"use server"

import { randomUUID } from "node:crypto"

import { and, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/db"
import { applications, jobs, users } from "@/db/schema"
import { calculateCost } from "@/lib/ai/cost-calc"
import { extractTextFromPdf } from "@/lib/pdf"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { feedbackWorkflow } from "@/mastra/workflows/feedback"
import { scoringWorkflow } from "@/mastra/workflows/scoring"
import { ScoringResultSchema } from "@/mastra/workflows/scoring"

const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024
const SCORING_TIMEOUT_MS = 45_000
const SCORING_TIMEOUT_RETRY_DELAY_MS = 1_200
const SCORING_MAX_TIMEOUT_ATTEMPTS = 2

type SubmitApplicationResult =
  | { success: true; score: number | null }
  | { success: false; error: string }

type RetryApplicationScoringResult =
  | { success: true; score: number | null; status: "pending" | "rejected" }
  | { success: false; error: string }

type MyApplicationItem = {
  id: number
  jobId: number
  jobTitle: string
  status: "pending" | "reviewed" | "interview" | "rejected"
  submittedAt: Date
}

type GetMyApplicationsResult =
  | { success: true; applications: MyApplicationItem[] }
  | { success: false; error: string }

type JobApplicationItem = {
  id: number
  applicant: {
    email: string
  }
  status: "pending" | "reviewed" | "interview" | "rejected"
  score: number
  matches: unknown[]
  hasReferral: boolean
  createdAt: Date
}

type GetJobApplicationsResult =
  | { success: true; applications: JobApplicationItem[] }
  | { success: false; error: string }

type UpdatableApplicationStatus = "reviewed" | "rejected" | "interview"

type UpdateApplicationStatusResult =
  | { success: true }
  | { success: false; error: string }

type GenerateRejectionFeedbackResult =
  | { success: true; emailBody: string }
  | { success: false; error: string }

type GenerateApplicationFeedbackResult =
  | { success: true; emailBody: string }
  | { success: false; error: string }

type GenerateFeedbackResult =
  | { success: true; feedbackDraft: string }
  | { success: false; error: string }

type GetMyApplicationFeedbackResult =
  | {
      success: true
      data: {
        scoreData: z.infer<typeof ScoringResultSchema>
        gapAnalysis: string
      }
    }
  | { success: false; error: string }

type CostStepMeta = {
  step: "scoring" | "feedback"
  model: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost: number
}

type RequirementRule = {
  name: string
  weight: number
  isMandatory: boolean
}

type AutoRejectScoreBreakdown = {
  scorePercentage: number
  scoreRatio: number
  mandatoryScorePercentage: number | null
  nonMandatoryScorePercentage: number | null
}

function clampPercentageScore(value: number): number {
  return Number(Math.min(Math.max(value, 0), 100).toFixed(2))
}

function normalizeScoringScale(
  scoringResult: z.infer<typeof ScoringResultSchema>
): z.infer<typeof ScoringResultSchema> {
  const matchScores = scoringResult.matches
    .map((match) => match.score)
    .filter((score) => typeof score === "number" && Number.isFinite(score))

  if (matchScores.length === 0) {
    return {
      ...scoringResult,
      overallScore: clampPercentageScore(scoringResult.overallScore),
    }
  }

  const maxMatchScore = Math.max(...matchScores)
  const scaleFactor = maxMatchScore <= 10 ? 10 : 1

  const normalizedMatches = scoringResult.matches.map((match) => ({
    ...match,
    score: clampPercentageScore(match.score * scaleFactor),
  }))

  const normalizedOverallScore =
    typeof scoringResult.overallScore === "number" && Number.isFinite(scoringResult.overallScore)
      ? clampPercentageScore(scoringResult.overallScore * scaleFactor)
      : clampPercentageScore(
          normalizedMatches.reduce((sum, match) => sum + match.score, 0) / normalizedMatches.length
        )

  return {
    ...scoringResult,
    matches: normalizedMatches,
    overallScore: normalizedOverallScore,
  }
}

function toSafeApplicationError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Failed to submit application."

  if (
    message.includes("Incorrect API key provided") ||
    message.includes("AI_APICallError") ||
    message.toLowerCase().includes("openai")
  ) {
    return "AI scoring is temporarily unavailable. Please contact support or try again later."
  }

  return message
}

function normalizeRequirementRules(requirements: unknown[]): RequirementRule[] {
  return requirements
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const source = item as Record<string, unknown>
      const nameCandidate = [source.requirementName, source.name, source.label].find(
        (value) => typeof value === "string" && value.trim().length > 0
      ) as string | undefined

      const weight = typeof source.weight === "number" ? source.weight : 0
      const isMandatory =
        typeof source.isMandatory === "boolean"
          ? source.isMandatory
          : typeof source.required === "boolean"
            ? source.required
            : false

      if (!nameCandidate || !Number.isFinite(weight) || weight <= 0) {
        return null
      }

      return {
        name: nameCandidate.trim(),
        weight,
        isMandatory,
      }
    })
    .filter((rule): rule is RequirementRule => rule !== null)
}

function resolveMatchScore(
  matchScoreByName: Map<string, number>,
  fallbackMatches: z.infer<typeof ScoringResultSchema>["matches"],
  requirementName: string,
  fallbackIndex: number
) {
  const key = requirementName.toLowerCase()
  const byName = matchScoreByName.get(key)
  if (typeof byName === "number") {
    return byName
  }

  const byIndex = fallbackMatches[fallbackIndex]
  return typeof byIndex?.score === "number" ? byIndex.score : 0
}

function normalizeThresholdToRatio(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  if (value <= 1) {
    return Number(Math.min(Math.max(value, 0), 1).toFixed(4))
  }

  return Number((Math.min(Math.max(value, 0), 100) / 100).toFixed(4))
}

function toPercentageFromRatio(value: number): number {
  return Number((value * 100).toFixed(2))
}

function computeWeightedPercentage(
  rules: RequirementRule[],
  fallbackIndexByName: Map<string, number>,
  matchScoreByName: Map<string, number>,
  fallbackMatches: z.infer<typeof ScoringResultSchema>["matches"]
): number | null {
  if (rules.length === 0) {
    return null
  }

  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0)
  if (totalWeight <= 0) {
    return null
  }

  const weightedScore = rules.reduce((sum, rule, index) => {
    const fallbackIndex = fallbackIndexByName.get(rule.name.toLowerCase()) ?? index
    const score = resolveMatchScore(matchScoreByName, fallbackMatches, rule.name, fallbackIndex)
    return sum + score * rule.weight
  }, 0)

  return Number((weightedScore / totalWeight).toFixed(2))
}

function computeAutoRejectScoreBreakdown(
  scoringResult: z.infer<typeof ScoringResultSchema>,
  requirementsRaw: unknown[]
): AutoRejectScoreBreakdown {
  const rules = normalizeRequirementRules(requirementsRaw)
  const mandatoryRules = rules.filter((rule) => rule.isMandatory)
  const nonMandatoryRules = rules.filter((rule) => !rule.isMandatory)
  const fallbackIndexByName = new Map<string, number>()
  for (const [index, rule] of rules.entries()) {
    fallbackIndexByName.set(rule.name.toLowerCase(), index)
  }

  const matchScoreByName = new Map<string, number>()
  for (const match of scoringResult.matches) {
    if (typeof match.requirementName === "string" && typeof match.score === "number") {
      matchScoreByName.set(match.requirementName.toLowerCase(), match.score)
    }
  }

  const overallWeightedScore =
    computeWeightedPercentage(rules, fallbackIndexByName, matchScoreByName, scoringResult.matches) ??
    scoringResult.overallScore
  const mandatoryWeightedScore = computeWeightedPercentage(
    mandatoryRules,
    fallbackIndexByName,
    matchScoreByName,
    scoringResult.matches
  )
  const nonMandatoryWeightedScore = computeWeightedPercentage(
    nonMandatoryRules,
    fallbackIndexByName,
    matchScoreByName,
    scoringResult.matches
  )

  return {
    scorePercentage: overallWeightedScore,
    scoreRatio: Number((overallWeightedScore / 100).toFixed(4)),
    mandatoryScorePercentage: mandatoryWeightedScore,
    nonMandatoryScorePercentage: nonMandatoryWeightedScore,
  }
}

type ScoringExecutionResult =
  | {
      ok: true
      scoringResult: z.infer<typeof ScoringResultSchema>
      scoringMeta: CostStepMeta
    }
  | {
      ok: false
      error: string
      traceId: string
    }

type ScoringRequirementInput = {
  requirementName?: string
  name?: string
  aiContext?: string
  [key: string]: unknown
}

function normalizeScoringRequirements(requirements: unknown[]): ScoringRequirementInput[] {
  return requirements
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      ...item,
      requirementName:
        typeof item.requirementName === "string" && item.requirementName.trim().length > 0
          ? item.requirementName
          : undefined,
      name: typeof item.name === "string" && item.name.trim().length > 0 ? item.name : undefined,
      aiContext:
        typeof item.aiContext === "string" && item.aiContext.trim().length > 0
          ? item.aiContext
          : undefined,
    }))
}

const EVIDENCE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "you",
  "your",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "they",
  "them",
  "their",
  "role",
  "candidate",
  "requirement",
  "score",
  "based",
  "using",
  "used",
  "will",
  "can",
  "not",
  "but",
  "also",
])

type ResumeLineSpan = {
  start: number
  end: number
  excerpt: string
}

function extractEvidenceKeywords(requirementName: string, reasoning: string): string[] {
  const tokens = `${requirementName} ${reasoning}`
    .toLowerCase()
    .split(/[^a-z0-9+.#-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !EVIDENCE_STOP_WORDS.has(token))

  return Array.from(new Set(tokens))
}

function buildResumeLineSpans(resumeText: string): ResumeLineSpan[] {
  const spans: ResumeLineSpan[] = []
  const regex = /[^\r\n]+/g
  let match = regex.exec(resumeText)

  while (match) {
    const line = match[0]
    const absoluteStart = match.index
    let startOffset = 0
    let endOffset = line.length

    while (startOffset < endOffset && /\s/.test(line[startOffset] ?? "")) {
      startOffset += 1
    }
    while (endOffset > startOffset && /\s/.test(line[endOffset - 1] ?? "")) {
      endOffset -= 1
    }

    if (endOffset > startOffset) {
      const start = absoluteStart + startOffset
      const end = absoluteStart + endOffset
      spans.push({
        start,
        end,
        excerpt: resumeText.slice(start, end),
      })
    }

    match = regex.exec(resumeText)
  }

  return spans
}

function enrichScoringWithEvidence(
  scoringResult: z.infer<typeof ScoringResultSchema>,
  resumeText: string
): z.infer<typeof ScoringResultSchema> {
  const resumeLineSpans = buildResumeLineSpans(resumeText)

  const enrichedMatches = scoringResult.matches.map((match) => {
    const keywords = extractEvidenceKeywords(match.requirementName, match.reasoning)
    const evidenceSpans = resumeLineSpans
      .map((span) => {
        const lowerExcerpt = span.excerpt.toLowerCase()
        const matchedKeywords = keywords.filter((keyword) => lowerExcerpt.includes(keyword))

        return matchedKeywords.length > 0
          ? {
              start: span.start,
              end: span.end,
              excerpt: span.excerpt,
              matchedKeywords,
            }
          : null
      })
      .filter((span): span is NonNullable<typeof span> => span !== null)

    return {
      ...match,
      evidenceSpans,
    }
  })

  return {
    ...scoringResult,
    matches: enrichedMatches,
  }
}

type FeedbackExecutionResult =
  | {
      ok: true
      text: string
      meta: CostStepMeta
    }
  | {
      ok: false
      error: string
    }

function readUsage(source: unknown): { prompt: number; completion: number } {
  if (!source || typeof source !== "object") {
    return { prompt: 0, completion: 0 }
  }

  const container = source as Record<string, unknown>
  const usageCandidate =
    container.usage && typeof container.usage === "object"
      ? (container.usage as Record<string, unknown>)
      : container

  const promptValue =
    typeof usageCandidate.promptTokens === "number"
      ? usageCandidate.promptTokens
      : typeof usageCandidate.inputTokens === "number"
        ? usageCandidate.inputTokens
        : 0
  const completionValue =
    typeof usageCandidate.completionTokens === "number"
      ? usageCandidate.completionTokens
      : typeof usageCandidate.outputTokens === "number"
        ? usageCandidate.outputTokens
        : 0

  return {
    prompt: Math.max(0, Math.trunc(promptValue)),
    completion: Math.max(0, Math.trunc(completionValue)),
  }
}

function parseFeedbackWorkflowSuccess(workflowResult: unknown): { text: string; meta: CostStepMeta } | null {
  if (typeof workflowResult === "string") {
    return {
      text: workflowResult,
      meta: {
        step: "feedback",
        model: "gpt-4o",
        tokens: { prompt: 0, completion: 0, total: 0 },
        cost: 0,
      },
    }
  }

  if (!workflowResult || typeof workflowResult !== "object") {
    return null
  }

  const raw = workflowResult as Record<string, unknown>
  const text =
    typeof raw.text === "string"
      ? raw.text
      : typeof raw.result === "string"
        ? raw.result
        : ""

  if (!text) {
    return null
  }

  const usage = readUsage(raw)
  const model = "gpt-4o"

  return {
    text,
    meta: {
      step: "feedback",
      model,
      tokens: {
        prompt: usage.prompt,
        completion: usage.completion,
        total: usage.prompt + usage.completion,
      },
      cost: calculateCost(model, usage.prompt, usage.completion),
    },
  }
}

async function executeFeedbackWorkflow(
  scoringData: z.infer<typeof ScoringResultSchema>,
  candidateName: string
): Promise<FeedbackExecutionResult> {
  try {
    const run = await feedbackWorkflow.createRun()
    const result = await run.start({
      inputData: {
        scoringData,
        candidateName,
      },
    })

    if (result.status !== "success") {
      return { ok: false, error: "Failed to generate feedback draft." }
    }

    const parsed = parseFeedbackWorkflowSuccess(result.result)
    if (!parsed) {
      return { ok: false, error: "Feedback workflow returned an unexpected result shape." }
    }

    return { ok: true, text: parsed.text, meta: parsed.meta }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate feedback draft."
    return { ok: false, error: message }
  }
}

function parseScoringWorkflowSuccess(
  workflowResult: unknown
): { scoringResult: z.infer<typeof ScoringResultSchema>; scoringMeta: CostStepMeta } | null {
  if (!workflowResult || typeof workflowResult !== "object") {
    return null
  }

  const data = workflowResult as Record<string, unknown>
  const directResult = ScoringResultSchema.safeParse(data)
  if (directResult.success) {
    return {
      scoringResult: directResult.data,
      scoringMeta: {
        step: "scoring",
        model: "gpt-4o",
        tokens: {
          prompt: 0,
          completion: 0,
          total: 0,
        },
        cost: 0,
      },
    }
  }

  const nestedResult = ScoringResultSchema.safeParse(data.result)
  if (!nestedResult.success) {
    return null
  }

  const metaCandidate =
    data.meta && typeof data.meta === "object" ? (data.meta as Record<string, unknown>) : {}

  const promptTokens =
    typeof metaCandidate.tokens === "object" &&
    metaCandidate.tokens &&
    typeof (metaCandidate.tokens as Record<string, unknown>).prompt === "number"
      ? ((metaCandidate.tokens as Record<string, unknown>).prompt as number)
      : 0
  const completionTokens =
    typeof metaCandidate.tokens === "object" &&
    metaCandidate.tokens &&
    typeof (metaCandidate.tokens as Record<string, unknown>).completion === "number"
      ? ((metaCandidate.tokens as Record<string, unknown>).completion as number)
      : 0

  return {
    scoringResult: nestedResult.data,
    scoringMeta: {
      step: "scoring",
      model: typeof metaCandidate.model === "string" ? metaCandidate.model : "gpt-4o",
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      cost: typeof metaCandidate.cost === "number" ? metaCandidate.cost : 0,
    },
  }
}

function toErrorPayload(error: unknown, depth = 0): unknown {
  if (depth > 3) {
    return "[max-depth-reached]"
  }

  if (error instanceof Error) {
    const base: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }

    const enumerable = Object.entries(error as unknown as Record<string, unknown>)
    if (enumerable.length > 0) {
      base.details = Object.fromEntries(
        enumerable.map(([key, value]) => [key, toErrorPayload(value, depth + 1)])
      )
    }

    const maybeCause = (error as Error & { cause?: unknown }).cause
    if (maybeCause) {
      base.cause = toErrorPayload(maybeCause, depth + 1)
    }

    return base
  }

  if (Array.isArray(error)) {
    return error.map((item) => toErrorPayload(item, depth + 1))
  }

  if (error && typeof error === "object") {
    return Object.fromEntries(
      Object.entries(error as Record<string, unknown>).map(([key, value]) => [
        key,
        toErrorPayload(value, depth + 1),
      ])
    )
  }

  return error
}

function logScoringDiagnostic(traceId: string, payload: Record<string, unknown>) {
  const key = process.env.OPENAI_API_KEY ?? ""
  const keySuffix = key.length >= 6 ? key.slice(-6) : "missing"

  console.error(
    `[scoring-trace:${traceId}]`,
    JSON.stringify(
      {
        ...payload,
        openaiKeySuffix: keySuffix,
      },
      null,
      2
    )
  )
}

async function executeScoringWorkflow(
  resumeText: string,
  requirements: unknown[],
  context: { source: "submit" | "retry"; applicationId?: number; jobId?: number }
): Promise<ScoringExecutionResult> {
  const traceId = randomUUID()
  const normalizedRequirements = normalizeScoringRequirements(requirements)

  try {
    for (let attempt = 1; attempt <= SCORING_MAX_TIMEOUT_ATTEMPTS; attempt += 1) {
      const run = await scoringWorkflow.createRun()
      logScoringDiagnostic(traceId, {
        stage: attempt === 1 ? "start" : "retry-start",
        attempt,
        source: context.source,
        applicationId: context.applicationId ?? null,
        jobId: context.jobId ?? null,
        requirementsCount: Array.isArray(requirements) ? requirements.length : null,
        resumeTextLength: resumeText.length,
        runId: (run as { runId?: string }).runId ?? null,
      })

      try {
        const workflowResult = await withTimeout(
          run.start({
            inputData: {
              resumeText,
              requirements: normalizedRequirements,
            },
          }),
          SCORING_TIMEOUT_MS,
          "AI scoring"
        )

        if (workflowResult.status !== "success") {
          logScoringDiagnostic(traceId, {
            stage: "workflow-non-success",
            attempt,
            source: context.source,
            applicationId: context.applicationId ?? null,
            jobId: context.jobId ?? null,
            workflowStatus: workflowResult.status,
            workflowResult: toErrorPayload(workflowResult),
          })
          return { ok: false, error: `Failed to score application. (trace: ${traceId})`, traceId }
        }

        const parsed = parseScoringWorkflowSuccess(workflowResult.result)
        if (!parsed) {
          logScoringDiagnostic(traceId, {
            stage: "unexpected-success-shape",
            attempt,
            source: context.source,
            applicationId: context.applicationId ?? null,
            jobId: context.jobId ?? null,
            workflowResult: toErrorPayload(workflowResult.result),
          })
          return {
            ok: false,
            error: `Scoring workflow returned an unexpected result shape. (trace: ${traceId})`,
            traceId,
          }
        }

        return {
          ok: true,
          scoringResult: enrichScoringWithEvidence(normalizeScoringScale(parsed.scoringResult), resumeText),
          scoringMeta: parsed.scoringMeta,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown scoring error."
        const isTimeoutError = message.includes("timed out")
        logScoringDiagnostic(traceId, {
          stage: "attempt-exception",
          attempt,
          source: context.source,
          applicationId: context.applicationId ?? null,
          jobId: context.jobId ?? null,
          isTimeoutError,
          error: toErrorPayload(error),
        })

        if (isTimeoutError && attempt < SCORING_MAX_TIMEOUT_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, SCORING_TIMEOUT_RETRY_DELAY_MS))
          continue
        }

        return { ok: false, error: `${toSafeApplicationError(error)} (trace: ${traceId})`, traceId }
      }
    }

    return { ok: false, error: `Failed to score application. (trace: ${traceId})`, traceId }
  } catch (error) {
    logScoringDiagnostic(traceId, {
      stage: "exception",
      source: context.source,
      applicationId: context.applicationId ?? null,
      jobId: context.jobId ?? null,
      error: toErrorPayload(error),
    })
    return { ok: false, error: `${toSafeApplicationError(error)} (trace: ${traceId})`, traceId }
  }
}

function mergeAiCostData(current: unknown, meta: CostStepMeta) {
  const currentData =
    current && typeof current === "object" ? (current as Record<string, unknown>) : null
  const currentTotalTokens =
    typeof currentData?.total_tokens === "number" ? currentData.total_tokens : 0
  const currentTotalCost =
    typeof currentData?.total_cost_usd === "number" ? currentData.total_cost_usd : 0
  const currentBreakdown =
    currentData?.breakdown && typeof currentData.breakdown === "object"
      ? (currentData.breakdown as Record<string, unknown>)
      : {}

  return {
    total_tokens: currentTotalTokens + meta.tokens.total,
    total_cost_usd: Number((currentTotalCost + meta.cost).toFixed(6)),
    breakdown: {
      ...currentBreakdown,
      [meta.step]: {
        prompt: meta.tokens.prompt,
        completion: meta.tokens.completion,
        model: meta.model,
      },
    },
  } as typeof applications.$inferInsert.aiCostData
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out.`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export async function submitApplicationAction(
  formData: FormData
): Promise<SubmitApplicationResult> {
  try {
    const fileEntry = formData.get("file")
    const jobIdRaw = formData.get("jobId")
    const candidateEmailRaw = formData.get("candidateEmail")

    if (!(fileEntry instanceof File)) {
      return { success: false, error: "Resume PDF file is required." }
    }

    if (fileEntry.type !== "application/pdf") {
      return { success: false, error: "Resume must be a PDF file." }
    }

    if (fileEntry.size > MAX_PDF_SIZE_BYTES) {
      return { success: false, error: "Resume PDF must be smaller than 4MB." }
    }

    if (typeof jobIdRaw !== "string" || !jobIdRaw.trim()) {
      return { success: false, error: "Job ID is required." }
    }

    const jobId = Number.parseInt(jobIdRaw, 10)
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return { success: false, error: "Invalid job ID." }
    }

    const candidateEmail =
      typeof candidateEmailRaw === "string" ? candidateEmailRaw.trim().toLowerCase() : ""

    const arrayBuffer = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const resumeText = await extractTextFromPdf(buffer)

    const [job] = await db
      .select({
        id: jobs.id,
        requirementsConfig: jobs.requirementsConfig,
        aiSettings: jobs.aiSettings,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1)

    if (!job) {
      return { success: false, error: "Job not found." }
    }

    let overallScore: number | null = null
    let status: "pending" | "rejected" = "pending"
    let aiScoreData: typeof applications.$inferInsert.aiScoreData = null
    let aiCostData: typeof applications.$inferInsert.aiCostData = null

    const scoringExecution = await executeScoringWorkflow(resumeText, job.requirementsConfig ?? [], {
      source: "submit",
      jobId,
    })
    if (scoringExecution.ok) {
      const thresholdRatio = normalizeThresholdToRatio(job.aiSettings?.auto_reject_threshold)
      const autoRejectScore = computeAutoRejectScoreBreakdown(
        scoringExecution.scoringResult,
        job.requirementsConfig ?? []
      )
      overallScore = scoringExecution.scoringResult.overallScore
      status =
        thresholdRatio !== null && autoRejectScore.scoreRatio < thresholdRatio
          ? ("rejected" as const)
          : ("pending" as const)
      aiScoreData = {
        ...scoringExecution.scoringResult,
        autoRejectScore: autoRejectScore.scorePercentage,
        autoRejectThreshold: thresholdRatio !== null ? toPercentageFromRatio(thresholdRatio) : null,
        mandatoryWeightedScore: autoRejectScore.mandatoryScorePercentage,
        nonMandatoryWeightedScore: autoRejectScore.nonMandatoryScorePercentage,
        autoRejectBasis: "weighted_percentage_mandatory_optional",
        aiBaseScore: scoringExecution.scoringResult.overallScore,
        referralBoost: false,
        scoringStatus: "success",
      }
      aiCostData = mergeAiCostData(null, scoringExecution.scoringMeta)
    } else {
      aiScoreData = {
        scoringStatus: "failed",
        scoringError: scoringExecution.error,
        scoringTraceId: scoringExecution.traceId,
      }
      status = "pending"
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    const applicantEmail = authUser?.email?.toLowerCase() ?? candidateEmail
    if (!applicantEmail) {
      return { success: false, error: "Candidate email is required." }
    }

    let applicantId = authUser?.id

    if (!applicantId) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, applicantEmail), eq(users.role, "applicant")))
        .limit(1)

      if (existingUser) {
        applicantId = existingUser.id
      } else {
        const [createdUser] = await db
          .insert(users)
          .values({
            email: applicantEmail,
            role: "applicant",
          })
          .returning({ id: users.id })

        if (!createdUser) {
          return { success: false, error: "Failed to create applicant profile." }
        }

        applicantId = createdUser.id
      }
    }

    await db.insert(applications).values({
      jobId,
      applicantId,
      status,
      resumeData: { text: resumeText },
      aiScoreData,
      aiCostData,
    })

    revalidatePath("/dashboard/hr")

    return { success: true, score: overallScore }
  } catch (error) {
    return { success: false, error: toSafeApplicationError(error) }
  }
}

export async function retryApplicationScoringAction(
  applicationId: number
): Promise<RetryApplicationScoringResult> {
  try {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return { success: false, error: "Invalid application ID." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const [application] = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
        resumeData: applications.resumeData,
        aiScoreData: applications.aiScoreData,
        aiCostData: applications.aiCostData,
        requirementsConfig: jobs.requirementsConfig,
        aiSettings: jobs.aiSettings,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.id, applicationId), eq(jobs.creatorId, user.id)))
      .limit(1)

    if (!application) {
      return { success: false, error: "Application not found." }
    }

    const resumeText =
      application.resumeData &&
      typeof application.resumeData === "object" &&
      typeof application.resumeData.text === "string"
        ? application.resumeData.text.trim()
        : ""

    if (!resumeText) {
      return { success: false, error: "Resume text is unavailable for this application." }
    }

    const scoringExecution = await executeScoringWorkflow(
      resumeText,
      application.requirementsConfig ?? [],
      {
        source: "retry",
        applicationId: application.id,
        jobId: application.jobId,
      }
    )

    const currentScoreData =
      application.aiScoreData && typeof application.aiScoreData === "object"
        ? application.aiScoreData
        : {}

    let nextStatus: "pending" | "rejected" = "pending"
    let nextScore: number | null = null
    let nextAiCostData: typeof applications.$inferInsert.aiCostData = application.aiCostData ?? null
    let nextAiScoreData: typeof applications.$inferInsert.aiScoreData

    if (scoringExecution.ok) {
      const thresholdRatio = normalizeThresholdToRatio(application.aiSettings?.auto_reject_threshold)
      const autoRejectScore = computeAutoRejectScoreBreakdown(
        scoringExecution.scoringResult,
        application.requirementsConfig ?? []
      )
      nextScore = scoringExecution.scoringResult.overallScore
      nextStatus =
        thresholdRatio !== null && autoRejectScore.scoreRatio < thresholdRatio
          ? ("rejected" as const)
          : ("pending" as const)
      nextAiScoreData = {
        ...currentScoreData,
        ...scoringExecution.scoringResult,
        autoRejectScore: autoRejectScore.scorePercentage,
        autoRejectThreshold: thresholdRatio !== null ? toPercentageFromRatio(thresholdRatio) : null,
        mandatoryWeightedScore: autoRejectScore.mandatoryScorePercentage,
        nonMandatoryWeightedScore: autoRejectScore.nonMandatoryScorePercentage,
        autoRejectBasis: "weighted_percentage_mandatory_optional",
        aiBaseScore: scoringExecution.scoringResult.overallScore,
        referralBoost: false,
        scoringStatus: "success",
      }
      nextAiCostData = mergeAiCostData(application.aiCostData, scoringExecution.scoringMeta)
    } else {
      nextAiScoreData = {
        ...currentScoreData,
        scoringStatus: "failed",
        scoringError: scoringExecution.error,
        scoringTraceId: scoringExecution.traceId,
      }
      nextStatus = "pending"
    }

    await db
      .update(applications)
      .set({
        status: nextStatus,
        aiScoreData: nextAiScoreData,
        aiCostData: nextAiCostData,
      })
      .where(eq(applications.id, application.id))

    revalidatePath("/dashboard/hr")
    revalidatePath(`/dashboard/hr/jobs/${application.jobId}`)
    revalidatePath(`/dashboard/hr/applications/${application.id}`)
    revalidatePath("/dashboard/applicant")

    return { success: true, score: nextScore, status: nextStatus }
  } catch (error) {
    return { success: false, error: toSafeApplicationError(error) }
  }
}

export async function getMyApplicationsAction(): Promise<GetMyApplicationsResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const rows = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        jobTitle: jobs.title,
        status: applications.status,
        submittedAt: applications.createdAt,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(eq(applications.applicantId, user.id))
      .orderBy(desc(applications.createdAt))

    const mappedApplications: MyApplicationItem[] = rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      status: row.status,
      submittedAt: row.submittedAt,
    }))

    return { success: true, applications: mappedApplications }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch your applications."
    return { success: false, error: message }
  }
}

export async function getJobApplicationsAction(
  jobId: number
): Promise<GetJobApplicationsResult> {
  try {
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return { success: false, error: "Invalid job ID." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const [ownedJob] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.creatorId, user.id)))
      .limit(1)

    if (!ownedJob) {
      return { success: false, error: "Forbidden." }
    }

    const rows = await db
      .select({
        id: applications.id,
        status: applications.status,
        aiScoreData: applications.aiScoreData,
        createdAt: applications.createdAt,
        applicantEmail: users.email,
        referralCount: sql<number>`(
          select count(*)::int
          from referrals r
          where r.application_id = ${applications.id}
            and r.status = 'submitted'
        )`,
      })
      .from(applications)
      .innerJoin(users, eq(users.id, applications.applicantId))
      .where(eq(applications.jobId, jobId))

    const mappedApplications: JobApplicationItem[] = rows
      .map((row) => {
        const scoreValue = row.aiScoreData?.overallScore
        const matchesValue = row.aiScoreData?.matches
        const score = typeof scoreValue === "number" ? scoreValue : 0
        const matches = Array.isArray(matchesValue) ? matchesValue : []

        return {
          id: row.id,
          applicant: {
            email: row.applicantEmail,
          },
          status: row.status,
          score,
          matches,
          hasReferral: row.referralCount > 0,
          createdAt: row.createdAt,
        }
      })
      .sort((a, b) => b.score - a.score)

    return { success: true, applications: mappedApplications }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch job applications."
    return { success: false, error: message }
  }
}

export async function updateApplicationStatusAction(
  applicationId: number,
  newStatus: UpdatableApplicationStatus
): Promise<UpdateApplicationStatusResult> {
  try {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return { success: false, error: "Invalid application ID." }
    }

    if (!["reviewed", "rejected", "interview"].includes(newStatus)) {
      return { success: false, error: "Invalid status." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const [ownedApplication] = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.id, applicationId), eq(jobs.creatorId, user.id)))
      .limit(1)

    if (!ownedApplication) {
      return { success: false, error: "Forbidden." }
    }

    await db
      .update(applications)
      .set({ status: newStatus })
      .where(eq(applications.id, applicationId))

    revalidatePath("/dashboard/hr")
    revalidatePath(`/dashboard/hr/jobs/${ownedApplication.jobId}`)

    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update application status."
    return { success: false, error: message }
  }
}

export async function generateRejectionFeedbackAction(
  scoringResult: unknown
): Promise<GenerateRejectionFeedbackResult> {
  try {
    const parsed = ScoringResultSchema.safeParse(scoringResult)
    if (!parsed.success) {
      return { success: false, error: "Invalid scoring result." }
    }

    const feedback = await executeFeedbackWorkflow(parsed.data, "Candidate")
    if (!feedback.ok) {
      return { success: false, error: feedback.error }
    }

    return { success: true, emailBody: feedback.text }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate rejection email."
    return { success: false, error: message }
  }
}

export async function getMyApplicationFeedbackAction(
  applicationId: number
): Promise<GetMyApplicationFeedbackResult> {
  try {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return { success: false, error: "Invalid application ID." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const [application] = await db
      .select({
        id: applications.id,
        status: applications.status,
        aiScoreData: applications.aiScoreData,
      })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.applicantId, user.id)))
      .limit(1)

    if (!application) {
      return { success: false, error: "Application not found." }
    }

    if (application.status !== "rejected") {
      return { success: false, error: "Feedback is only available for rejected applications." }
    }

    const parsedScore = ScoringResultSchema.safeParse(application.aiScoreData)
    if (!parsedScore.success) {
      return { success: false, error: "Scoring data is unavailable for this application." }
    }

    const existingDraft = application.aiScoreData?.feedbackDraft
    let gapAnalysis = typeof existingDraft === "string" ? existingDraft : ""

    if (!gapAnalysis) {
      const feedbackResult = await generateRejectionFeedbackAction(parsedScore.data)
      if (!feedbackResult.success) {
        return { success: false, error: feedbackResult.error }
      }

      gapAnalysis = feedbackResult.emailBody

      await db
        .update(applications)
        .set({
          aiScoreData: {
            ...(application.aiScoreData ?? {}),
            feedbackDraft: gapAnalysis,
          } as typeof applications.$inferInsert.aiScoreData,
        })
        .where(eq(applications.id, application.id))

      revalidatePath("/dashboard/applicant")
    }

    return {
      success: true,
      data: {
        scoreData: parsedScore.data,
        gapAnalysis,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch application feedback."
    return { success: false, error: message }
  }
}

export async function generateApplicationFeedbackAction(
  applicationId: number
): Promise<GenerateApplicationFeedbackResult> {
  try {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return { success: false, error: "Invalid application ID." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const [application] = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
        aiScoreData: applications.aiScoreData,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(applications.id, applicationId), eq(jobs.creatorId, user.id)))
      .limit(1)

    if (!application) {
      return { success: false, error: "Application not found." }
    }

    const existingDraft = application.aiScoreData?.feedbackDraft
    if (typeof existingDraft === "string" && existingDraft) {
      return { success: true, emailBody: existingDraft }
    }

    const parsedScore = ScoringResultSchema.safeParse(application.aiScoreData)
    if (!parsedScore.success) {
      return { success: false, error: "Scoring data is unavailable for this application." }
    }

    const feedbackResult = await generateRejectionFeedbackAction(parsedScore.data)
    if (!feedbackResult.success) {
      return { success: false, error: feedbackResult.error }
    }

    await db
      .update(applications)
      .set({
        aiScoreData: {
          ...(application.aiScoreData ?? {}),
          feedbackDraft: feedbackResult.emailBody,
        } as typeof applications.$inferInsert.aiScoreData,
      })
      .where(eq(applications.id, application.id))

    revalidatePath("/dashboard/hr")
    revalidatePath(`/dashboard/hr/jobs/${application.jobId}`)
    revalidatePath("/dashboard/applicant")

    return { success: true, emailBody: feedbackResult.emailBody }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate application feedback."
    return { success: false, error: message }
  }
}

function deriveCandidateName(email: string): string {
  const localPart = email.split("@")[0] ?? ""
  const cleaned = localPart.replace(/[._-]+/g, " ").trim()
  if (!cleaned) {
    return "Candidate"
  }

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export async function generateFeedbackAction(
  applicationId: number
): Promise<GenerateFeedbackResult> {
  try {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return { success: false, error: "Invalid application ID." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized." }
    }

    const [application] = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        aiScoreData: applications.aiScoreData,
        aiCostData: applications.aiCostData,
        applicantEmail: users.email,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(users, eq(users.id, applications.applicantId))
      .where(and(eq(applications.id, applicationId), eq(jobs.creatorId, user.id)))
      .limit(1)

    if (!application) {
      return { success: false, error: "Application not found." }
    }

    const existingDraft = application.aiScoreData?.feedbackDraft
    if (typeof existingDraft === "string" && existingDraft) {
      return { success: true, feedbackDraft: existingDraft }
    }

    const parsedScore = ScoringResultSchema.safeParse(application.aiScoreData)
    if (!parsedScore.success) {
      return { success: false, error: "Scoring data is unavailable for this application." }
    }

    const feedback = await executeFeedbackWorkflow(
      parsedScore.data,
      deriveCandidateName(application.applicantEmail)
    )
    if (!feedback.ok) {
      return { success: false, error: feedback.error }
    }

    await db
      .update(applications)
      .set({
        aiScoreData: {
          ...(application.aiScoreData ?? {}),
          feedbackDraft: feedback.text,
        } as typeof applications.$inferInsert.aiScoreData,
        aiCostData: mergeAiCostData(application.aiCostData, feedback.meta),
      })
      .where(eq(applications.id, application.id))

    revalidatePath("/dashboard/hr")
    revalidatePath(`/dashboard/hr/jobs/${application.jobId}`)

    return { success: true, feedbackDraft: feedback.text }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate feedback draft."
    return { success: false, error: message }
  }
}

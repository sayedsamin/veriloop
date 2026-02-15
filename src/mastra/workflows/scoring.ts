import { Workflow, createStep } from "@mastra/core/workflows"
import { z } from "zod"

import { hiringAgent } from "@/mastra/agents"

const JobRequirementSchema = z
  .object({
    requirementName: z.string().optional(),
    name: z.string().optional(),
    aiContext: z.string().optional(),
  })
  .passthrough()

const ScoringWorkflowInputSchema = z.object({
  resumeText: z.string().min(1),
  requirements: z.array(JobRequirementSchema),
})

const ScoringMatchSchema = z.object({
  requirementName: z.string(),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  evidenceSpans: z
    .array(
      z.object({
        start: z.number().int().min(0),
        end: z.number().int().min(1),
        excerpt: z.string().min(1),
        matchedKeywords: z.array(z.string()),
      })
    )
    .optional(),
})

export const ScoringResultSchema = z.object({
  matches: z.array(ScoringMatchSchema),
  summary: z.string(),
  overallScore: z.number().min(0).max(100),
})

function buildScoringPrompt(input: z.infer<typeof ScoringWorkflowInputSchema>): string {
  const requirementsWithContext = input.requirements.map((requirement, index) => ({
    ...requirement,
    requirementName: requirement.requirementName ?? requirement.name ?? `Requirement ${index + 1}`,
    aiContext: requirement.aiContext ?? null,
  }))

  return `
Analyze the resume against these weighted requirements. For each requirement, check for evidence. If "aiContext" is provided, use it as the primary truth source.
Scoring scale rules:
- Every requirement "score" MUST be a percentage from 0 to 100.
- Do NOT return 0-10 scores.
- Do NOT copy requirement weight as score.
- "overallScore" MUST be 0-100 and represent the candidate's final percentage match.

Return ONLY valid JSON that matches this schema:
{
  "matches": [
    { "requirementName": "string", "score": 0, "reasoning": "string" }
  ],
  "summary": "string",
  "overallScore": 0
}

Resume Text:
${input.resumeText}

Job Requirements (JSON):
${JSON.stringify(requirementsWithContext, null, 2)}
  `.trim()
}

const analysisStep = createStep(hiringAgent, {
  structuredOutput: {
    schema: ScoringResultSchema,
  },
})

const scoringWorkflow = new Workflow({
  id: "resume-scoring",
  inputSchema: ScoringWorkflowInputSchema,
  outputSchema: ScoringResultSchema,
})

scoringWorkflow
  .map({
    prompt: {
      fn: async ({ inputData }) => buildScoringPrompt(inputData),
      schema: z.string(),
    },
  })
  .then(analysisStep)
  .commit()

export { scoringWorkflow }

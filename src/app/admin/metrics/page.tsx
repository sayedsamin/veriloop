import { and, desc, eq, isNotNull, sql } from "drizzle-orm"
import { redirect } from "next/navigation"

import { db } from "@/db"
import { applications, users } from "@/db/schema"
import { calculateCost } from "@/lib/ai/cost-calc"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type BreakdownStep = {
  prompt: number
  completion: number
  model: string
}

type ParsedCostData = {
  totalTokens: number
  totalCostUsd: number
  scoringCost: number
  feedbackCost: number
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

function readStepCost(step: unknown): number {
  if (!step || typeof step !== "object") {
    return 0
  }

  const raw = step as Partial<BreakdownStep>
  const prompt = typeof raw.prompt === "number" ? Math.max(0, raw.prompt) : 0
  const completion = typeof raw.completion === "number" ? Math.max(0, raw.completion) : 0
  const model = typeof raw.model === "string" ? raw.model : ""
  return calculateCost(model, prompt, completion)
}

function parseCostData(value: unknown): ParsedCostData {
  if (!value || typeof value !== "object") {
    return { totalTokens: 0, totalCostUsd: 0, scoringCost: 0, feedbackCost: 0 }
  }

  const data = value as Record<string, unknown>
  const totalTokens = typeof data.total_tokens === "number" ? Math.max(0, data.total_tokens) : 0
  const totalCostUsd =
    typeof data.total_cost_usd === "number" ? Math.max(0, data.total_cost_usd) : 0
  const breakdown =
    data.breakdown && typeof data.breakdown === "object"
      ? (data.breakdown as Record<string, unknown>)
      : {}

  const scoringCost = readStepCost(breakdown.scoring)
  const feedbackCost = readStepCost(breakdown.feedback)

  return {
    totalTokens,
    totalCostUsd,
    scoringCost,
    feedbackCost,
  }
}

export default async function AdminMetricsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const [globalTotals] = await db
    .select({
      totalAiSpend: sql<number>`coalesce(sum((applications.ai_cost_data ->> 'total_cost_usd')::numeric), 0)::float8`,
      totalCandidates: sql<number>`count(*)::int`,
    })
    .from(applications)
    .where(isNotNull(applications.aiCostData))

  const expensiveRows = await db
    .select({
      id: applications.id,
      aiCostData: applications.aiCostData,
      applicantEmail: users.email,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.applicantId))
    .where(and(isNotNull(applications.aiCostData)))
    .orderBy(desc(sql<number>`(applications.ai_cost_data ->> 'total_cost_usd')::float8`))
    .limit(50)

  const totalAiSpend = globalTotals?.totalAiSpend ?? 0
  const totalCandidates = globalTotals?.totalCandidates ?? 0
  const avgCostPerCandidate = totalCandidates > 0 ? totalAiSpend / totalCandidates : 0

  const rows = expensiveRows.map((row) => {
    const cost = parseCostData(row.aiCostData)
    const breakdownTotal = cost.scoringCost + cost.feedbackCost
    const scoringPct = breakdownTotal > 0 ? (cost.scoringCost / breakdownTotal) * 100 : 0
    const feedbackPct = breakdownTotal > 0 ? (cost.feedbackCost / breakdownTotal) * 100 : 0

    return {
      id: row.id,
      candidateName: deriveCandidateName(row.applicantEmail),
      totalTokens: cost.totalTokens,
      totalCostUsd: cost.totalCostUsd,
      scoringPct,
      feedbackPct,
      scoringCost: cost.scoringCost,
      feedbackCost: cost.feedbackCost,
    }
  })

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin AI Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Track AI spend and identify costly applications.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Total AI Spend (All Time)</p>
          <p className="text-3xl font-semibold">${totalAiSpend.toFixed(4)}</p>
        </article>
        <article className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Avg Cost per Candidate</p>
          <p className="text-3xl font-semibold">${avgCostPerCandidate.toFixed(4)}</p>
        </article>
      </section>

      <section className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Candidate Name</th>
              <th className="px-4 py-3 font-medium">Total Tokens</th>
              <th className="px-4 py-3 font-medium">Cost Breakdown</th>
              <th className="px-4 py-3 font-medium">Total Cost ($)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">{row.candidateName}</td>
                <td className="px-4 py-3">{row.totalTokens.toLocaleString("en-US")}</td>
                <td className="px-4 py-3">
                  <div className="w-56 space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="flex h-full w-full">
                        <div className="bg-blue-500" style={{ width: `${row.scoringPct}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${row.feedbackPct}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{`Scoring $${row.scoringCost.toFixed(4)}`}</span>
                      <span>{`Feedback $${row.feedbackCost.toFixed(4)}`}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">${row.totalCostUsd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

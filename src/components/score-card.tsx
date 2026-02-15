import { CheckCircle2, XCircle } from "lucide-react"
import { z } from "zod"

import { ScoringResultSchema } from "@/mastra/workflows/scoring"

type ScoringResult = z.infer<typeof ScoringResultSchema>

type ScoreCardProps = {
  data: ScoringResult
  isApplicantView?: boolean
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function scoreColorClass(score: number) {
  if (score >= 80) {
    return "bg-green-500"
  }

  if (score >= 50) {
    return "bg-yellow-500"
  }

  return "bg-red-500"
}

function isHighMatch(score: number) {
  return score >= 70
}

export function ScoreCard({ data, isApplicantView = false }: ScoreCardProps) {
  const overallScore = clampScore(data.overallScore)
  const ringStyle = {
    background: `conic-gradient(rgb(59 130 246) ${overallScore * 3.6}deg, rgb(228 228 231) 0deg)`,
  }

  return (
    <section className="space-y-6 rounded-xl border p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 rounded-full p-1" style={ringStyle}>
          <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
            <span className="text-2xl font-bold">{overallScore}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Score</p>
          <p className="text-sm text-muted-foreground">AI compatibility against role requirements</p>
        </div>
      </div>

      <blockquote className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {data.summary}
      </blockquote>

      <div className="space-y-4">
        {data.matches.map((match, index) => {
          const score = clampScore(match.score)
          const highMatch = isHighMatch(score)

          return (
            <div key={`${match.requirementName}-${index}`} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <p className="font-medium">{match.requirementName}</p>
                <div className="flex items-center gap-2">
                  {highMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-semibold">{score}%</span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${scoreColorClass(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {!isApplicantView ? (
                <p className="mt-2 text-xs text-muted-foreground">{match.reasoning}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

import { z } from "zod"

import { ScoringResultSchema } from "@/mastra/workflows/scoring"

type ScoringResult = z.infer<typeof ScoringResultSchema>

type ResumeExplainabilityProps = {
  resumeText: string
  scoreData: ScoringResult
}

type EvidenceSnippet = {
  start?: number
  end?: number
  excerpt: string
  matchedKeywords: string[]
}

const STOP_WORDS = new Set([
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

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+.#-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
}

function compact(text: string, maxLength = 300): string {
  const collapsed = text.replace(/\s+/g, " ").trim()
  if (collapsed.length <= maxLength) {
    return collapsed
  }

  return `${collapsed.slice(0, maxLength - 1)}...`
}

function collectResumeChunks(resumeText: string): string[] {
  const lines = resumeText
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length >= 8) {
    return lines
  }

  return resumeText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function pickEvidenceSnippets(
  resumeText: string,
  requirementName: string,
  reasoning: string
): EvidenceSnippet[] {
  const chunks = collectResumeChunks(resumeText)
  const keywords = Array.from(new Set([...tokenize(requirementName), ...tokenize(reasoning)])).slice(0, 12)

  const ranked = chunks
    .map((chunk) => {
      const lower = chunk.toLowerCase()
      const matchedKeywords = keywords.filter((keyword) => lower.includes(keyword)).slice(0, 6)
      const score = matchedKeywords.length

      return {
        chunk,
        score,
        matchedKeywords,
      }
    })
    .sort((a, b) => b.score - a.score)

  const candidates = ranked.filter((entry) => entry.score > 0).slice(0, 2)
  if (candidates.length > 0) {
    return candidates.map((entry) => ({
      excerpt: compact(entry.chunk),
      matchedKeywords: entry.matchedKeywords,
    }))
  }

  return chunks.slice(0, 2).map((chunk) => ({
    excerpt: compact(chunk),
    matchedKeywords: [],
  }))
}

export function ResumeExplainability({ resumeText, scoreData }: ResumeExplainabilityProps) {
  const trimmedResume = resumeText.trim()

  if (!trimmedResume) {
    return (
      <section className="space-y-3 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Resume Evidence</h2>
        <p className="text-sm text-muted-foreground">Resume text is unavailable for this application.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-xl border p-6">
      <div>
        <h2 className="text-lg font-semibold">Resume Evidence</h2>
        <p className="text-sm text-muted-foreground">
          AI scores are linked to resume excerpts to keep review decisions auditable.
        </p>
      </div>

      <div className="space-y-3">
        {scoreData.matches.map((match, index) => {
          const storedSpans = Array.isArray(match.evidenceSpans)
            ? match.evidenceSpans
                .filter(
                  (span) =>
                    typeof span.start === "number" &&
                    typeof span.end === "number" &&
                    typeof span.excerpt === "string" &&
                    Array.isArray(span.matchedKeywords)
                )
                .map((span) => ({
                  start: span.start,
                  end: span.end,
                  excerpt: span.excerpt,
                  matchedKeywords: span.matchedKeywords,
                }))
            : []
          const snippets =
            storedSpans.length > 0
              ? storedSpans
              : pickEvidenceSnippets(trimmedResume, match.requirementName, match.reasoning)

          return (
            <div key={`${match.requirementName}-${index}`} className="rounded-lg border p-4">
              <p className="text-sm font-medium">
                {match.requirementName} <span className="text-muted-foreground">({Math.round(match.score)})</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{match.reasoning}</p>

              <div className="mt-3 space-y-2">
                {snippets.map((snippet, snippetIndex) => (
                  <div key={`${match.requirementName}-${snippetIndex}`} className="rounded-md bg-muted/40 p-3">
                    <p className="text-sm">&quot;{snippet.excerpt}&quot;</p>
                    {snippet.matchedKeywords.length > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Matched: {snippet.matchedKeywords.join(", ")}
                      </p>
                    ) : null}
                    {typeof snippet.start === "number" && typeof snippet.end === "number" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Span: {snippet.start}-{snippet.end}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">View Full Resume Text</summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">{trimmedResume}</pre>
      </details>
    </section>
  )
}

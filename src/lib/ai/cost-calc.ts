export const MODEL_RATES = {
  "gpt-4o": { input: 2.5 / 1_000_000, output: 10.0 / 1_000_000 },
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
} as const

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MODEL_RATES[model as keyof typeof MODEL_RATES]
  if (!rates) {
    console.warn(`[cost-calc] Unknown model "${model}". Returning 0.`)
    return 0
  }

  const safeInputTokens = Number.isFinite(inputTokens) ? Math.max(0, inputTokens) : 0
  const safeOutputTokens = Number.isFinite(outputTokens) ? Math.max(0, outputTokens) : 0

  const total = safeInputTokens * rates.input + safeOutputTokens * rates.output
  return Number(total.toFixed(6))
}

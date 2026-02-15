import { Agent } from "@mastra/core"
import { Workflow, createStep } from "@mastra/core/workflows"
import { z } from "zod"

import { ensureMastraEnv } from "@/mastra/env"
import { ScoringResultSchema } from "@/mastra/workflows/scoring"

ensureMastraEnv()

const careerCoachAgent = new Agent({
  id: "career-coach-agent",
  name: "Career Coach",
  model: {
    id: "openai/gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  },
  instructions:
    'You are an empathetic Career Coach. Your goal is to write a rejection email that helps the candidate improve. Use the score breakdown to identify their top 2 gaps. Be specific but kind. Do not use generic fluff.',
})

const feedbackWorkflowInputSchema = z.object({
  scoringData: ScoringResultSchema,
  candidateName: z.string().min(1),
})

const feedbackStep = createStep(careerCoachAgent)

function buildFeedbackPrompt(input: z.infer<typeof feedbackWorkflowInputSchema>): string {
  return `
Candidate: ${input.candidateName}

Score Breakdown: ${JSON.stringify(input.scoringData)}

Task: Write a rejection email for the role.

Structure:

Thank them.

State the decision clearly.

Explain the primary reason based on the lowest scoring requirement.

Suggest a concrete resource or skill to improve.

Sign off.
  `.trim()
}

const feedbackWorkflow = new Workflow({
  id: "generate-feedback",
  inputSchema: feedbackWorkflowInputSchema,
  outputSchema: z.unknown(),
})

feedbackWorkflow
  .map({
    prompt: {
      fn: async ({ inputData }) => buildFeedbackPrompt(inputData),
      schema: z.string(),
    },
  })
  .then(feedbackStep)
  .commit()

export { feedbackWorkflow }

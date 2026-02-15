import { Agent } from "@mastra/core"
import { ensureMastraEnv } from "@/mastra/env"

ensureMastraEnv()

export const hiringAgent = new Agent({
  id: "hiring-manager",
  name: "Hiring Manager",
  model: {
    id: "openai/gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  },
  instructions: `
You are an expert Technical Recruiter and Hiring Manager.
Your job is to objectively evaluate candidates based only on the provided job requirements.
You are skeptical of buzzwords and look for "Proof of Work" (metrics, specific project details).
You never hallucinate skills that are not explicitly present in the text.
  `.trim(),
})

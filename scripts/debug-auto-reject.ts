import { eq } from "drizzle-orm"

import { db } from "../src/db/index"
import { applications, jobs } from "../src/db/schema"

async function main() {
  const rows = await db
    .select({
      appId: applications.id,
      status: applications.status,
      score: applications.aiScoreData,
      jobId: applications.jobId,
      settings: jobs.aiSettings,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .orderBy(applications.id)

  for (const row of rows.slice(-10)) {
    const scoreObj = row.score && typeof row.score === "object" ? (row.score as Record<string, unknown>) : null
    const settingsObj =
      row.settings && typeof row.settings === "object"
        ? (row.settings as Record<string, unknown>)
        : null

    const overallScore = typeof scoreObj?.overallScore === "number" ? scoreObj.overallScore : null
    const threshold =
      typeof settingsObj?.auto_reject_threshold === "number"
        ? settingsObj.auto_reject_threshold
        : null
    const scoringStatus = typeof scoreObj?.scoringStatus === "string" ? scoreObj.scoringStatus : null

    console.log({
      appId: row.appId,
      jobId: row.jobId,
      status: row.status,
      overallScore,
      threshold,
      scoringStatus,
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

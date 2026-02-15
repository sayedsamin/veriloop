import Link from "next/link"
import { and, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

import { ScoreCard } from "@/components/score-card"
import { db } from "@/db"
import { applications, jobs, referrals, users } from "@/db/schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ScoringResultSchema } from "@/mastra/workflows/scoring"
import { RejectionFeedbackPanel } from "@/app/dashboard/hr/applications/[appId]/_components/rejection-feedback-panel"
import { RetryScoringButton } from "@/app/dashboard/hr/applications/[appId]/_components/retry-scoring-button"
import { ResumeExplainability } from "@/app/dashboard/hr/applications/[appId]/_components/resume-explainability"
import { ReferralInsightsPanel } from "@/app/dashboard/hr/applications/[appId]/_components/referral-insights-panel"

type HrApplicationDetailsPageProps = {
  params: Promise<{ appId: string }>
}

export default async function HrApplicationDetailsPage({ params }: HrApplicationDetailsPageProps) {
  const { appId } = await params
  const applicationId = Number.parseInt(appId, 10)

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [application] = await db
    .select({
      id: applications.id,
      status: applications.status,
      createdAt: applications.createdAt,
      resumeData: applications.resumeData,
      aiScoreData: applications.aiScoreData,
      applicantId: applications.applicantId,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      creatorId: jobs.creatorId,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(and(eq(applications.id, applicationId), eq(jobs.creatorId, user.id)))
    .limit(1)

  if (!application) {
    notFound()
  }

  const parsedScore = ScoringResultSchema.safeParse(application.aiScoreData)
  const referralRows = await db
    .select({
      id: referrals.id,
      createdAt: referrals.createdAt,
      relationship: referrals.relationship,
      comment: referrals.comment,
      ratings: referrals.ratings,
      referrerProfile: referrals.referrerProfile,
      referrerEmail: users.email,
    })
    .from(referrals)
    .innerJoin(users, eq(users.id, referrals.referrerId))
    .where(and(eq(referrals.applicationId, application.id), eq(referrals.status, "submitted")))

  const aiScoreData =
    application.aiScoreData && typeof application.aiScoreData === "object"
      ? (application.aiScoreData as Record<string, unknown>)
      : {}

  const referralAverageRating =
    typeof aiScoreData.referralAverageRating === "number" ? aiScoreData.referralAverageRating : null
  const referralContribution =
    typeof aiScoreData.referralContribution === "number" ? aiScoreData.referralContribution : null
  const aiBaseScore = typeof aiScoreData.aiBaseScore === "number" ? aiScoreData.aiBaseScore : null
  const aiContribution =
    typeof aiScoreData.aiContribution === "number" ? aiScoreData.aiContribution : null
  const finalScore = typeof aiScoreData.overallScore === "number" ? aiScoreData.overallScore : null

  const referralJustification =
    aiScoreData.referralJustification && typeof aiScoreData.referralJustification === "object"
      ? (aiScoreData.referralJustification as Record<string, unknown>)
      : {}
  const positiveSignals = Array.isArray(referralJustification.positives)
    ? referralJustification.positives.filter((value): value is string => typeof value === "string")
    : []
  const negativeSignals = Array.isArray(referralJustification.negatives)
    ? referralJustification.negatives.filter((value): value is string => typeof value === "string")
    : []

  const normalizedReferrals = referralRows.map((row) => ({
    id: row.id,
    referrerEmail: row.referrerEmail,
    relationship: row.relationship,
    comment: row.comment,
    referrerProfile:
      row.referrerProfile &&
      typeof row.referrerProfile === "object" &&
      typeof row.referrerProfile.fullName === "string" &&
      typeof row.referrerProfile.headline === "string" &&
      typeof row.referrerProfile.company === "string" &&
      typeof row.referrerProfile.yearsExperience === "number"
        ? {
            fullName: row.referrerProfile.fullName,
            headline: row.referrerProfile.headline,
            company: row.referrerProfile.company,
            yearsExperience: row.referrerProfile.yearsExperience,
            linkedinUrl:
              typeof row.referrerProfile.linkedinUrl === "string"
                ? row.referrerProfile.linkedinUrl
                : undefined,
            credentialsSummary:
              typeof row.referrerProfile.credentialsSummary === "string"
                ? row.referrerProfile.credentialsSummary
                : undefined,
          }
        : null,
    createdAt: row.createdAt,
    ratings: Array.isArray(row.ratings)
      ? row.ratings.filter(
          (item): item is { requirementName: string; rating: number } =>
            !!item &&
            typeof item === "object" &&
            typeof item.requirementName === "string" &&
            typeof item.rating === "number"
        )
      : [],
  }))

  const scoringStatus =
    application.aiScoreData &&
    typeof application.aiScoreData === "object" &&
    typeof application.aiScoreData.scoringStatus === "string"
      ? application.aiScoreData.scoringStatus
      : null
  const scoringError =
    application.aiScoreData &&
    typeof application.aiScoreData === "object" &&
    typeof application.aiScoreData.scoringError === "string"
      ? application.aiScoreData.scoringError
      : null
  const feedbackDraft =
    typeof application.aiScoreData?.feedbackDraft === "string"
      ? application.aiScoreData.feedbackDraft
      : ""
  const resumeText =
    application.resumeData &&
    typeof application.resumeData === "object" &&
    typeof application.resumeData.text === "string"
      ? application.resumeData.text
      : ""

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link href={`/dashboard/hr/jobs/${application.jobId}`} className="text-sm text-muted-foreground hover:underline">
          Back to Candidate Leaderboard
        </Link>
        <h1 className="text-2xl font-semibold">Application #{application.id}</h1>
        <p className="text-sm text-muted-foreground">
          Job: {application.jobTitle} | Status: {application.status}
        </p>
      </header>

      {parsedScore.success ? (
        <div className="space-y-6">
          <ScoreCard data={parsedScore.data} />
          <ReferralInsightsPanel
            referrals={normalizedReferrals}
            referralAverageRating={referralAverageRating}
            referralContribution={referralContribution}
            aiBaseScore={aiBaseScore}
            aiContribution={aiContribution}
            finalScore={finalScore}
            positiveSignals={positiveSignals}
            negativeSignals={negativeSignals}
          />
          <ResumeExplainability resumeText={resumeText} scoreData={parsedScore.data} />
          <RejectionFeedbackPanel applicationId={application.id} initialDraft={feedbackDraft} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border p-6">
            {scoringStatus === "failed" ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-700">
                  AI scoring failed for this application. Manual review is required.
                </p>
                {scoringError ? <p className="text-sm text-muted-foreground">{scoringError}</p> : null}
                <RetryScoringButton applicationId={application.id} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                AI scoring data is not available for this application yet.
              </p>
            )}
          </div>

          <ReferralInsightsPanel
            referrals={normalizedReferrals}
            referralAverageRating={referralAverageRating}
            referralContribution={referralContribution}
            aiBaseScore={aiBaseScore}
            aiContribution={aiContribution}
            finalScore={finalScore}
            positiveSignals={positiveSignals}
            negativeSignals={negativeSignals}
          />

          <section className="space-y-3 rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Candidate Resume</h2>
            {resumeText.trim() ? (
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{resumeText}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">Resume text is unavailable for this application.</p>
            )}
          </section>

          {scoringStatus === "failed" ? (
            <div className="rounded-xl border border-dashed p-6">
              <p className="text-sm text-muted-foreground">
                Manual review mode: use the resume above and candidate history to decide status while AI scoring is unavailable.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </main>
  )
}

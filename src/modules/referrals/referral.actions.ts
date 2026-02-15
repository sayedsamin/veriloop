"use server"

import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/db"
import { applications, jobs, referrals, users } from "@/db/schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const ReferralRatingInputSchema = z.object({
  requirementName: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
})

const ReferrerProfileInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  headline: z.string().trim().min(2).max(160),
  company: z.string().trim().min(2).max(120),
  yearsExperience: z.number().int().min(0).max(60),
  linkedinUrl: z.string().trim().url().max(300).optional(),
  credentialsSummary: z.string().trim().max(500).optional(),
})

const SubmitReferralInputSchema = z.object({
  applicationId: z.number().int().positive(),
  relationship: z.enum(["Manager", "Peer", "Mentor"]),
  comment: z.string().trim().min(1).max(4000),
  ratings: z.array(ReferralRatingInputSchema).min(1),
  referrerProfile: ReferrerProfileInputSchema,
})

type SubmitReferralResult = { success: true } | { success: false; error: string }
type ReferralApplicationStatus = "pending" | "interview" | "rejected" | "hired"

type MyReferralItem = {
  id: number
  candidateName: string
  jobTitle: string
  status: ReferralApplicationStatus
  createdAt: Date
  impactScore: number
}

type GetMyReferralsResult =
  | { success: true; referrals: MyReferralItem[]; reputationScore: number }
  | { success: false; error: string }

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

function normalizeReferralStatus(value: string): ReferralApplicationStatus {
  if (value === "interview" || value === "rejected" || value === "hired") {
    return value
  }

  return "pending"
}

function computeImpactScore(status: ReferralApplicationStatus): number {
  if (status === "interview") {
    return 10
  }

  if (status === "hired") {
    return 25
  }

  return 0
}

function calculateReferralAverageRating(
  referralRows: Array<{ ratings: Array<{ requirementName: string; rating: number }> | null }>
) {
  const ratingValues = referralRows
    .flatMap((row) => (Array.isArray(row.ratings) ? row.ratings : []))
    .map((item) => item.rating)
    .filter((value): value is number => Number.isFinite(value) && value >= 1 && value <= 5)

  if (ratingValues.length === 0) {
    return null
  }

  const total = ratingValues.reduce((sum, value) => sum + value, 0)
  return total / ratingValues.length
}

function buildRequirementRatingAverages(
  referralRows: Array<{ ratings: Array<{ requirementName: string; rating: number }> | null }>
) {
  const buckets = new Map<string, { total: number; count: number }>()

  for (const row of referralRows) {
    const ratings = Array.isArray(row.ratings) ? row.ratings : []
    for (const item of ratings) {
      if (
        !item ||
        typeof item.requirementName !== "string" ||
        !item.requirementName.trim() ||
        typeof item.rating !== "number" ||
        !Number.isFinite(item.rating)
      ) {
        continue
      }

      const key = item.requirementName.trim()
      const existing = buckets.get(key)
      if (existing) {
        existing.total += item.rating
        existing.count += 1
        continue
      }

      buckets.set(key, { total: item.rating, count: 1 })
    }
  }

  return Array.from(buckets.entries())
    .map(([requirementName, bucket]) => ({
      requirementName,
      averageRating: Number((bucket.total / bucket.count).toFixed(2)),
      ratingCount: bucket.count,
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
}

function buildReferralJustification(
  requirementAverages: Array<{ requirementName: string; averageRating: number; ratingCount: number }>
) {
  const positives = requirementAverages
    .filter((item) => item.averageRating >= 4)
    .map((item) => `${item.requirementName} (${item.averageRating}/5)`)
  const negatives = requirementAverages
    .filter((item) => item.averageRating <= 2.5)
    .map((item) => `${item.requirementName} (${item.averageRating}/5)`)
  const neutrals = requirementAverages
    .filter((item) => item.averageRating > 2.5 && item.averageRating < 4)
    .map((item) => `${item.requirementName} (${item.averageRating}/5)`)

  return {
    model: "deterministic_referral_policy",
    positives,
    negatives,
    neutrals,
  }
}

export async function submitReferralAction(formData: FormData): Promise<SubmitReferralResult> {
  try {
    const applicationIdRaw = formData.get("applicationId")
    const relationshipRaw = formData.get("relationship")
    const commentRaw = formData.get("comment")
    const ratingsRaw = formData.get("ratingsJson")
    const referrerProfileRaw = formData.get("referrerProfileJson")

    if (
      typeof applicationIdRaw !== "string" ||
      typeof relationshipRaw !== "string" ||
      typeof commentRaw !== "string" ||
      typeof ratingsRaw !== "string" ||
      typeof referrerProfileRaw !== "string"
    ) {
      return { success: false, error: "Invalid referral payload." }
    }

    let parsedRatings: unknown
    let parsedReferrerProfile: unknown
    try {
      parsedRatings = JSON.parse(ratingsRaw)
      parsedReferrerProfile = JSON.parse(referrerProfileRaw)
    } catch {
      return { success: false, error: "Invalid referral payload." }
    }

    const parsed = SubmitReferralInputSchema.safeParse({
      applicationId: Number.parseInt(applicationIdRaw, 10),
      relationship: relationshipRaw,
      comment: commentRaw,
      ratings: parsedRatings,
      referrerProfile: parsedReferrerProfile,
    })

    if (!parsed.success) {
      return { success: false, error: "Please complete all referral fields correctly." }
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please sign in to submit a vouch." }
    }

    const [application] = await db
      .select({
        id: applications.id,
        applicantId: applications.applicantId,
      })
      .from(applications)
      .where(eq(applications.id, parsed.data.applicationId))
      .limit(1)

    if (!application) {
      return { success: false, error: "Application not found." }
    }

    if (application.applicantId === user.id) {
      return { success: false, error: "You cannot refer yourself." }
    }

    await db.insert(referrals).values({
      applicationId: parsed.data.applicationId,
      referrerId: user.id,
      status: "submitted",
      relationship: parsed.data.relationship,
      comment: parsed.data.comment,
      ratings: parsed.data.ratings,
      referrerProfile: parsed.data.referrerProfile,
    })

    const [applicationScore] = await db
      .select({
        aiScoreData: applications.aiScoreData,
      })
      .from(applications)
      .where(eq(applications.id, parsed.data.applicationId))
      .limit(1)

    const currentScoreData =
      applicationScore && applicationScore.aiScoreData && typeof applicationScore.aiScoreData === "object"
        ? (applicationScore.aiScoreData as Record<string, unknown>)
        : null

    const baseFromData = currentScoreData?.aiBaseScore
    const overallFromData = currentScoreData?.overallScore
    const aiBaseScore =
      typeof baseFromData === "number"
        ? baseFromData
        : typeof overallFromData === "number"
          ? overallFromData
          : null

    if (aiBaseScore === null) {
      return { success: false, error: "AI scoring data is unavailable for this application." }
    }

    const referralRows = await db
      .select({
        ratings: referrals.ratings,
      })
      .from(referrals)
      .where(
        and(
          eq(referrals.applicationId, parsed.data.applicationId),
          eq(referrals.status, "submitted")
        )
      )

    const referralAverageRating = calculateReferralAverageRating(
      referralRows as Array<{ ratings: Array<{ requirementName: string; rating: number }> | null }>
    )

    if (referralAverageRating === null) {
      return { success: false, error: "Referral ratings are invalid." }
    }

    const finalScore = Number(((aiBaseScore * 0.8) + referralAverageRating * 20).toFixed(2))
    const aiContribution = Number((aiBaseScore * 0.8).toFixed(2))
    const referralContribution = Number((referralAverageRating * 20).toFixed(2))
    const requirementAverages = buildRequirementRatingAverages(
      referralRows as Array<{ ratings: Array<{ requirementName: string; rating: number }> | null }>
    )
    const referralJustification = buildReferralJustification(requirementAverages)

    await db
      .update(applications)
      .set({
        aiScoreData: {
          ...(currentScoreData ?? {}),
          aiBaseScore,
          aiContribution,
          overallScore: finalScore,
          referralAverageRating,
          referralContribution,
          referralRequirementAverages: requirementAverages,
          referralJustification,
          referralBoost: true,
        } as typeof applications.$inferInsert.aiScoreData,
      })
      .where(eq(applications.id, parsed.data.applicationId))

    revalidatePath(`/refer/vouch/${parsed.data.applicationId}`)
    revalidatePath(`/dashboard/hr/applications/${parsed.data.applicationId}`)
    revalidatePath("/dashboard/hr")

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit referral."
    return { success: false, error: message }
  }
}

export async function getMyReferralsAction(): Promise<GetMyReferralsResult> {
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
        id: referrals.id,
        createdAt: referrals.createdAt,
        applicationStatus: applications.status,
        jobTitle: jobs.title,
        applicantEmail: users.email,
      })
      .from(referrals)
      .innerJoin(applications, eq(applications.id, referrals.applicationId))
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(users, eq(users.id, applications.applicantId))
      .where(eq(referrals.referrerId, user.id))
      .orderBy(desc(referrals.createdAt))

    const items: MyReferralItem[] = rows.map((row) => {
      const status = normalizeReferralStatus(row.applicationStatus)

      return {
        id: row.id,
        candidateName: deriveCandidateName(row.applicantEmail),
        jobTitle: row.jobTitle,
        status,
        createdAt: row.createdAt,
        impactScore: computeImpactScore(status),
      }
    })

    const interviewCount = items.filter((item) => item.status === "interview").length
    const hiredCount = items.filter((item) => item.status === "hired").length
    const reputationScore = items.length * 5 + interviewCount * 20 + hiredCount * 50

    return { success: true, referrals: items, reputationScore }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch referrals."
    return { success: false, error: message }
  }
}

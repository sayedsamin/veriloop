import Link from "next/link"
import { and, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

import { JobForm } from "@/app/jobs/new/_components/job-form"
import { db } from "@/db"
import { jobs } from "@/db/schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { type CreateJobInput } from "@/types/job.schema"

type EditJobPageProps = {
  params: Promise<{ id: string }>
}

function clampWeight(value: number) {
  if (value < 1) {
    return 1
  }

  if (value > 10) {
    return 10
  }

  return value
}

function clampThreshold(value: number) {
  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return value
}

function normalizeRequirements(input: unknown): CreateJobInput["requirements"] {
  if (!Array.isArray(input)) {
    return [
      {
        category: "skill",
        name: "Core requirement",
        weight: 5,
        isMandatory: false,
        aiContext: "",
      },
    ]
  }

  const normalized = input
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => {
      const value = item as Record<string, unknown>
      const categoryValue = value.category
      const nameValue = value.name ?? value.label ?? value.key
      const weightValue = value.weight
      const isMandatoryValue = value.isMandatory ?? value.required
      const aiContextValue = value.aiContext

      const category =
        categoryValue === "skill" ||
        categoryValue === "experience" ||
        categoryValue === "education" ||
        categoryValue === "certification"
          ? categoryValue
          : "skill"

      const name =
        typeof nameValue === "string" && nameValue.trim().length >= 2
          ? nameValue.trim()
          : "Core requirement"

      const weight =
        typeof weightValue === "number" && Number.isFinite(weightValue)
          ? clampWeight(Math.round(weightValue))
          : 5

      return {
        category,
        name,
        weight,
        isMandatory: Boolean(isMandatoryValue),
        aiContext: typeof aiContextValue === "string" ? aiContextValue : "",
      }
    })

  if (normalized.length === 0) {
    return [
      {
        category: "skill",
        name: "Core requirement",
        weight: 5,
        isMandatory: false,
        aiContext: "",
      },
    ]
  }

  return normalized
}

function normalizeAiSettings(input: unknown): CreateJobInput["aiSettings"] {
  const value = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const thresholdValue = value.autoRejectThreshold ?? value.auto_reject_threshold
  const feedbackModeValue = value.feedbackMode ?? value.feedback_mode

  return {
    autoRejectThreshold:
      typeof thresholdValue === "number" && Number.isFinite(thresholdValue)
        ? clampThreshold(Math.round(thresholdValue))
        : 50,
    feedbackMode:
      feedbackModeValue === "auto" || feedbackModeValue === "manual" || feedbackModeValue === "semi"
        ? feedbackModeValue
        : "semi",
  }
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { id } = await params
  const jobId = Number.parseInt(id, 10)

  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [job] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      location: jobs.location,
      employmentType: jobs.employmentType,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      salaryCurrency: jobs.salaryCurrency,
      requirementsConfig: jobs.requirementsConfig,
      aiSettings: jobs.aiSettings,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.creatorId, user.id)))
    .limit(1)

  if (!job) {
    notFound()
  }

  const initialValues: CreateJobInput = {
    title: job.title,
    description: job.description ?? "",
    location: job.location ?? "Remote",
    employmentType: job.employmentType ?? "full_time",
    salaryMin: typeof job.salaryMin === "number" ? job.salaryMin : 90000,
    salaryMax: typeof job.salaryMax === "number" ? job.salaryMax : 120000,
    salaryCurrency: typeof job.salaryCurrency === "string" ? job.salaryCurrency : "USD",
    requirements: normalizeRequirements(job.requirementsConfig),
    aiSettings: normalizeAiSettings(job.aiSettings),
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/dashboard/hr/jobs/${job.id}`}
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to Candidate Leaderboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit Job Posting</h1>
      </div>

      <JobForm mode="edit" jobId={job.id} initialValues={initialValues} />
    </main>
  )
}

import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

import { db } from "@/db"
import { jobs } from "@/db/schema"
import { submitApplicationAction } from "@/modules/applications/application.actions"
import { ApplicationForm } from "@/app/jobs/[id]/apply/_components/application-form"
import { JobDescription } from "@/app/jobs/[id]/_components/job-description"

type ApplyPageProps = {
  params: Promise<{ id: string }>
}

function formatEmploymentType(value: "full_time" | "part_time" | "contract" | "internship" | null) {
  if (!value) {
    return "Unspecified"
  }

  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (typeof min !== "number" || typeof max !== "number") {
    return "Salary not listed"
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  })

  return `${formatter.format(min)} - ${formatter.format(max)}`
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params
  const jobId = Number.parseInt(id, 10)

  if (!Number.isInteger(jobId) || jobId <= 0) {
    notFound()
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
      status: jobs.status,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1)

  if (!job || job.status === "closed") {
    notFound()
  }

  async function applyAction(
    _state: { error: string | null },
    formData: FormData
  ): Promise<{ error: string | null }> {
    "use server"

    let result: Awaited<ReturnType<typeof submitApplicationAction>>
    try {
      result = await submitApplicationAction(formData)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit application."
      return { error: message }
    }

    if (!result.success) {
      return { error: result.error }
    }

    const scoreQuery =
      typeof result.score === "number" && Number.isFinite(result.score)
        ? `?score=${result.score}`
        : ""

    redirect(`/jobs/${jobId}/apply/success${scoreQuery}`)
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
        <p className="text-sm text-muted-foreground">Apply Now</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border px-2 py-1 text-xs font-medium">
            {job.location ?? "Remote / Unspecified"}
          </span>
          <span className="inline-flex rounded-full border px-2 py-1 text-xs font-medium">
            {formatEmploymentType(job.employmentType)}
          </span>
          <span className="inline-flex rounded-full border px-2 py-1 text-xs font-medium">
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
          </span>
        </div>
      </header>

      <JobDescription description={job.description} />

      <ApplicationForm jobId={job.id} action={applyAction} />
    </main>
  )
}

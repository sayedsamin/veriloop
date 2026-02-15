import Link from "next/link"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { db } from "@/db"
import { jobs } from "@/db/schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { JobDescription } from "@/app/jobs/[id]/_components/job-description"

type JobDetailsPageProps = {
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

type PublicRequirement = {
  name: string
  category: string
}

function normalizeRequirements(input: unknown): PublicRequirement[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .filter((item) => typeof item === "object" && item !== null)
    .map((item, index) => {
      const requirement = item as Record<string, unknown>
      const nameValue = requirement.name ?? requirement.label ?? requirement.key
      const categoryValue = requirement.category

      return {
        name:
          typeof nameValue === "string" && nameValue.trim()
            ? nameValue
            : `Requirement ${index + 1}`,
        category:
          typeof categoryValue === "string" && categoryValue.trim()
            ? categoryValue
            : "general",
      }
    })
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
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
      creatorId: jobs.creatorId,
      location: jobs.location,
      employmentType: jobs.employmentType,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      salaryCurrency: jobs.salaryCurrency,
      requirementsConfig: jobs.requirementsConfig,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1)

  if (!job) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isCreator = user?.id === job.creatorId
  const requirements = normalizeRequirements(job.requirementsConfig)

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-28 pt-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
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
        <JobDescription description={job.description} />

        {isCreator ? (
          <Button asChild variant="outline">
            <Link href={`/dashboard/hr/jobs/${job.id}/edit`}>Edit Job</Link>
          </Button>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Requirements</h2>
        {requirements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public requirements listed.</p>
        ) : (
          <div className="space-y-2">
            {requirements.map((requirement, index) => (
              <div
                key={`${requirement.name}-${index}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="font-medium">{requirement.name}</span>
                <span className="text-xs capitalize text-muted-foreground">
                  {requirement.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl justify-end px-4 py-3">
          <Button asChild>
            <Link href={`/jobs/${job.id}/apply`}>Apply Now</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

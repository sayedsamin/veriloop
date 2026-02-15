import { and, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

import { db } from "@/db"
import { applications, jobs, users } from "@/db/schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { submitReferralAction } from "@/modules/referrals/referral.actions"
import { VouchForm } from "@/app/refer/vouch/[id]/_components/vouch-form"

type VouchPageProps = {
  params: Promise<{ id: string }>
}

type VouchFormState = {
  error: string | null
}

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

function normalizeRequirementNames(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .filter((item) => typeof item === "object" && item !== null)
    .map((item, index) => {
      const requirement = item as Record<string, unknown>
      const nameValue = requirement.name ?? requirement.label ?? requirement.key

      if (typeof nameValue === "string" && nameValue.trim()) {
        return nameValue.trim()
      }

      return `Requirement ${index + 1}`
    })
}

export default async function VouchPage({ params }: VouchPageProps) {
  const { id } = await params
  const applicationId = Number.parseInt(id, 10)

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/refer/vouch/${applicationId}`)}`)
  }

  const [record] = await db
    .select({
      applicationId: applications.id,
      jobTitle: jobs.title,
      requirementsConfig: jobs.requirementsConfig,
      applicantEmail: users.email,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(users, eq(users.id, applications.applicantId))
    .where(and(eq(applications.id, applicationId)))
    .limit(1)

  if (!record) {
    notFound()
  }

  const requirementNames = normalizeRequirementNames(record.requirementsConfig)
  const candidateName = deriveCandidateName(record.applicantEmail)

  async function vouchAction(
    _state: VouchFormState,
    formData: FormData
  ): Promise<VouchFormState> {
    "use server"

    const result = await submitReferralAction(formData)
    if (!result.success) {
      return { error: result.error }
    }

    redirect(`/refer/vouch/${record.applicationId}/success`)
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{`Vouch for ${candidateName}`}</h1>
        <p className="text-sm text-muted-foreground">{`Application #${record.applicationId} | ${record.jobTitle}`}</p>
      </header>

      {requirementNames.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            No job requirements are available for this vouching form.
          </p>
        </div>
      ) : (
        <VouchForm
          applicationId={record.applicationId}
          requirements={requirementNames}
          action={vouchAction}
        />
      )}
    </main>
  )
}

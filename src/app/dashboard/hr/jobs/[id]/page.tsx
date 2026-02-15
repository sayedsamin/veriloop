import Link from "next/link"
import { and, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

import { db } from "@/db"
import { jobs } from "@/db/schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getJobApplicationsAction } from "@/modules/applications/application.actions"
import { CandidateLeaderboard } from "@/app/dashboard/hr/jobs/[id]/_components/candidate-leaderboard"
import { Button } from "@/components/ui/button"
import { DeleteJobButton } from "@/app/dashboard/hr/_components/delete-job-button"

export default async function HrJobCandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const jobId = Number(id)

  if (!Number.isInteger(jobId) || jobId < 1) {
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
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.creatorId, user.id)))
    .limit(1)

  if (!job) {
    notFound()
  }

  const result = await getJobApplicationsAction(jobId)

  if (!result.success) {
    notFound()
  }

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link href="/dashboard/hr" className="text-sm text-muted-foreground hover:underline">
          Back to HR Dashboard
        </Link>
        <h1 className="text-2xl font-semibold">Candidates for {job.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/hr/jobs/${job.id}/edit`}>Edit Job</Link>
          </Button>
          <DeleteJobButton jobId={job.id} redirectTo="/dashboard/hr" />
        </div>
      </header>

      <CandidateLeaderboard applications={result.applications} />
    </main>
  )
}

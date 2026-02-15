import { redirect } from "next/navigation"

import { OpenJobsBoard } from "@/app/jobs/_components/open-jobs-board"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getOpenJobsAction } from "@/modules/jobs/job.actions"

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getOpenJobsAction()
  const jobs = result.success ? result.jobs : []

  return (
    <main className="w-full space-y-6 px-4 py-8 md:px-6">
      <header className="relative overflow-hidden rounded-2xl border bg-card/80 p-6 md:p-8">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Veriloop Talent Network</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Open Positions</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Browse roles scored by requirement-level criteria and apply with your latest resume.
        </p>
      </header>

      {!result.success ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <OpenJobsBoard jobs={jobs} />
      )}
    </main>
  )
}

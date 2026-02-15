import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ApplicationsTable } from "@/app/dashboard/applicant/_components/applications-table"
import { getMyApplicationsAction } from "@/modules/applications/application.actions"

export default async function ApplicantDashboardPage() {
  const result = await getMyApplicationsAction()

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">My Applications</h1>
        <p className="text-sm text-muted-foreground">Track your application status here.</p>
      </header>

      {!result.success ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : result.applications.length === 0 ? (
        <div className="space-y-4 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t applied to any jobs yet.
          </p>
          <Button asChild>
            <Link href="/jobs">Browse Jobs</Link>
          </Button>
        </div>
      ) : (
        <ApplicationsTable applications={result.applications} />
      )}
    </main>
  )
}

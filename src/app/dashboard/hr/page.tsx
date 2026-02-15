import Link from "next/link";
import { getJobsAction } from "@/modules/jobs/job.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteJobButton } from "@/app/dashboard/hr/_components/delete-job-button";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function statusBadgeClass(status: string) {
  if (status === "open") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (status === "closed") {
    return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  }

  return "bg-amber-500/15 text-amber-300 border-amber-500/30";
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

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null
) {
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

export default async function HrDashboardPage() {
  const result = await getJobsAction();
  const jobItems = result.success ? result.jobs : [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">HR Console</h1>
        <Button asChild>
          <Link href="/jobs/new">Create New Job</Link>
        </Button>
      </div>

      {!result.success ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : jobItems.length === 0 ? (
        <p className="text-muted-foreground">
          No active jobs. Create your first one to start hiring.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobItems.map((job) => (
            <Card key={job.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">
                    <Link href={`/dashboard/hr/jobs/${job.id}`} className="hover:underline">
                      {job.title}
                    </Link>
                  </CardTitle>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${statusBadgeClass(job.status)}`}
                  >
                    {job.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Created: {formatDate(job.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Applications: {job.applicationCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {job.location ?? "Remote / Unspecified"} | {formatEmploymentType(job.employmentType)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/hr/jobs/${job.id}`}>View Applications</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/hr/jobs/${job.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteJobButton jobId={job.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

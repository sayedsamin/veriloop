import Link from "next/link";
import { JobForm } from "@/app/jobs/new/_components/job-form";

export default function NewJobPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <Link
          href="/dashboard/hr"
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to Jobs Dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Create New Job Posting
        </h1>
      </div>

      <JobForm />
    </main>
  );
}

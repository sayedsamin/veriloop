"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { ScoreCard } from "@/components/score-card"
import { Button } from "@/components/ui/button"
import { getMyApplicationFeedbackAction } from "@/modules/applications/application.actions"
import { ScoringResultSchema } from "@/mastra/workflows/scoring"
import { RequestReferralDialog } from "@/app/dashboard/applicant/_components/request-referral-dialog"

type ApplicationItem = {
  id: number
  jobId: number
  jobTitle: string
  status: "pending" | "reviewed" | "interview" | "rejected"
  submittedAt: Date
}

type ApplicationsTableProps = {
  applications: ApplicationItem[]
}

type FeedbackState = {
  applicationId: number
  scoreData: z.infer<typeof ScoringResultSchema>
  gapAnalysis: string
} | null

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value)
}

function getStatusBadgeClass(status: "pending" | "reviewed" | "interview" | "rejected") {
  if (status === "pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700"
  }

  if (status === "reviewed") {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  if (status === "interview") {
    return "border-green-200 bg-green-50 text-green-700"
  }

  return "border-red-200 bg-red-50 text-red-700"
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isPending, startTransition] = useTransition()

  function handleViewFeedback(applicationId: number) {
    startTransition(async () => {
      const result = await getMyApplicationFeedbackAction(applicationId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setFeedback({
        applicationId,
        scoreData: result.data.scoreData,
        gapAnalysis: result.data.gapAnalysis,
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Job Title</th>
              <th className="px-4 py-3 font-medium">Date Applied</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Feedback</th>
              <th className="px-4 py-3 font-medium">Referral</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/jobs/${application.jobId}`} className="font-medium hover:underline">
                    {application.jobTitle}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(application.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(application.status)}`}
                  >
                    {application.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {application.status === "rejected" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleViewFeedback(application.id)}
                    >
                      View Feedback
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RequestReferralDialog applicationId={application.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {feedback ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Gap Analysis</h2>
          <ScoreCard data={feedback.scoreData} isApplicantView={true} />
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            {feedback.gapAnalysis}
          </div>
        </section>
      ) : null}
    </div>
  )
}

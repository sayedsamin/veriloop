"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateApplicationStatusAction } from "@/modules/applications/application.actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ApplicationItem = {
  id: number
  applicant: {
    email: string
  }
  status: "pending" | "reviewed" | "interview" | "rejected"
  score: number
  matches: unknown[]
  hasReferral: boolean
  createdAt: Date
}

type CandidateLeaderboardProps = {
  applications: ApplicationItem[]
}

function scoreBadgeClass(score: number) {
  if (score > 80) {
    return "border-green-200 bg-green-50 text-green-700"
  }

  if (score >= 50) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700"
  }

  return "border-red-200 bg-red-50 text-red-700"
}

function formatStatus(status: ApplicationItem["status"]) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`
}

export function CandidateLeaderboard({ applications }: CandidateLeaderboardProps) {
  const router = useRouter()
  const [items, setItems] = useState(applications)
  const [isPending, startTransition] = useTransition()

  function updateStatus(
    applicationId: number,
    status: "reviewed" | "interview" | "rejected"
  ) {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, status)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setItems((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status,
              }
            : item
        )
      )
      toast.success("Application status updated.")
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">No candidates have applied yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Candidate</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((application, index) => (
            <tr
              key={application.id}
              className="cursor-pointer border-t hover:bg-muted/40"
              onClick={() => router.push(`/dashboard/hr/applications/${application.id}`)}
            >
              <td className="px-4 py-3 font-medium">{index + 1}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <span>{application.applicant.email}</span>
                  {application.hasReferral ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                      title="Trust badge: referral received"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Trust
                    </span>
                  ) : null}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${scoreBadgeClass(application.score)}`}
                >
                  {application.score}
                </span>
              </td>
              <td className="px-4 py-3">{formatStatus(application.status)}</td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem
                      className="text-blue-700 focus:text-blue-700"
                      onClick={() => updateStatus(application.id, "reviewed")}
                    >
                      Mark as Reviewed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-green-700 focus:text-green-700"
                      onClick={() => updateStatus(application.id, "interview")}
                    >
                      Invite to Interview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => updateStatus(application.id, "rejected")}
                    >
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

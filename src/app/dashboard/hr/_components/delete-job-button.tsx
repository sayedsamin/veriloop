"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { deleteJobAction } from "@/modules/jobs/job.actions"
import { Button } from "@/components/ui/button"

type DeleteJobButtonProps = {
  jobId: number
  redirectTo?: string
  variant?: "destructive" | "outline" | "ghost"
}

export function DeleteJobButton({
  jobId,
  redirectTo,
  variant = "destructive",
}: DeleteJobButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this job posting? This will also remove related applications and referrals."
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await deleteJobAction(jobId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success("Job deleted.")

      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4" />
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  )
}

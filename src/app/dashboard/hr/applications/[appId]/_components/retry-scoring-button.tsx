"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { retryApplicationScoringAction } from "@/modules/applications/application.actions"

type RetryScoringButtonProps = {
  applicationId: number
}

export function RetryScoringButton({ applicationId }: RetryScoringButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRetry() {
    startTransition(async () => {
      const result = await retryApplicationScoringAction(applicationId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      if (typeof result.score === "number") {
        toast.success(`AI scoring completed. Score: ${result.score}`)
      } else {
        toast.error("AI scoring is still unavailable. Application remains in manual review.")
      }

      router.refresh()
    })
  }

  return (
    <Button type="button" variant="outline" onClick={handleRetry} disabled={isPending}>
      {isPending ? "Retrying..." : "Retry AI Scoring"}
    </Button>
  )
}

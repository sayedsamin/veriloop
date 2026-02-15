"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  generateFeedbackAction,
  updateApplicationStatusAction,
} from "@/modules/applications/application.actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type RejectionFeedbackPanelProps = {
  applicationId: number
  initialDraft: string
}

export function RejectionFeedbackPanel({ applicationId, initialDraft }: RejectionFeedbackPanelProps) {
  const [draft, setDraft] = useState(initialDraft)
  const [isPending, startTransition] = useTransition()
  const [isSending, startSending] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateFeedbackAction(applicationId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setDraft(result.feedbackDraft)
      toast.success("Rejection email draft generated.")
    })
  }

  function handleSend() {
    startSending(async () => {
      console.log("Send Rejection Email", { applicationId, draft })
      const result = await updateApplicationStatusAction(applicationId, "rejected")
      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success("Candidate marked as rejected.")
    })
  }

  return (
    <section className="space-y-3 rounded-xl border p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Rejection Feedback Draft</h2>
        {!draft ? (
          <Button type="button" onClick={handleGenerate} disabled={isPending}>
            {isPending ? "Generating..." : "Generate AI Feedback"}
          </Button>
        ) : null}
      </div>

      {draft ? (
        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={10}
            placeholder="Generated rejection email will appear here."
          />
          <Button type="button" variant="destructive" onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send Rejection Email"}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

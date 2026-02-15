"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RequestReferralDialogProps = {
  applicationId: number
}

function getConfiguredBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ""
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textArea = document.createElement("textarea")
  textArea.value = value
  textArea.style.position = "fixed"
  textArea.style.opacity = "0"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  document.execCommand("copy")
  document.body.removeChild(textArea)
}

export function RequestReferralDialog({ applicationId }: RequestReferralDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const baseUrl = useMemo(() => {
    const configured = getConfiguredBaseUrl()
    if (configured) {
      return configured.replace(/\/$/, "")
    }

    if (typeof window !== "undefined") {
      return window.location.origin
    }

    return ""
  }, [])

  const referralLink = useMemo(() => {
    const suffix = `/refer/vouch/${applicationId}`
    if (!baseUrl) {
      return suffix
    }

    return `${baseUrl}${suffix}`
  }, [applicationId, baseUrl])

  async function handleCopy() {
    try {
      await copyText(referralLink)
      toast.success("Referral link copied.")
    } catch {
      toast.error("Failed to copy referral link.")
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Request Referral
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`referral-dialog-title-${applicationId}`}
            className="w-full max-w-lg space-y-4 rounded-xl bg-background p-6 shadow-xl"
          >
            <div className="space-y-1">
              <h2 id={`referral-dialog-title-${applicationId}`} className="text-lg font-semibold">
                Share Referral Link
              </h2>
              <p className="text-sm text-muted-foreground">
                Send this link to a trusted referrer to submit a vouch.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor={`referral-link-${applicationId}`} className="text-sm font-medium">
                Unique Link
              </label>
              <Input id={`referral-link-${applicationId}`} value={referralLink} readOnly />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleCopy}>
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

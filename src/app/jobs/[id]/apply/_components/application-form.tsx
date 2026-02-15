"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ActionState = {
  error: string | null
}

type ApplicationFormProps = {
  jobId: number
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing Resume...
        </span>
      ) : (
        "Submit Application"
      )}
    </Button>
  )
}

export function ApplicationForm({ jobId, action }: ApplicationFormProps) {
  const [state, formAction] = useActionState(action, { error: null })

  return (
    <form action={formAction} className="space-y-5 rounded-xl border p-6">
      <input type="hidden" name="jobId" value={jobId} />

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="candidateEmail">Email</Label>
        <Input
          id="candidateEmail"
          name="candidateEmail"
          type="email"
          placeholder="jane@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Resume (PDF)</Label>
        <Input id="file" name="file" type="file" accept=".pdf,application/pdf" required />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <SubmitButton />
    </form>
  )
}

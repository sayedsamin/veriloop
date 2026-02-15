"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

type VouchFormState = {
  error: string | null
}

type VouchFormProps = {
  applicationId: number
  requirements: string[]
  action: (state: VouchFormState, formData: FormData) => Promise<VouchFormState>
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting...
        </span>
      ) : (
        "Submit Vouch"
      )}
    </Button>
  )
}

export function VouchForm({ applicationId, requirements, action }: VouchFormProps) {
  const [state, formAction] = useActionState(action, { error: null })
  const initialRatings = useMemo(
    () =>
      requirements.map((requirementName) => ({
        requirementName,
        rating: 3,
      })),
    [requirements]
  )
  const [ratings, setRatings] = useState(initialRatings)
  const [fullName, setFullName] = useState("")
  const [headline, setHeadline] = useState("")
  const [company, setCompany] = useState("")
  const [yearsExperience, setYearsExperience] = useState(0)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [credentialsSummary, setCredentialsSummary] = useState("")

  const ratingsJson = useMemo(() => JSON.stringify(ratings), [ratings])
  const referrerProfileJson = useMemo(
    () =>
      JSON.stringify({
        fullName,
        headline,
        company,
        yearsExperience,
        linkedinUrl: linkedinUrl.trim() ? linkedinUrl.trim() : undefined,
        credentialsSummary: credentialsSummary.trim() ? credentialsSummary.trim() : undefined,
      }),
    [company, credentialsSummary, fullName, headline, linkedinUrl, yearsExperience]
  )

  return (
    <form action={formAction} className="space-y-6 rounded-xl border p-6">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="ratingsJson" value={ratingsJson} />
      <input type="hidden" name="referrerProfileJson" value={referrerProfileJson} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your Credentials</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Taylor Morgan"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years of Experience</Label>
            <input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              value={yearsExperience}
              onChange={(event) =>
                setYearsExperience(Number.parseInt(event.target.value || "0", 10))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Role / Headline</Label>
            <input
              id="headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Engineering Manager, Frontend Platform"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <input
              id="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL (optional)</Label>
            <input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="https://www.linkedin.com/in/your-profile"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="credentialsSummary">Credentials Summary (optional)</Label>
            <Textarea
              id="credentialsSummary"
              rows={3}
              value={credentialsSummary}
              onChange={(event) => setCredentialsSummary(event.target.value)}
              placeholder="Share brief credentials relevant to this recommendation."
            />
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="relationship">Relationship</Label>
        <select
          id="relationship"
          name="relationship"
          defaultValue="Peer"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="Manager">Manager</option>
          <option value="Peer">Peer</option>
          <option value="Mentor">Mentor</option>
        </select>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Skill Ratings</h2>
        {ratings.map((ratingItem, index) => (
          <div key={`${ratingItem.requirementName}-${index}`} className="space-y-2">
            <Label htmlFor={`rating-${index}`}>
              {`How would you rate their ${ratingItem.requirementName}?`}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                id={`rating-${index}`}
                min={1}
                max={5}
                step={1}
                value={[ratingItem.rating]}
                onValueChange={(value) => {
                  const nextValue = value[0] ?? 3
                  setRatings((current) =>
                    current.map((entry, currentIndex) =>
                      currentIndex === index ? { ...entry, rating: nextValue } : entry
                    )
                  )
                }}
              />
              <span className="w-8 text-sm font-medium">{ratingItem.rating}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="space-y-2">
        <Label htmlFor="comment">Why do you recommend them?</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={6}
          placeholder="Share specific examples of impact, strengths, and collaboration."
          required
        />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton />
    </form>
  )
}

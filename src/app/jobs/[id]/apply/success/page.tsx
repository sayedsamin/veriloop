import Link from "next/link"

import { Button } from "@/components/ui/button"

type ApplySuccessPageProps = {
  searchParams: Promise<{ score?: string }>
}

export default async function ApplySuccessPage({ searchParams }: ApplySuccessPageProps) {
  const { score } = await searchParams
  const parsedScore = Number.parseFloat(score ?? "")
  const hasScore = Number.isFinite(parsedScore)

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center px-4 py-12">
      <div className="w-full space-y-3 rounded-xl border p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Application Received</h1>
        <p className="text-sm text-muted-foreground">
          Thanks for applying. Our team will review your profile and follow up soon.
        </p>
        {hasScore ? <p className="text-sm font-medium">Current Match Score: {parsedScore}</p> : null}
        <div className="pt-2">
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

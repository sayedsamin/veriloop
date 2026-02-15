import Link from "next/link"

import { Button } from "@/components/ui/button"

type VouchSuccessPageProps = {
  params: Promise<{ id: string }>
}

export default async function VouchSuccessPage({ params }: VouchSuccessPageProps) {
  const { id } = await params

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center px-4 py-12">
      <section className="w-full space-y-4 rounded-xl border p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Thanks for your vouch</h1>
        <p className="text-sm text-muted-foreground">
          Your referral for application #{id} was submitted successfully.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/refer/vouch/${id}`}>Back to Vouch Page</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}

import { getMyReferralsAction } from "@/modules/referrals/referral.actions"

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value)
}

function statusBadgeClass(status: "pending" | "interview" | "hired" | "rejected") {
  if (status === "interview") {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  if (status === "hired") {
    return "border-green-200 bg-green-50 text-green-700"
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  return "border-gray-200 bg-gray-50 text-gray-700"
}

function trustLevelFromScore(score: number) {
  if (score >= 200) {
    return "Talent Scout"
  }

  if (score >= 50) {
    return "Connector"
  }

  return "Newbie"
}

export default async function ReferrerDashboardPage() {
  const result = await getMyReferralsAction()

  if (!result.success) {
    return (
      <main className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">My Referrals</h1>
        </header>
        <p className="text-sm text-destructive">{result.error}</p>
      </main>
    )
  }

  const totalReferred = result.referrals.length
  const successfulPlacements = result.referrals.filter((item) => item.status === "hired").length
  const trustLevel = trustLevelFromScore(result.reputationScore)

  return (
    <main className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">My Referrals</h1>
        </div>
        <div className="rounded-xl border px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Trust Level</p>
          <p className="text-sm font-medium">{trustLevel}</p>
          <p className="text-xs text-muted-foreground">{result.reputationScore} pts</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Referred</p>
          <p className="text-2xl font-semibold">{totalReferred}</p>
        </article>
        <article className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Successful Placements</p>
          <p className="text-2xl font-semibold">{successfulPlacements}</p>
        </article>
      </section>

      {result.referrals.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t referred anyone yet. Ask a candidate for their unique referral link!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Vouched Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.referrals.map((referral) => (
                <tr key={referral.id} className="border-t">
                  <td className="px-4 py-3">{referral.candidateName}</td>
                  <td className="px-4 py-3">{referral.jobTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(referral.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium capitalize ${statusBadgeClass(referral.status)}`}
                    >
                      {referral.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

type ReferralRating = {
  requirementName: string
  rating: number
}

type ReferralItem = {
  id: number
  referrerEmail: string
  referrerProfile: {
    fullName: string
    headline: string
    company: string
    yearsExperience: number
    linkedinUrl?: string
    credentialsSummary?: string
  } | null
  relationship: string | null
  comment: string | null
  ratings: ReferralRating[]
  createdAt: Date
}

type ReferralInsightsPanelProps = {
  referrals: ReferralItem[]
  referralAverageRating: number | null
  referralContribution: number | null
  aiBaseScore: number | null
  aiContribution: number | null
  finalScore: number | null
  positiveSignals: string[]
  negativeSignals: string[]
}

function scorePillClass(rating: number) {
  if (rating >= 4) {
    return "border-green-200 bg-green-50 text-green-700"
  }

  if (rating <= 2) {
    return "border-red-200 bg-red-50 text-red-700"
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700"
}

export function ReferralInsightsPanel({
  referrals,
  referralAverageRating,
  referralContribution,
  aiBaseScore,
  aiContribution,
  finalScore,
  positiveSignals,
  negativeSignals,
}: ReferralInsightsPanelProps) {
  if (referrals.length === 0) {
    return null
  }

  return (
    <section className="space-y-4 rounded-xl border p-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Referral Signals</h2>
        <p className="text-sm text-muted-foreground">
          Referral scoring and justifications used in the final candidate score.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">Score Breakdown</p>
          <p className="text-muted-foreground">
            AI Base: {aiBaseScore ?? 0}% | Weighted AI: {aiContribution ?? 0}
          </p>
          <p className="text-muted-foreground">
            Referral Avg: {referralAverageRating ?? 0}/5 | Referral Contribution:{" "}
            {referralContribution ?? 0}
          </p>
          <p className="mt-1 font-medium">Final Score: {finalScore ?? 0}%</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
            <p className="text-sm font-medium text-green-800">Positive Signals</p>
            {positiveSignals.length > 0 ? (
              <ul className="mt-1 space-y-1 text-xs text-green-900">
                {positiveSignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-green-900">No strong positives detected.</p>
            )}
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
            <p className="text-sm font-medium text-red-800">Negative Signals</p>
            {negativeSignals.length > 0 ? (
              <ul className="mt-1 space-y-1 text-xs text-red-900">
                {negativeSignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-red-900">No negative signals detected.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {referrals.map((referral) => (
          <article key={referral.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {referral.referrerProfile?.fullName ?? referral.referrerEmail}
                {referral.relationship ? ` | ${referral.relationship}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {referral.createdAt.toLocaleString("en-US")}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Referrer Account: {referral.referrerEmail}</p>
            {referral.referrerProfile ? (
              <div className="mt-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  {referral.referrerProfile.headline} at {referral.referrerProfile.company}
                </p>
                <p>{referral.referrerProfile.yearsExperience} years of experience</p>
                {referral.referrerProfile.linkedinUrl ? (
                  <p>
                    LinkedIn:{" "}
                    <a
                      href={referral.referrerProfile.linkedinUrl}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {referral.referrerProfile.linkedinUrl}
                    </a>
                  </p>
                ) : null}
                {referral.referrerProfile.credentialsSummary ? (
                  <p className="mt-1">{referral.referrerProfile.credentialsSummary}</p>
                ) : null}
              </div>
            ) : null}
            {referral.comment ? <p className="mt-2 text-sm text-muted-foreground">{referral.comment}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {referral.ratings.map((rating, index) => (
                <span
                  key={`${referral.id}-${rating.requirementName}-${index}`}
                  className={`inline-flex rounded-full border px-2 py-1 text-xs ${scorePillClass(rating.rating)}`}
                >
                  {rating.requirementName}: {rating.rating}/5
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

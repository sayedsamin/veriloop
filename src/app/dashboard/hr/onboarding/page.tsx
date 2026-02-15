import Link from "next/link"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type JourneyStep = {
  title: string
  body: string
  icon: React.ComponentType<{ className?: string }>
}

type ActionGuide = {
  buttonLabel: string
  location: string
  whatItDoes: string
  visualTone: "primary" | "neutral" | "success"
}

const hrJourney: JourneyStep[] = [
  {
    title: "Set Hiring Policy",
    body: "Create a job with weighted requirements, mandatory criteria, and threshold settings.",
    icon: Target,
  },
  {
    title: "AI + Referral Intelligence",
    body: "Review score evidence, referral credentials, and positive or negative trust signals.",
    icon: Bot,
  },
  {
    title: "Human Decision + Feedback",
    body: "Update application status and send transparent, data-backed feedback drafts.",
    icon: ShieldCheck,
  },
]

const actionGuide: ActionGuide[] = [
  {
    buttonLabel: "Create New Job",
    location: "HR Console Header",
    whatItDoes:
      "Opens the job builder where you define requirements, weights, mandatory flags, and auto-reject threshold.",
    visualTone: "primary",
  },
  {
    buttonLabel: "View Applications",
    location: "Job Card / HR Console",
    whatItDoes:
      "Opens candidate leaderboard for a job so you can compare candidates and open full application details.",
    visualTone: "neutral",
  },
  {
    buttonLabel: "Edit",
    location: "Job Card / HR Console",
    whatItDoes:
      "Lets you adjust job requirements and AI settings when hiring policy needs to change.",
    visualTone: "neutral",
  },
  {
    buttonLabel: "Retry Scoring",
    location: "Application Detail",
    whatItDoes:
      "Re-runs AI scoring when parsing or model execution failed for a specific candidate.",
    visualTone: "neutral",
  },
  {
    buttonLabel: "Generate Feedback",
    location: "Application Detail",
    whatItDoes:
      "Creates a feedback draft from score gaps to support transparent rejection communication.",
    visualTone: "success",
  },
]

function guideToneClass(tone: ActionGuide["visualTone"]) {
  if (tone === "primary") {
    return "border-blue-300/70 bg-blue-50/70 dark:bg-blue-950/25"
  }
  if (tone === "success") {
    return "border-emerald-300/70 bg-emerald-50/70 dark:bg-emerald-950/25"
  }
  return "border-border bg-background"
}

export default function HrOnboardingPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          HR Onboarding
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">How To Run Hiring In Veriloop</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Visual onboarding for HR workflows, decision points, and button-level actions.
        </p>
      </header>

      <section className="rounded-2xl border bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 p-5">
        <h2 className="text-lg font-semibold">Hiring Journey Map</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {hrJourney.map((step, index) => {
            const Icon = step.icon
            return (
              <article key={step.title} className="rounded-xl border bg-background/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold">
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Control Surface Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 rounded-lg border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">HR Console</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">Create New Job</span>
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">View Applications</span>
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">Edit</span>
                      <FileSearch className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Application Detail</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">Retry Scoring</span>
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">Generate Feedback</span>
                      <MessageSquareText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">Referral Insights</span>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decision Confidence Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">AI Evidence</p>
              <p className="mt-1 text-sm">Requirement-level reasoning + resume snippets</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Referral Trust</p>
              <p className="mt-1 text-sm">Referrer identity, credentials, positive/negative ratings</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Human Override</p>
              <p className="mt-1 text-sm">Final status remains an HR decision with full traceability</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Button Action Guide</h2>
        <div className="grid gap-3">
          {actionGuide.map((row) => (
            <article
              key={row.buttonLabel}
              className={`rounded-xl border p-3 ${guideToneClass(row.visualTone)}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border bg-background px-2 py-1 text-xs font-semibold">
                  {row.buttonLabel}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{row.location}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{row.whatItDoes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Create Job",
            body: "Set requirements and launch structured evaluation.",
            href: "/jobs/new",
            icon: Target,
          },
          {
            title: "Open HR Console",
            body: "Review jobs and move candidates through decisions.",
            href: "/dashboard/hr",
            icon: LayoutDashboard,
          },
          {
            title: "Public Jobs Board",
            body: "Confirm role visibility before sharing externally.",
            href: "/jobs",
            icon: Megaphone,
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-flex rounded-md border bg-muted/40 p-1.5">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">{item.body}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href} className="inline-flex items-center gap-1">
                    Open
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </main>
  )
}

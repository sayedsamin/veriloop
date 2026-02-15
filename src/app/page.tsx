import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HomePersonaSwitcher } from "@/app/_components/home-persona-switcher"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const workflow = [
  {
    title: "Input",
    text: "HR defines weighted requirements, threshold policy, and role criteria once.",
  },
  {
    title: "Process",
    text: "AI scores evidence by requirement, referrals add weighted trust, and every score includes rationale.",
  },
  {
    title: "Result",
    text: "Teams review ranked candidates faster while applicants get transparent gap feedback.",
  },
]

const featureBlocks = [
  {
    title: "Go beyond ATS keyword filtering",
    body: "Your ATS stores applications. This platform evaluates them. Requirement-level scoring replaces manual resume triage with proof-based matching and transparent reasoning per requirement.",
    outcome: "Outcome: Teams spend review time on qualified candidates, not noisy resumes.",
    reverse: false,
  },
  {
    title: "Turn referrals into measurable trust signal",
    body: "Micro-vouching captures relationship context plus requirement-by-requirement ratings. Referral signal boosts scoring without overriding your hiring policy.",
    outcome: "Outcome: Stronger decisions on borderline applicants with traceable trust input.",
    reverse: true,
  },
  {
    title: "Deliver no-ghosting feedback for every rejected applicant",
    body: "AI generates constructive rejection drafts from actual score gaps, and applicants can view gap analysis tied to their requirement-level results.",
    outcome: "Outcome: Better candidate experience with transparent, data-backed feedback.",
    reverse: false,
  },
]

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isSignedIn = Boolean(user)

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(16,185,129,0.14),transparent_36%)]" />

      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image
              src="/Veriloop.png"
              alt="Veriloop"
              width={44}
              height={44}
              className="h-11 w-11 rounded-md object-cover"
              priority
            />
            <span className="text-sm font-semibold uppercase tracking-[0.12em]">Veriloop</span>
          </div>
          {isSignedIn ? (
            <nav className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Signed in as {user?.email}</span>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </nav>
          ) : (
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </nav>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-16 md:pt-20">
        <div className="grid items-start gap-10 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Built for HR, Recruiters, Referrers, and Admins
            </p>
            <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight md:text-7xl">
              Turn your ATS into
              <br />
              a hiring intelligence
              <br />
              engine.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              Veriloop is a policy-driven layer for scoring, referrals, and feedback. Keep your existing ATS,
              then add requirement-level evaluation, transparent rationale, trust-weighted
              vouching, and applicant gap analysis.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="px-6">
                <Link href="/dashboard">
                  Get a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/jobs">Explore Open Roles</Link>
              </Button>
            </div>
          </div>

          <aside className="grid gap-4">
            <article className="-rotate-1 rounded-2xl border bg-card p-5 shadow-sm">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Decision consistency
              </p>
              <p className="text-3xl font-semibold">Proof {" > "} Keyword Match</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Weighted requirement scoring with explicit pass/fail reasoning.
              </p>
            </article>

            <article className="rotate-1 rounded-2xl border bg-card p-5 shadow-sm">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Structured trust signal
              </p>
              <p className="text-3xl font-semibold">Micro-Vouching Engine</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Relationship-aware referrals that add score lift within policy limits.
              </p>
            </article>

            <article className="-rotate-[0.5deg] rounded-2xl border bg-card p-5 shadow-sm">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Candidate experience
              </p>
              <p className="text-3xl font-semibold">Gap Feedback Loop</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Rejection feedback drafts and applicant-visible gap analysis from real scores.
              </p>
            </article>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <div className="relative overflow-hidden rounded-[2rem] border bg-background/75 p-6 md:p-8">
          <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
          <h2 className="text-3xl font-semibold">How It Works</h2>
          <p className="mt-2 text-sm text-muted-foreground">Input &rarr; Process &rarr; Result</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <article
                key={step.title}
                className={`relative rounded-xl border bg-card/75 p-5 ${
                  index === 1 ? "md:-translate-y-3" : index === 2 ? "md:translate-y-2" : ""
                }`}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                {index < workflow.length - 1 ? (
                  <div className="mt-4 hidden md:flex">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="-rotate-[0.6deg] rounded-xl border bg-slate-900 px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 rotate-[0.6deg]">
            <span>Policy-Driven Decisions</span>
            <span>Trust-Weighted Referrals</span>
            <span>Ranked Candidate Leaderboards</span>
            <span>Threshold-Based Auto Decisions</span>
            <span>Transparent Feedback</span>
            <span>Human-in-the-Loop Review</span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <div className="space-y-6">
          {featureBlocks.map((feature, index) => (
            <article
              key={feature.title}
              className={`rounded-2xl border bg-card/80 p-6 md:p-8 ${
                index === 0
                  ? "md:mr-8 md:rotate-[-0.35deg]"
                  : index === 1
                    ? "md:ml-10 md:rotate-[0.45deg]"
                    : "md:mr-4 md:rotate-[-0.25deg]"
              }`}
            >
              <div
                className={`grid items-center gap-6 md:grid-cols-2 ${
                  feature.reverse ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1" : ""
                }`}
              >
                <div className="rounded-xl border bg-gradient-to-br from-slate-100 to-slate-200 p-6 shadow-inner dark:from-slate-900 dark:to-slate-800">
                  <div className="grid gap-3">
                    <div className="h-3 w-32 rounded bg-slate-300/90 dark:bg-slate-600" />
                    <div className="h-3 w-24 rounded bg-slate-300/80 dark:bg-slate-600" />
                    <div className="h-20 rounded bg-white/80 dark:bg-slate-700/70" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-10 rounded bg-white/90 dark:bg-slate-700/80" />
                      <div className="h-10 rounded bg-white/90 dark:bg-slate-700/80" />
                      <div className="h-10 rounded bg-white/90 dark:bg-slate-700/80" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Feature {index + 1}
                  </p>
                  <h3 className="text-3xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground md:text-base">{feature.body}</p>
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-sm font-medium">
                    {feature.outcome}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/10 via-transparent to-emerald-500/10" />
          <HomePersonaSwitcher />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-background/70 p-6 md:p-8">
            <h2 className="text-3xl font-semibold">Pricing</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Enterprise pricing is currently being finalized. We are onboarding pilot teams now and
              publishing public pricing tiers soon.
            </p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Join Pilot Access</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-900 p-6 text-white md:rotate-[1deg]">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Early access</p>
            <p className="mt-3 text-2xl font-semibold">Pilot Cohort Open</p>
            <p className="mt-2 text-sm text-slate-200">
              Priority onboarding for teams that want guided setup, workflow tuning, and executive reporting.
            </p>
            <div className="mt-5 text-xs text-slate-300">
              Includes implementation support and policy setup guidance.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border bg-gradient-to-r from-slate-900 to-blue-900 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.14em] text-blue-100">Conversion Close</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Build a hiring process your team can defend and your candidates can trust.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-blue-100 md:text-base">
            Keep your current ATS and add an intelligence layer for quality hiring, explainable
            decisions, and better applicant communication.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/30 bg-white/10 hover:bg-white/20"
            >
              <Link href="/jobs/new">Create First Job Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t bg-background/95">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em]">
              Veriloop
            </p>
            <p className="text-xs text-muted-foreground">
              Policy-driven hiring operations with trust signals and transparent decisioning.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  API Docs
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  )
}

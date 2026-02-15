"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

type PersonaKey = "engineering" | "management" | "recruiting" | "finance"

const personaCopy: Record<
  PersonaKey,
  {
    label: string
    title: string
    description: string
    points: string[]
  }
> = {
  engineering: {
    label: "Built for Engineers",
    title: "Reduce resume noise and focus on proven capability.",
    description:
      "Requirement-based scoring helps technical teams evaluate depth, not just keyword density.",
    points: [
      "Role-specific skill scoring with requirement traceability",
      "Referral context tied to specific competencies",
      "Faster shortlist decisions with less manual triage",
    ],
  },
  management: {
    label: "Built for Managers",
    title: "Hire with consistency across teams and regions.",
    description:
      "Codify hiring policy once and apply it the same way across every opening.",
    points: [
      "Standardized scoring and threshold logic",
      "Transparent candidate rationale for alignment meetings",
      "Reusable playbooks for repeat roles",
    ],
  },
  recruiting: {
    label: "Built for Recruiters",
    title: "Deliver better candidate experiences at scale.",
    description:
      "Automated gap feedback and referral workflows keep communication clear and timely.",
    points: [
      "No-ghosting rejection workflows",
      "Structured referral intake and trust signals",
      "Centralized dashboard for status and decision context",
    ],
  },
  finance: {
    label: "Built for Finance",
    title: "Track hiring quality with accountable operations.",
    description:
      "Monitor decision quality, workflow consistency, and operating efficiency across hiring stages.",
    points: [
      "Visibility into scoring and feedback workflow volume",
      "Consistent policy execution across teams",
      "Audit-ready trail for hiring decisions",
    ],
  },
}

export function HomePersonaSwitcher() {
  const [active, setActive] = useState<PersonaKey>("engineering")
  const content = personaCopy[active]

  return (
    <section className="rounded-2xl border bg-background/70 p-6 md:p-8">
      <h2 className="text-3xl font-semibold">Find Your Fit</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Select a persona to see how the platform creates value for that team.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={active === "engineering" ? "default" : "outline"}
          onClick={() => setActive("engineering")}
        >
          Engineers
        </Button>
        <Button
          type="button"
          variant={active === "management" ? "default" : "outline"}
          onClick={() => setActive("management")}
        >
          Managers
        </Button>
        <Button
          type="button"
          variant={active === "recruiting" ? "default" : "outline"}
          onClick={() => setActive("recruiting")}
        >
          Recruiters
        </Button>
        <Button
          type="button"
          variant={active === "finance" ? "default" : "outline"}
          onClick={() => setActive("finance")}
        >
          Finance
        </Button>
      </div>

      <article className="mt-5 rounded-xl border bg-card/70 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {content.label}
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{content.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {content.points.map((point) => (
            <li key={point} className="rounded-md bg-muted/50 px-3 py-2">
              {point}
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

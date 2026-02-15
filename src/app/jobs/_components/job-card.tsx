import Link from "next/link"
import { BriefcaseBusiness, CalendarDays, FileCheck2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type JobCardProps = {
  id: number
  title: string
  description: string | null
  location: string | null
  employmentType: "full_time" | "part_time" | "contract" | "internship" | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  createdAt: Date
  requirementsCount: number
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value)
}

function truncateDescription(description: string | null): string {
  if (!description) {
    return "Role details will be shared during screening."
  }

  if (description.length <= 150) {
    return description
  }

  return `${description.slice(0, 150)}...`
}

function formatEmploymentType(value: JobCardProps["employmentType"]) {
  if (!value) {
    return "Unspecified"
  }

  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (typeof min !== "number" || typeof max !== "number") {
    return "Salary not listed"
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  })

  return `${formatter.format(min)} - ${formatter.format(max)}`
}

export function JobCard({
  id,
  title,
  description,
  location,
  employmentType,
  salaryMin,
  salaryMax,
  salaryCurrency,
  createdAt,
  requirementsCount,
}: JobCardProps) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/70 bg-gradient-to-b from-card via-card to-muted/20 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/80 via-cyan-500/60 to-emerald-500/70" />
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <FileCheck2 className="h-3.5 w-3.5" />
            {requirementsCount} Requirements
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(createdAt)}
          </span>
        </div>
        <CardTitle className="min-h-12 text-xl leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {formatEmploymentType(employmentType)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {location ?? "Remote / Unspecified"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{truncateDescription(description)}</p>
        <div className="rounded-lg border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{formatSalary(salaryMin, salaryMax, salaryCurrency)}</span>
          {" "}annual base range
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/jobs/${id}/apply`}>Apply Now</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

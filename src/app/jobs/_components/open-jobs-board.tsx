"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { JobCard } from "@/app/jobs/_components/job-card"

type OpenJob = {
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

type OpenJobsBoardProps = {
  jobs: OpenJob[]
}

export function OpenJobsBoard({ jobs }: OpenJobsBoardProps) {
  const [query, setQuery] = useState("")

  const filteredJobs = useMemo(() => {
    const search = query.trim().toLowerCase()

    if (!search) {
      return jobs
    }

    return jobs.filter((job) => {
      const titleMatch = job.title.toLowerCase().includes(search)
      const descriptionMatch = (job.description ?? "").toLowerCase().includes(search)
      return titleMatch || descriptionMatch
    })
  }, [jobs, query])

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border bg-card/70 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by job title or role description"
            aria-label="Search open roles"
            className="h-11 border-0 bg-background pl-9 shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border bg-card/70 p-8 text-center">
          <p className="text-sm text-muted-foreground">No open roles match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      )}
    </section>
  )
}

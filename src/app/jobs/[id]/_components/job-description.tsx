type JobDescriptionProps = {
  description: string | null
}

function normalizeDescription(raw: string): string {
  return raw
    .replace(
      /\s+(Role Overview:|Responsibilities:|Qualifications:|Compensation & Benefits:|Work Setup:)/g,
      "\n\n$1"
    )
    .replace(/\s+-\s+/g, "\n- ")
}

type ParsedSection = {
  heading: string | null
  paragraphs: string[]
  bullets: string[]
}

function parseSections(description: string): ParsedSection[] {
  const normalized = normalizeDescription(description).trim()
  if (!normalized) {
    return []
  }

  return normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)

      if (lines.length === 0) {
        return { heading: null, paragraphs: [], bullets: [] }
      }

      let heading: string | null = null
      const contentLines = [...lines]

      if (contentLines[0]?.endsWith(":")) {
        heading = contentLines.shift() ?? null
      }

      const bullets = contentLines
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim())
      const paragraphs = contentLines.filter((line) => !line.startsWith("- "))

      return { heading, paragraphs, bullets }
    })
    .filter((section) => section.heading || section.paragraphs.length > 0 || section.bullets.length > 0)
}

export function JobDescription({ description }: JobDescriptionProps) {
  if (!description) {
    return <p className="text-sm text-muted-foreground">No description provided.</p>
  }

  const sections = parseSections(description)
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">{description}</p>
  }

  return (
    <div className="space-y-5">
      {sections.map((section, index) => (
        <section key={`${section.heading ?? "section"}-${index}`} className="space-y-2">
          {section.heading ? <h3 className="text-base font-semibold">{section.heading}</h3> : null}
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={`paragraph-${paragraphIndex}`} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
          {section.bullets.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              {section.bullets.map((bullet, bulletIndex) => (
                <li key={`bullet-${bulletIndex}`}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  )
}

import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { jobs, users } from "@/db/schema";

dotenv.config({ path: ".env.local" });

const CREATOR_ID = "7142bde3-52fc-4294-82d0-4ce8a6e713a2";
const CREATOR_EMAIL = "hr.manager.seed@example.com";

type SeedRequirement = {
  category: "skill" | "experience" | "education" | "certification";
  name: string;
  weight: number;
  isMandatory: boolean;
  aiContext: string;
};

type SeedJob = {
  title: string;
  description: string;
  status: "open" | "closed" | "draft";
  location: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  requirementsConfig: SeedRequirement[];
  aiSettings: {
    auto_reject_threshold: number;
    feedback_mode: "auto" | "manual" | "semi";
    bias_guardrails: string;
  };
};

const seedJobs: SeedJob[] = [
  {
    title: "Senior Frontend Engineer (ATS Platform)",
    description:
      "Role Overview:\nVeriloop is hiring a Senior Frontend Engineer to build the recruiter-facing product experience for our hiring intelligence platform.\n\nResponsibilities:\n- Build and ship production features in React and Next.js App Router.\n- Develop recruiter workflows for candidate scoring visibility, decision rationale, and hiring actions.\n- Partner with HR, design, and AI teams to translate policy into clear product behavior.\n- Improve UI quality through accessibility, testing, and performance optimization.\n\nQualifications:\n- 5+ years of frontend engineering experience.\n- Strong TypeScript and React architecture skills in complex B2B products.\n- Experience with workflow-heavy interfaces and data-rich dashboards.\n- Nice to have: HRTech, ATS, or compliance-heavy product background.\n\nCompensation & Benefits:\n- Base salary: $155,000 - $190,000 USD.\n- Equity package and performance bonus.\n- Health, dental, and vision coverage.\n\nWork Setup:\n- Full-time.\n- Hybrid (Toronto) or remote in North America.",
    status: "open",
    location: "Toronto, ON / Remote (North America)",
    employmentType: "full_time",
    salaryMin: 155000,
    salaryMax: 190000,
    salaryCurrency: "USD",
    requirementsConfig: [
      {
        category: "skill",
        name: "React + Next.js App Router",
        weight: 10,
        isMandatory: true,
        aiContext:
          "Prioritize direct evidence of shipping App Router features in production (server actions, route handlers, caching strategy). Penalize candidates whose examples are only Pages Router tutorials or toy projects.",
      },
      {
        category: "skill",
        name: "TypeScript Domain Modeling",
        weight: 8,
        isMandatory: true,
        aiContext:
          "Look for strict typing patterns in complex business domains: discriminated unions, schema validation integration, and typed API boundaries. Give extra credit for preventing runtime bugs via compile-time constraints.",
      },
      {
        category: "experience",
        name: "B2B workflow product delivery",
        weight: 7,
        isMandatory: true,
        aiContext:
          "Value concrete examples where candidate simplified multi-step enterprise workflows and improved completion metrics. Preference for HRTech, fintech, healthcare, or compliance-heavy tooling.",
      },
      {
        category: "experience",
        name: "Accessibility and UX quality",
        weight: 6,
        isMandatory: false,
        aiContext:
          "Reward evidence of accessibility ownership (keyboard navigation, semantic markup, contrast, screen-reader testing). Ignore vague claims without artifacts such as audits, PRs, or test reports.",
      },
    ],
    aiSettings: {
      auto_reject_threshold: 55,
      feedback_mode: "semi",
      bias_guardrails:
        "Do not infer capability from employer prestige. Score only evidence tied to requirements and deliverable outcomes.",
    },
  },
  {
    title: "AI Workflow Engineer (Talent Intelligence)",
    description:
      "Role Overview:\nWe are looking for an AI Workflow Engineer to design and operate reliable LLM workflows used in applicant scoring, gap analysis, and recruiter feedback generation.\n\nResponsibilities:\n- Build orchestration pipelines with tool-calling, retries, fallbacks, and traceability.\n- Define quality gates and evaluation methods for production prompts.\n- Implement safeguards for bias, hallucination, and unsafe outputs.\n- Collaborate with product and HR teams on explainable, human-in-the-loop decisions.\n\nQualifications:\n- 3+ years in AI/ML product engineering.\n- Production experience with multi-step LLM systems.\n- Strong prompt evaluation, metrics design, and reliability engineering skills.\n- Nice to have: MLOps or cloud AI certifications.\n\nCompensation & Benefits:\n- Base salary: $165,000 - $205,000 USD.\n- Equity and annual performance bonus.\n- Full health benefits and learning budget.\n\nWork Setup:\n- Full-time.\n- Remote-first in US/Canada with quarterly on-sites.",
    status: "open",
    location: "Remote (US/Canada)",
    employmentType: "full_time",
    salaryMin: 165000,
    salaryMax: 205000,
    salaryCurrency: "USD",
    requirementsConfig: [
      {
        category: "skill",
        name: "LLM Workflow Orchestration",
        weight: 10,
        isMandatory: true,
        aiContext:
          "Prioritize candidates with production experience in multi-step AI workflows (tool calling, retries, fallback logic, traceability). Favor systems with explicit quality gates over one-shot prompting.",
      },
      {
        category: "skill",
        name: "Prompt and Evaluation Design",
        weight: 9,
        isMandatory: true,
        aiContext:
          "Require evidence of measurable prompt iteration (rubrics, eval sets, acceptance thresholds). Score higher when candidate demonstrates hallucination controls and reproducible evaluation pipelines.",
      },
      {
        category: "experience",
        name: "Trust/Safety in AI systems",
        weight: 8,
        isMandatory: true,
        aiContext:
          "Reward concrete implementation of guardrails, policy checks, or red-team findings. Candidate should show how they prevented harmful or biased outputs in user-facing workflows.",
      },
      {
        category: "certification",
        name: "Cloud AI or MLOps certification",
        weight: 4,
        isMandatory: false,
        aiContext:
          "Use certifications as secondary evidence only. Do not over-weight unless paired with shipped systems and operational ownership.",
      },
    ],
    aiSettings: {
      auto_reject_threshold: 60,
      feedback_mode: "manual",
      bias_guardrails:
        "Never reward verbosity. Require verifiable examples, metrics, and architectural reasoning tied to each requirement.",
    },
  },
  {
    title: "Technical Recruiter (Engineering Hiring)",
    description:
      "Role Overview:\nVeriloop is hiring a Technical Recruiter to lead full-cycle recruiting for engineering roles and improve quality-of-hire through structured hiring practices.\n\nResponsibilities:\n- Own sourcing, screening, interview coordination, and offer management for technical roles.\n- Partner with hiring managers to define scorecards and calibrate interviews.\n- Drive strong candidate communication and timely updates at every stage.\n- Track funnel metrics and improve conversion and time-to-fill through process changes.\n\nQualifications:\n- 3+ years of technical recruiting experience for software roles.\n- Proven success hiring across frontend, backend, and platform profiles.\n- Strong communication and stakeholder management skills.\n- Experience with data-informed recruiting operations.\n\nCompensation & Benefits:\n- Base salary: $95,000 - $125,000 USD.\n- Performance bonus tied to hiring outcomes.\n- Health benefits and professional development stipend.\n\nWork Setup:\n- Full-time.\n- Hybrid (Toronto) or remote in North America.",
    status: "open",
    location: "Toronto, ON / Remote (North America)",
    employmentType: "full_time",
    salaryMin: 95000,
    salaryMax: 125000,
    salaryCurrency: "USD",
    requirementsConfig: [
      {
        category: "experience",
        name: "Technical recruiting for SWE roles",
        weight: 10,
        isMandatory: true,
        aiContext:
          "Prioritize proven ownership of engineering pipelines with volume and quality outcomes. Score higher for candidates who can differentiate frontend/backend/platform profiles and adjust sourcing strategy accordingly.",
      },
      {
        category: "skill",
        name: "Structured interview design",
        weight: 8,
        isMandatory: true,
        aiContext:
          "Look for evidence of building role-based scorecards and interviewer calibration loops. Penalize approaches that rely on unstructured intuition or generic interview templates.",
      },
      {
        category: "skill",
        name: "Candidate communication and closure",
        weight: 7,
        isMandatory: true,
        aiContext:
          "Reward detailed feedback practices, transparent updates, and strong close-rate narratives. Candidate should show respectful rejection handling, not just offer acceptance wins.",
      },
      {
        category: "experience",
        name: "Data-driven recruiting operations",
        weight: 6,
        isMandatory: false,
        aiContext:
          "Prefer candidates who track funnel metrics and run experiments (source mix, interviewer load balancing, stage conversion). Ignore superficial dashboard mentions without decisions made from data.",
      },
    ],
    aiSettings: {
      auto_reject_threshold: 50,
      feedback_mode: "semi",
      bias_guardrails:
        "Do not infer candidate quality from company brand alone; evaluate process rigor, communication quality, and measurable recruiting outcomes.",
    },
  },
  {
    title: "People Analytics Specialist (Hiring Insights)",
    description:
      "Role Overview:\nWe are seeking a People Analytics Specialist to drive hiring analytics, reporting, and experimentation across recruiting and referral operations.\n\nResponsibilities:\n- Build SQL-based models for pipeline, conversion, and quality-of-hire analysis.\n- Create dashboards and reporting for recruiting, HR leadership, and operations.\n- Design experiments to evaluate process changes and hiring interventions.\n- Translate analytical findings into policy and workflow recommendations.\n\nQualifications:\n- 3+ years in people analytics, recruiting analytics, or business intelligence.\n- Advanced SQL and strong statistical reasoning.\n- Experience communicating insights to non-technical stakeholders.\n- Nice to have: degree in statistics, economics, mathematics, or computer science.\n\nCompensation & Benefits:\n- Base salary: $115,000 - $145,000 USD.\n- Annual bonus and equity opportunity.\n- Health benefits and wellness allowance.\n\nWork Setup:\n- Full-time.\n- Remote-first with optional hybrid office access.",
    status: "open",
    location: "Remote (North America)",
    employmentType: "full_time",
    salaryMin: 115000,
    salaryMax: 145000,
    salaryCurrency: "USD",
    requirementsConfig: [
      {
        category: "skill",
        name: "SQL and analytics engineering",
        weight: 9,
        isMandatory: true,
        aiContext:
          "Require strong SQL proficiency demonstrated through hiring funnel modeling, cohort analysis, and anomaly detection. Reward candidates who can explain data quality constraints and assumptions.",
      },
      {
        category: "skill",
        name: "Experimentation and causal reasoning",
        weight: 8,
        isMandatory: true,
        aiContext:
          "Prioritize candidates who can design A/B or quasi-experiments for recruiting interventions. Score based on statistical reasoning quality, not jargon density.",
      },
      {
        category: "experience",
        name: "Stakeholder storytelling with data",
        weight: 7,
        isMandatory: true,
        aiContext:
          "Look for examples where analytics changed hiring policy or process. Candidate should demonstrate communication to non-technical audiences and decision follow-through.",
      },
      {
        category: "education",
        name: "Quantitative degree (Stats, Econ, CS, Math)",
        weight: 4,
        isMandatory: false,
        aiContext:
          "Treat degree as supporting signal only. Practical analytics impact and reproducible methodology are higher priority.",
      },
    ],
    aiSettings: {
      auto_reject_threshold: 58,
      feedback_mode: "manual",
      bias_guardrails:
        "Exclude demographic proxies from scoring logic. Evaluate only job-relevant analytical capabilities and demonstrated impact.",
    },
  },
  {
    title: "Referral Program Manager",
    description:
      "Role Overview:\nVeriloop is hiring a Referral Program Manager to scale high-quality referral pipelines and improve trust-based candidate conversion outcomes.\n\nResponsibilities:\n- Own referral program strategy, operations, and performance targets.\n- Build repeatable processes for referrer onboarding, communication, and follow-up.\n- Partner with HR, finance, and hiring teams on program governance and incentives.\n- Analyze program metrics and run experiments to improve referral quality and conversion.\n\nQualifications:\n- 4+ years in program management, talent operations, or recruiting operations.\n- Experience running referral, ambassador, or internal advocacy programs.\n- Strong cross-functional leadership and execution skills.\n- Demonstrated ability to improve process adoption with measurable outcomes.\n\nCompensation & Benefits:\n- Base salary: $110,000 - $140,000 USD.\n- Bonus and equity package.\n- Comprehensive health benefits.\n\nWork Setup:\n- Full-time.\n- Hybrid or remote in North America.",
    status: "open",
    location: "Hybrid or Remote (North America)",
    employmentType: "full_time",
    salaryMin: 110000,
    salaryMax: 140000,
    salaryCurrency: "USD",
    requirementsConfig: [
      {
        category: "experience",
        name: "Program management in talent/referrals",
        weight: 9,
        isMandatory: true,
        aiContext:
          "Prioritize candidates with direct ownership of referral or ambassador programs. Score higher for end-to-end execution with measured improvements in qualified pipeline contribution.",
      },
      {
        category: "skill",
        name: "Cross-functional process design",
        weight: 8,
        isMandatory: true,
        aiContext:
          "Look for evidence of coordinating HR, hiring managers, finance, and internal comms. Strong candidates define SLAs, escalation paths, and transparent process documentation.",
      },
      {
        category: "skill",
        name: "Incentive design and experimentation",
        weight: 7,
        isMandatory: false,
        aiContext:
          "Reward candidates who tested incentive structures and can show conversion, quality, and retention effects. Avoid over-scoring vanity participation metrics.",
      },
      {
        category: "experience",
        name: "Change management and adoption",
        weight: 6,
        isMandatory: false,
        aiContext:
          "Prefer candidates who can demonstrate rollout strategy, adoption barriers, and remediation plans with quantified outcomes.",
      },
    ],
    aiSettings: {
      auto_reject_threshold: 52,
      feedback_mode: "semi",
      bias_guardrails:
        "Do not favor candidates solely by network size claims; require operational process quality and measurable business outcomes.",
    },
  },
];

async function seedJobsForCreator() {
  const { db } = await import("@/db");

  await db
    .insert(users)
    .values({
      id: CREATOR_ID,
      email: CREATOR_EMAIL,
      role: "hr",
    })
    .onConflictDoNothing({ target: users.id });

  const report: Array<{ title: string; status: "inserted" | "updated"; jobId?: number }> = [];

  for (const job of seedJobs) {
    const existing = await db.query.jobs.findFirst({
      where: and(eq(jobs.creatorId, CREATOR_ID), eq(jobs.title, job.title)),
      columns: { id: true },
    });

    if (existing) {
      await db
        .update(jobs)
        .set({
          description: job.description,
          status: job.status,
          location: job.location,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          requirementsConfig:
            job.requirementsConfig as unknown as typeof jobs.$inferInsert.requirementsConfig,
          aiSettings: job.aiSettings as unknown as typeof jobs.$inferInsert.aiSettings,
        })
        .where(eq(jobs.id, existing.id));

      report.push({ title: job.title, status: "updated", jobId: existing.id });
      continue;
    }

    const [inserted] = await db
      .insert(jobs)
      .values({
        creatorId: CREATOR_ID,
        title: job.title,
        description: job.description,
        status: job.status,
        location: job.location,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        requirementsConfig:
          job.requirementsConfig as unknown as typeof jobs.$inferInsert.requirementsConfig,
        aiSettings: job.aiSettings as unknown as typeof jobs.$inferInsert.aiSettings,
      })
      .returning({ id: jobs.id });

    report.push({ title: job.title, status: "inserted", jobId: inserted?.id });
  }

  console.log("Seeded realistic HR job postings for creator:", CREATOR_ID);
  console.table(report);
}

seedJobsForCreator()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Job seed failed:", error);
    process.exit(1);
  });

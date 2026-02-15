# AGENTS.md — Smart Hiring & Referral Platform

You are working on the **Smart Hiring & Referral Platform**, an AI-augmented system connecting HR, Applicants, and Referrers.

This is a **Trust & Intelligence** platform.
Prioritize transparency, data integrity, and "human-in-the-loop" AI.

---

# 1. PRODUCT GOALS (MOST IMPORTANT)

Every change should improve one of these core pillars:

**1. Intelligent Scoring (HR):**

- Jobs have weighted requirements (Skills, Experience, Artifacts).
- AI scores applicants based on _proof_, not just keywords.
- Scoring logic is flexible (stored in JSON) but strict in execution.

**2. Stranger-Trust Referrals (Referrers):**

- Referrals are weighted by the referrer's reputation/seniority.
- "Micro-vouching" replaces generic letters.

**3. Augmented Feedback (Applicants):**

- No ghosting. Every rejection gets constructive, data-driven feedback.
- Applicants see exactly _why_ they didn't match (Gap Analysis).

---

# 2. ARCHITECTURE & FOLDER STRUCTURE (STRICT)

We use a **Service-Based Architecture** for logic and **Co-location** for UI.

## Directory Map

- `src/app/` → **Routes & Local UI**.
  - `src/app/(dashboard)/jobs/[id]/_components/` → **Route-specific components**.
  - `src/app/actions.ts` → **Route-specific Server Actions**.
- `src/components/` → **Global Primitives Only** (Button, Input, Modal, Toast).
- `src/modules/` → **THE CORE LOGIC (Service Layer)**.
  - `src/modules/jobs/` → `job.service.ts` (DB calls).
  - `src/modules/applications/` → `application.service.ts`.
- `src/mastra/` → **AI Brain**.
  - `agents/`, `workflows/`, `tools/`.
- `src/db/` → Drizzle Schema & Config.
- `src/types/` → Shared Zod Schemas.

## The Co-location Rule:

- If a component is used **only in one page**, put it in `src/app/[route]/_components/`.
- If a component is used **in multiple distinct features**, move it to `src/components/`.
- **Do not** create a "utils" folder for UI logic; keep it close to the component.

---

# 3. CODING STANDARDS

## Service Layer Pattern

When building a feature (e.g., "Create Job"):

1. Define the **Zod Schema** in `src/types`.
2. Create the **Service Function** in `src/modules/jobs/job.service.ts` (handles DB insert).
3. Create the **Server Action** in `src/app/[route]/actions.ts` (handles validation & auth).
4. Call the Action from the UI (`_components/JobForm.tsx`).

## Database Access (Drizzle)

- **Never** write SQL/Drizzle queries inside UI components.
- Always use the `db` instance from `src/db/index.ts`.
- Use **JSONB columns** (`requirements_config`, `ai_settings`) for flexible data.

## AI Integration (Mastra)

- AI logic lives in `src/mastra`.
- Do not put prompt strings in UI components.
- Use **Workflows** for complex steps (Scoring -> Gaps -> Feedback).

---

# 4. DATABASE STRATEGY (HYBRID SCHEMA)

We use **PostgreSQL (Supabase) + Drizzle ORM**.

## The Hybrid Rule

1. **Rigid Columns:** IDs, Foreign Keys, Status, Dates, Email. (Must have strict SQL types).
2. **Flexible Columns:** AI Weights, Scoring Results, Agent Configs. (Must use `jsonb`).

## Schema Changes

- **DO:** Update `src/db/schema.ts` and run `npx drizzle-kit generate`.
- **DO NOT:** Manually edit Supabase tables or SQL files.
- **DO NOT:** Hardcode JSON structures; use Zod schemas to validate `jsonb` data in code.

---

# 5. ANTI-HALLUCINATION RULES

Before writing code:

1. **Check the Schema:** Read `src/db/schema.ts`. Do not invent column names.
2. **Check the Service:** Look in `src/modules/`. If `getJobById` exists, use it. Don't write a new query.
3. **Check the Types:** Use shared Zod schemas from `src/types/` instead of `any`.

---

# TL;DR FOR THE AGENT

- **Logic** goes in `src/modules`.
- **UI** stays local in `src/app/[route]/_components`.
- **Global UI** goes in `src/components`.
- **AI** goes in `src/mastra`.
- **DB** changes via Drizzle Schema only.
- Use **Zod** for everything.

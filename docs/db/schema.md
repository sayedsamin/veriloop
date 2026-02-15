# Database Schema (Drizzle + Postgres)

This project uses a hybrid schema:

- Rigid SQL columns for identity, status, and relationships.
- JSONB columns for AI-driven and evolving data structures.

## users

Purpose:
- Identity and role management for admins, HR, applicants, and referrers.

Columns:
- `id`: `uuid` primary key, `defaultRandom()`.
- `email`: `text`, unique, not null.
- `role`: `text`, not null, default `"applicant"`.
- `created_at`: `timestamptz`, default `now()`.

Role enum constraints:
- `admin`
- `hr`
- `applicant`
- `referrer`

## jobs

Purpose:
- Job postings with configurable requirement weighting and AI settings.

Columns:
- `id`: `serial` primary key.
- `creator_id`: `uuid`, not null, references `users.id` (`onDelete: cascade`).
- `title`: `text`, not null.
- `description`: `text`.
- `status`: `text`, not null, default `"open"`.
- `requirements_config`: `jsonb`, not null, default `[]`.
- `ai_settings`: `jsonb`, not null, default `{}`.
- `created_at`: `timestamptz`, default `now()`.

Status enum constraints:
- `open`
- `closed`
- `draft`

JSONB notes:
- `requirements_config` stores weighted criteria (skills, experience, artifacts).
- `ai_settings` stores runtime AI parameters (for example `auto_reject_threshold`).

## applications

Purpose:
- Applicant submissions and AI scoring outputs per job.

Columns:
- `id`: `serial` primary key.
- `job_id`: `integer`, not null, references `jobs.id` (`onDelete: cascade`).
- `applicant_id`: `uuid`, not null, references `users.id` (`onDelete: cascade`).
- `status`: `text`, not null, default `"pending"`.
- `resume_data`: `jsonb` (parsed resume payload).
- `ai_score_data`: `jsonb` (AI score + breakdown payload).
- `created_at`: `timestamptz`, default `now()`.

Status enum constraints:
- `pending`
- `reviewed`
- `rejected`
- `interview`

## Relations

- Job belongs to one creator:
  - `jobs.creator_id -> users.id`
- Application belongs to one job:
  - `applications.job_id -> jobs.id`
- Application belongs to one applicant:
  - `applications.applicant_id -> users.id`

Additional relation mappings are declared in `src/db/schema.ts`:
- `usersRelations`
- `jobsRelations`
- `applicationsRelations`

## Migrations

Schema source:
- `src/db/schema.ts`

Generate SQL migration:

```bash
npx drizzle-kit generate
```

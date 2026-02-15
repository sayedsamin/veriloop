# Database Contract (Supabase)

This folder is the source-of-truth for DB usage in the app.

## Source of truth

- Migrations: /supabase/migrations
- Types: /src/db/supabase.types.ts (generated, committed)

## Tables (core)

- projects: user-owned project buckets (AI weight lives here)
- tasks: core tasks + AI scores + user override fields
- task_subtasks: breakdown checklist
- task_events: analytics + motivation/praise history
- task_notes: difficulty/progress logs (RAG-friendly)
- task_tags + task_tag_links: labels
- task_time_blocks: planned schedule/time blocks (tasks OR subtasks)
- task_work_logs: actual time spent sessions (tasks OR subtasks)
- knowledge_sources + knowledge_chunks: RAG storage

## RLS rule (must follow)

Every row has user_id. Queries must always be scoped by user_id (RLS enforces).
Use service role only in server-only code.

## RPCs (public schema)

- match_my_knowledge_chunks(p_query_embedding, p_match_count)
  - returns relevant knowledge chunks for the logged-in user

(If more RPCs exist, list them here.)

## Agent guidance

- Prefer using typed wrappers in /src/db/rpc instead of calling supabase.rpc directly.
- Do not write raw SQL in frontend code.
- Keep embedding ingestion server-side only.

## Drizzle migrate + seed

This repo now includes Drizzle schema/migration support in parallel with Supabase.

Prerequisite:
- Set `DATABASE_URL` in `.env.local` to your Supabase Postgres connection string.

Commands:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npx tsx src/db/seed.ts
```

Expected seed proof output:
- `Seeded HR user: ...`
- `Seeded job ID: ...`
- `Saved requirements_config JSON: [...]`

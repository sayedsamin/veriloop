ALTER TABLE "jobs" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "employment_type" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_min" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_max" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_currency" text DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employment_type_check" CHECK ("jobs"."employment_type" is null or "jobs"."employment_type" in ('full_time', 'part_time', 'contract', 'internship'));--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_min_check" CHECK ("jobs"."salary_min" is null or "jobs"."salary_min" >= 0);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_max_check" CHECK ("jobs"."salary_max" is null or "jobs"."salary_max" >= 0);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_range_check" CHECK ("jobs"."salary_min" is null or "jobs"."salary_max" is null or "jobs"."salary_max" >= "jobs"."salary_min");
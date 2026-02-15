import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const userRoles = ["admin", "hr", "applicant", "referrer"] as const;
const jobStatuses = ["open", "closed", "draft"] as const;
const employmentTypes = ["full_time", "part_time", "contract", "internship"] as const;
const applicationStatuses = [
  "pending",
  "reviewed",
  "rejected",
  "interview",
] as const;
const referralStatuses = ["pending", "submitted", "rejected"] as const;

export type UserRole = (typeof userRoles)[number];
export type JobStatus = (typeof jobStatuses)[number];
export type EmploymentType = (typeof employmentTypes)[number];
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ReferralStatus = (typeof referralStatuses)[number];

export type JobRequirementConfig = {
  key: string;
  label: string;
  weight: number;
  required?: boolean;
  metadata?: Record<string, unknown>;
};

export type JobAiSettings = {
  auto_reject_threshold?: number;
  [key: string]: unknown;
};

export type ResumeData = Record<string, unknown>;
export type AiScoreData = Record<string, unknown>;
export type AiCostData = {
  total_tokens: number;
  total_cost_usd: number;
  breakdown: {
    scoring?: {
      prompt: number;
      completion: number;
      model: string;
    };
    feedback?: {
      prompt: number;
      completion: number;
      model: string;
    };
    [key: string]: unknown;
  };
};
export type ReferralRating = {
  requirementName: string;
  rating: number;
};
export type ReferrerProfile = {
  fullName: string;
  headline: string;
  company: string;
  yearsExperience: number;
  linkedinUrl?: string;
  credentialsSummary?: string;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    role: text("role").$type<UserRole>().notNull().default("applicant"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "users_role_check",
      sql`${table.role} in ('admin', 'hr', 'applicant', 'referrer')`
    ),
  ]
);

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<JobStatus>().notNull().default("open"),
    location: text("location"),
    employmentType: text("employment_type").$type<EmploymentType>(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency").default("USD"),
    requirementsConfig: jsonb("requirements_config")
      .$type<JobRequirementConfig[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    aiSettings: jsonb("ai_settings")
      .$type<JobAiSettings>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("jobs_status_check", sql`${table.status} in ('open', 'closed', 'draft')`),
    check(
      "jobs_employment_type_check",
      sql`${table.employmentType} is null or ${table.employmentType} in ('full_time', 'part_time', 'contract', 'internship')`
    ),
    check(
      "jobs_salary_min_check",
      sql`${table.salaryMin} is null or ${table.salaryMin} >= 0`
    ),
    check(
      "jobs_salary_max_check",
      sql`${table.salaryMax} is null or ${table.salaryMax} >= 0`
    ),
    check(
      "jobs_salary_range_check",
      sql`${table.salaryMin} is null or ${table.salaryMax} is null or ${table.salaryMax} >= ${table.salaryMin}`
    ),
  ]
);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status")
      .$type<ApplicationStatus>()
      .notNull()
      .default("pending"),
    resumeData: jsonb("resume_data").$type<ResumeData>(),
    aiScoreData: jsonb("ai_score_data").$type<AiScoreData>(),
    aiCostData: jsonb("ai_cost_data").$type<AiCostData>(),
    feedbackText: text("feedback_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "applications_status_check",
      sql`${table.status} in ('pending', 'reviewed', 'rejected', 'interview')`
    ),
  ]
);

export const referrals = pgTable(
  "referrals",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status")
      .$type<ReferralStatus>()
      .notNull()
      .default("pending"),
    ratings: jsonb("ratings").$type<ReferralRating[]>().notNull().default(sql`'[]'::jsonb`),
    referrerProfile: jsonb("referrer_profile")
      .$type<ReferrerProfile>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    comment: text("comment"),
    relationship: text("relationship"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "referrals_status_check",
      sql`${table.status} in ('pending', 'submitted', 'rejected')`
    ),
  ]
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  createdJobs: many(jobs),
  applications: many(applications),
  referrals: many(referrals),
  auditLogs: many(auditLogs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  creator: one(users, {
    fields: [jobs.creatorId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  applicant: one(users, {
    fields: [applications.applicantId],
    references: [users.id],
  }),
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  application: one(applications, {
    fields: [referrals.applicationId],
    references: [applications.id],
  }),
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

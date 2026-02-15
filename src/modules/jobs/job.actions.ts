"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { applications, jobs } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateJobSchema, type CreateJobInput } from "@/types/job.schema";

type JobListItem = {
  id: number;
  title: string;
  status: "open" | "closed" | "draft";
  location: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "internship" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  createdAt: Date;
  applicationCount: number;
};

type OpenJobListItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "internship" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  createdAt: Date;
  requirementsCount: number;
};

type GetJobsActionResult =
  | { success: true; jobs: JobListItem[] }
  | { success: false; error: string };

type GetOpenJobsActionResult =
  | { success: true; jobs: OpenJobListItem[] }
  | { success: false; error: string };

type MutateJobActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createJobAction(data: CreateJobInput) {
  try {
    const parsed = CreateJobSchema.parse(data);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const [createdJob] = await db
      .insert(jobs)
      .values({
        creatorId: user.id,
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        employmentType: parsed.employmentType,
        salaryMin: parsed.salaryMin,
        salaryMax: parsed.salaryMax,
        salaryCurrency: parsed.salaryCurrency,
        requirementsConfig:
          parsed.requirements as unknown as typeof jobs.$inferInsert.requirementsConfig,
        aiSettings:
          parsed.aiSettings as unknown as typeof jobs.$inferInsert.aiSettings,
      })
      .returning({ id: jobs.id });

    if (!createdJob) {
      return { success: false, error: "Failed to create job." };
    }

    revalidatePath("/jobs");

    return { success: true, jobId: createdJob.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create job.";
    return { success: false, error: message };
  }
}

export async function updateJobAction(
  jobId: number,
  data: CreateJobInput
): Promise<MutateJobActionResult> {
  try {
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return { success: false, error: "Invalid job ID." };
    }

    const parsed = CreateJobSchema.parse(data);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const [ownedJob] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.creatorId, user.id)))
      .limit(1);

    if (!ownedJob) {
      return { success: false, error: "Forbidden." };
    }

    await db
      .update(jobs)
      .set({
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        employmentType: parsed.employmentType,
        salaryMin: parsed.salaryMin,
        salaryMax: parsed.salaryMax,
        salaryCurrency: parsed.salaryCurrency,
        requirementsConfig:
          parsed.requirements as unknown as typeof jobs.$inferInsert.requirementsConfig,
        aiSettings:
          parsed.aiSettings as unknown as typeof jobs.$inferInsert.aiSettings,
      })
      .where(eq(jobs.id, jobId));

    revalidatePath("/dashboard/hr");
    revalidatePath(`/dashboard/hr/jobs/${jobId}`);
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/jobs");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update job.";
    return { success: false, error: message };
  }
}

export async function deleteJobAction(jobId: number): Promise<MutateJobActionResult> {
  try {
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return { success: false, error: "Invalid job ID." };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const deleted = await db
      .delete(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.creatorId, user.id)))
      .returning({ id: jobs.id });

    if (deleted.length === 0) {
      return { success: false, error: "Job not found or not allowed." };
    }

    revalidatePath("/dashboard/hr");
    revalidatePath("/jobs");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete job.";
    return { success: false, error: message };
  }
}

export async function getJobsAction(): Promise<GetJobsActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const rows = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        createdAt: jobs.createdAt,
        applicationCount: sql<number>`count(${applications.id})::int`,
      })
      .from(jobs)
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(eq(jobs.creatorId, user.id))
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt));

    return { success: true, jobs: rows as JobListItem[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch jobs.";
    return { success: false, error: message };
  }
}

export async function getOpenJobsAction(): Promise<GetOpenJobsActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const rows = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        createdAt: jobs.createdAt,
        requirementsConfig: jobs.requirementsConfig,
      })
      .from(jobs)
      .where(eq(jobs.status, "open"))
      .orderBy(desc(jobs.createdAt));

    const mappedJobs: OpenJobListItem[] = rows.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      createdAt: job.createdAt,
      requirementsCount: Array.isArray(job.requirementsConfig)
        ? job.requirementsConfig.length
        : 0,
    }));

    return { success: true, jobs: mappedJobs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch open jobs.";
    return { success: false, error: message };
  }
}

import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { jobs, users } from "@/db/schema";

dotenv.config({ path: ".env.local" });

async function seed() {
  const { db } = await import("@/db");

  const [hrUser] = await db
    .insert(users)
    .values({
      email: "hr.demo@example.com",
      role: "hr",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: "hr" },
    })
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
    });

  if (!hrUser) {
    throw new Error("Failed to create or update HR user");
  }

  const requirementsConfig = [
    { category: "skill", name: "React", weight: 10 },
    { category: "experience", years: 5, weight: 5 },
  ] as const;

  const [job] = await db
    .insert(jobs)
    .values({
      creatorId: hrUser.id,
      title: "Senior Frontend Engineer",
      description: "Seeded job for Drizzle JSONB validation.",
      status: "open",
      requirementsConfig: requirementsConfig as unknown as
        typeof jobs.$inferInsert.requirementsConfig,
      aiSettings: { auto_reject_threshold: 60 },
    })
    .returning({
      id: jobs.id,
      creatorId: jobs.creatorId,
      requirementsConfig: jobs.requirementsConfig,
    });

  if (!job) {
    throw new Error("Failed to insert job");
  }

  const [savedJob] = await db
    .select({
      id: jobs.id,
      requirementsConfig: jobs.requirementsConfig,
    })
    .from(jobs)
    .where(eq(jobs.id, job.id))
    .limit(1);

  console.log("Seeded HR user:", hrUser);
  console.log("Seeded job ID:", job.id);
  console.log(
    "Saved requirements_config JSON:",
    JSON.stringify(savedJob?.requirementsConfig, null, 2)
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

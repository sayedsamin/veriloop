import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users, type UserRole } from "@/db/schema"

type NonAdminRole = Extract<UserRole, "hr" | "applicant" | "referrer">

const dashboardPathByRole: Record<UserRole, string> = {
  admin: "/admin/metrics",
  hr: "/dashboard/hr",
  applicant: "/dashboard/applicant",
  referrer: "/dashboard/referrer",
}

export function getDashboardPathForRole(role: UserRole): string {
  return dashboardPathByRole[role]
}

export async function resolveDashboardPathForUser(input: {
  userId: string
  email?: string | null
  fallbackRole?: NonAdminRole
}): Promise<string> {
  const fallbackRole = input.fallbackRole ?? "applicant"

  const [existingUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)

  if (existingUser?.role) {
    return getDashboardPathForRole(existingUser.role)
  }

  const normalizedEmail = input.email?.trim().toLowerCase()
  if (normalizedEmail) {
    await db.insert(users).values({
      id: input.userId,
      email: normalizedEmail,
      role: fallbackRole,
    }).onConflictDoNothing()
  }

  return getDashboardPathForRole(fallbackRole)
}

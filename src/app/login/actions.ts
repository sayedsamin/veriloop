"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDashboardPathForUser } from "@/lib/auth/dashboard";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["hr", "applicant", "referrer"]),
});

type AuthActionResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

function resolveSafeNextPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}

export async function login(formData: FormData): Promise<AuthActionResult> {
  try {
    const parsed = loginSchema.parse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { success: false, error: "Sign in failed." };
    }

    const fallbackRedirectTo = await resolveDashboardPathForUser({
      userId,
      email: data.user?.email ?? parsed.email,
      fallbackRole: "applicant",
    });
    const nextPath = resolveSafeNextPath(formData.get("next"));

    return { success: true, redirectTo: nextPath ?? fallbackRedirectTo };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign in failed.",
    };
  }
}

export async function signup(formData: FormData): Promise<AuthActionResult> {
  try {
    const parsed = signupSchema.parse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? ""),
    });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const userId = data.user?.id;

    if (!userId) {
      return { success: false, error: "User creation failed." };
    }

    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: userId,
        email: parsed.email,
        role: parsed.role,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    const redirectTo = await resolveDashboardPathForUser({
      userId,
      email: parsed.email,
      fallbackRole: parsed.role,
    });

    return { success: true, redirectTo };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign up failed.",
    };
  }
}

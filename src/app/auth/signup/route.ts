import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDashboardPathForUser } from "@/lib/auth/dashboard";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "User creation failed" }, { status: 400 });
  }

  const redirectTo = await resolveDashboardPathForUser({
    userId,
    email: data.user?.email ?? email,
    fallbackRole: "applicant",
  });

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDashboardPathForUser } from "@/lib/auth/dashboard";

export async function POST(req: Request) {
  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");

  const supabase = await createSupabaseServerClient();

  if (kind === "google") {
    const origin = new URL(req.url).origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.redirect(data.url, { status: 303 });
  }

  if (kind === "password") {
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const userId = data.user?.id;
    if (!userId) return NextResponse.json({ error: "Sign in failed" }, { status: 400 });

    const redirectTo = await resolveDashboardPathForUser({
      userId,
      email: data.user?.email ?? email,
      fallbackRole: "applicant",
    });

    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  }

  return NextResponse.json({ error: "Invalid sign-in request" }, { status: 400 });
}

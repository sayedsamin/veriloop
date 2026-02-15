import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDashboardPathForUser } from "@/lib/auth/dashboard";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/?error=oauth", req.url), { status: 303 });
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  const redirectTo = await resolveDashboardPathForUser({
    userId: user.id,
    email: user.email,
    fallbackRole: "applicant",
  });

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}

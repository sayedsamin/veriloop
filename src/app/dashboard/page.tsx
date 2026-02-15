import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDashboardPathForUser } from "@/lib/auth/dashboard";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const redirectTo = await resolveDashboardPathForUser({
    userId: data.user.id,
    email: data.user.email,
    fallbackRole: "applicant",
  });

  redirect(redirectTo);
}

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <main className="p-10 space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Login / Signup</h1>

      <form action="/auth/signin" method="post" className="space-y-3">
        <input type="hidden" name="kind" value="google" />
        <button className="rounded-md border px-3 py-2 text-sm">Continue with Google</button>
      </form>

      <div className="rounded-md border p-4 space-y-3">
        <form action="/auth/signin" method="post" className="space-y-3">
          <input type="hidden" name="kind" value="password" />
          <input
            name="email"
            type="email"
            placeholder="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="password"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
          <button className="rounded-md border px-3 py-2 text-sm">
            Sign in (email/password)
          </button>
        </form>

        <form action="/auth/signup" method="post" className="space-y-3 pt-3 border-t">
          <input
            name="email"
            type="email"
            placeholder="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="password"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
          <button className="rounded-md border px-3 py-2 text-sm">Create account</button>
        </form>

        <p className="text-xs text-gray-500">
          Note: if email confirmation is enabled in Supabase, you may need to confirm before
          dashboard works.
        </p>
      </div>
    </main>
  );
}

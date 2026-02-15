import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, LayoutDashboard, Search, Sparkles, Users } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getNavItemsByRole(role: string | null | undefined): NavItem[] {
  if (role === "hr") {
    return [
      {
        href: "/dashboard/hr",
        label: "HR Console",
        description: "Manage jobs, ranking, and hiring decisions.",
        icon: LayoutDashboard,
      },
      {
        href: "/jobs/new",
        label: "Create Job",
        description: "Define weighted requirements and thresholds.",
        icon: BriefcaseBusiness,
      },
      {
        href: "/dashboard/hr/onboarding",
        label: "HR Onboarding",
        description: "Learn workflows, button actions, and best practices.",
        icon: Sparkles,
      },
    ];
  }

  if (role === "referrer") {
    return [
      {
        href: "/dashboard/referrer",
        label: "Referral Hub",
        description: "Track vouches, trust level, and outcomes.",
        icon: Users,
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        href: "/admin/metrics",
        label: "Admin Metrics",
        description: "Platform-level governance and system reporting.",
        icon: BadgeCheck,
      },
    ];
  }

  return [
    {
      href: "/dashboard/applicant",
      label: "My Applications",
      description: "Track status, scores, and gap feedback.",
      icon: LayoutDashboard,
    },
    {
      href: "/jobs",
      label: "Browse Jobs",
      description: "Find open roles and submit applications.",
      icon: Search,
    },
  ];
}

function roleTitle(role: string | null | undefined) {
  if (role === "hr") return "HR Workspace";
  if (role === "referrer") return "Referrer Workspace";
  if (role === "admin") return "Admin Workspace";
  return "Applicant Workspace";
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const navItems = getNavItemsByRole(profile?.role);
  const workspaceLabel = roleTitle(profile?.role);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen w-full gap-6 px-4 py-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-6">
        <aside className="h-fit rounded-2xl border bg-card/70 p-4 shadow-sm lg:sticky lg:top-4">
          <div className="space-y-3 border-b pb-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Veriloop</p>
            <p className="text-lg font-semibold leading-tight">Hiring Intelligence Dashboard</p>
            <span className="inline-flex rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium">
              {workspaceLabel}
            </span>
          </div>

          <nav className="mt-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  className="block rounded-xl border bg-background/80 p-3 transition-colors hover:bg-muted/50"
                  href={item.href}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex rounded-md border bg-muted/40 p-1.5">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="block">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <form action="/auth/signout" method="post" className="mt-4 border-t pt-4">
            <button
              type="submit"
              className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Sign Out
            </button>
          </form>
        </aside>

        <section className="min-w-0 rounded-2xl border bg-card/60 p-4 shadow-sm md:p-6">
          {children}
        </section>
      </div>
    </div>
  );
}

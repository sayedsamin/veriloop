import Link from "next/link";

export function DashboardSidebar() {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-4 backdrop-blur">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/85">
          Quick access
        </div>
        <p className="mt-2 text-sm text-cyan-50/85">
          Placeholder navigation while the full product dashboard is being
          rebuilt.
        </p>
        <Link
          href="/planner"
          className="mt-3 inline-flex rounded-full border border-cyan-200/50 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cyan-50 hover:border-cyan-100"
        >
          Open planner
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="text-xs uppercase tracking-[0.2em] text-white/60">
          Status
        </div>
        <p className="mt-2 text-sm text-white/70">
          Dummy data only. No live projects yet.
        </p>
      </div>
    </aside>
  );
}

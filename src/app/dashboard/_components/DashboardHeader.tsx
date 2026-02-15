type DashboardHeaderProps = {
  userEmail: string;
};

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Momentum
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          Dashboard
        </h1>
        <p className="text-sm text-white/70">
          Signed in as {userEmail || "your account"}
        </p>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}

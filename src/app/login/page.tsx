import { LoginCard } from "@/app/login/_components/login-card";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <LoginCard nextPath={next} />
    </main>
  );
}

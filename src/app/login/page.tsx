import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: { absolute: "Login | FocusRoute" },
  description: "Securely access your FocusRoute dashboard.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

function LoginFallback() {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-16"
      style={{ background: "var(--color-bg-page)" }}
    >
      <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(firstParam(params.next));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    redirect(next);
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

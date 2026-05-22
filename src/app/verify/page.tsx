import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = {
  title: { absolute: "Verify Your Login | FocusRoute" },
  description: "Enter your FocusRoute verification code to access your dashboard.",
  alternates: { canonical: "/verify" },
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

function VerifyFallback() {
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

export default async function VerifyPage({
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
    <Suspense fallback={<VerifyFallback />}>
      <VerifyForm />
    </Suspense>
  );
}

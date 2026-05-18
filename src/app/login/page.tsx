import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to FocusRoute with a secure email link.",
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

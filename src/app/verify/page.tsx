import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = {
  title: "Enter login code",
  description: "Verify your email with the code FocusRoute sent you.",
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

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyForm />
    </Suspense>
  );
}

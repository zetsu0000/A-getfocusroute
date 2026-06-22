"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { useQuizStore } from "@/store/quizStore";
import { RETAKE_QUIZ } from "@/lib/dashboard/post-purchase-content";

/**
 * Clean retake entry point for the post-purchase dashboard. Reuses the existing
 * quiz flow (startRetake → funnel) — no new history feature, no scoring change,
 * no question-count change.
 */
export function RetakeQuizCard({
  email,
  displayName,
}: {
  email: string;
  displayName: string;
}) {
  const router = useRouter();
  const startRetake = useQuizStore((s) => s.startRetake);

  const handleRetake = () => {
    startRetake(email, displayName);
    router.push("/");
  };

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        borderRadius: 16,
        padding: "18px 18px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.3, marginBottom: 6 }}>
        {RETAKE_QUIZ.title}
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 16 }}>
        {RETAKE_QUIZ.body}
      </p>
      <button
        type="button"
        onClick={handleRetake}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 12,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          boxShadow: "var(--shadow-btn-primary)",
        }}
      >
        <RotateCcw size={16} strokeWidth={2.4} />
        {RETAKE_QUIZ.cta}
      </button>
    </div>
  );
}

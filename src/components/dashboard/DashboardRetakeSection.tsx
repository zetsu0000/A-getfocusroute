"use client";

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { safeName } from "@/lib/personalization";
import { useQuizStore } from "@/store/quizStore";

export function DashboardRetakeSection({
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
        borderRadius: 20,
        padding: "20px 20px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
        Retake the assessment
      </p>
      <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 16 }}>
        Your plan includes retakes. New results sync to your account after you finish the funnel.
      </p>
      <m.button
        type="button"
        onClick={handleRetake}
        whileTap={{ scale: 0.97 }}
        style={{
          width: "100%",
          padding: "15px 20px",
          borderRadius: 14,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "var(--shadow-btn-primary)",
        }}
      >
        <RotateCcw size={17} />
        Start retake — {safeName(displayName, "friend")}
      </m.button>
    </div>
  );
}

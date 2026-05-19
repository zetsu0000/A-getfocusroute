import type { CSSProperties, ReactNode } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        marginBottom: 8,
      }}
    >
      {children}
    </p>
  );
}

export function AccessBadge({ unlocked }: { unlocked: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        borderRadius: 999,
        padding: "5px 10px",
        background: unlocked ? "var(--color-success-tint)" : "var(--color-bg-card-2)",
        color: unlocked ? "var(--color-success)" : "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
      }}
    >
      {unlocked ? <Sparkles size={11} /> : <LockKeyhole size={11} />}
      {unlocked ? "Unlocked" : "Locked"}
    </span>
  );
}

export function PremiumCard({
  children,
  featured = false,
  style,
}: {
  children: ReactNode;
  featured?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: featured ? "22px 22px" : "18px 18px",
        background: featured
          ? "linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-cognitive-tint) 100%)"
          : "var(--color-bg-card)",
        border: featured ? "1px solid rgba(103,87,232,0.28)" : "1px solid var(--color-border)",
        boxShadow: featured ? "var(--shadow-card-strong)" : "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

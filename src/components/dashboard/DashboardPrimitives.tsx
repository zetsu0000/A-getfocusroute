import type { CSSProperties, ReactNode } from "react";
import { LockKeyhole } from "lucide-react";

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
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 999,
        padding: "4px 8px",
        background: unlocked ? "transparent" : "var(--color-bg-card-2)",
        color: unlocked ? "var(--color-success)" : "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
      }}
    >
      {unlocked ? null : <LockKeyhole size={10} />}
      {unlocked ? "Available" : "Locked"}
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
        padding: featured ? "20px 20px" : "16px 16px",
        background: "var(--color-bg-card)",
        border: featured ? "1px solid var(--color-border-2)" : "1px solid var(--color-border)",
        borderTop: featured ? "2px solid var(--color-signal)" : undefined,
        boxShadow: featured ? "var(--shadow-card-strong)" : "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

import Link from "next/link";
import { CheckCircle2, Crown, Calendar } from "lucide-react";

import type {
  DashboardSubscriptionRow,
  LoggedInDashboardSnapshot,
} from "@/lib/dashboard/load-dashboard-context";

function pickPrimarySubscription(rows: DashboardSubscriptionRow[]) {
  const priority = ["active", "trialing", "past_due"];
  for (const st of priority) {
    const hit = rows.find((r) => r.status === st);
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

export function DashboardMembershipSummary({
  subscriptions,
}: {
  subscriptions: LoggedInDashboardSnapshot["subscriptions"];
}) {
  const sub = pickPrimarySubscription(subscriptions);

  if (!sub) {
    return (
      <div
        style={{
          background: "var(--color-bg-card)",
          borderRadius: 20,
          padding: "18px 20px",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
          Membership
        </p>
        <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.55 }}>
          No subscription on file yet. Unlock membership for retakes, billing portal access, and
          future profile updates.
        </p>
        <Link
          href="/dashboard/upgrade?need=membership"
          style={{
            display: "inline-flex",
            marginTop: 14,
            padding: "12px 20px",
            borderRadius: 12,
            background: "var(--color-accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "var(--shadow-btn-accent)",
          }}
        >
          Explore Membership
        </Link>
      </div>
    );
  }

  const isHealthy = sub.status === "active" || sub.status === "trialing";
  const color = isHealthy ? "var(--color-success)" : "var(--color-text-muted)";
  const bg = isHealthy ? "var(--color-success-tint)" : "var(--color-bg-card-2)";
  const end = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        borderRadius: 20,
        padding: "18px 20px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Crown size={22} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)" }}>Membership</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 99,
                background: bg,
                color,
                textTransform: "capitalize",
              }}
            >
              {sub.status.replace(/_/g, " ")}
            </span>
            {sub.cancel_at_period_end && (
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Cancels at period end</span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 6,
            }}
          >
            <Calendar size={11} />
            Current period ends {end}
          </div>
        </div>
      </div>

      {isHealthy && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            Plan includes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              "Retake the assessment anytime",
              "Access to your Brain Profile and protocol library",
              "Billing portal access",
            ].map((feat) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={10} color={color} />
                </div>
                <span style={{ fontSize: 12, color: "var(--color-text-body)" }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

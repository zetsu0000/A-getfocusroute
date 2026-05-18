"use client";

import { m } from "framer-motion";
import { Check } from "lucide-react";

interface PriceCardProps {
  plan: "annual" | "monthly";
  isSelected: boolean;
  onSelect: () => void;
}

const FEATURES = [
  "Complete cognitive profile report",
  "Personalized 28-day action guide",
  "Strategies tailored to your profile",
  "Unlimited access to the report and guide",
];

export function PriceCard({ plan, isSelected, onSelect }: PriceCardProps) {
  const isAnnual = plan === "annual";

  return (
    <m.button
      onClick={onSelect}
      whileTap={{ scale: 0.982 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="w-full text-left rounded-[24px] overflow-hidden"
      style={{
        background: "var(--color-bg-card)",
        boxShadow: isSelected ? "var(--shadow-sel)" : "var(--shadow-card)",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Popular badge */}
      {isAnnual && (
        <div style={{
          padding: "9px 24px",
          background: "var(--color-warning)",
          color: "#fff",
          fontSize: 12, fontWeight: 700,
          textAlign: "center", letterSpacing: "0.05em",
        }}>
          ⭐ MOST POPULAR — SAVE 72%
        </div>
      )}

      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 11, fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7,
            }}>
              {isAnnual ? "Annual Plan" : "Monthly Plan"}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>
                {isAnnual ? "$2.49" : "$9.99"}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>/mo</span>
            </div>
            {isAnnual && (
              <>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", textDecoration: "line-through" }}>
                  $9.99/mo
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary)", marginTop: 2 }}>
                  Billed annually: $29.88
                </p>
              </>
            )}
          </div>

          {/* Radio */}
          <div style={{
            marginTop: 3, width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border-2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.15s",
          }}>
            {isSelected && (
              <m.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)" }}
              />
            )}
          </div>
        </div>

        {/* Features — annual only */}
        {isAnnual && (
          <ul style={{
            marginTop: 18, paddingTop: 18,
            borderTop: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: "var(--color-success-tint)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={11} color="var(--color-success)" />
                </div>
                <span style={{ fontSize: 13, color: "var(--color-text-body)" }}>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </m.button>
  );
}

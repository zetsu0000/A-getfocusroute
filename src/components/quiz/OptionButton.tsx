"use client";

import { useRef, useCallback } from "react";
import { m } from "framer-motion";
import { QuizOption } from "@/types/quiz";
import { useFunnelTheme } from "@/components/v2/FunnelThemeProvider";

interface OptionButtonProps {
  option: QuizOption & { badge?: string };
  isSelected: boolean;
  inputType: "single" | "multiple";
  onClick: () => void;
}

/**
 * V2 option row — a glass signal-node. Idle rows are quiet glass; the
 * selected row lights up with the signal accent and a luminous edge,
 * like a node locking onto the route. A soft signal-glow tracks the
 * pointer across the row (mouse only).
 */
export function OptionButton({ option, isSelected, inputType, onClick }: OptionButtonProps) {
  const glowRef = useRef<HTMLSpanElement>(null);
  const { theme } = useFunnelTheme();
  const dark = theme === "dark";

  const onMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const g = glowRef.current;
    if (!g || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    g.style.opacity = "1";
    const glow = dark ? "rgba(124,138,255,0.14)" : "rgba(70,85,230,0.10)";
    g.style.background = `radial-gradient(150px circle at ${x.toFixed(0)}px ${y.toFixed(0)}px, ${glow}, transparent 70%)`;
  }, [dark]);

  const onLeave = useCallback(() => {
    const g = glowRef.current;
    if (g) g.style.opacity = "0";
  }, []);

  return (
    <m.button
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.982, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-full flex items-center gap-3 text-left cursor-pointer select-none"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "15px 17px",
        borderRadius: 16,
        background: isSelected
          ? (dark
              ? "linear-gradient(120deg, rgba(124,138,255,0.18), rgba(155,232,255,0.08))"
              : "linear-gradient(120deg, rgba(70,85,230,0.14), rgba(20,135,181,0.07))")
          : (dark
              ? "linear-gradient(165deg, rgba(148,163,255,0.07), rgba(148,163,255,0.03))"
              : "linear-gradient(165deg, rgba(255,255,255,0.9), rgba(243,245,252,0.7))"),
        border: `1.5px solid ${isSelected ? (dark ? "rgba(124,138,255,0.85)" : "rgba(70,85,230,0.85)") : (dark ? "var(--v2-line)" : "var(--v2-line-bright)")}`,
        boxShadow: isSelected
          ? (dark
              ? "0 0 0 1px rgba(124,138,255,0.3), 0 8px 30px rgba(124,138,255,0.22), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 0 0 1px rgba(70,85,230,0.25), 0 10px 26px rgba(70,85,230,0.18), inset 0 1px 0 rgba(255,255,255,0.7)")
          : (dark
              ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 18px rgba(2,3,10,0.35)"
              : "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px rgba(20,30,90,0.05)"),
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
      }}
    >
      {/* pointer-tracking signal glow */}
      <span
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          transition: "opacity 0.35s",
          pointerEvents: "none",
        }}
      />

      {/* Label */}
      <span
        className="flex-1 leading-snug"
        style={{
          fontSize: 15,
          fontWeight: isSelected ? 700 : 500,
          color: isSelected ? (dark ? "#FFFFFF" : "var(--v2-ink)") : "var(--v2-ink-dim)",
        }}
      >
        {option.label}
      </span>

      {/* Badge (time question) */}
      {option.badge && !isSelected && (
        <span
          style={{
            fontFamily: "var(--v2-font-mono)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--v2-ink-faint)",
          }}
        >
          {option.badge}
        </span>
      )}

      {/* ── Multiple-choice checkbox ──────────────────────────── */}
      {inputType === "multiple" && (
        <m.div
          animate={{
            backgroundColor: isSelected ? (dark ? "rgba(124,138,255,1)" : "rgba(70,85,230,1)") : (dark ? "rgba(124,138,255,0)" : "rgba(70,85,230,0)"),
            borderColor: isSelected ? (dark ? "rgba(155,232,255,0.9)" : "rgba(70,85,230,0.95)") : (dark ? "rgba(163,178,255,0.35)" : "rgba(48,64,150,0.35)"),
          }}
          transition={{ duration: 0.14 }}
          style={{
            width: 20, height: 20, borderRadius: 6,
            border: "1.5px solid",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isSelected ? (dark ? "0 0 12px rgba(124,138,255,0.6)" : "0 0 12px rgba(70,85,230,0.4)") : "none",
          }}
        >
          {isSelected && (
            <m.svg
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.14 }}
              width="11" height="9" viewBox="0 0 10 8" fill="none"
            >
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </m.svg>
          )}
        </m.div>
      )}

      {/* ── Single-choice: only show indicator when SELECTED ─── */}
      {inputType === "single" && isSelected && (
        <m.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.14 }}
          style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            background: "var(--v2-grad-signal)",
            boxShadow: dark ? "0 0 14px rgba(124,138,255,0.7)" : "0 0 12px rgba(70,85,230,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke={dark ? "#06070D" : "#FFFFFF"} strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </m.div>
      )}
    </m.button>
  );
}

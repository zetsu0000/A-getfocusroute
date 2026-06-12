"use client";

import { m } from "framer-motion";
import { QuizOption } from "@/types/quiz";

interface OptionButtonProps {
  option: QuizOption & { badge?: string };
  isSelected: boolean;
  inputType: "single" | "multiple";
  onClick: () => void;
}

/**
 * V2 option row — a glass signal-node. Idle rows are quiet glass; the
 * selected row lights up with the signal accent and a luminous edge,
 * like a node locking onto the route.
 */
export function OptionButton({ option, isSelected, inputType, onClick }: OptionButtonProps) {
  return (
    <m.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.982, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-full flex items-center gap-3 text-left cursor-pointer select-none"
      style={{
        padding: "15px 17px",
        borderRadius: 16,
        background: isSelected
          ? "linear-gradient(120deg, rgba(124,138,255,0.18), rgba(155,232,255,0.08))"
          : "linear-gradient(165deg, rgba(148,163,255,0.07), rgba(148,163,255,0.03))",
        border: `1.5px solid ${isSelected ? "rgba(124,138,255,0.85)" : "var(--v2-line)"}`,
        boxShadow: isSelected
          ? "0 0 0 1px rgba(124,138,255,0.3), 0 8px 30px rgba(124,138,255,0.22), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 18px rgba(2,3,10,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Label */}
      <span
        className="flex-1 leading-snug"
        style={{
          fontSize: 15,
          fontWeight: isSelected ? 700 : 500,
          color: isSelected ? "#FFFFFF" : "var(--v2-ink-dim)",
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
            backgroundColor: isSelected ? "rgba(124,138,255,1)" : "rgba(124,138,255,0)",
            borderColor: isSelected ? "rgba(155,232,255,0.9)" : "rgba(163,178,255,0.35)",
          }}
          transition={{ duration: 0.14 }}
          style={{
            width: 20, height: 20, borderRadius: 6,
            border: "1.5px solid",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isSelected ? "0 0 12px rgba(124,138,255,0.6)" : "none",
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
            boxShadow: "0 0 14px rgba(124,138,255,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#06070D" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </m.div>
      )}
    </m.button>
  );
}

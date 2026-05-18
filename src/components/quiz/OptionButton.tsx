"use client";

import { m } from "framer-motion";
import { QuizOption } from "@/types/quiz";

interface OptionButtonProps {
  option: QuizOption & { badge?: string };
  isSelected: boolean;
  inputType: "single" | "multiple";
  onClick: () => void;
}

export function OptionButton({ option, isSelected, inputType, onClick }: OptionButtonProps) {
  return (
    <m.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.982, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-full flex items-center gap-3 rounded-2xl text-left cursor-pointer select-none"
      style={{
        padding: "14px 16px",
        background: isSelected ? "var(--color-primary-tint)" : "var(--color-bg-card)",
        border: `1.5px solid ${isSelected ? "var(--color-primary)" : "rgba(28,26,46,0.09)"}`,
        boxShadow: isSelected ? "var(--shadow-sel)" : "0 1px 3px rgba(28,26,46,0.04)",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Label */}
      <span
        className="flex-1 leading-snug"
        style={{
          fontSize: 15,
          fontWeight: isSelected ? 600 : 400,
          color: isSelected ? "var(--color-primary)" : "var(--color-text)",
        }}
      >
        {option.label}
      </span>

      {/* Badge (time question) */}
      {option.badge && !isSelected && (
        <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>
          {option.badge}
        </span>
      )}

      {/* ── Multiple-choice checkbox ──────────────────────────── */}
      {inputType === "multiple" && (
        <m.div
          animate={{
            backgroundColor: isSelected
              ? "#4a7fa5"
              : "transparent",
            borderColor: isSelected ? "#4a7fa5" : "rgba(28,26,46,0.22)",
          }}
          transition={{ duration: 0.14 }}
          style={{
            width: 20, height: 20, borderRadius: 5,
            border: "1.5px solid",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isSelected && (
            <m.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 24 }}
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </m.div>
      )}
    </m.button>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Menu } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";

/* ── Male SVG character ──────────────────────────────────────────── */
function MaleCharacter() {
  return (
    <svg width="250" height="250" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin slice"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="10" y="10" width="280" height="280" rx="20" fill="white" stroke="#008075" strokeWidth="2" />
      <path d="M60 280 C 60 220, 90 190, 150 190 C 210 190, 240 220, 240 280" fill="#5C6BC0" stroke="#2C3E50" strokeWidth="2" />
      <rect x="135" y="175" width="30" height="25" fill="#FFAB91" stroke="#2C3E50" strokeWidth="2" />
      <path d="M110 120 C 110 80, 190 80, 190 120 C 190 160, 180 185, 150 185 C 120 185, 110 160, 110 120 Z" fill="#FFAB91" stroke="#2C3E50" strokeWidth="2" />
      <circle cx="192" cy="135" r="10" fill="#FFAB91" stroke="#2C3E50" strokeWidth="2" />
      <path d="M105 105 C 105 60, 195 60, 195 105 Z" fill="#008075" stroke="#2C3E50" strokeWidth="2" />
      <path d="M95 105 Q 150 90 205 105" fill="none" stroke="#2C3E50" strokeWidth="4" strokeLinecap="round" />
      <path d="M105 105 L 105 125 C 115 115, 110 105, 110 105 Z" fill="#263238" />
      <circle cx="138" cy="125" r="2.5" fill="#2C3E50" />
      <circle cx="165" cy="125" r="2.5" fill="#2C3E50" />
      <path d="M152 135 L 148 150 L 155 150" fill="none" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M138 160 Q 150 170 162 160 Z" fill="white" stroke="#2C3E50" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Female SVG character ────────────────────────────────────────── */
function FemaleCharacter() {
  return (
    <svg width="250" height="250" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin slice"
      style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="10" y="10" width="280" height="280" rx="20" fill="white" stroke="#008075" strokeWidth="2" />
      <path d="M 100 60 C 40 60, 20 130, 30 190 C 35 220, 20 260, 45 285 C 75 295, 95 260, 105 230 L 125 150 L 175 150 L 195 230 C 205 260, 225 295, 255 285 C 280 260, 265 220, 270 190 C 280 130, 260 60, 200 60 Z" fill="#A04E4E" stroke="#2C3E50" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 50 280 C 60 210, 90 180, 120 170 L 150 190 L 180 170 C 210 180, 240 210, 250 280 Z" fill="#FF8C00" stroke="#2C3E50" strokeWidth="2" />
      <path d="M 120 170 L 140 210 L 150 190 Z" fill="#FF8C00" stroke="#2C3E50" strokeWidth="2" />
      <path d="M 180 170 L 160 210 L 150 190 Z" fill="#FF8C00" stroke="#2C3E50" strokeWidth="2" />
      <line x1="150" y1="190" x2="150" y2="280" stroke="#2C3E50" strokeWidth="2" />
      <circle cx="157" cy="230" r="3" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
      <circle cx="157" cy="260" r="3" fill="none" stroke="#2C3E50" strokeWidth="1.5" />
      <rect x="130" y="150" width="40" height="35" fill="#FFAB91" stroke="#2C3E50" strokeWidth="2" />
      <path d="M 110 110 C 110 70, 190 70, 190 110 C 190 155, 175 170, 150 170 C 125 170, 110 155, 110 110 Z" fill="#FFAB91" stroke="#2C3E50" strokeWidth="2" />
      <path d="M 188 115 C 198 115, 202 125, 195 135 C 190 140, 185 135, 185 130" fill="#FFAB91" stroke="#2C3E50" strokeWidth="2" />
      <path d="M 105 120 C 100 50, 190 45, 210 100 C 190 65, 140 75, 120 110 Z" fill="#A04E4E" stroke="#2C3E50" strokeWidth="2" />
      <circle cx="132" cy="105" r="2.5" fill="#2C3E50" />
      <circle cx="160" cy="105" r="2.5" fill="#2C3E50" />
      <path d="M 145 112 L 138 122 L 143 122" fill="none" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 135 132 Q 145 145 155 132 Z" fill="white" stroke="#2C3E50" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Gender Card ─────────────────────────────────────────────────── */
interface GenderCardProps {
  gender: "male" | "female";
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function GenderCard({ gender, label, isSelected, onSelect }: GenderCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        border: isSelected
          ? `2.5px solid var(--color-primary)`
          : "1.5px solid var(--color-border)",
        background: "var(--color-bg-card)",
        boxShadow: isSelected
          ? "var(--shadow-sel)"
          : "0 2px 8px rgba(28,26,46,0.07), 0 6px 20px rgba(28,26,46,0.05)",
        cursor: "pointer",
        padding: 0,
        transition: "border-color 0.18s, box-shadow 0.18s",
        textAlign: "left",
      }}
    >
      {/* Illustration — bust / half-body crop */}
      <div style={{
        width: "100%",
        /* landscape aspect shows only the top ~60% of the SVG (head + torso) */
        aspectRatio: "4 / 3",
        overflow: "hidden",
      }}>
        {gender === "male" ? <MaleCharacter /> : <FemaleCharacter />}
      </div>

      {/* Label button */}
      <div style={{
        background: isSelected ? "var(--color-primary-dark)" : "var(--color-primary)",
        padding: "11px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background 0.18s",
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
          {label}
        </span>
        <span style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>→</span>
      </div>
    </motion.button>
  );
}

/* ── Main Landing Component ──────────────────────────────────────── */
export function GenderLanding() {
  const { selectOption, submitAnswer } = useQuizStore();
  const [selected, setSelected] = useState<"male" | "female" | null>(null);

  const handleSelect = (id: "male" | "female") => {
    if (selected) return;           // prevent double-tap
    setSelected(id);
    selectOption(id, "single");
    setTimeout(() => submitAnswer(), 380);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--color-bg-page)",
    }}>

      {/* ── Brand Header (only on landing) ──────────────────── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        background: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}>
        {/* Logo mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {/* Brain-wave icon */}
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path d="M1 8 Q3 3 5 8 Q7 13 9 8 Q11 3 13 8 Q15 13 17 8 Q19 3 21 8"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", letterSpacing: "0.02em" }}>
              FOCUSROUTE
            </p>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", letterSpacing: "0.1em", fontWeight: 500 }}>
              ADHD TEST
            </p>
          </div>
        </div>

        {/* Navigation icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[User, Menu].map((Icon, i) => (
            <button key={i} style={{
              width: 38, height: 38, borderRadius: 10,
              background: "transparent",
              border: "1.5px solid var(--color-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-text-body)",
            }}>
              <Icon size={17} />
            </button>
          ))}
        </div>
      </header>

      {/* ── Hero Content ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px 36px",
        gap: 0,
      }}>

        {/* Text block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          style={{ textAlign: "center", maxWidth: 480, marginBottom: 24 }}
        >
          <h1 style={{
            fontSize: "clamp(24px, 5.5vw, 32px)",
            fontWeight: 800,
            color: "var(--color-text)",
            lineHeight: 1.22,
            marginBottom: 10,
            letterSpacing: "-0.02em",
          }}>
            Discover your{" "}
            <span style={{ color: "var(--color-primary)" }}>
              ADHD profile
            </span>{" "}
            in 3 minutes
          </h1>

          <p style={{
            fontSize: 14,
            color: "var(--color-text-body)",
            lineHeight: 1.6,
            maxWidth: 360,
            margin: "0 auto 12px",
          }}>
            Take the free diagnostic assessment and receive your personalized result with a guide on how to manage ADHD.
          </p>

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.28 }}
            style={{
              display: "inline-block",
              color: "var(--color-primary)",
              fontSize: 12, fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Free test · 3 minutes
          </motion.span>
        </motion.div>

        {/* Gender cards — compact, matching Impulse proportions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.34, ease: "easeOut" }}
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            maxWidth: 420,
          }}
        >
          <GenderCard
            gender="male"
            label="Male"
            isSelected={selected === "male"}
            onSelect={() => handleSelect("male")}
          />
          <GenderCard
            gender="female"
            label="Female"
            isSelected={selected === "female"}
            onSelect={() => handleSelect("female")}
          />
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", marginTop: 20 }}
        >
          Your data is 100% private and secure 🔒
        </motion.p>
      </div>
    </div>
  );
}

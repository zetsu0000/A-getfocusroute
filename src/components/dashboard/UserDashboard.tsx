"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { RotateCcw, CheckCircle2, Crown, Calendar, ArrowLeft } from "lucide-react";
import {
  UserSession,
  getSession,
  canRetake,
  planLabel,
  planColor,
  planBg,
} from "@/lib/session";
import { useQuizStore } from "@/store/quizStore";
import { QuizAnswer } from "@/types/quiz";
import { safeName } from "@/lib/personalization";
import { scoreFromAnswers, getSymptomLevel } from "@/lib/symptom-level";

/* ── ADHD Profile card ── */
function ProfileCard({ answers }: { answers: QuizAnswer[] }) {
  const score = scoreFromAnswers(answers);
  const level = getSymptomLevel(score);

  const rows = [
    { label: "ADHD Subtype",          value: "Inattentive-C" },
    { label: "Procrastination index", value: "78 / 100"      },
    { label: "Focus pattern",         value: "Hyperactive"   },
    { label: "Priority strategy",     value: "Body-doubling" },
  ];

  return (
    <div style={{ borderRadius: 22, overflow: "hidden", background: "var(--color-bg-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 14px", background: "linear-gradient(135deg,#EAF2F8,#F5F3EE)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#4A7FA5,#6AA3C8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1C1A2E" }}>Your ADHD Profile</p>
          <p style={{ fontSize: 11, color: "#9B9BB5", marginTop: 1 }}>Diagnostic assessment · Completed</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: level.bg, color: level.color }}>
          {level.label}
        </span>
      </div>

      {/* Gauge */}
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#9B9BB5" }}>ADHD Symptom Level</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: level.color }}>{level.label}</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "linear-gradient(to right,#EAF2F8,#6AA3C8,#F5C17A,#E87450,#A82E2E)", position: "relative" }}>
          <m.div
            initial={{ left: "0%" }}
            animate={{ left: `${level.pct}%` }}
            transition={{ delay: 0.4, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `3px solid ${level.color}`, boxShadow: `0 2px 8px ${level.color}55` }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {["Low","Mild","Moderate","High","Very High"].map((l) => (
            <span key={l} style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Unlocked rows */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "#FAF9F6", border: "1px solid #EAE6DC" }}>
            <span style={{ fontSize: 12, color: "#4A4A6A" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4A7FA5" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Plan badge ── */
function PlanBadge({ session }: { session: UserSession }) {
  const color  = planColor(session.planType);
  const bg     = planBg(session.planType);
  const label  = planLabel(session.planType);
  const isAnnual = session.planType === "annual";
  const isSub  = session.planType !== "assessment";

  const date = new Date(session.purchasedAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div style={{ background: "var(--color-bg-card)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isAnnual ? <Crown size={22} color={color} /> : <CheckCircle2 size={22} color={color} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)" }}>{label}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: bg, color }}>
              {isSub ? "Active" : "Lifetime access"}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-muted)" }}>
              <Calendar size={11} />
              {date}
            </span>
          </div>
        </div>
      </div>

      {isSub && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Plan includes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              "Retake the assessment anytime",
              "Continuous access to your ADHD report",
              "Monthly check-ins and progress tracking",
              ...(isAnnual ? ["Updated strategies and content", "Priority support"] : []),
            ].map((feat) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

/* ── No session state ── */
function NoSession() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🔒</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", marginBottom: 12 }}>
        No account found
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.65, maxWidth: 320, marginBottom: 32 }}>
        Complete the ADHD assessment and purchase a plan to access your personal dashboard.
      </p>
      <a
        href="/"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "14px 28px", borderRadius: 14,
          background: "var(--color-primary)", color: "#fff",
          fontSize: 15, fontWeight: 700, textDecoration: "none",
          boxShadow: "var(--shadow-btn-primary)",
        }}
      >
        Take the assessment →
      </a>
    </div>
  );
}

/* ── Main dashboard ── */
export function UserDashboard() {
  const router = useRouter();
  const startRetake = useQuizStore((s) => s.startRetake);
  const [session, setSession] = useState<UserSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getSession());
  }, []);

  if (session === undefined) return null;
  if (session === null) return <NoSession />;

  const eligible = canRetake(session.planType);
  const displayName = safeName(session.name, "there");

  const handleRetake = () => {
    startRetake(session.email, session.name);
    router.push("/");
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{ minHeight: "100vh", padding: "0 16px 64px" }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24 }}>
          <button
            onClick={() => router.push("/")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-muted)", padding: 0 }}
          >
            <ArrowLeft size={16} />
            Home
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            My Account
          </span>
        </div>

        {/* Greeting */}
        <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.25, marginBottom: 4 }}>
            Welcome back,{" "}
            <span style={{ color: "var(--color-primary)" }}>{displayName}</span> 👋
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{session.email}</p>
        </m.div>

        {/* Plan badge */}
        <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
          <PlanBadge session={session} />
        </m.div>

        {/* Retake CTA — only for subscribers */}
        {eligible && (
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <div style={{ background: "var(--color-bg-card)", borderRadius: 20, padding: "20px 20px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
                Refazer o teste
              </p>
              <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 16 }}>
                Your plan allows you to retake the ADHD assessment anytime. Your new results will be saved automatically.
              </p>
              <m.button
                onClick={handleRetake}
                whileTap={{ scale: 0.97 }}
                animate={{ scale: [1, 1.015, 1], transition: { repeat: Infinity, duration: 2.8, ease: "easeInOut" } }}
                style={{
                  width: "100%", padding: "15px 20px", borderRadius: 14,
                  background: "var(--color-primary)", color: "#fff",
                  fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: "var(--shadow-btn-primary)",
                }}
              >
                <RotateCcw size={17} />
                Refazer o teste agora
              </m.button>
            </div>
          </m.div>
        )}

        {/* ADHD profile card */}
        <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: eligible ? 0.18 : 0.14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Your latest results
          </p>
          <ProfileCard answers={session.answers} />
        </m.div>

        {/* No retake notice for assessment-only users */}
        {!eligible && (
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <div style={{ background: "var(--color-bg-card)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
                Want to retake the assessment?
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 14 }}>
                Upgrade to a Monthly or Annual plan to retake the test anytime and track your progress over time.
              </p>
              <a
                href="/"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 22px", borderRadius: 12,
                  background: "var(--color-primary)", color: "#fff",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                }}
              >
                Upgrade my plan →
              </a>
            </div>
          </m.div>
        )}

      </div>
    </m.div>
  );
}

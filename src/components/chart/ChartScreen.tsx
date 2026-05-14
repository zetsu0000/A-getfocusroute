"use client";

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceDot, ResponsiveContainer } from "recharts";
import { useQuizStore } from "@/store/quizStore";
import { updateSessionAnswers } from "@/lib/session";
import { safeName } from "@/lib/personalization";

const data = [
  { week: "Now",  score: 82 },
  { week: "Wk 1", score: 65 },
  { week: "Wk 2", score: 48 },
  { week: "Wk 3", score: 30 },
  { week: "Wk 4", score: 16 },
];

export function ChartScreen() {
  const { name, setStep, retakeMode, answers } = useQuizStore();
  const router = useRouter();
  const displayName = safeName(name, "you");

  const handleRetakeDone = () => {
    updateSessionAnswers(answers);
    router.push("/dashboard");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.28 }}
      style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Chart card */}
        <div style={{
          background: "var(--color-bg-card)",
          borderRadius: 28, padding: "24px 20px 16px",
          boxShadow: "var(--shadow-card)",
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", textAlign: "center", marginBottom: 20 }}>
            Projection: your ADHD symptom progression
          </p>

          <div style={{ position: "relative" }}>
            {/* After label */}
            <div style={{
              position: "absolute", bottom: 32, right: 12, zIndex: 10,
              background: "var(--color-primary-tint)", borderRadius: 8,
              padding: "3px 10px",
              fontSize: 12, fontWeight: 700, color: "var(--color-primary)",
              textAlign: "center", lineHeight: 1.4,
            }}>
              After<br />4 weeks
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 28, right: 16, left: -24, bottom: 4 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#E87450" />
                    <stop offset="100%" stopColor="#4A7FA5" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week"
                  tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                  axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Line
                  type="monotone" dataKey="score"
                  stroke="url(#lineGrad)" strokeWidth={3} dot={false}
                />
                <ReferenceDot x="Now"  y={82} r={6} fill="#FDF1EC" stroke="#E87450" strokeWidth={2} />
                <ReferenceDot x="Wk 4" y={16} r={6} fill="var(--color-primary-tint)" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", marginTop: 8 }}>
            This chart is for illustration purposes only
          </p>
        </div>

        {/* Personalized message */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.4 }}>
            <span style={{ color: "var(--color-primary)" }}>{displayName},</span>
            {" "}your results are ready — unlock now and start your transformation!
          </p>
        </m.div>

        {/* CTA */}
        {retakeMode ? (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleRetakeDone}
            style={{
              width: "100%", padding: "18px",
              borderRadius: 16, fontSize: 16, fontWeight: 700,
              border: "none", cursor: "pointer",
              background: "var(--color-primary)", color: "#fff",
              boxShadow: "var(--shadow-btn-primary)",
            }}
          >
            Salvar novo resultado →
          </m.button>
        ) : (
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setStep("paywall")}
            style={{
              width: "100%", padding: "18px",
              borderRadius: 16, fontSize: 16, fontWeight: 700,
              border: "none", cursor: "pointer",
              background: "var(--color-primary)", color: "#fff",
              boxShadow: "var(--shadow-btn-primary)",
            }}
          >
            See my results →
          </m.button>
        )}
      </div>
    </m.div>
  );
}

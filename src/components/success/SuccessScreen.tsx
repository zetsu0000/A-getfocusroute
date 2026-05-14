"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Mail } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";

function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 70 }, () => ({
      x:   Math.random() * canvas.width,
      y:   Math.random() * -canvas.height,
      r:   Math.random() * 7 + 3,
      d:   Math.random() * 80 + 20,
      color: ["#4A7FA5","#6AA3C8","#E87450","#F5C17A","#A3D9A5"][Math.floor(Math.random() * 5)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrementDenum: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    }));

    let frame: number;
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.01;
      pieces.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncrementDenum;
        p.y += (Math.cos(angle + p.d) + 1 + p.r / 2) * 0.9;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        if (p.y > canvas.height) { p.y = -p.r; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });
      frame = requestAnimationFrame(draw);
    };

    draw();
    const timeout = setTimeout(() => cancelAnimationFrame(frame), 4000);
    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}
    />
  );
}

export function SuccessScreen() {
  const { name, email } = useQuizStore();
  const displayName = name || "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}
    >
      <ConfettiCanvas />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        style={{ width: 84, height: 84, borderRadius: 24, background: "linear-gradient(135deg, var(--color-primary), #6AA3C8)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 8px 32px rgba(74,127,165,0.35)" }}
      >
        <CheckCircle2 size={44} color="white" strokeWidth={2.2} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30 }}
        style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.25, marginBottom: 12 }}
      >
        You&apos;re all set, {displayName}! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.40 }}
        style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.7, maxWidth: 340, marginBottom: 36 }}
      >
        Your ADHD Assessment results and personalized guide are on their way. Check your inbox — this is the clarity you&apos;ve been looking for.
      </motion.p>

      {email && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.50 }}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--color-bg-card)", borderRadius: 16, padding: "14px 22px", boxShadow: "var(--shadow-card)", marginBottom: 32 }}
        >
          <Mail size={18} color="var(--color-primary)" />
          <p style={{ fontSize: 13, color: "var(--color-text-body)" }}>
            Sent to <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{email}</span>
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.60 }}
        style={{ background: "var(--color-bg-card)", borderRadius: 22, padding: "24px 26px", boxShadow: "var(--shadow-card)", maxWidth: 380, width: "100%" }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          What happens next
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {[
            { step: "1", text: "Check your email for your full ADHD report and profile." },
            { step: "2", text: "Read your personalized analysis and cognitive insights." },
            { step: "3", text: "Start Day 1 of your action plan — even 10 minutes counts." },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary)" }}>{step}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5, paddingTop: 4 }}>{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

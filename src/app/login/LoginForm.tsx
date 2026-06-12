"use client";

import { safeNextPath } from "@/lib/auth/safe-next";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { HudLabel, TelemetryChip } from "@/components/v2/primitives";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextAfterLogin = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    const trimmed = email.trim();
    trackEvent(FIRST_PARTY_EVENTS.loginStarted, {
      meta: false,
      metadata: { next_path: nextAfterLogin },
    });
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const nextQs = encodeURIComponent(nextAfterLogin);
      const redirectTo = `${origin}/auth/callback?next=${nextQs}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      router.replace(
        `/verify?email=${encodeURIComponent(trimmed)}&next=${encodeURIComponent(nextAfterLogin)}`,
      );
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setStatus("error");
      const detail = e.message.trim().slice(0, 400);
      setMessage(
        detail.length > 0
          ? detail
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div
      className="v2-screen v2-grain"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div className="v2-aurora" aria-hidden="true" />
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 2 }}>
        <div
          className="v2-panel"
          style={{
            borderRadius: "var(--v2-r-lg)",
            padding: "30px 26px 28px",
            background: "linear-gradient(170deg, rgba(14,18,32,0.9), rgba(7,8,17,0.94))",
          }}
        >
          <HudLabel tone="signal" style={{ marginBottom: 14 }}>
            FocusRoute — secure access
          </HudLabel>
          <h1
            className="v2-display"
            style={{
              fontSize: "clamp(26px, 5vw, 32px)",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Sign in to your observatory
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--v2-ink-dim)",
              maxWidth: 370,
            }}
          >
            We&apos;ll email you a login code and a magic link. Your access is
            tied to your account on our servers — not browser storage — and you
            stay signed in on this device while your secure session is valid.
          </p>

          {(errorParam === "auth" || status === "error") && (
            <p
              style={{
                marginTop: 16,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                background: "rgba(var(--v2-error-rgb), 0.10)",
                border: "1px solid rgba(var(--v2-error-rgb), 0.35)",
                color: "var(--v2-error)",
              }}
              role="alert"
            >
              {message ?? "Sign-in could not be completed. Please try again."}
            </p>
          )}

          <form
            style={{
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onSubmit={onSubmit}
          >
            <label style={{ display: "block" }}>
              <span
                className="v2-hud"
                style={{
                  display: "block",
                  fontSize: 10,
                  marginBottom: 9,
                }}
              >
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={status === "loading"}
                className="v2-input"
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="v2-cta"
              style={{
                width: "100%",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                opacity: status === "loading" ? 0.65 : 1,
              }}
            >
              {status === "loading" ? "Sending…" : "Send login code"}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid var(--v2-line)",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 18px",
              justifyContent: "center",
            }}
          >
            <TelemetryChip>Private</TelemetryChip>
            <TelemetryChip>No password needed</TelemetryChip>
            <TelemetryChip color="var(--v2-ink-faint)">Secure session</TelemetryChip>
          </div>

          <p
            style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Link
              href="/"
              style={{
                color: "var(--v2-signal-2)",
                textDecoration: "none",
              }}
            >
              ← Back to home
            </Link>
          </p>
        </div>
        <p style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--v2-ink-faint)", lineHeight: 2 }}>
          <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
          {" · "}
          <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
          {" · "}
          <a href="/refund-policy" style={{ color: "inherit", textDecoration: "none" }}>Refunds</a>
          {" · "}
          <a href="/disclaimer" style={{ color: "inherit", textDecoration: "none" }}>Disclaimer</a>
        </p>
      </div>
    </div>
  );
}

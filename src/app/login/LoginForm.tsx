"use client";

import { safeNextPath } from "@/lib/auth/safe-next";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "var(--color-bg-page)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1.5px solid var(--color-border)",
            borderRadius: 16,
            padding: "28px 24px 26px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 8,
            }}
          >
            FocusRoute
          </p>
          <h1
            style={{
              fontSize: "clamp(22px, 4.5vw, 26px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.22,
              color: "var(--color-text)",
              marginBottom: 10,
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--color-text-body)",
              maxWidth: 360,
            }}
          >
            We&apos;ll email you a login code and a magic link. Paid access is
            tied to your account on our servers, not browser storage. On this
            device, you&apos;ll stay signed in while your secure Supabase session
            remains valid.
          </p>

          {(errorParam === "auth" || status === "error") && (
            <p
              style={{
                marginTop: 16,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                background: "var(--color-accent-tint)",
                color: "var(--color-accent-dark)",
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
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text-body)",
                  marginBottom: 8,
                }}
              >
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={status === "loading"}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px var(--color-primary-ring)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid var(--color-border)",
                  fontSize: 15,
                  lineHeight: 1.4,
                  outline: "none",
                  color: "var(--color-text)",
                  background: "var(--color-bg-card-2)",
                  transition:
                    "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
                }}
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                border: "none",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "#ffffff",
                background: "var(--color-primary)",
                boxShadow: "var(--shadow-btn-primary)",
                opacity: status === "loading" ? 0.65 : 1,
                transition: "opacity 0.15s ease, transform 0.12s ease",
              }}
            >
              {status === "loading" ? "Sending…" : "Send login code"}
            </button>
          </form>

          <p
            style={{
              marginTop: 26,
              textAlign: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text-muted)",
            }}
          >
            <Link
              href="/"
              style={{
                color: "var(--color-primary)",
                textDecoration: "none",
                borderBottom: "1.5px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomColor =
                  "var(--color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomColor = "transparent";
              }}
            >
              Back to home
            </Link>
          </p>
        </div>
        <p style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--color-text-muted)", lineHeight: 2 }}>
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

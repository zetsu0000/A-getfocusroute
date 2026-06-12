"use client";

import { safeNextPath } from "@/lib/auth/safe-next";
import { FIRST_PARTY_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/client";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { HudLabel } from "@/components/v2/primitives";

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email")?.trim() ?? "";
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams],
  );

  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!emailParam) return;
    const code = token.replace(/\s/g, "");
    if (code.length < 6) {
      setStatus("error");
      setMessage("Enter the verification code sent to your email.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: emailParam,
        token: code,
        type: "email",
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      trackEvent(FIRST_PARTY_EVENTS.otpVerified, {
        meta: false,
        metadata: { next_path: nextPath },
      });
      router.refresh();
      router.replace(nextPath);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setStatus("error");
      setMessage(e.message.trim().slice(0, 400) || "Verification failed.");
    }
  }

  async function onResend() {
    if (!emailParam) return;
    setResendStatus("loading");
    setMessage(null);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: emailParam,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("idle");
        setMessage("We sent another email. Check your inbox and spam.");
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setStatus("error");
      setMessage(e.message.trim().slice(0, 400) || "Could not resend.");
    } finally {
      setResendStatus("idle");
    }
  }

  if (!emailParam) {
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
        <div style={{ maxWidth: 440, textAlign: "center", position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 14, color: "var(--v2-ink-dim)" }}>
            Missing email. Start from the sign-in page.
          </p>
          <Link
            href={loginHref}
            style={{
              display: "inline-block",
              marginTop: 16,
              fontWeight: 700,
              color: "var(--v2-signal-2)",
            }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
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
            FocusRoute — verification
          </HudLabel>
          <h1
            className="v2-display"
            style={{
              fontSize: "clamp(26px, 5vw, 32px)",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Check your email
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--v2-ink-dim)",
              marginBottom: 8,
            }}
          >
            Enter the verification code sent to{" "}
            <strong style={{ color: "var(--v2-ink)" }}>{emailParam}</strong>.
            You can also use the magic link in the same email.
          </p>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: "var(--v2-ink-faint)",
              marginBottom: 8,
            }}
          >
            If your email only shows a link, sign in with that link instead —
            it opens the same secure session.
          </p>

          {message && (
            <p
              style={{
                marginTop: 12,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                background:
                  status === "error"
                    ? "rgba(var(--v2-error-rgb), 0.10)"
                    : "rgba(127, 224, 178, 0.10)",
                border:
                  status === "error"
                    ? "1px solid rgba(var(--v2-error-rgb), 0.35)"
                    : "1px solid rgba(127, 224, 178, 0.35)",
                color:
                  status === "error"
                    ? "var(--v2-error)"
                    : "var(--v2-success)",
              }}
              role={status === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}

          <form
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            onSubmit={onVerify}
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
                Verification code
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                required
                value={token}
                onChange={(ev) =>
                  setToken(ev.target.value)
                }
                disabled={status === "loading"}
                className="v2-input"
                style={{
                  fontSize: 19,
                  letterSpacing: "0.22em",
                  fontFamily: "var(--v2-font-mono)",
                  textAlign: "center",
                }}
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
              {status === "loading" ? "Verifying…" : "Continue"}
            </button>
          </form>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              disabled={resendStatus === "loading"}
              onClick={() => void onResend()}
              style={{
                background: "none",
                border: "none",
                cursor:
                  resendStatus === "loading" ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--v2-signal-2)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {resendStatus === "loading" ? "Sending…" : "Resend code"}
            </button>
            <Link
              href={loginHref}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--v2-ink-faint)",
              }}
            >
              Use a different email
            </Link>
          </div>
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

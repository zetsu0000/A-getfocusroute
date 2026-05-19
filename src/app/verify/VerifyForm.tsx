"use client";

import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

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
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--color-text-body)" }}>
            Missing email. Start from the sign-in page.
          </p>
          <Link
            href={loginHref}
            style={{
              display: "inline-block",
              marginTop: 16,
              fontWeight: 700,
              color: "var(--color-primary)",
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
            Check your email
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--color-text-body)",
              marginBottom: 8,
            }}
          >
            Enter the verification code sent to{" "}
            <strong style={{ color: "var(--color-text)" }}>{emailParam}</strong>
            . You can also use the magic link in the same email.
          </p>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: "var(--color-text-muted)",
              marginBottom: 8,
            }}
          >
            Supabase email templates must include{" "}
            <code style={{ fontSize: 11 }}>{`{{ .Token }}`}</code> for the
            code to appear. If you only see a link, sign in with that link
            instead.
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
                    ? "var(--color-accent-tint)"
                    : "var(--color-success-tint)",
                color:
                  status === "error"
                    ? "var(--color-accent-dark)"
                    : "var(--color-success)",
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
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text-body)",
                  marginBottom: 8,
                }}
              >
                Verification code
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Verification code"
                required
                value={token}
                onChange={(ev) =>
                  setToken(ev.target.value)
                }
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid var(--color-border)",
                  fontSize: 18,
                  letterSpacing: "0.12em",
                  outline: "none",
                  color: "var(--color-text)",
                  background: "var(--color-bg-card-2)",
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
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-primary)",
                textDecoration: "underline",
              }}
            >
              {resendStatus === "loading" ? "Sending…" : "Resend code"}
            </button>
            <Link
              href={loginHref}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              Use a different email
            </Link>
          </div>
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

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithOtp, verifyOtp } from "@/lib/supabaseAuth";

export default function VerifyPage() {
  const router = useRouter();
  const [next, setNext] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
    setNext(params.get("next") ?? "/dashboard");
  }, []);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsVerifying(true);

    try {
      await verifyOtp(email, token);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify the code.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const result = await signInWithOtp(email);
      setEmail(result.email);
      setMessage("We sent a new login code to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend the login code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f4ef" }}>
      <section style={{ width: "100%", maxWidth: 460, background: "#fff", border: "1px solid #eadfce", borderRadius: 24, padding: 32, boxShadow: "0 24px 80px rgba(37, 29, 20, 0.08)" }}>
        <p style={{ margin: 0, color: "#8a6f4d", fontWeight: 700 }}>FocusRoute</p>
        <h1 style={{ margin: "12px 0 8px", fontSize: 32, lineHeight: 1.1, color: "#241c15" }}>Verify your code</h1>
        <p style={{ margin: "0 0 24px", color: "#66594b", lineHeight: 1.6 }}>
          Enter the one-time code sent to your email to access your dashboard.
        </p>

        <form onSubmit={handleVerify}>
          <label htmlFor="email" style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#241c15" }}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isVerifying || isResending}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d8c7b1", borderRadius: 14, padding: "14px 16px", fontSize: 16, color: "#241c15" }}
          />

          <label htmlFor="token" style={{ display: "block", margin: "16px 0 8px", fontWeight: 700, color: "#241c15" }}>
            Login code
          </label>
          <input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            disabled={isVerifying || isResending}
            placeholder="123456"
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d8c7b1", borderRadius: 14, padding: "14px 16px", fontSize: 18, letterSpacing: 4, color: "#241c15" }}
          />

          {error && <p role="alert" style={{ margin: "14px 0 0", color: "#b42318" }}>{error}</p>}
          {message && <p role="status" style={{ margin: "14px 0 0", color: "#157f3b" }}>{message}</p>}

          <button
            type="submit"
            disabled={isVerifying || isResending}
            style={{ width: "100%", marginTop: 22, border: 0, borderRadius: 999, padding: "14px 18px", fontWeight: 800, fontSize: 16, color: "#fff", background: isVerifying ? "#a98f69" : "#6d4f2a", cursor: isVerifying || isResending ? "not-allowed" : "pointer" }}
          >
            {isVerifying ? "Verifying..." : "Verify and continue"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isVerifying || isResending}
          style={{ width: "100%", marginTop: 12, border: "1px solid #d8c7b1", borderRadius: 999, padding: "13px 18px", fontWeight: 800, fontSize: 16, color: "#6d4f2a", background: "#fff", cursor: isVerifying || isResending ? "not-allowed" : "pointer" }}
        >
          {isResending ? "Resending..." : "Resend code"}
        </button>

        <p style={{ margin: "20px 0 0", color: "#66594b" }}>
          Wrong email? <Link href={`/login?next=${encodeURIComponent(next)}`}>Go back to login</Link>
        </p>
      </section>
    </main>
  );
}

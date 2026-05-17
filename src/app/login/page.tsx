"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithOtp } from "@/lib/supabaseAuth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const result = await signInWithOtp(email);
      setMessage("We sent a login code to your email.");
      const params = new URLSearchParams({ email: result.email, next });
      router.push(`/verify?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the login code.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f7f4ef" }}>
      <section style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #eadfce", borderRadius: 24, padding: 32, boxShadow: "0 24px 80px rgba(37, 29, 20, 0.08)" }}>
        <p style={{ margin: 0, color: "#8a6f4d", fontWeight: 700 }}>FocusRoute</p>
        <h1 style={{ margin: "12px 0 8px", fontSize: 32, lineHeight: 1.1, color: "#241c15" }}>Log in with email</h1>
        <p style={{ margin: "0 0 24px", color: "#66594b", lineHeight: 1.6 }}>
          Enter your email and we’ll send you a one-time code.
        </p>

        <form onSubmit={handleSubmit}>
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
            disabled={isLoading}
            placeholder="you@example.com"
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d8c7b1", borderRadius: 14, padding: "14px 16px", fontSize: 16, color: "#241c15" }}
          />

          {error && <p role="alert" style={{ margin: "14px 0 0", color: "#b42318" }}>{error}</p>}
          {message && <p role="status" style={{ margin: "14px 0 0", color: "#157f3b" }}>{message}</p>}

          <button
            type="submit"
            disabled={isLoading}
            style={{ width: "100%", marginTop: 22, border: 0, borderRadius: 999, padding: "14px 18px", fontWeight: 800, fontSize: 16, color: "#fff", background: isLoading ? "#a98f69" : "#6d4f2a", cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? "Sending code..." : "Send login code"}
          </button>
        </form>

        <p style={{ margin: "20px 0 0", color: "#66594b" }}>
          Already have a code? <Link href={`/verify${email ? `?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}` : ""}`}>Verify it</Link>
        </p>
      </section>
    </main>
  );
}
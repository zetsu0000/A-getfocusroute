import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found · FocusRoute",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 48,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <path
              d="M1 8 Q3 3 5 8 Q7 13 9 8 Q11 3 13 8 Q15 13 17 8 Q19 3 21 8"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "var(--color-text)",
            letterSpacing: "-0.01em",
          }}
        >
          FocusRoute
        </span>
      </div>

      {/* 404 headline */}
      <div
        style={{
          fontSize: "clamp(72px, 18vw, 120px)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-mid))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 16,
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: "clamp(20px, 5vw, 28px)",
          fontWeight: 800,
          color: "var(--color-text)",
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "var(--color-text-body)",
          lineHeight: 1.65,
          maxWidth: 360,
          marginBottom: 40,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "15px 32px",
          borderRadius: 16,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "var(--shadow-btn-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        Take the free ADHD test →
      </Link>

      <p
        style={{
          marginTop: 28,
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}
      >
        Or return to{" "}
        <Link
          href="/"
          style={{ color: "var(--color-primary)", textDecoration: "underline" }}
        >
          getfocusroute.com
        </Link>
      </p>
    </div>
  );
}

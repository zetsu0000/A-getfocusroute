import type { ReactNode } from "react";
import Link from "next/link";

import { BRAIN_OS } from "@/lib/positioning";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="v2-screen v2-grain v2-skin" style={{ minHeight: "100dvh", paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(12, 15, 28, 0.7)",
          borderBottom: "1px solid var(--color-border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <path
                d="M1 8 Q3 3 5 8 Q7 13 9 8 Q11 3 13 8 Q15 13 17 8 Q19 3 21 8"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "var(--color-text)",
                letterSpacing: "-0.01em",
              }}
            >
              FocusRoute
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                letterSpacing: "0.08em",
                fontWeight: 500,
              }}
            >
              {BRAIN_OS.headerEyebrow}
            </p>
          </div>
        </Link>
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Home
        </Link>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px, 5vw, 48px) 20px 0", position: "relative", zIndex: 2 }}>
        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 34px)",
            fontWeight: 900,
            color: "var(--color-text)",
            marginBottom: 8,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: "clamp(24px, 5vw, 48px)" }}>
          Last updated: {lastUpdated}
        </p>

        {children}

        {/* Cross-links */}
        <div
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 12,
            }}
          >
            Legal
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {LEGAL_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                style={{
                  fontSize: 13,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link
              href="/"
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to FocusRoute
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

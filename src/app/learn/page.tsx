import type { Metadata } from "next";
import Link from "next/link";
import { BRAIN_OS } from "@/lib/positioning";

export const metadata: Metadata = {
  title: "Brain OS Guides · FocusRoute",
  description:
    "Educational FocusRoute guides: profile patterns, assessment walkthroughs, and strategy design.",
};

const ARTICLES = [
  {
    slug: "types-of-adhd",
    title: "5 Cognitive Signature™ Patterns Explained",
    description:
      "Learn the Sprinter, Archivist, Spark, Reactor, and Drifter profile signatures used inside FocusRoute Brain OS™.",
    readTime: "4 min read",
  },
  {
    slug: "adhd-symptoms-in-adults",
    title: "ADHD Symptoms in Adults: What to Look For",
    description:
      "ADHD in adults often looks different than in children. Discover the 12 most common adult ADHD symptoms.",
    readTime: "5 min read",
  },
  {
    slug: "adhd-assessment-guide",
    title: "How Cognitive Mapping Assessment™ Works",
    description:
      "Understand the flow from quick assessment to partial reveal and full Profile-to-Protocol™ output.",
    readTime: "5 min read",
  },
];

export default function LearnIndexPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)", padding: "0 0 80px" }}>
      <header
        style={{
          background: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
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
            <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
              FocusRoute
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.08em", fontWeight: 500 }}>
              {BRAIN_OS.headerEyebrow}
            </p>
          </div>
        </Link>
        <Link
          href="/"
          style={{ fontSize: 13, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
        >
          ← Start Brain OS
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 0" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 36px)", marginBottom: 8, color: "var(--color-text)" }}>
          Brain OS Articles &amp; Guides
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-body)", lineHeight: 1.65, marginBottom: 40 }}>
          Practical, evidence-informed writing to help you understand ADHD patterns and turn insight into an execution system that fits your brain.
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: 26 }}>
          Educational content only. FocusRoute does not provide medical diagnosis.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 16,
                  padding: "24px 28px",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <h2
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--color-text)",
                        marginBottom: 8,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {article.title}
                    </h2>
                    <p style={{ fontSize: 14, color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: 12 }}>
                      {article.description}
                    </p>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {article.readTime}
                    </span>
                  </div>
                  <span style={{ fontSize: 20, color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link
            href="/"
            style={{ fontSize: 14, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}
          >
            ← Back to FocusRoute Brain OS
          </Link>
        </div>
      </main>
    </div>
  );
}

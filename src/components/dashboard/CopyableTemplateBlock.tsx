"use client";

import { useState } from "react";

export function CopyableTemplateBlock({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "err">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          {label}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-card-2)",
            color: "var(--color-primary)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {state === "copied" ? "Copied" : state === "err" ? "Copy blocked" : "Copy text"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          borderRadius: 12,
          background: "var(--color-bg-card-2)",
          border: "1px solid var(--color-border)",
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--color-text-body)",
          whiteSpace: "pre-wrap",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          overflowX: "auto",
        }}
      >
        {text}
      </pre>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

/**
 * Opens the authenticated Stripe Customer Portal.
 *
 * The button POSTs to /api/billing/portal, which verifies the signed-in user
 * and their membership/billing_portal entitlement server-side, resolves the
 * Stripe customer from the user's own rows, and returns a one-time portal URL.
 * No customer id or price is ever supplied by the client.
 */
export function ManageBillingButton({
  returnPath = "/dashboard/membership",
}: {
  returnPath?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_path: returnPath }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.assign(data.url);
        return; // keep the spinner while the browser navigates away
      }
      setError(data.error ?? "Unable to open billing portal");
    } catch {
      setError("Unable to open billing portal");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "12px 20px",
          borderRadius: 12,
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          boxShadow: "var(--shadow-btn-primary)",
          alignSelf: "flex-start",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={14} strokeWidth={2.4} style={{ animation: "spin 1s linear infinite" }} />
            Opening…
          </>
        ) : (
          <>
            Manage billing <ArrowUpRight size={14} strokeWidth={2.4} />
          </>
        )}
      </button>
      {error && (
        <p style={{ fontSize: 12, color: "var(--color-error)", lineHeight: 1.5 }}>{error}</p>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";

import {
  type DisplayNameState,
  updateDisplayName,
} from "@/app/dashboard/actions";

const initialState: DisplayNameState = { ok: false, message: "" };

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(updateDisplayName, initialState);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label
        htmlFor="display_name"
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "var(--color-text-muted)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Display name
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={initialName}
          placeholder="Your name"
          maxLength={80}
          style={{
            minWidth: 0,
            flex: 1,
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-card-2)",
            color: "var(--color-text)",
            fontSize: 14,
            padding: "11px 12px",
            outlineColor: "var(--color-primary)",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            borderRadius: 12,
            border: "1px solid var(--color-accent)",
            background: pending ? "var(--color-text-muted)" : "var(--color-accent)",
            color: "#fff",
            cursor: pending ? "wait" : "pointer",
            fontSize: 13,
            fontWeight: 800,
            padding: "11px 14px",
            whiteSpace: "nowrap",
          }}
        >
          {pending ? "Saving" : "Save"}
        </button>
      </div>
      {state.message ? (
        <p
          style={{
            fontSize: 12,
            color: state.ok ? "var(--color-success)" : "var(--color-error)",
            lineHeight: 1.45,
          }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

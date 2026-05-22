"use client";

import { useActionState, useState } from "react";

import {
  type DisplayNameState,
  updateDisplayName,
} from "@/app/dashboard/actions";

const initialState: DisplayNameState = { ok: false, message: "" };

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(updateDisplayName, initialState);
  const [userOpened, setUserOpened] = useState(false);
  const open = userOpened && !state.ok;

  const hasName = initialName.length > 0;
  const triggerLabel = hasName ? "Edit name" : "Add your name";

  if (!open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setUserOpened(true)}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            padding: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-accent)",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {triggerLabel}
        </button>
        {state.ok && state.message ? (
          <span style={{ fontSize: 12, color: "var(--color-success)" }}>{state.message}</span>
        ) : null}
      </div>
    );
  }

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
          autoFocus
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
        <button
          type="button"
          onClick={() => setUserOpened(false)}
          disabled={pending}
          style={{
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-muted)",
            cursor: pending ? "wait" : "pointer",
            fontSize: 13,
            fontWeight: 700,
            padding: "11px 12px",
            whiteSpace: "nowrap",
          }}
        >
          Cancel
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

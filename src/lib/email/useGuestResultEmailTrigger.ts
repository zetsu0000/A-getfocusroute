"use client";

import { useEffect, useRef } from "react";

import { useQuizStore } from "@/store/quizStore";
import { getPersistedResultEmailToken } from "@/lib/resultEmailToken";

const TRIGGERED_PREFIX = "focusroute_result_email_triggered:";

export function resultEmailTriggerStorageKey(resultId: string): string {
  return `${TRIGGERED_PREFIX}${resultId}`;
}

/**
 * Pure decision for the one-time guest trigger. Kept side-effect free so the
 * guard logic is unit-testable. The server ledger is the real idempotency
 * guarantee; this only avoids redundant POSTs on refresh / re-mount.
 */
export function shouldTriggerGuestResultEmail(input: {
  quizResultId: string | null;
  token: string | null;
  alreadyFired: boolean;
  alreadyTriggered: boolean;
}): boolean {
  if (input.alreadyFired) return false;
  if (!input.quizResultId) return false;
  if (!input.token) return false;
  if (input.alreadyTriggered) return false;
  return true;
}

function wasAlreadyTriggered(resultId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(resultEmailTriggerStorageKey(resultId)) === "1";
  } catch {
    return false;
  }
}

function markTriggered(resultId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(resultEmailTriggerStorageKey(resultId), "1");
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Fire-and-forget POST. Never throws into the caller. */
export async function postGuestResultEmailTrigger(
  resultId: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  try {
    await fetchImpl("/api/result-email/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId, token }),
      keepalive: true,
    });
  } catch {
    // Provider/webhook/network failures must never affect checkout.
  }
}

/**
 * Triggers the guest result email once when a checkout/paywall surface mounts.
 *
 * - Server-side authorized: only sends a `(resultId, token)` pair; the server
 *   reads the recipient from the stored row and verifies the proof token.
 * - Guest-only: no token means no trigger, so it never fires for the
 *   authenticated/account path (handled separately) and never requires login.
 * - Idempotent: a per-result sessionStorage guard plus the server delivery
 *   ledger prevent duplicate sends on refresh or repeated paywall visits.
 * - Non-blocking: fire-and-forget, so it can never delay or break checkout.
 */
export function useGuestResultEmailTrigger(): void {
  const quizResultId = useQuizStore((s) => s.quizResultId);
  const resultEmailToken = useQuizStore((s) => s.resultEmailToken);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!quizResultId) return;

    const token = resultEmailToken ?? getPersistedResultEmailToken();
    const alreadyTriggered = wasAlreadyTriggered(quizResultId);

    if (
      !shouldTriggerGuestResultEmail({
        quizResultId,
        token,
        alreadyFired: firedRef.current,
        alreadyTriggered,
      })
    ) {
      if (alreadyTriggered) firedRef.current = true;
      return;
    }

    firedRef.current = true;
    markTriggered(quizResultId);
    void postGuestResultEmailTrigger(quizResultId, token as string);
  }, [quizResultId, resultEmailToken]);
}

export type CheckoutLoadErrorKind =
  | "rate_limited"
  | "temporarily_unavailable"
  | "bad_request"
  | "generic";

export interface CheckoutLoadError {
  kind: CheckoutLoadErrorKind;
  message: string;
  retryAfterSeconds?: number;
}

const DEFAULT_RETRY_AFTER_SECONDS = 60;

export function retryAfterSecondsFromHeader(
  value: string | null,
  nowMs = Date.now(),
): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds));
  }

  const retryAtMs = Date.parse(value);
  if (!Number.isFinite(retryAtMs)) return null;

  return Math.max(0, Math.ceil((retryAtMs - nowMs) / 1000));
}

export function formatRetryAfter(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function checkoutLoadErrorForStatus(
  status: number,
  retryAfterHeader: string | null,
  nowMs = Date.now(),
): CheckoutLoadError {
  if (status === 429) {
    const retryAfterSeconds =
      retryAfterSecondsFromHeader(retryAfterHeader, nowMs) ??
      DEFAULT_RETRY_AFTER_SECONDS;

    return {
      kind: "rate_limited",
      message: `Too many checkout attempts. Please try again in ${formatRetryAfter(retryAfterSeconds)}.`,
      retryAfterSeconds,
    };
  }

  if (status === 503) {
    return {
      kind: "temporarily_unavailable",
      message: "Secure checkout is temporarily unavailable. Please try again shortly.",
    };
  }

  if (status === 400) {
    return {
      kind: "bad_request",
      message: "We couldn't start secure checkout for this session. Please check your details and try again.",
    };
  }

  return {
    kind: "generic",
    message: "We couldn't load secure checkout. Please try again shortly.",
  };
}

export function hasCheckoutClientSecret(
  value: unknown,
): value is { clientSecret: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "clientSecret" in value &&
    typeof value.clientSecret === "string" &&
    value.clientSecret.length > 0
  );
}

export function canStartCheckoutRequest({
  clientSecret,
  loading,
  retryBlockedUntil,
  nowMs = Date.now(),
}: {
  clientSecret: string | null;
  loading: boolean;
  retryBlockedUntil: number | null;
  nowMs?: number;
}): boolean {
  if (clientSecret) return false;
  if (loading) return false;
  if (retryBlockedUntil !== null && retryBlockedUntil > nowMs) return false;
  return true;
}

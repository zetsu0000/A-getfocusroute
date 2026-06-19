import { createHmac } from "crypto";

const DEV_ONLY_SECRET = "focusroute-development-rate-limit-secret";

export type RateLimitIdentityInput = {
  request: Request;
  route: string;
  email?: string | null;
  productKey?: string | null;
  paymentIntentId?: string | null;
  subscriptionId?: string | null;
  sessionId?: string | null;
  eventName?: string | null;
  resultId?: string | null;
  userId?: string | null;
};

export type RateLimitIdentityContext = {
  route: string;
  network: string;
  email?: string | null;
  productKey?: string | null;
  paymentIntentId?: string | null;
  subscriptionId?: string | null;
  sessionId?: string | null;
  eventName?: string | null;
  resultId?: string | null;
  userId?: string | null;
};

export function normalizeEmailForRateLimit(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@") || trimmed.length > 320) return null;
  return trimmed;
}

function firstForwardedAddress(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function forwardedHeaderAddress(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  if (!first) return null;
  const match = /for=(?:"?\[?([^;\]"]+)\]?"?)/i.exec(first);
  return match?.[1]?.trim() || null;
}

export function clientAddressSignal(request: Request): string {
  return (
    firstForwardedAddress(request.headers.get("x-vercel-forwarded-for")) ??
    firstForwardedAddress(request.headers.get("x-forwarded-for")) ??
    firstForwardedAddress(request.headers.get("x-real-ip")) ??
    firstForwardedAddress(request.headers.get("cf-connecting-ip")) ??
    firstForwardedAddress(request.headers.get("true-client-ip")) ??
    forwardedHeaderAddress(request.headers.get("forwarded")) ??
    "missing-client-address"
  );
}

export function identityContext(
  input: RateLimitIdentityInput,
): RateLimitIdentityContext {
  return {
    route: input.route,
    network: clientAddressSignal(input.request),
    email: normalizeEmailForRateLimit(input.email),
    productKey: input.productKey?.trim() || null,
    paymentIntentId: input.paymentIntentId?.trim() || null,
    subscriptionId: input.subscriptionId?.trim() || null,
    sessionId: input.sessionId?.trim().slice(0, 128) || null,
    eventName: input.eventName?.trim().slice(0, 120) || null,
    resultId: input.resultId?.trim().slice(0, 64) || null,
    userId: input.userId?.trim().slice(0, 64) || null,
  };
}

export function rateLimitHashSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const configured = env.RATE_LIMIT_HMAC_SECRET?.trim();
  if (configured) return configured;
  return env.NODE_ENV === "production" ? null : DEV_ONLY_SECRET;
}

export function hmacIdentifier(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function safeHashPrefix(hash: string): string {
  return hash.slice(0, 12);
}

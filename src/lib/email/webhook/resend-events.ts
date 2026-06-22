import "server-only";

/** The only Resend event types this receiver acts on. No open/click/contact/domain. */
export const ALLOWED_RESEND_WEBHOOK_EVENTS = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
] as const;

export type AllowedResendWebhookEvent = (typeof ALLOWED_RESEND_WEBHOOK_EVENTS)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_RESEND_WEBHOOK_EVENTS);

export function isAllowedResendWebhookEvent(value: unknown): value is AllowedResendWebhookEvent {
  return typeof value === "string" && ALLOWED_SET.has(value);
}

export type ParsedResendEvent = {
  type: AllowedResendWebhookEvent;
  providerMessageId: string | null;
};

/**
 * Extracts only the operational fields we need from a Resend webhook envelope.
 * Never returns recipient addresses or raw payload content.
 */
export function parseResendWebhookEvent(raw: unknown): ParsedResendEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const type = (raw as { type?: unknown }).type;
  if (!isAllowedResendWebhookEvent(type)) return null;

  const data = (raw as { data?: unknown }).data;
  let providerMessageId: string | null = null;
  if (data && typeof data === "object") {
    const candidate =
      (data as { email_id?: unknown }).email_id ?? (data as { id?: unknown }).id;
    if (typeof candidate === "string" && candidate.length > 0) {
      providerMessageId = candidate;
    }
  }

  return { type, providerMessageId };
}

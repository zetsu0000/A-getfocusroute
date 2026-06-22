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

/** Events that mean the address must be treated as suppressed going forward. */
export const SUPPRESSION_RESEND_EVENTS = new Set<AllowedResendWebhookEvent>([
  "email.bounced",
  "email.complained",
  "email.suppressed",
]);

export function isAllowedResendWebhookEvent(value: unknown): value is AllowedResendWebhookEvent {
  return typeof value === "string" && ALLOWED_SET.has(value);
}

export function isSuppressionEvent(event: AllowedResendWebhookEvent): boolean {
  return SUPPRESSION_RESEND_EVENTS.has(event);
}

export type ParsedResendEvent = {
  type: AllowedResendWebhookEvent;
  providerMessageId: string | null;
  /** Event time from the signed envelope; used for out-of-order defensiveness. */
  occurredAt: string | null;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

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
  let dataCreatedAt: string | null = null;
  if (data && typeof data === "object") {
    providerMessageId =
      readString((data as { email_id?: unknown }).email_id) ??
      readString((data as { id?: unknown }).id);
    dataCreatedAt = readString((data as { created_at?: unknown }).created_at);
  }

  const occurredAt =
    readString((raw as { created_at?: unknown }).created_at) ?? dataCreatedAt;

  return { type, providerMessageId, occurredAt };
}

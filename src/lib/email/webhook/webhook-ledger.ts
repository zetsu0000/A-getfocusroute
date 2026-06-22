import type { AllowedResendWebhookEvent } from "@/lib/email/webhook/resend-events";

export type WebhookEventInput = {
  svixId: string;
  eventType: AllowedResendWebhookEvent;
  providerMessageId: string | null;
  occurredAt: string;
};

export type WebhookEventResult = "applied" | "applied_unmatched" | "duplicate";

/**
 * Records Resend webhook events at-least-once-safe.
 * Dedup is keyed on the Svix message id; correlation uses the provider message id.
 */
export interface EmailWebhookLedger {
  recordEvent(input: WebhookEventInput): Promise<WebhookEventResult>;
}

type StoredEvent = WebhookEventInput;

/** Process-local webhook ledger for tests — not cross-instance dedup. */
export class InMemoryEmailWebhookLedger implements EmailWebhookLedger {
  private readonly seen = new Map<string, StoredEvent>();
  private readonly matchableMessageIds: Set<string>;

  constructor(options: { knownProviderMessageIds?: Iterable<string> } = {}) {
    this.matchableMessageIds = new Set(options.knownProviderMessageIds ?? []);
  }

  getEvent(svixId: string): StoredEvent | undefined {
    return this.seen.get(svixId);
  }

  async recordEvent(input: WebhookEventInput): Promise<WebhookEventResult> {
    if (this.seen.has(input.svixId)) {
      return "duplicate";
    }
    this.seen.set(input.svixId, input);
    if (input.providerMessageId && this.matchableMessageIds.has(input.providerMessageId)) {
      return "applied";
    }
    return "applied_unmatched";
  }
}

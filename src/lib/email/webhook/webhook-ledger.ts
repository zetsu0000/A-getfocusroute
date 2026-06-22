import {
  isSuppressionEvent,
  type AllowedResendWebhookEvent,
} from "@/lib/email/webhook/resend-events";

export type WebhookEventInput = {
  svixId: string;
  eventType: AllowedResendWebhookEvent;
  providerMessageId: string | null;
  occurredAt: string | null;
};

export type WebhookEventResult = "applied" | "applied_unmatched" | "duplicate";

/**
 * Records Resend webhook events at-least-once-safe.
 * Dedup is keyed on the Svix message id; correlation uses the provider message id.
 */
export interface EmailWebhookLedger {
  recordEvent(input: WebhookEventInput): Promise<WebhookEventResult>;
}

export type DeliveryProviderState = {
  providerStatus: AllowedResendWebhookEvent | null;
  providerStatusAt: string | null;
  suppressed: boolean;
};

/** Process-local webhook ledger for tests — not cross-instance dedup. */
export class InMemoryEmailWebhookLedger implements EmailWebhookLedger {
  private readonly seen = new Map<string, WebhookEventInput>();
  private readonly deliveries = new Map<string, DeliveryProviderState>();

  constructor(options: { knownProviderMessageIds?: Iterable<string> } = {}) {
    for (const id of options.knownProviderMessageIds ?? []) {
      this.deliveries.set(id, {
        providerStatus: null,
        providerStatusAt: null,
        suppressed: false,
      });
    }
  }

  getEvent(svixId: string): WebhookEventInput | undefined {
    return this.seen.get(svixId);
  }

  getDeliveryState(providerMessageId: string): DeliveryProviderState | undefined {
    return this.deliveries.get(providerMessageId);
  }

  async recordEvent(input: WebhookEventInput): Promise<WebhookEventResult> {
    if (this.seen.has(input.svixId)) {
      return "duplicate";
    }
    this.seen.set(input.svixId, input);

    if (!input.providerMessageId) return "applied_unmatched";
    const state = this.deliveries.get(input.providerMessageId);
    if (!state) return "applied_unmatched";

    // Out-of-order defensiveness: only advance status when this event is newer;
    // suppression is monotonic and never cleared by a later non-suppression event.
    const isNewer =
      state.providerStatusAt === null ||
      input.occurredAt === null ||
      Date.parse(input.occurredAt) >= Date.parse(state.providerStatusAt);

    if (isNewer) {
      state.providerStatus = input.eventType;
      state.providerStatusAt = input.occurredAt ?? state.providerStatusAt;
    }
    state.suppressed = state.suppressed || isSuppressionEvent(input.eventType);
    this.deliveries.set(input.providerMessageId, state);
    return "applied";
  }
}

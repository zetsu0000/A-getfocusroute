import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EmailWebhookLedger,
  WebhookEventInput,
  WebhookEventResult,
} from "@/lib/email/webhook/webhook-ledger";

/** Persistent Resend webhook ledger — service role only, backed by record_email_webhook_event. */
export class SupabaseEmailWebhookLedger implements EmailWebhookLedger {
  async recordEvent(input: WebhookEventInput): Promise<WebhookEventResult> {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("record_email_webhook_event", {
      p_svix_id: input.svixId,
      p_event_type: input.eventType,
      p_provider_message_id: input.providerMessageId,
      p_occurred_at: input.occurredAt,
    });

    if (error || typeof data !== "string") {
      throw new Error("webhook_ledger_record_failed");
    }

    if (data === "duplicate" || data === "applied" || data === "applied_unmatched") {
      return data;
    }
    throw new Error("webhook_ledger_record_failed");
  }
}

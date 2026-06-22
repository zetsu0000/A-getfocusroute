import "server-only";

import { isSupabaseServiceRoleConfigured } from "@/lib/email/config";
import type { EmailWebhookLedger } from "@/lib/email/webhook/webhook-ledger";
import { SupabaseEmailWebhookLedger } from "@/lib/email/webhook/supabase-webhook-ledger";

/** Resolves the persistent webhook ledger. Fails closed when service role is unavailable. */
export function resolveEmailWebhookLedger(
  override?: EmailWebhookLedger,
): EmailWebhookLedger {
  if (override) return override;
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("webhook_ledger_configuration_missing");
  }
  return new SupabaseEmailWebhookLedger();
}

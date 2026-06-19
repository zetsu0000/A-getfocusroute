import "server-only";

import {
  InMemoryEmailDeliveryLedger,
  type EmailDeliveryLedger,
} from "@/lib/email/delivery-ledger";
import { SupabaseEmailDeliveryLedger } from "@/lib/email/ledgers/supabase-email-delivery-ledger";
import {
  isPersistentEmailLedgerRequired,
  isSupabaseServiceRoleConfigured,
} from "@/lib/email/config";

let inMemoryLedger: InMemoryEmailDeliveryLedger | null = null;

function getInMemoryLedger(): InMemoryEmailDeliveryLedger {
  if (!inMemoryLedger) {
    inMemoryLedger = new InMemoryEmailDeliveryLedger();
  }
  return inMemoryLedger;
}

/** Resolves the delivery ledger for orchestration. Fails closed when persistent storage is required. */
export function resolveEmailDeliveryLedger(
  override?: EmailDeliveryLedger,
): EmailDeliveryLedger {
  if (override) return override;

  if (isPersistentEmailLedgerRequired()) {
    if (!isSupabaseServiceRoleConfigured()) {
      throw new Error("delivery_ledger_configuration_missing");
    }
    return new SupabaseEmailDeliveryLedger();
  }

  return getInMemoryLedger();
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_DELIVERY_CLAIM_LEASE_MS,
  type DeliveryClaimInput,
  type DeliveryClaimResult,
  type DeliveryLedgerRecord,
  type DeliverySkippedUpdateInput,
  type DeliveryStatusUpdateInput,
  type EmailDeliveryLedger,
} from "@/lib/email/delivery-ledger";

type ClaimRpcRow = {
  claim_status: "claimed" | "reclaimed" | "duplicate" | "in_progress";
  claim_token: string;
  attempt_count: number;
  provider: string;
  provider_message_id: string | null;
  record_status: string;
  result_id: string;
  user_id: string | null;
  claimed_at: string;
  lease_expires_at: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  last_error_code: string | null;
};

function mapRecord(
  idempotencyKey: string,
  emailType: DeliveryClaimInput["emailType"],
  row: ClaimRpcRow,
): DeliveryLedgerRecord {
  return {
    idempotencyKey,
    emailType,
    resultId: row.result_id,
    userId: row.user_id,
    provider: row.provider,
    providerMessageId: row.provider_message_id,
    status: row.record_status as DeliveryLedgerRecord["status"],
    attemptCount: row.attempt_count,
    lastErrorCode: row.last_error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
    claimedAt: row.claimed_at,
    leaseExpiresAt: row.lease_expires_at,
    claimToken: row.claim_token,
  };
}

function leaseSeconds(): number {
  return Math.floor(DEFAULT_DELIVERY_CLAIM_LEASE_MS / 1000);
}

/** Persistent Supabase delivery ledger — service role only. */
export class SupabaseEmailDeliveryLedger implements EmailDeliveryLedger {
  async claim(input: DeliveryClaimInput): Promise<DeliveryClaimResult> {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("claim_email_delivery", {
      p_idempotency_key: input.idempotencyKey,
      p_email_type: input.emailType,
      p_result_id: input.resultId,
      p_user_id: input.userId ?? null,
      p_provider: input.provider,
      p_lease_seconds: leaseSeconds(),
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      throw new Error("delivery_ledger_claim_failed");
    }

    const row = data[0] as ClaimRpcRow;
    const record = mapRecord(input.idempotencyKey, input.emailType, row);
    return { status: row.claim_status, record };
  }

  private async finalize(
    input: DeliveryStatusUpdateInput,
    status: DeliveryLedgerRecord["status"],
  ): Promise<DeliveryLedgerRecord> {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("finalize_email_delivery", {
      p_idempotency_key: input.idempotencyKey,
      p_claim_token: input.claimToken,
      p_status: status,
      p_provider: input.provider,
      p_provider_message_id: input.providerMessageId ?? null,
      p_last_error_code: input.lastErrorCode ?? null,
    });

    if (error) {
      throw new Error("delivery_ledger_finalize_failed");
    }
    if (!data) {
      throw new Error("delivery_ledger_claim_token_mismatch");
    }

    const { data: row, error: readError } = await admin
      .from("email_deliveries")
      .select("*")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (readError || !row) {
      throw new Error("delivery_ledger_record_missing");
    }

    return {
      idempotencyKey: row.idempotency_key,
      emailType: row.email_type,
      resultId: row.result_id,
      userId: row.user_id,
      provider: row.provider,
      providerMessageId: row.provider_message_id,
      status: row.status,
      attemptCount: row.attempt_count,
      lastErrorCode: row.last_error_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sentAt: row.sent_at,
      claimedAt: row.claimed_at,
      leaseExpiresAt: row.lease_expires_at,
      claimToken: row.claim_token,
    };
  }

  async markSent(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.finalize(input, "sent");
  }

  async markFailed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.finalize(input, "failed");
  }

  async markPreviewed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.finalize(input, "previewed");
  }

  async markSkipped(input: DeliverySkippedUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.finalize(input, input.status);
  }
}

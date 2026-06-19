import type { EmailCategory, EmailDeliveryStatus } from "@/lib/email/types";

export type DeliveryLedgerRecord = {
  idempotencyKey: string;
  emailType: EmailCategory;
  resultId: string;
  userId: string | null;
  provider: string;
  providerMessageId: string | null;
  status: EmailDeliveryStatus;
  attemptCount: number;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export type DeliveryClaimInput = {
  idempotencyKey: string;
  emailType: EmailCategory;
  resultId: string;
  userId?: string | null;
  provider: string;
};

export type DeliveryClaimResult =
  | { status: "claimed"; record: DeliveryLedgerRecord }
  | { status: "duplicate"; record: DeliveryLedgerRecord };

export type DeliveryStatusUpdateInput = {
  idempotencyKey: string;
  provider: string;
  providerMessageId?: string | null;
  lastErrorCode?: string | null;
};

export type DeliverySkippedUpdateInput = DeliveryStatusUpdateInput & {
  status: Extract<EmailDeliveryStatus, "skipped_disabled" | "skipped_duplicate" | "skipped_invalid">;
};

/**
 * Atomic duplicate protection contract.
 * Future Supabase implementation must use INSERT ... ON CONFLICT / UNIQUE(idempotency_key).
 */
export interface EmailDeliveryLedger {
  claim(input: DeliveryClaimInput): Promise<DeliveryClaimResult>;
  markSent(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord>;
  markFailed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord>;
  markPreviewed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord>;
  markSkipped(input: DeliverySkippedUpdateInput): Promise<DeliveryLedgerRecord>;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Process-local ledger for tests — not production duplicate protection across instances. */
export class InMemoryEmailDeliveryLedger implements EmailDeliveryLedger {
  private readonly records = new Map<string, DeliveryLedgerRecord>();

  private claimSync(input: DeliveryClaimInput): DeliveryClaimResult {
    const existing = this.records.get(input.idempotencyKey);
    if (existing) {
      return { status: "duplicate", record: existing };
    }

    const now = nowIso();
    const record: DeliveryLedgerRecord = {
      idempotencyKey: input.idempotencyKey,
      emailType: input.emailType,
      resultId: input.resultId,
      userId: input.userId ?? null,
      provider: input.provider,
      providerMessageId: null,
      status: "pending",
      attemptCount: 1,
      lastErrorCode: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    };
    this.records.set(input.idempotencyKey, record);
    return { status: "claimed", record };
  }

  async claim(input: DeliveryClaimInput): Promise<DeliveryClaimResult> {
    return this.claimSync(input);
  }

  private update(
    input: DeliveryStatusUpdateInput,
    status: EmailDeliveryStatus,
  ): DeliveryLedgerRecord {
    const existing = this.records.get(input.idempotencyKey);
    if (!existing) {
      throw new Error("delivery_ledger_record_missing");
    }
    const now = nowIso();
    const next: DeliveryLedgerRecord = {
      ...existing,
      provider: input.provider,
      status,
      providerMessageId: input.providerMessageId ?? existing.providerMessageId,
      lastErrorCode: input.lastErrorCode ?? null,
      attemptCount: existing.attemptCount + 1,
      updatedAt: now,
      sentAt: status === "sent" ? now : existing.sentAt,
    };
    this.records.set(input.idempotencyKey, next);
    return next;
  }

  async markSent(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.update(input, "sent");
  }

  async markFailed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.update(input, "failed");
  }

  async markPreviewed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.update(input, "previewed");
  }

  async markSkipped(input: DeliverySkippedUpdateInput): Promise<DeliveryLedgerRecord> {
    return this.update(input, input.status);
  }
}

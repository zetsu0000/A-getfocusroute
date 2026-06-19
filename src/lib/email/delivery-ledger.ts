import type { EmailCategory, EmailDeliveryStatus } from "@/lib/email/types";

/** Default pending-claim lease — future Supabase must enforce the same window atomically. */
export const DEFAULT_DELIVERY_CLAIM_LEASE_MS = 5 * 60 * 1000;

export type DeliveryLedgerClock = {
  now: () => Date;
};

export type InMemoryEmailDeliveryLedgerOptions = {
  clock?: DeliveryLedgerClock;
  leaseMs?: number;
};

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
  claimedAt: string;
  leaseExpiresAt: string;
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
  | { status: "reclaimed"; record: DeliveryLedgerRecord }
  | { status: "duplicate"; record: DeliveryLedgerRecord }
  | { status: "in_progress"; record: DeliveryLedgerRecord };

export type DeliveryStatusUpdateInput = {
  idempotencyKey: string;
  provider: string;
  providerMessageId?: string | null;
  lastErrorCode?: string | null;
};

export type DeliverySkippedUpdateInput = DeliveryStatusUpdateInput & {
  status: Extract<
    EmailDeliveryStatus,
    "skipped_disabled" | "skipped_duplicate" | "skipped_invalid"
  >;
};

/**
 * Atomic duplicate protection and retry contract.
 *
 * Future Supabase implementation must atomically:
 * - INSERT first claim on unique idempotency_key
 * - reclaim when status = failed OR (status = pending AND lease_expires_at < now())
 * - reject duplicate when status IN (sent, previewed) or pending lease still active
 */
export interface EmailDeliveryLedger {
  claim(input: DeliveryClaimInput): Promise<DeliveryClaimResult>;
  markSent(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord>;
  markFailed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord>;
  markPreviewed(input: DeliveryStatusUpdateInput): Promise<DeliveryLedgerRecord>;
  markSkipped(input: DeliverySkippedUpdateInput): Promise<DeliveryLedgerRecord>;
}

function defaultClock(): DeliveryLedgerClock {
  return { now: () => new Date() };
}

/** Process-local ledger for tests — not production duplicate protection across instances. */
export class InMemoryEmailDeliveryLedger implements EmailDeliveryLedger {
  private readonly records = new Map<string, DeliveryLedgerRecord>();
  private readonly clock: DeliveryLedgerClock;
  private readonly leaseMs: number;

  constructor(options: InMemoryEmailDeliveryLedgerOptions = {}) {
    this.clock = options.clock ?? defaultClock();
    this.leaseMs = options.leaseMs ?? DEFAULT_DELIVERY_CLAIM_LEASE_MS;
  }

  getRecord(idempotencyKey: string): DeliveryLedgerRecord | undefined {
    return this.records.get(idempotencyKey);
  }

  private nowIso(): string {
    return this.clock.now().toISOString();
  }

  private leaseExpiresIso(from: Date): string {
    return new Date(from.getTime() + this.leaseMs).toISOString();
  }

  private createPendingRecord(
    input: DeliveryClaimInput,
    attemptCount: number,
    createdAt: string,
  ): DeliveryLedgerRecord {
    const claimedAt = this.nowIso();
    const nowDate = this.clock.now();
    return {
      idempotencyKey: input.idempotencyKey,
      emailType: input.emailType,
      resultId: input.resultId,
      userId: input.userId ?? null,
      provider: input.provider,
      providerMessageId: null,
      status: "pending",
      attemptCount,
      lastErrorCode: null,
      createdAt,
      updatedAt: claimedAt,
      sentAt: null,
      claimedAt,
      leaseExpiresAt: this.leaseExpiresIso(nowDate),
    };
  }

  private claimSync(input: DeliveryClaimInput): DeliveryClaimResult {
    const existing = this.records.get(input.idempotencyKey);
    const nowDate = this.clock.now();

    if (!existing) {
      const now = this.nowIso();
      const record = this.createPendingRecord(input, 1, now);
      this.records.set(input.idempotencyKey, record);
      return { status: "claimed", record };
    }

    if (existing.status === "sent" || existing.status === "previewed") {
      return { status: "duplicate", record: existing };
    }

    if (existing.status === "failed") {
      const record = this.createPendingRecord(
        input,
        existing.attemptCount + 1,
        existing.createdAt,
      );
      this.records.set(input.idempotencyKey, record);
      return { status: "reclaimed", record };
    }

    if (existing.status === "pending") {
      const leaseActive = nowDate.getTime() < Date.parse(existing.leaseExpiresAt);
      if (leaseActive) {
        return { status: "in_progress", record: existing };
      }

      const record = this.createPendingRecord(
        input,
        existing.attemptCount + 1,
        existing.createdAt,
      );
      this.records.set(input.idempotencyKey, record);
      return { status: "reclaimed", record };
    }

    return { status: "duplicate", record: existing };
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
    const now = this.nowIso();
    const next: DeliveryLedgerRecord = {
      ...existing,
      provider: input.provider,
      status,
      providerMessageId: input.providerMessageId ?? existing.providerMessageId,
      lastErrorCode: input.lastErrorCode ?? null,
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

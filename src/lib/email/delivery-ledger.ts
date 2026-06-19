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

export type DeliveryLedgerUpsertInput = {
  idempotencyKey: string;
  emailType: EmailCategory;
  resultId: string;
  userId?: string | null;
  provider: string;
  status: EmailDeliveryStatus;
  providerMessageId?: string | null;
  lastErrorCode?: string | null;
};

export interface EmailDeliveryLedger {
  findByIdempotencyKey(idempotencyKey: string): Promise<DeliveryLedgerRecord | null>;
  upsert(input: DeliveryLedgerUpsertInput): Promise<DeliveryLedgerRecord>;
}

/** Process-local ledger for tests and pre-migration duplicate protection. */
export class InMemoryEmailDeliveryLedger implements EmailDeliveryLedger {
  private readonly records = new Map<string, DeliveryLedgerRecord>();

  async findByIdempotencyKey(idempotencyKey: string): Promise<DeliveryLedgerRecord | null> {
    return this.records.get(idempotencyKey) ?? null;
  }

  async upsert(input: DeliveryLedgerUpsertInput): Promise<DeliveryLedgerRecord> {
    const existing = this.records.get(input.idempotencyKey);
    const now = new Date().toISOString();
    const next: DeliveryLedgerRecord = {
      idempotencyKey: input.idempotencyKey,
      emailType: input.emailType,
      resultId: input.resultId,
      userId: input.userId ?? null,
      provider: input.provider,
      providerMessageId: input.providerMessageId ?? existing?.providerMessageId ?? null,
      status: input.status,
      attemptCount: (existing?.attemptCount ?? 0) + 1,
      lastErrorCode: input.lastErrorCode ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      sentAt: input.status === "sent" ? now : existing?.sentAt ?? null,
    };
    this.records.set(input.idempotencyKey, next);
    return next;
  }
}

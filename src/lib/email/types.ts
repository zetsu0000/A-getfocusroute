/** Transactional vs marketing — separate delivery paths. */
export type EmailCategory = "transactional" | "marketing";

export type TransactionalEmailType = "transactional";

export type EmailDeliveryStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped_disabled"
  | "skipped_duplicate"
  | "skipped_invalid";

export type FocusFrictionScorePayload = {
  value: number;
  minimum: 0;
  maximum: 100;
};

export type ResultEmailPayload = {
  resultId: string;
  recipientEmail: string;
  recipientName: string | null;
  patternKey: string;
  patternName: string;
  focusFrictionScore: FocusFrictionScorePayload | null;
  resultUrl: string;
  dashboardUrl: string;
  locale: string;
  emailType: TransactionalEmailType;
  idempotencyKey: string;
};

/** Minimal placeholder content for provider adapters — PR 7B supplies final copy. */
export type ResultEmailMessage = {
  subject: string;
  previewText: string;
  textBody: string;
  htmlBody: string;
};

export type SendResultEmailOptions = {
  templateVersion?: string;
  locale?: string;
  category?: EmailCategory;
};

export type SendResultEmailResult = {
  status: EmailDeliveryStatus;
  idempotencyKey: string;
  provider: string;
  providerMessageId?: string | null;
  safeErrorCode?: string | null;
};

export type ResultEmailBuildInput = {
  quizRow: Record<string, unknown>;
  recipientEmail: string;
  recipientName?: string | null;
  locale?: string;
  templateVersion?: string;
  siteOrigin?: string;
};

export type TrustedRecipientSource =
  | { kind: "authenticated_user"; userId: string; email: string }
  | { kind: "persisted_quiz_result"; resultId: string; email: string };

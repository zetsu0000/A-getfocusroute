/** Transactional vs marketing — separate delivery paths. */
export type EmailCategory = "transactional" | "marketing";

export type TransactionalEmailType = "transactional";

export type EmailDeliveryStatus =
  | "pending"
  | "sent"
  | "previewed"
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

/** Non-production placeholder only — PR 7B supplies final copy. */
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
};

/**
 * Server-side recipient sources for transactional result email.
 * Guest submitted email is persisted but not verified as owned.
 */
export type ResultEmailRecipientSource =
  | {
      kind: "authenticated_user";
      userId: string;
      email: string;
    }
  | {
      kind: "submitted_quiz_result_email";
      resultId: string;
      email: string;
      /** Required server-side signal that the user requested this delivery. */
      explicitDeliveryRequest: true;
    };

export type ResultEmailPayloadBuildResult = {
  payload: ResultEmailPayload;
  /** True when stored signature fields disagree with the canonical calculation. */
  patternMismatch: boolean;
};

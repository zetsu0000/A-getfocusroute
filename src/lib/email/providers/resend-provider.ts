import "server-only";

import {
  getResultEmailFromAddress,
  getResultEmailReplyToAddress,
} from "@/lib/email/config";
import type { ResultEmailMessage, ResultEmailPayload } from "@/lib/email/types";
import type { ProviderSendResult, ResultEmailProvider } from "@/lib/email/providers/types";

const RESEND_SEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_REQUEST_TIMEOUT_MS = 10_000;

export type ResendProviderDeps = {
  fetchImpl?: typeof fetch;
  apiKey?: () => string | null;
  fromAddress?: () => string | null;
  replyTo?: () => string | null;
  endpoint?: string;
};

function readApiKey(): string | null {
  const raw = process.env.RESULT_EMAIL_PROVIDER_API_KEY?.trim();
  return raw || null;
}

/**
 * Production Resend transactional adapter.
 * Fails closed when config is missing and never reports a failed send as success.
 * Logs nothing — provider responses can contain recipient PII.
 */
export class ResendResultEmailProvider implements ResultEmailProvider {
  readonly name = "resend";

  private readonly fetchImpl: typeof fetch;
  private readonly apiKey: () => string | null;
  private readonly fromAddress: () => string | null;
  private readonly replyTo: () => string | null;
  private readonly endpoint: string;

  constructor(deps: ResendProviderDeps = {}) {
    this.fetchImpl = deps.fetchImpl ?? fetch;
    this.apiKey = deps.apiKey ?? readApiKey;
    this.fromAddress = deps.fromAddress ?? getResultEmailFromAddress;
    this.replyTo = deps.replyTo ?? getResultEmailReplyToAddress;
    this.endpoint = deps.endpoint ?? RESEND_SEND_ENDPOINT;
  }

  async send(
    payload: ResultEmailPayload,
    message: ResultEmailMessage,
  ): Promise<ProviderSendResult> {
    const apiKey = this.apiKey();
    const from = this.fromAddress();
    if (!apiKey || !from) {
      return { ok: false, safeErrorCode: "provider_config_missing" };
    }

    const replyTo = this.replyTo();
    const requestBody: Record<string, unknown> = {
      from,
      to: [payload.recipientEmail],
      subject: message.subject,
      html: message.htmlBody,
      text: message.textBody,
    };
    if (replyTo) {
      requestBody.reply_to = replyTo;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RESEND_REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          // Resend honours Idempotency-Key for at-most-once delivery on retries.
          "Idempotency-Key": payload.idempotencyKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch {
      return { ok: false, safeErrorCode: "provider_request_failed" };
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return { ok: false, safeErrorCode: `provider_http_${response.status}` };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { ok: false, safeErrorCode: "provider_invalid_response" };
    }

    const id =
      data && typeof data === "object" && typeof (data as { id?: unknown }).id === "string"
        ? (data as { id: string }).id
        : null;
    if (!id) {
      return { ok: false, safeErrorCode: "provider_missing_message_id" };
    }

    return { ok: true, providerMessageId: id };
  }
}

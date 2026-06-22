import "server-only";

import { isResultEmailWebhookEnabled } from "@/lib/email/config";
import {
  parseResendWebhookEvent,
  type ParsedResendEvent,
} from "@/lib/email/webhook/resend-events";
import {
  readSvixHeaders,
  verifyResendWebhookSignature,
} from "@/lib/email/webhook/resend-signature";
import type { EmailWebhookLedger } from "@/lib/email/webhook/webhook-ledger";
import { resolveEmailWebhookLedger } from "@/lib/email/webhook/webhook-ledger-factory";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

const JSON_HEADERS = { "Cache-Control": "no-store" };

export type ResendWebhookDeps = {
  webhookSecret?: () => string | null | undefined;
  webhookEnabled?: () => boolean;
  ledger?: EmailWebhookLedger;
  nowSeconds?: number;
};

function ok(body: Record<string, unknown> = { received: true }): Response {
  return Response.json(body, { status: 200, headers: JSON_HEADERS });
}

function badRequest(): Response {
  // Generic — never disclose which check failed.
  return Response.json({ error: "invalid_webhook" }, { status: 400, headers: JSON_HEADERS });
}

/** Core handler with injectable dependencies for testing. */
export async function processResendWebhook(
  request: Request,
  deps: ResendWebhookDeps = {},
): Promise<Response> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_WEBHOOK_BODY_BYTES) {
    return badRequest();
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return badRequest();
  }
  if (new TextEncoder().encode(body).length > MAX_WEBHOOK_BODY_BYTES) {
    return badRequest();
  }

  const secret = (deps.webhookSecret ?? (() => process.env.RESULT_EMAIL_WEBHOOK_SECRET))();
  const verification = verifyResendWebhookSignature({
    secret,
    payload: body,
    headers: readSvixHeaders(request.headers),
    nowSeconds: deps.nowSeconds,
  });
  if (!verification.ok) {
    return badRequest();
  }

  // Valid signature but feature gate off: acknowledge without mutating state.
  const enabled = (deps.webhookEnabled ?? isResultEmailWebhookEnabled)();
  if (!enabled) {
    return ok({ received: true, disabled: true });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return badRequest();
  }

  const event: ParsedResendEvent | null = parseResendWebhookEvent(parsed);
  if (!event) {
    // Unknown / disallowed event types are acknowledged and ignored.
    return ok({ received: true, ignored: true });
  }

  try {
    const ledger = deps.ledger ?? resolveEmailWebhookLedger();
    const result = await ledger.recordEvent({
      svixId: verification.svixId,
      eventType: event.type,
      providerMessageId: event.providerMessageId,
      occurredAt: new Date().toISOString(),
    });
    return ok({ received: true, result });
  } catch {
    // Signal retry without leaking detail.
    return Response.json(
      { error: "webhook_processing_failed" },
      { status: 500, headers: JSON_HEADERS },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  return processResendWebhook(request);
}

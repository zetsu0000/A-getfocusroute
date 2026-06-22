import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ResendResultEmailProvider } from "@/lib/email/providers/resend-provider";
import type { ResultEmailMessage, ResultEmailPayload } from "@/lib/email/types";

const payload: ResultEmailPayload = {
  resultId: "result-123",
  recipientEmail: "user@example.com",
  recipientName: "Sam",
  patternKey: "Spark",
  patternName: "Fast starts",
  focusFrictionScore: { value: 72, minimum: 0, maximum: 100 },
  resultUrl: "https://www.getfocusroute.com/dashboard/profile",
  dashboardUrl: "https://www.getfocusroute.com/dashboard",
  planUrl: "https://www.getfocusroute.com/assessment",
  locale: "en-US",
  emailType: "transactional",
  idempotencyKey: "result_email:result-123:1",
};

const message: ResultEmailMessage = {
  subject: "Your FocusRoute result is ready",
  previewText: "Preview",
  textBody: "Body",
  htmlBody: "<p>Body</p>",
};

const baseDeps = {
  apiKey: () => "re_test_key",
  fromAddress: () => "FocusRoute <results@mail.getfocusroute.com>",
  replyTo: () => "support@getfocusroute.com",
  endpoint: "https://api.resend.com/emails",
};

describe("ResendResultEmailProvider", () => {
  it("fails closed when the API key is missing", async () => {
    const fetchImpl = vi.fn();
    const provider = new ResendResultEmailProvider({ ...baseDeps, apiKey: () => null, fetchImpl });
    const result = await provider.send(payload, message);
    expect(result).toEqual({ ok: false, safeErrorCode: "provider_config_missing" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed when the from address is missing", async () => {
    const fetchImpl = vi.fn();
    const provider = new ResendResultEmailProvider({ ...baseDeps, fromAddress: () => null, fetchImpl });
    const result = await provider.send(payload, message);
    expect(result).toEqual({ ok: false, safeErrorCode: "provider_config_missing" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends and maps the Resend response id, with auth/idempotency/reply-to wiring", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "resend_msg_1" }), { status: 200 }),
    );
    const provider = new ResendResultEmailProvider({ ...baseDeps, fetchImpl });
    const result = await provider.send(payload, message);

    expect(result).toEqual({ ok: true, providerMessageId: "resend_msg_1" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0]!;
    const headers = init!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_key");
    expect(headers["Idempotency-Key"]).toBe("result_email:result-123:1");
    const body = JSON.parse(init!.body as string);
    expect(body.reply_to).toBe("support@getfocusroute.com");
    expect(body.to).toEqual(["user@example.com"]);
    expect(body.html).toBe("<p>Body</p>");
    expect(body.text).toBe("Body");
  });

  it("does not include reply_to when unset", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "resend_msg_2" }), { status: 200 }),
    );
    const provider = new ResendResultEmailProvider({ ...baseDeps, replyTo: () => null, fetchImpl });
    await provider.send(payload, message);
    const body = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
    expect(body).not.toHaveProperty("reply_to");
  });

  it("reports HTTP errors as failures without throwing", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 422 }));
    const provider = new ResendResultEmailProvider({ ...baseDeps, fetchImpl });
    const result = await provider.send(payload, message);
    expect(result).toEqual({ ok: false, safeErrorCode: "provider_http_422" });
  });

  it("reports transport exceptions as failures, not success", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network exploded user@example.com");
    });
    const provider = new ResendResultEmailProvider({ ...baseDeps, fetchImpl });
    const result = await provider.send(payload, message);
    expect(result).toEqual({ ok: false, safeErrorCode: "provider_request_failed" });
  });

  it("fails when the provider omits a message id", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    const provider = new ResendResultEmailProvider({ ...baseDeps, fetchImpl });
    const result = await provider.send(payload, message);
    expect(result).toEqual({ ok: false, safeErrorCode: "provider_missing_message_id" });
  });
});

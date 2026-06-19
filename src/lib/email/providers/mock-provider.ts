import type { ResultEmailMessage, ResultEmailPayload } from "@/lib/email/types";
import type { ProviderSendResult, ResultEmailProvider } from "@/lib/email/providers/types";

export type MockProviderCall = {
  payload: ResultEmailPayload;
  message: ResultEmailMessage;
};

/** Test/dev adapter — never performs real delivery. */
export class MockResultEmailProvider implements ResultEmailProvider {
  readonly name = "mock";
  readonly calls: MockProviderCall[] = [];

  async send(
    payload: ResultEmailPayload,
    message: ResultEmailMessage,
  ): Promise<ProviderSendResult> {
    this.calls.push({ payload, message });
    return {
      ok: true,
      providerMessageId: `mock_${payload.idempotencyKey}`,
    };
  }
}

/** No-op adapter used when sending is disabled. */
export class NoopResultEmailProvider implements ResultEmailProvider {
  readonly name = "noop";

  async send(): Promise<ProviderSendResult> {
    return { ok: false, safeErrorCode: "provider_disabled" };
  }
}

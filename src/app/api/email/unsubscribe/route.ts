import { recordMarketingUnsubscribe } from "@/lib/email/email-preferences";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

const GENERIC_MESSAGE = "Your preferences have been updated.";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return Response.json({ ok: true, message: "Your preferences have been updated." });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return Response.json({ ok: true, message: "Your preferences have been updated." });
  }

  try {
    await recordMarketingUnsubscribe({
      emailHash: payload.emailHash,
      userId: payload.userId,
      resultId: payload.resultId,
    });
  } catch {
    return Response.json({ ok: true, message: "Your preferences have been updated." });
  }

  return Response.json({ ok: true, message: GENERIC_MESSAGE });
}

export async function POST() {
  return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}

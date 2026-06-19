import { recordMarketingUnsubscribe } from "@/lib/email/email-preferences";
import {
  renderInvalidUnsubscribePage,
  renderUnsubscribeConfirmPage,
  renderUnsubscribeSuccessPage,
} from "@/lib/email/unsubscribe-page";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token || !verifyUnsubscribeToken(token)) {
    return new Response(renderInvalidUnsubscribePage(), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  return new Response(renderUnsubscribeConfirmPage(token), {
    status: 200,
    headers: HTML_HEADERS,
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim();
  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    return new Response(renderInvalidUnsubscribePage(), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  try {
    await recordMarketingUnsubscribe(payload.emailHash);
  } catch {
    return new Response(renderInvalidUnsubscribePage(), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  return new Response(renderUnsubscribeSuccessPage(), {
    status: 200,
    headers: HTML_HEADERS,
  });
}

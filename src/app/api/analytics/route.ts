import { NextResponse } from "next/server";

import {
  FIRST_PARTY_EVENTS,
  META_EVENT_BY_FIRST_PARTY,
  isAllowedFirstPartyEvent,
} from "@/lib/analytics/events";
import {
  cleanString,
  metadataSizeOk,
  recordAnalyticsEvent,
} from "@/lib/analytics/server";
import { sendMetaEvent } from "@/lib/meta/conversions";
import { createClient } from "@/lib/supabase/server";

const CAPI_FORWARDED_EVENTS = new Set<string>([
  FIRST_PARTY_EVENTS.emailSubmitted,
  FIRST_PARTY_EVENTS.quizCompleted,
  FIRST_PARTY_EVENTS.paywallViewed,
  FIRST_PARTY_EVENTS.checkoutIntent,
]);

type AnalyticsRequest = {
  event_name?: unknown;
  anonymous_id?: unknown;
  session_id?: unknown;
  path?: unknown;
  referrer?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  fbclid?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  meta_event_id?: unknown;
  metadata?: unknown;
};

function requestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
  return cleaned.length ? cleaned : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyticsRequest;
    const eventName = cleanString(body.event_name, 120);
    if (!eventName || !isAllowedFirstPartyEvent(eventName)) {
      return NextResponse.json({ error: "invalid event_name" }, { status: 400 });
    }

    const metadata = safeMetadata(body.metadata);
    if (!metadataSizeOk(metadata)) {
      return NextResponse.json({ error: "metadata too large" }, { status: 413 });
    }

    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }

    const event = {
      event_name: eventName,
      anonymous_id: cleanString(body.anonymous_id, 128),
      session_id: cleanString(body.session_id, 128),
      user_id: userId,
      path: cleanString(body.path, 1000),
      referrer: cleanString(body.referrer, 1000),
      utm_source: cleanString(body.utm_source, 200),
      utm_medium: cleanString(body.utm_medium, 200),
      utm_campaign: cleanString(body.utm_campaign, 300),
      utm_content: cleanString(body.utm_content, 300),
      utm_term: cleanString(body.utm_term, 300),
      fbclid: cleanString(body.fbclid, 500),
      fbp: cleanString(body.fbp, 300),
      fbc: cleanString(body.fbc, 600),
      meta_event_id: cleanString(body.meta_event_id, 200),
      metadata: {
        ...metadata,
        user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    };

    await recordAnalyticsEvent(event);

    const metaEventName = META_EVENT_BY_FIRST_PARTY[eventName];
    if (
      metaEventName &&
      CAPI_FORWARDED_EVENTS.has(eventName)
    ) {
      await sendMetaEvent({
        event_name: metaEventName,
        event_id: event.meta_event_id,
        event_source_url: event.path ? new URL(event.path, request.url).toString() : request.url,
        user_data: {
          client_ip_address: requestIp(request),
          client_user_agent: request.headers.get("user-agent"),
          fbp: event.fbp,
          fbc: event.fbc,
        },
        custom_data:
          eventName === FIRST_PARTY_EVENTS.paywallViewed ||
          eventName === FIRST_PARTY_EVENTS.checkoutIntent ||
          eventName === FIRST_PARTY_EVENTS.emailSubmitted
            ? {
                product_key: cleanString(metadata.product_key, 120) || undefined,
                content_name: cleanString(metadata.content_name, 200) || undefined,
                content_ids: stringArray(metadata.content_ids),
                content_type: cleanString(metadata.content_type, 80) || undefined,
                value: numberValue(metadata.value),
                currency: cleanString(metadata.currency, 12) || undefined,
              }
            : undefined,
      });
    }

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}

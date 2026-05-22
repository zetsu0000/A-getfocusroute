import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedFirstPartyEvent } from "@/lib/analytics/events";

export type AnalyticsEventInput = {
  event_name: string;
  anonymous_id?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  path?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  meta_event_id?: string | null;
  metadata?: Record<string, unknown>;
};

const MAX_METADATA_BYTES = 4096;

export function metadataSizeOk(metadata: unknown): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(metadata ?? {})).length <= MAX_METADATA_BYTES;
  } catch {
    return false;
  }
}

export function cleanString(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function recordAnalyticsEvent(
  input: AnalyticsEventInput,
): Promise<void> {
  if (!isAllowedFirstPartyEvent(input.event_name)) return;
  if (!metadataSizeOk(input.metadata ?? {})) return;

  const admin = createAdminClient();
  const { error } = await admin.from("analytics_events").insert({
    event_name: input.event_name,
    anonymous_id: cleanString(input.anonymous_id, 128),
    session_id: cleanString(input.session_id, 128),
    user_id: cleanString(input.user_id, 64),
    path: cleanString(input.path, 1000),
    referrer: cleanString(input.referrer, 1000),
    utm_source: cleanString(input.utm_source, 200),
    utm_medium: cleanString(input.utm_medium, 200),
    utm_campaign: cleanString(input.utm_campaign, 300),
    utm_content: cleanString(input.utm_content, 300),
    utm_term: cleanString(input.utm_term, 300),
    fbclid: cleanString(input.fbclid, 500),
    fbp: cleanString(input.fbp, 300),
    fbc: cleanString(input.fbc, 600),
    meta_event_id: cleanString(input.meta_event_id, 200),
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`analytics_events insert: ${error.message}`);
  }
}

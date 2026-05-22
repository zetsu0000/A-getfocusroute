import "server-only";

import crypto from "node:crypto";

import type { MetaStandardEvent } from "@/lib/analytics/events";

type UserData = {
  client_ip_address?: string | null;
  client_user_agent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  email?: string | null;
};

type CustomData = {
  value?: number | null;
  currency?: string | null;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  product_key?: string;
  [key: string]: unknown;
};

export type MetaConversionEvent = {
  event_name: MetaStandardEvent;
  event_time?: number;
  event_id?: string | null;
  event_source_url?: string | null;
  user_data?: UserData;
  custom_data?: CustomData;
};

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizedEmailHash(email: string | null | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return undefined;
  return sha256(normalized);
}

function cleanObject<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export async function sendMetaEvent(event: MetaConversionEvent): Promise<void> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!accessToken || !pixelId) return;

  const version = process.env.META_CONVERSIONS_API_VERSION || "v23.0";
  const url = `https://graph.facebook.com/${version}/${pixelId}/events`;
  const userData = event.user_data ?? {};

  const payload = {
    data: [
      {
        event_name: event.event_name,
        event_time: event.event_time ?? Math.floor(Date.now() / 1000),
        event_id: event.event_id ?? undefined,
        action_source: "website",
        event_source_url: event.event_source_url ?? undefined,
        user_data: cleanObject({
          client_ip_address: userData.client_ip_address,
          client_user_agent: userData.client_user_agent,
          fbp: userData.fbp,
          fbc: userData.fbc,
          em: normalizedEmailHash(userData.email),
        }),
        custom_data: event.custom_data ? cleanObject(event.custom_data) : undefined,
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
    });
    if (!res.ok && process.env.NODE_ENV === "development") {
      console.warn("[meta/capi] event rejected", res.status);
    }
  } catch {
    // Analytics must never break product UX or webhook processing.
  }
}

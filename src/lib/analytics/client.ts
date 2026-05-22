"use client";

import {
  FIRST_PARTY_EVENTS,
  META_CUSTOM_EVENT_BY_FIRST_PARTY,
  META_EVENT_BY_FIRST_PARTY,
  META_ALLOWED_FIRST_PARTY_EVENTS,
  type FirstPartyEventName,
  type MetaStandardEvent,
} from "@/lib/analytics/events";

type Primitive = string | number | boolean | null;
type AnalyticsMetadata = Record<string, Primitive | Primitive[]>;

type TrackOptions = {
  eventId?: string;
  metadata?: AnalyticsMetadata;
  firstParty?: boolean;
  meta?: boolean;
  metaEventName?: MetaStandardEvent;
};

declare global {
  interface Window {
    fbq?: (command: string, eventName: string, params?: object, options?: object) => void;
    _fbq?: unknown;
  }
}

const ANON_KEY = "focusroute_anonymous_id";
const SESSION_KEY = "focusroute_session_id";
const SESSION_STARTED_KEY = "focusroute_session_started_at";
const UTM_KEY = "focusroute_utm_context";
const SESSION_TTL_MS = 30 * 60 * 1000;

export function createAnalyticsEventId(prefix = "evt"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function setCookie(name: string, value: string, maxAgeDays = 90): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeDays * 86400}; Path=/; SameSite=Lax; Secure`;
}

function getAnonymousId(): string | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  const existing = storage.getItem(ANON_KEY);
  if (existing) return existing;
  const id = createAnalyticsEventId("anon");
  storage.setItem(ANON_KEY, id);
  return id;
}

function getSessionId(): string | null {
  const storage = safeSessionStorage();
  if (!storage) return null;

  const now = Date.now();
  const started = Number(storage.getItem(SESSION_STARTED_KEY) ?? "0");
  const existing = storage.getItem(SESSION_KEY);
  if (existing && started && now - started < SESSION_TTL_MS) {
    storage.setItem(SESSION_STARTED_KEY, String(now));
    return existing;
  }

  const id = createAnalyticsEventId("sess");
  storage.setItem(SESSION_KEY, id);
  storage.setItem(SESSION_STARTED_KEY, String(now));
  return id;
}

function readUtmContext(): Record<string, string | null> {
  const storage = safeLocalStorage();
  const url = new URL(window.location.href);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  const current = Object.fromEntries(keys.map((key) => [key, url.searchParams.get(key)]));
  const hasNewCampaign = Object.values(current).some(Boolean);

  if (hasNewCampaign && storage) {
    storage.setItem(UTM_KEY, JSON.stringify(current));
  }

  if (!hasNewCampaign && storage) {
    try {
      const saved = JSON.parse(storage.getItem(UTM_KEY) ?? "{}") as Record<string, string | null>;
      return { ...current, ...saved };
    } catch {
      return current;
    }
  }

  return current;
}

function ensureFbc(fbclid: string | null): string | null {
  const existing = getCookie("_fbc");
  if (existing) return existing;
  if (!fbclid) return null;
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  setCookie("_fbc", fbc);
  return fbc;
}

export function getAnalyticsContext() {
  if (typeof window === "undefined") return {};
  const campaign = readUtmContext();
  const fbclid = campaign.fbclid;
  return {
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    ...campaign,
    fbp: getCookie("_fbp"),
    fbc: ensureFbc(fbclid),
  };
}

function safeMetadata(metadata?: AnalyticsMetadata): AnalyticsMetadata {
  if (!metadata) return {};
  const entries = Object.entries(metadata).filter(([, value]) => {
    if (value === null) return true;
    if (["string", "number", "boolean"].includes(typeof value)) return true;
    return Array.isArray(value) && value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item));
  });
  return Object.fromEntries(entries) as AnalyticsMetadata;
}

function sendFirstParty(eventName: FirstPartyEventName, eventId: string, metadata: AnalyticsMetadata): void {
  const body = JSON.stringify({
    event_name: eventName,
    meta_event_id: eventId,
    ...getAnalyticsContext(),
    metadata,
  });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      if (sent) return;
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Ignore analytics failures.
  }
}

function fireMetaPixel(
  eventName: FirstPartyEventName,
  eventId: string,
  metadata: AnalyticsMetadata,
  override?: MetaStandardEvent,
): void {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || !window.fbq) return;
  if (!META_ALLOWED_FIRST_PARTY_EVENTS.has(eventName)) return;

  const standard = override ?? META_EVENT_BY_FIRST_PARTY[eventName];
  const custom = META_CUSTOM_EVENT_BY_FIRST_PARTY[eventName];
  const params = { ...metadata };
  const options = { eventID: eventId };

  try {
    if (standard) window.fbq("track", standard, params, options);
    if (custom) window.fbq("trackCustom", custom, params, options);
  } catch {
    // Ignore pixel failures.
  }
}

export function trackEvent(eventName: FirstPartyEventName, options: TrackOptions = {}): string {
  const eventId = options.eventId ?? createAnalyticsEventId(eventName);
  const metadata = safeMetadata(options.metadata);
  if (options.firstParty !== false) {
    sendFirstParty(eventName, eventId, metadata);
  }
  if (options.meta !== false) {
    fireMetaPixel(eventName, eventId, metadata, options.metaEventName);
  }
  return eventId;
}

export function trackPageView(): void {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || !window.fbq) return;
  const eventId = createAnalyticsEventId("pageview");
  try {
    window.fbq("track", "PageView", {}, { eventID: eventId });
  } catch {
    // Ignore pixel failures.
  }
}

export function pageEventForPath(pathname: string): FirstPartyEventName | null {
  if (pathname === "/") return FIRST_PARTY_EVENTS.homepageView;
  if (pathname === "/assessment") return FIRST_PARTY_EVENTS.assessmentView;
  if (pathname === "/roadmap") return FIRST_PARTY_EVENTS.roadmapLandingViewed;
  if (pathname === "/dashboard") return FIRST_PARTY_EVENTS.dashboardViewed;
  if (pathname === "/dashboard/profile") return FIRST_PARTY_EVENTS.profileOpened;
  if (pathname === "/dashboard/bonuses") return FIRST_PARTY_EVENTS.bonusOpened;
  return null;
}

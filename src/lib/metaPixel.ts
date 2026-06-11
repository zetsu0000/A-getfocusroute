"use client";

export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "CompleteRegistration"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type MetaEventData = {
  value?: number | null;
  currency?: string | null;
  content_name?: string | null;
  content_ids?: string[] | string | null;
  content_type?: string | null;
  num_items?: number | null;
  product_key?: string | null;
  funnel_step?: string | null;
  signature_key?: string | null;
  [key: string]: unknown;
};

type Fbq = (
  command: "init" | "track" | "trackCustom",
  eventNameOrPixelId: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: unknown;
    __focusrouteMetaPixelInitialized?: string;
    __focusrouteMetaPixelPageViews?: Record<string, true>;
  }
}

const DEFAULT_CURRENCY = "USD";
const SENSITIVE_QUERY_PARAMS = new Set([
  "email",
  "phone",
  "telefone",
  "cpf",
  "name",
  "nome",
]);

function pixelId(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
}

function canTrackMarketing(): boolean {
  if (typeof window === "undefined") return false;
  // No project consent manager is currently present. If one is added later,
  // wire its marketing opt-in here before loading or firing Meta events.
  return true;
}

function currentUrlHasSensitiveQuery(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return Array.from(params.keys()).some((key) =>
    SENSITIVE_QUERY_PARAMS.has(key.toLowerCase()),
  );
}

function cleanEventData(data: MetaEventData = {}): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    params[key] = value;
  }
  if (!params.currency && typeof params.value === "number") {
    params.currency = DEFAULT_CURRENCY;
  }
  return params;
}

export function getMetaPixelBootstrapCode(id = pixelId()): string {
  const safePixelId = id.replace(/[^0-9]/g, "");
  if (!safePixelId) return "";

  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${safePixelId}');
window.__focusrouteMetaPixelInitialized='${safePixelId}';
`;
}

export function initMetaPixel(id = pixelId()): void {
  if (typeof window === "undefined" || !id || !canTrackMarketing()) return;
  if (window.__focusrouteMetaPixelInitialized === id) return;
  window.fbq?.("init", id);
  window.__focusrouteMetaPixelInitialized = id;
}

function trackMetaEvent(
  eventName: MetaStandardEvent,
  data?: MetaEventData,
  eventId?: string,
): boolean {
  if (
    typeof window === "undefined" ||
    !pixelId() ||
    !canTrackMarketing() ||
    currentUrlHasSensitiveQuery()
  ) {
    return false;
  }
  const fbq = window.fbq;
  if (!fbq) return false;

  try {
    fbq("track", eventName, cleanEventData(data), eventId ? { eventID: eventId } : undefined);
    return true;
  } catch {
    // Pixel failures must never affect checkout or product UX.
    return false;
  }
}

export function trackPageView(routeKey?: string, eventId?: string, retryCount = 0): void {
  if (typeof window === "undefined") return;
  if (currentUrlHasSensitiveQuery()) return;
  const key = routeKey ?? `${window.location.pathname}${window.location.search}`;
  window.__focusrouteMetaPixelPageViews ??= {};
  if (window.__focusrouteMetaPixelPageViews[key]) return;
  if (trackMetaEvent("PageView", {}, eventId)) {
    window.__focusrouteMetaPixelPageViews[key] = true;
    return;
  }

  if (retryCount < 20) {
    window.setTimeout(() => {
      if (!window.__focusrouteMetaPixelPageViews?.[key]) {
        trackPageView(key, eventId, retryCount + 1);
      }
    }, 100);
  }
}

export function trackViewContent(data: MetaEventData, eventId?: string): void {
  trackMetaEvent("ViewContent", data, eventId);
}

export function trackLead(data: MetaEventData, eventId?: string): void {
  trackMetaEvent("Lead", data, eventId);
}

export function trackCompleteRegistration(data: MetaEventData, eventId?: string): void {
  trackMetaEvent("CompleteRegistration", data, eventId);
}

export function trackAddToCart(data: MetaEventData, eventId?: string): void {
  trackMetaEvent("AddToCart", data, eventId);
}

export function trackInitiateCheckout(data: MetaEventData, eventId?: string): void {
  trackMetaEvent("InitiateCheckout", data, eventId);
}

export function trackPurchase(data: MetaEventData, eventId?: string): void {
  trackMetaEvent("Purchase", data, eventId);
}

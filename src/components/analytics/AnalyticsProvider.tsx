"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { pageEventForPath, trackEvent, trackPageView } from "@/lib/analytics/client";
import { getMetaPixelBootstrapCode, initMetaPixel } from "@/lib/metaPixel";

function RouteAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams.toString();
    const routeKey = qs ? `${pathname}?${qs}` : pathname;
    if (lastTracked.current === routeKey) return;
    lastTracked.current = routeKey;

    trackPageView(routeKey);
    const pageEvent = pageEventForPath(pathname);
    if (pageEvent) trackEvent(pageEvent, { meta: true });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const bootstrapCode = pixelId ? getMetaPixelBootstrapCode(pixelId) : "";

  return (
    <>
      {bootstrapCode ? (
        <>
          <Script
            id="meta-pixel-loader"
            strategy="afterInteractive"
            onReady={() => initMetaPixel(pixelId)}
            dangerouslySetInnerHTML={{
              __html: bootstrapCode,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- Meta Pixel noscript fallback. */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}
      <Suspense fallback={null}>
        <RouteAnalyticsInner />
      </Suspense>
    </>
  );
}

"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { pageEventForPath, trackEvent, trackPageView } from "@/lib/analytics/client";

function RouteAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams.toString();
    const routeKey = qs ? `${pathname}?${qs}` : pathname;
    if (lastTracked.current === routeKey) return;
    lastTracked.current = routeKey;

    trackPageView();
    const pageEvent = pageEventForPath(pathname);
    if (pageEvent) trackEvent(pageEvent, { meta: true });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {pixelId ? (
        <>
          <Script
            id="meta-pixel-loader"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
              `,
            }}
          />
        </>
      ) : null}
      <Suspense fallback={null}>
        <RouteAnalyticsInner />
      </Suspense>
    </>
  );
}

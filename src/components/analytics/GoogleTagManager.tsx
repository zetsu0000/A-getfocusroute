"use client";

import Script from "next/script";

/**
 * Google Tag Manager loader.
 *
 * - Renders nothing unless NEXT_PUBLIC_GTM_ID is set (server + client agree, so
 *   no hydration mismatch).
 * - `afterInteractive` so it never blocks rendering.
 * - The GTM snippet seeds `window.dataLayer`, and our `dataLayer.ts` helper also
 *   guards `dataLayer = dataLayer || []`, so events pushed before GTM finishes
 *   loading are preserved and replayed by GTM.
 * - GA4 is configured *inside* GTM (no hardcoded GA4 here). Configure GA4
 *   page_view via GTM's History Change trigger to cover App Router navigations.
 * - Single instance mounted in the root layout — no duplicate scripts.
 */
export function GoogleTagManager() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!gtmId) return null;

  return (
    <>
      <Script
        id="gtm-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}

"use client";

import Script from "next/script";

/**
 * Microsoft Clarity loader.
 *
 * - Renders nothing unless NEXT_PUBLIC_CLARITY_ID is set (server + client agree,
 *   so no hydration mismatch).
 * - `afterInteractive` so it never blocks rendering and loads independently of
 *   Meta Pixel and GTM (no shared globals, no conflict).
 * - We never call `clarity("set", ...)` or otherwise feed Clarity personal data;
 *   Clarity's own input masking handles form fields. Nothing PII is sent here.
 */
export function MicrosoftClarity() {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();
  if (!clarityId) return null;

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`,
      }}
    />
  );
}

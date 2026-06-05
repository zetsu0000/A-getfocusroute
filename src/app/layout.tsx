import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { MotionProvider } from "@/components/providers/MotionProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const BASE_URL = "https://getfocusroute.com";
const TITLE    = "FocusRoute — Understand How Your Focus Works";
const DESC     = "Take a guided assessment to understand your focus patterns, friction points, and next best step. FocusRoute is for self-understanding and productivity support, not diagnosis.";
const OG_ALT   = "FocusRoute — Understand how your focus works.";

export const metadata: Metadata = {
  title: {
    default:  TITLE,
    template: "%s | FocusRoute",
  },
  description: DESC,
  metadataBase: new URL(BASE_URL),
  applicationName: "FocusRoute",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:       TITLE,
    description: DESC,
    url:         BASE_URL,
    siteName:    "FocusRoute",
    locale:      "en_US",
    type:        "website",
    images: [
      {
        url:    "/opengraph-image",
        width:  1200,
        height: 630,
        alt:    OG_ALT,
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESC,
    images:      ["/opengraph-image"],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`light ${jakarta.variable}`}>
      <body className={jakarta.className}>
        <GoogleTagManager />
        <MicrosoftClarity />
        <SchemaMarkup />
        <AnalyticsProvider />
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
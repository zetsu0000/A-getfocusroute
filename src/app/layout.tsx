import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { BRAIN_OS } from "@/lib/positioning";

/*
 * Plus Jakarta Sans — a modern, friendly, highly legible sans-serif.
 * Ideal for health & wellness apps: professional but approachable.
 * Weights 400 (body), 600 (labels), 700 (sub-headings), 800 (display).
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const BASE_URL = "https://getfocusroute.com";
const TITLE    = `${BRAIN_OS.lineTm} · Personalized ADHD Profile`;
const DESC     = "You're not lazy. Your brain needs a different operating system. Map your cognitive profile and unlock a personalized 28-day protocol.";

export const metadata: Metadata = {
  title: {
    default:  TITLE,
    template: "%s · FocusRoute",
  },
  description: DESC,
  metadataBase: new URL(BASE_URL),
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
        alt:    `${BRAIN_OS.lineTm} · Personalized ADHD Profile`,
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
    <html lang="pt-BR" className={`light ${jakarta.variable}`}>
      <body className={jakarta.className}><SchemaMarkup /><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}

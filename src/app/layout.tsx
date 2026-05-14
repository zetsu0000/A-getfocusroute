import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "FocusRoute – Free ADHD Test",
  description: "Discover your ADHD profile in 3 minutes and receive a personalized management guide.",
  metadataBase: new URL("https://getfocusroute.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "FocusRoute – Free ADHD Test",
    description: "Discover your ADHD profile in 3 minutes and receive a personalized management guide.",
    url: "https://getfocusroute.com",
    siteName: "FocusRoute",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusRoute – Free ADHD Test",
    description: "Discover your ADHD profile in 3 minutes and receive a personalized management guide.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`light ${jakarta.variable}`}>
      <body className={jakarta.className}>{children}</body>
    </html>
  );
}

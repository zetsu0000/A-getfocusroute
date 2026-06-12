import type { Metadata } from "next";
import HomeV2 from "@/components/v2/home/HomeV2";

export const metadata: Metadata = {
  title: {
    absolute: "FocusRoute — Understand How Your Focus Works",
  },
  description:
    "A guided assessment and Brain Profile to help you understand your focus patterns, friction points, and next best step.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FocusRoute — Understand How Your Focus Works",
    description:
      "A guided assessment and Brain Profile to help you understand your focus patterns, friction points, and next best step.",
    url: "/",
    type: "website",
  },
  twitter: {
    title: "FocusRoute — Understand How Your Focus Works",
    description:
      "A guided assessment and Brain Profile to help you understand your focus patterns, friction points, and next best step.",
  },
};

export default function HomePage() {
  return <HomeV2 />;
}

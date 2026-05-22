import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "Free Focus Assessment — Find Your Focus Pattern | FocusRoute";
const DESC  = "Take the free 3-minute FocusRoute assessment to map your focus patterns, friction points, and next best step. Private results. Not a diagnosis.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/assessment" },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "/assessment",
    type: "website",
  },
  twitter: {
    title: TITLE,
    description: DESC,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
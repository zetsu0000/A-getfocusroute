import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "About FocusRoute — A Better Map for Focus";
const DESC  = "FocusRoute helps people understand how their focus starts, stalls, and recovers through a guided Brain Profile and practical next-step tools.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/about" },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "/about",
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
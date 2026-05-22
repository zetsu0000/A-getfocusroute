import type { Metadata } from "next";
import type { ReactNode } from "react";

const TITLE = "28-Day Focus Protocol | FocusRoute";
const DESC  = "Turn your Brain Profile into a 28-day focus system with guided daily actions, reflection prompts, and practical next steps.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/roadmap" },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "/roadmap",
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
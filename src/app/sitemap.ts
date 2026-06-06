import type { MetadataRoute } from "next";

const SITE_URL = "https://getfocusroute.com";

type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const PUBLIC_ROUTES: SitemapEntry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/assessment", priority: 0.8, changeFrequency: "weekly" },
  { path: "/roadmap", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "weekly" },
  { path: "/learn", priority: 0.8, changeFrequency: "weekly" },
  { path: "/learn/types-of-adhd", priority: 0.5, changeFrequency: "monthly" },
  { path: "/learn/adhd-symptoms-in-adults", priority: 0.5, changeFrequency: "monthly" },
  { path: "/learn/adhd-assessment-guide", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.5, changeFrequency: "monthly" },
  { path: "/refund-policy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/disclaimer", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

import type { MetadataRoute } from "next";

const SITE_URL = "https://getfocusroute.com";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",              priority: 1.0, changeFrequency: "weekly"  },
  { path: "/assessment",    priority: 0.9, changeFrequency: "weekly"  },
  { path: "/roadmap",       priority: 0.8, changeFrequency: "weekly"  },
  { path: "/about",         priority: 0.7, changeFrequency: "monthly" },
  { path: "/how-it-works",  priority: 0.6, changeFrequency: "monthly" },
  { path: "/learn",         priority: 0.6, changeFrequency: "monthly" },
  { path: "/learn/types-of-adhd",         priority: 0.5, changeFrequency: "monthly" },
  { path: "/learn/adhd-symptoms-in-adults", priority: 0.5, changeFrequency: "monthly" },
  { path: "/learn/adhd-assessment-guide", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy",       priority: 0.3, changeFrequency: "yearly"  },
  { path: "/terms",         priority: 0.3, changeFrequency: "yearly"  },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly"  },
  { path: "/disclaimer",    priority: 0.3, changeFrequency: "yearly"  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_ROUTES.map((r) => ({
    url: SITE_URL + r.path,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
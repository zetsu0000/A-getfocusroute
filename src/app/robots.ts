import type { MetadataRoute } from "next";

const SITE_URL = "https://getfocusroute.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/api",
          "/api/",
          "/auth",
          "/auth/",
          "/login",
          "/verify",
          "/signatures-showcase",
        ],
      },
    ],
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}
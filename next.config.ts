import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const SECURITY_HEADERS = [
  // Prevent clickjacking
  { key: "X-Frame-Options",        value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Restrict referrer information
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Cross-Origin Opener Policy — prevents cross-origin window access
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // Restrict powerful features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  experimental: {
    // Inline all CSS into <style> tags instead of separate <link> files.
    // This eliminates the render-blocking CSS chunk (FCP/LCP gain of ~190 ms
    // on slow 4G) and is ideal for Tailwind because the generated bundle is
    // small (~4 KiB) and this site has mostly first-time visitors.
    inlineCss: true,
  },

  async redirects() {
    return [
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.getfocusroute.com" }],
        destination: "https://getfocusroute.com/:path*",
        permanent:   true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default bundleAnalyzer(nextConfig);

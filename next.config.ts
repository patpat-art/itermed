import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/** Security headers aligned with Vercel / OWASP recommendations. */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  compiler: isProduction
    ? {
        removeConsole: { exclude: ["error", "warn"] },
      }
    : undefined,
  async redirects() {
    return [
      { source: "/dashboard/decks", destination: "/dashboard/cases", permanent: true },
      { source: "/dashboard/decks/:path*", destination: "/dashboard/cases", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/billing/webhook",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;

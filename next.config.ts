import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// CSP intentionally omitted for now: requires nonce strategy for Next.js inline scripts.
const isDeploymentProduction =
  process.env.APP_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.CONTEXT === "production";

if (isDeploymentProduction) {
  const forbidden = ["DEV_AUTH_BYPASS", "DEV_TOKEN_GRANT_ENABLED", "NEXT_PUBLIC_DEV_AUTH_BYPASS"].filter(
    (name) => process.env[name] === "true"
  );
  if (forbidden.length) {
    throw new Error(`Production cannot enable development flags: ${forbidden.join(", ")}`);
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      {
        source: "/partner/dashboard",
        destination: "/partner",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

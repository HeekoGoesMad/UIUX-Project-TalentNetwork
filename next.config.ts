import type { NextConfig } from "next";

const isDeploymentProduction = process.env.APP_ENV === "production" || process.env.VERCEL_ENV === "production" || process.env.CONTEXT === "production";

if (isDeploymentProduction) {
  const forbidden = ["NEXT_PUBLIC_DEV_AUTH_BYPASS", "DEV_TOKEN_GRANT_ENABLED"]
    .filter((name) => process.env[name] === "true");
  if (forbidden.length) {
    throw new Error(`Production cannot enable development flags: ${forbidden.join(", ")}`);
  }
}

const nextConfig: NextConfig = {
  // This app uses middleware, App Router API handlers, and dynamic routes.
  // Keep the default server build; do not switch this to a static export.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/recruiter/dashboard", permanent: false },
      { source: "/search", destination: "/recruiter/discover", permanent: false },
      { source: "/shortlist", destination: "/recruiter/shortlists", permanent: false },
      { source: "/talent/:candidateId", destination: "/recruiter/discover/:candidateId", permanent: false },
      { source: "/profile", destination: "/candidate/profile", permanent: false },
    ];
  },
};

export default nextConfig;

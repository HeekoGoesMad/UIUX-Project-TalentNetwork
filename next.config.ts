import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

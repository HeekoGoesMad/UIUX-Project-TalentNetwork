/**
 * Demo seed data for local testing.
 * This provides a fully-filled candidate profile that can be loaded
 * without Supabase or any database connection.
 *
 * Usage: only active in demo/dev mode (no Supabase configured).
 */

import type { AppState, CvProfile, DemoUser } from "@/types";

export const DEMO_CANDIDATE_USER: DemoUser = {
  role: "candidate",
  provisioningStatus: "active",
  email: "nadia@proofylink.dev",
  name: "Nadia Putri Rahayu",
};

export const DEMO_CANDIDATE_CV: CvProfile = {
  id: "demo-candidate-cv-001",
  fullName: "Nadia Putri Rahayu",
  headline: "Senior Product Designer | UX Research & Design Systems | Fintech & E-Commerce",
  about:
    "Product designer dengan 5+ tahun pengalaman merancang pengalaman digital yang berdampak di industri fintech dan e-commerce. " +
    "Spesialisasi dalam UX research, design systems, dan kolaborasi cross-functional dengan tim engineering & product. " +
    "Berpengalaman memimpin proyek dari discovery hingga launch, dengan track record meningkatkan konversi dan kepuasan pengguna.",
  location: "Jakarta Selatan, DKI Jakarta",
  email: "nadia@proofylink.dev",
  phone: "0812-3456-7890",
  skills: [
    "Product Design",
    "UX Research",
    "User Testing",
    "Information Architecture",
    "Interaction Design",
    "Design Systems",
    "Prototyping",
    "Wireframing",
    "Visual Design",
    "Accessibility (WCAG)",
  ],
  tools: [
    "Figma",
    "FigJam",
    "Notion",
    "Jira",
    "Maze",
    "Hotjar",
    "Google Analytics",
    "Miro",
    "Zeplin",
    "Storybook",
  ],
  industries: ["product-design", "technology-software"],
  experience: [
    {
      company: "Tokopedia (GoTo Group)",
      role: "Senior Product Designer",
      dates: "Feb 2022 — Sekarang",
      achievements: [
        "Memimpin redesign alur checkout utama yang meningkatkan conversion rate sebesar 28% dan mengurangi drop-off 15% dalam 3 bulan post-launch.",
        "Membangun Design System 3.0 (300+ komponen) bersama 4 engineer frontend, mempercepat delivery sprint rata-rata 35%.",
        "Menjalankan 12 sesi usability testing per kuartal dengan 60+ partisipan, menghasilkan 40+ actionable insight untuk roadmap produk.",
        "Mentoring 2 junior designer dalam program internal accelerator design.",
      ],
    },
    {
      company: "OVO (Lippo Digital Indonesia)",
      role: "Product Designer",
      dates: "Jun 2020 — Jan 2022",
      achievements: [
        "Merancang ulang fitur transfer & pembayaran yang melayani 50+ juta pengguna aktif, meningkatkan task completion rate dari 71% ke 89%.",
        "Berkolaborasi dengan tim data science untuk mengintegrasikan personalisasi AI dalam rekomendasi fitur (CTR naik 22%).",
        "Menjadi PIC Design untuk proyek OVO PayLater — dari 0 ke launch dalam 4 bulan.",
      ],
    },
    {
      company: "Studio Nusantara (Design Agency)",
      role: "UI/UX Designer",
      dates: "Aug 2019 — May 2020",
      achievements: [
        "Mengerjakan proyek desain untuk 8 klien (startup & korporasi) mencakup mobile app, dashboard, dan landing page.",
        "Memenangkan pitch desain untuk klien FMCG senilai Rp 450 juta.",
      ],
    },
  ],
  education: [
    {
      school: "Universitas Indonesia",
      program: "S1 Desain Komunikasi Visual",
      dates: "2015 — 2019",
    },
    {
      school: "Google UX Design Certificate",
      program: "Professional Certificate — Coursera",
      dates: "2020",
    },
  ],
  certifications: [
    "Google UX Design Certificate (2020)",
    "Nielsen Norman Group UX Certification (2022)",
    "WCAG 2.1 Accessibility Specialist (2023)",
  ],
  portfolio: [
    "https://nadiaprd.design",
    "https://figma.com/community/@nadiaprd",
    "https://linkedin.com/in/nadia-putri-rahayu",
    "https://behance.net/nadiaprd",
  ],
  targetRole: "Senior Product Designer",
  workArrangement: "hybrid",
  openToWork: true,
  careerStatus: "open-to-work",
  updatedAt: new Date().toISOString(),
};

export const DEMO_APP_STATE: Partial<AppState> = {
  tokens: 25,
  screeningTokens: 3,
  previewsUsed: 0,
  scans: [],
  shortlisted: [],
  notes: {},
  recentlyViewed: [],
  screeningConsents: {},
  screeningResults: {},
  contactRequests: {},
  cvProfile: DEMO_CANDIDATE_CV,
  careerStatus: "open-to-work",
};

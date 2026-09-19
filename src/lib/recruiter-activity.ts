export type RecruiterActivityType =
  | "profile_viewed"
  | "profile_saved"
  | "message_received"
  | "interview_invited"
  | "assessment_invited";

export type RecruiterActivity = {
  id: string;
  type: RecruiterActivityType;
  companyName: string;
  companyInitial: string;
  companyIndustry: string;
  recruiterName: string;
  recruiterRole: string;
  targetRole?: string;
  title: string;
  snippet?: string;
  metadata?: {
    scheduledAt?: string;
    durationMinutes?: number;
    meetingUrl?: string;
    meetingType?: "online" | "offline";
    location?: string;
    assessmentId?: string;
    assessmentTitle?: string;
    conversationId?: string;
    shortlistName?: string;
  };
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
};

const STORAGE_KEY = "proofylink-candidate-recruiter-activities-v1";

export const INITIAL_DEMO_ACTIVITIES: RecruiterActivity[] = [
  {
    id: "act-001",
    type: "interview_invited",
    companyName: "PT GoTo Gojek Tokopedia Tbk",
    companyInitial: "GT",
    companyIndustry: "Teknologi & Layanan Digital",
    recruiterName: "Bambang Wicaksono",
    recruiterRole: "Senior Talent Acquisition Specialist",
    targetRole: "Senior Product Designer - Consumer Payments",
    title: "Undangan Wawancara Kompetensi Teknis & Portofolio",
    snippet: "Tim Product Design ingin mendiskusikan studi kasus checkout flow dan arsitektur design system yang Anda cantumkan di profil.",
    metadata: {
      scheduledAt: "2026-09-24T14:00:00.000+07:00",
      durationMinutes: 45,
      meetingType: "online",
      meetingUrl: "https://meet.google.com/goto-des-7821",
    },
    createdAt: "2026-09-18T10:15:00.000+07:00",
    isRead: false,
    actionUrl: "/candidate/messages",
  },
  {
    id: "act-002",
    type: "message_received",
    companyName: "PT Bank Central Asia Tbk",
    companyInitial: "BCA",
    companyIndustry: "Perbankan & Jasa Keuangan",
    recruiterName: "Rina Setyowati",
    recruiterRole: "Human Capital Lead - Digital Banking",
    targetRole: "Lead UX Researcher (MyBCA Squad)",
    title: "Peluang Karier Digital Experience MyBCA",
    snippet: "Halo Nadia, kami melihat rekam jejak riset Anda pada produk fintech. Apakah Anda terbuka untuk mendiskusikan peluang kepemimpinan riset di ekosistem baru kami?",
    metadata: {
      conversationId: "conv-bca-001",
    },
    createdAt: "2026-09-17T16:30:00.000+07:00",
    isRead: false,
    actionUrl: "/candidate/messages",
  },
  {
    id: "act-003",
    type: "assessment_invited",
    companyName: "PT Telkom Indonesia Tbk",
    companyInitial: "TLK",
    companyIndustry: "Telekomunikasi & Solusi Digital",
    recruiterName: "Dimas Anggara",
    recruiterRole: "Technical Talent Lead - Leap Digital",
    targetRole: "Product Thinking & Systems Architect",
    title: "Undangan Tes Asesmen: Product Thinking Check-in",
    snippet: "Asesmen singkat terstruktur (2 pertanyaan, ~20 menit) untuk memvalidasi pendekatan pemecahan masalah dan prioritisasi fitur sebelum tahap wawancara panel.",
    metadata: {
      assessmentId: "demo-invitation-1",
      assessmentTitle: "Product thinking check-in",
      durationMinutes: 20,
    },
    createdAt: "2026-09-16T11:00:00.000+07:00",
    isRead: true,
    actionUrl: "/candidate/assessments/demo-invitation-1",
  },
  {
    id: "act-004",
    type: "profile_saved",
    companyName: "PT Astra International Tbk",
    companyInitial: "AST",
    companyIndustry: "Konglomerasi & Otomotif",
    recruiterName: "Siti Rahmawati",
    recruiterRole: "Talent Sourcing Manager",
    targetRole: "Design System Lead",
    title: "Profil disimpan ke Talent Pool",
    snippet: "Profil Anda telah ditambahkan ke dalam daftar shortlist 'Astra Digital Hub — Q4 Key Hires'.",
    metadata: {
      shortlistName: "Astra Digital Hub — Q4 Key Hires",
    },
    createdAt: "2026-09-15T09:20:00.000+07:00",
    isRead: true,
  },
  {
    id: "act-005",
    type: "profile_viewed",
    companyName: "PT Blibli.com (Global Digital Niaga)",
    companyInitial: "BLI",
    companyIndustry: "E-Commerce & Logistik",
    recruiterName: "Kevin Chandra",
    recruiterRole: "Tech Recruiter",
    targetRole: "Staff Product Designer",
    title: "Profil lengkap Anda telah dilihat",
    snippet: "Rekruter meninjau riwayat pengalaman kerja, verifikasi kampus, dan portofolio interaktif Anda melalui pencarian bakat terverifikasi ProofyLink.",
    createdAt: "2026-09-14T14:45:00.000+07:00",
    isRead: true,
  },
  {
    id: "act-006",
    type: "profile_viewed",
    companyName: "PT Mandiri Sekuritas",
    companyInitial: "MAN",
    companyIndustry: "Pasar Modal & Investasi",
    recruiterName: "Dewi Lestari",
    recruiterRole: "Senior Recruiter",
    targetRole: "UI/UX Specialist",
    title: "Profil lengkap Anda telah dilihat",
    snippet: "Rekruter meninjau ringkasan profil dan skor kredibilitas kandidat untuk kebutuhan inisiatif platform investasi retail.",
    createdAt: "2026-09-12T08:10:00.000+07:00",
    isRead: true,
  },
];

export function listCandidateActivities(): RecruiterActivity[] {
  if (typeof window === "undefined") return INITIAL_DEMO_ACTIVITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ACTIVITIES));
      return INITIAL_DEMO_ACTIVITIES;
    }
    return JSON.parse(raw) as RecruiterActivity[];
  } catch {
    return INITIAL_DEMO_ACTIVITIES;
  }
}

export function markCandidateActivityAsRead(id: string): RecruiterActivity[] {
  if (typeof window === "undefined") return INITIAL_DEMO_ACTIVITIES;
  try {
    const current = listCandidateActivities();
    const next = current.map((item) => (item.id === id ? { ...item, isRead: true } : item));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return INITIAL_DEMO_ACTIVITIES;
  }
}

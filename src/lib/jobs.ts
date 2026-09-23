export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "temporary"] as const;
export const WORK_ARRANGEMENTS = ["onsite", "hybrid", "remote"] as const;
export const JOB_STATUSES = ["draft", "published", "closed", "archived"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];

export const EXPERIENCE_LEVELS = [
  "fresh_graduate",
  "1_3_years",
  "3_5_years",
  "5_10_years",
  "more_than_10_years",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EDUCATION_LEVELS = [
  "any",
  "sma_smk",
  "diploma",
  "bachelor",
  "master",
  "doctorate",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const JOB_CATEGORIES = [
  "engineering_it",
  "design_creative",
  "product_management",
  "marketing_pr",
  "sales_business_dev",
  "operations_hr",
  "finance_accounting",
  "customer_success",
  "other",
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export type JobRequirement = { id: string; type: "required" | "preferred"; name: string };

export type JobOrganization = {
  id?: string;
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  officeAddress?: string | null;
  city?: string | null;
  province?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  industry?: string | null;
  companyScale?: string | null;
  verificationStatus?: string | null;
};

export type Job = {
  id: string;
  organizationId?: string;
  organizationName: string;
  title: string;
  description: string;
  status: JobStatus;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  location: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requirements: JobRequirement[];
  // Kompensasi & Gaji (Ala Glints)
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: "monthly" | "hourly" | "yearly" | string;
  isSalaryNegotiable?: boolean;
  hideSalary?: boolean;
  // Kriteria & Spesifikasi
  experienceLevel?: ExperienceLevel | string | null;
  minEducation?: EducationLevel | string | null;
  jobCategory?: JobCategory | string | null;
  // Deskripsi Terstruktur & Tunjangan
  responsibilities?: string | null;
  qualifications?: string | null;
  benefits?: string[] | null;
  vacanciesCount?: number | null;
  expiresAt?: string | null;
  // Profil Perusahaan Lengkap
  organization?: JobOrganization | null;
};

export const employmentLabels: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Kontrak",
  internship: "Magang",
  temporary: "Freelance / Harian",
};

export const arrangementLabels: Record<WorkArrangement, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const statusLabels: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

export const experienceLabels: Record<ExperienceLevel, string> = {
  fresh_graduate: "Fresh Graduate / < 1 Tahun",
  "1_3_years": "1 — 3 Tahun",
  "3_5_years": "3 — 5 Tahun",
  "5_10_years": "5 — 10 Tahun",
  more_than_10_years: "Lebih dari 10 Tahun",
};

export const educationLabels: Record<EducationLevel, string> = {
  any: "Semua Jurusan / Bebas",
  sma_smk: "SMA / SMK Sederajat",
  diploma: "Diploma (D3 / D4)",
  bachelor: "Sarjana (S1)",
  master: "Magister (S2)",
  doctorate: "Doktor (S3)",
};

export const categoryLabels: Record<JobCategory, string> = {
  engineering_it: "Software & IT Engineering",
  design_creative: "Desain UI/UX & Kreatif",
  product_management: "Manajemen Produk",
  marketing_pr: "Pemasaran, Digital & PR",
  sales_business_dev: "Penjualan & Business Dev",
  operations_hr: "Operasional & Human Resources",
  finance_accounting: "Keuangan & Akuntansi",
  customer_success: "Layanan Pelanggan & Support",
  other: "Lainnya",
};

export const COMMON_BENEFITS = [
  "BPJS Ketenagakerjaan",
  "BPJS Kesehatan",
  "Asuransi Kesehatan Swasta",
  "Jam Kerja Fleksibel",
  "Laptop & Fasilitas Kerja",
  "Tunjangan Transportasi",
  "Bonus Kinerja / THR",
  "Cuti Berbayar & Cuti Melahirkan",
  "Pelatihan & Sertifikasi Profesional",
  "Snack & Minuman Gratis di Kantor",
  "Kegiatan Gathering Tim & Outing",
  "Diskon Produk & Keanggotaan Gym",
];

export function formatSalaryDisplay(job: Partial<Job>): string {
  if (job.hideSalary) {
    return "Gaji Kompetitif (Dirahasiakan)";
  }
  const min = job.salaryMin;
  const max = job.salaryMax;
  const period =
    job.salaryPeriod === "yearly"
      ? "/ thn"
      : job.salaryPeriod === "hourly"
      ? "/ jam"
      : "/ bln";

  if (!min && !max) {
    return "Gaji Kompetitif / Nego";
  }

  const formatRp = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  let baseStr = "";
  if (min && max) {
    baseStr = `${formatRp(min)} — ${formatRp(max)} ${period}`;
  } else if (min) {
    baseStr = `Mulai ${formatRp(min)} ${period}`;
  } else if (max) {
    baseStr = `Hingga ${formatRp(max)} ${period}`;
  }

  if (job.isSalaryNegotiable) {
    baseStr += " (Nego)";
  }
  return baseStr;
}

export const DEMO_JOBS: Job[] = [
  {
    id: "demo-job-product-designer",
    organizationId: "org-demo-nusantara",
    organizationName: "PT Nusantara Teknologi Kreatif",
    title: "Senior Product Designer (UI/UX)",
    description:
      "Kami mencari Senior Product Designer yang antusias memimpin eksplorasi antarmuka dan riset pengguna untuk ekosistem platform rekrutmen terverifikasi generasi baru. Anda akan berkolaborasi langsung dengan Head of Product dan Engineering Lead.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Jakarta Selatan, DKI Jakarta",
    publishedAt: "2026-08-10T08:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-08T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
    salaryMin: 12000000,
    salaryMax: 18000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "3_5_years",
    minEducation: "bachelor",
    jobCategory: "design_creative",
    responsibilities:
      "• Memimpin proses perancangan desain antarmuka end-to-end (wireframing, prototyping, high-fidelity UI).\n• Mengembangkan dan mengelola Design System berbasis Tailwind CSS dan Figma tokens.\n• Melakukan usability testing rutin dan wawancara kandidat maupun rekruter.\n• Berkolaborasi bersama Product Manager dan Tech Lead dalam mendefinisikan roadmap fitur kuartalan.",
    qualifications:
      "• Minimal 3 tahun pengalaman kerja profesional sebagai UI/UX atau Product Designer di industri SaaS/Tech.\n• Mahir menggunakan Figma (Auto-layout, Components, Variables, Interactive Prototyping).\n• Memiliki portofolio studi kasus produk B2B atau B2C yang nyata dan terukur dampaknya.\n• Terbiasa berkolaborasi dengan engineer menggunakan metodologi Scrum/Agile.",
    benefits: [
      "BPJS Kesehatan & Ketenagakerjaan",
      "Asuransi Kesehatan Swasta (Termasuk Rawat Inap & Jalan)",
      "Jam Kerja Fleksibel & WFH 2 Hari Seminggu",
      "MacBook Pro M-Series & Tunjangan Monitor",
      "Tunjangan Pembelajaran & Kursus Desain Rp 5.000.000 / tahun",
      "Annual Wellness Allowance & Membership Gym",
    ],
    vacanciesCount: 2,
    expiresAt: "2026-10-31T23:59:59.000Z",
    organization: {
      id: "org-demo-nusantara",
      name: "PT Nusantara Teknologi Kreatif",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80",
      description:
        "PT Nusantara Teknologi Kreatif adalah pionir pengembang solusi SDM dan verified talent discovery terdepan di Indonesia. Didirikan sejak tahun 2021, kami telah melayani lebih dari 150+ perusahaan enterprise dan rintisan.",
      industry: "Technology",
      companyScale: "51-200 Karyawan",
      officeAddress: "Gedung Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said Kav. X-5 No. 13, Kuningan Timur",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      companyEmail: "careers@nusantaralabs.id",
      companyPhone: "+62 21 5290 8899",
      website: "https://nusantaralabs.id",
      linkedinUrl: "https://linkedin.com/company/nusantara-labs",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-1", type: "required", name: "Product Design" },
      { id: "demo-req-2", type: "required", name: "Figma" },
      { id: "demo-req-3", type: "required", name: "Design System" },
      { id: "demo-req-4", type: "preferred", name: "UX Research" },
      { id: "demo-req-5", type: "preferred", name: "Tailwind CSS Basic" },
    ],
  },
  {
    id: "demo-job-growth-engineer",
    organizationId: "org-demo-karya",
    organizationName: "PT Karya Digital Gemilang",
    title: "Fullstack Engineer (React & Node.js)",
    description:
      "Bangun interface yang cepat, aman, dan accessible untuk platform talenta generasi berikutnya dengan Next.js App Router, TypeScript, PostgreSQL, dan Supabase.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "remote",
    location: "Bandung, Jawa Barat (Remote Seluruh Indonesia)",
    publishedAt: "2026-08-06T08:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-05T08:00:00.000Z",
    updatedAt: "2026-08-06T08:00:00.000Z",
    salaryMin: 10000000,
    salaryMax: 16000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: false,
    hideSalary: false,
    experienceLevel: "1_3_years",
    minEducation: "diploma",
    jobCategory: "engineering_it",
    responsibilities:
      "• Mengembangkan fitur web frontend dan backend microservices menggunakan Next.js dan Node.js.\n• Memastikan performa aplikasi web dengan skor Core Web Vitals tinggi dan waktu muat minimal.\n• Menulis database migration, query relasional Drizzle ORM, dan pengujian integrasi.\n• Menjaga keamanan data kandidat sesuai standar regulasi privasi data.",
    qualifications:
      "• Minimal 1-3 tahun pengalaman dalam pengembangan aplikasi berbasis TypeScript / React / Node.js.\n• Memahami arsitektur App Router Next.js, Server Components, dan REST/GraphQL APIs.\n• Pengalaman bekerja dengan database SQL (PostgreSQL, MySQL).\n• Terbiasa menggunakan Git, CI/CD pipeline, dan Docker containerization.",
    benefits: [
      "100% Kerja Remote dari Mana Saja (WFA)",
      "BPJS Kesehatan & Ketenagakerjaan Penuh",
      "Tunjangan Internet & Fasilitas Listrik Bulanan",
      "THR & Bonus Proyek Tahunan",
      "Cuti Tahunan Fleksibel 15 Hari",
    ],
    vacanciesCount: 3,
    expiresAt: "2026-11-15T23:59:59.000Z",
    organization: {
      id: "org-demo-karya",
      name: "PT Karya Digital Gemilang",
      logoUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
      description:
        "PT Karya Digital Gemilang berfokus pada rekayasa perangkat lunak modern untuk transformasi digital di sektor finansial dan ketenagakerjaan.",
      industry: "Financial Services",
      companyScale: "11-50 Karyawan",
      officeAddress: "Dago Tech Hub Lt. 4, Jl. Ir. H. Juanda No. 128",
      city: "Bandung",
      province: "Jawa Barat",
      companyEmail: "halo@karyadigital.id",
      companyPhone: "+62 22 201 4455",
      website: "https://karyadigital.id",
      linkedinUrl: "https://linkedin.com/company/karya-digital-gemilang",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-6", type: "required", name: "React" },
      { id: "demo-req-7", type: "required", name: "TypeScript" },
      { id: "demo-req-8", type: "required", name: "Next.js" },
      { id: "demo-req-9", type: "preferred", name: "PostgreSQL" },
      { id: "demo-req-10", type: "preferred", name: "Tailwind CSS" },
    ],
  },
];

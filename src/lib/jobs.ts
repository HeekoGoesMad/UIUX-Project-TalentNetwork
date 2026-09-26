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

export function formatOfficeAddress(
  address?: string | null,
  city?: string | null,
  province?: string | null
): string {
  let cleanAddr = address?.trim() || "";
  cleanAddr = cleanAddr.replace(/,\s*$/, "");
  const cleanCity = city?.trim().replace(/,\s*$/, "") || "";
  const cleanProv = province?.trim().replace(/,\s*$/, "") || "";

  if (!cleanAddr && !cleanCity && !cleanProv) return "-";
  if (!cleanAddr) {
    return [cleanCity, cleanProv].filter(Boolean).join(", ");
  }

  const parts = [cleanAddr];
  const lowerAddr = cleanAddr.toLowerCase();

  if (cleanCity && !lowerAddr.includes(cleanCity.toLowerCase())) {
    parts.push(cleanCity);
  }

  const lowerCity = cleanCity.toLowerCase();
  if (
    cleanProv &&
    !lowerAddr.includes(cleanProv.toLowerCase()) &&
    !lowerCity.includes(cleanProv.toLowerCase())
  ) {
    parts.push(cleanProv);
  }

  return parts.join(", ");
}

export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return "-";
  const trimmed = phone.trim();
  if (trimmed.includes(" ") || trimmed.includes("-")) return trimmed;
  if (trimmed.startsWith("+62")) {
    const digits = trimmed.slice(3);
    if (digits.length <= 8) return `+62 ${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `+62 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `+62 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return trimmed;
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
  {
    id: "demo-job-lead-backend",
    organizationId: "org-demo-fintek",
    organizationName: "PT Artha Solusi Finansial",
    title: "Lead Backend Engineer (Golang / Microservices)",
    description:
      "Artha Solusi Finansial membuka kesempatan bagi Lead Backend Engineer untuk memimpin arsitektur sistem payment gateway bervolume tinggi, settlement terdistribusi, dan kepatuhan standar PCI-DSS.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Jakarta Pusat, DKI Jakarta",
    publishedAt: "2026-08-12T09:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-11T09:00:00.000Z",
    updatedAt: "2026-08-12T09:00:00.000Z",
    salaryMin: 22000000,
    salaryMax: 32000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "5_10_years",
    minEducation: "bachelor",
    jobCategory: "engineering_it",
    responsibilities:
      "• Merancang arsitektur microservices performa tinggi dengan Golang, Kafka, dan Redis.\n• Memimpin tim backend beranggotakan 6 engineer dan membimbing best practice code review.\n• Menjamin zero-downtime deployment dan ketahanan SLA 99.99% transaksi pembayaran.",
    qualifications:
      "• Minimal 5 tahun pengalaman backend development, dengan minimal 3 tahun intensif Golang.\n• Pengalaman solid mengelola Kafka message broker, distributed locks, dan PostgreSQL tuning.\n• Pemahaman mendalam mengenai arsitektur event-driven dan microservices.",
    benefits: [
      "Asuransi Kesehatan Keluarga (Termasuk Anak & Pasangan)",
      "Stock Options / ESOP Alokasi Tahunan",
      "Tunjangan Transportasi & Parkir Eksekutif",
      "Bonus Kinerja Tahunan hingga 3x Gaji",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-11-30T23:59:59.000Z",
    organization: {
      id: "org-demo-fintek",
      name: "PT Artha Solusi Finansial",
      logoUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80",
      description: "Platform infrastruktur pembayaran digital dan agregator finansial B2B terlisensi Bank Indonesia.",
      industry: "Financial Services",
      companyScale: "201-500 Karyawan",
      officeAddress: "Pacific Century Place Lt. 24, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      companyEmail: "recruitment@arthasolusi.co.id",
      companyPhone: "+62 21 5150 1200",
      website: "https://arthasolusi.co.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-11", type: "required", name: "Golang" },
      { id: "demo-req-12", type: "required", name: "Microservices" },
      { id: "demo-req-13", type: "required", name: "Apache Kafka" },
      { id: "demo-req-14", type: "preferred", name: "PostgreSQL" },
      { id: "demo-req-15", type: "preferred", name: "Docker & K8s" },
    ],
  },
  {
    id: "demo-job-data-scientist",
    organizationId: "org-demo-logistik",
    organizationName: "PT Logistik Cerdas Nusantara",
    title: "Senior AI / Machine Learning Engineer",
    description:
      "Kembangkan model prediksi rute armada, estimasi waktu pengiriman real-time, dan deteksi anomali pergudangan dengan machine learning terapan dan LLM pipeline.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "remote",
    location: "Surabaya, Jawa Timur (Remote Indonesia)",
    publishedAt: "2026-08-14T07:30:00.000Z",
    closedAt: null,
    createdAt: "2026-08-13T07:30:00.000Z",
    updatedAt: "2026-08-14T07:30:00.000Z",
    salaryMin: 18000000,
    salaryMax: 26000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "3_5_years",
    minEducation: "bachelor",
    jobCategory: "engineering_it",
    responsibilities:
      "• Membangun dan melatih model optimasi logistik menggunakan Python, PyTorch, dan Scikit-learn.\n• Mengintegrasikan model ML ke API serving latensi rendah (FastAPI, Triton Server).\n• Memonitor data drift dan pipeline retraining otomatis di cloud environment.",
    qualifications:
      "• Minimal 3 tahun pengalaman di bidang Machine Learning / Data Science production.\n• Menguasai Python ekosistem, Pandas, NumPy, Scikit-Learn, PyTorch, dan MLOps tools.\n• Memiliki portofolio pemecahan masalah algoritma optimasi rute atau NLP.",
    benefits: [
      "100% Remote WFA & Flexible Working Hours",
      "Tunjangan Pembelian Hardware / Cloud Compute Credit",
      "Asuransi Rawat Inap & Rawat Jalan Mandiri Inhealth",
      "Cuti Bersama Ekstra 5 Hari",
    ],
    vacanciesCount: 2,
    expiresAt: "2026-11-20T23:59:59.000Z",
    organization: {
      id: "org-demo-logistik",
      name: "PT Logistik Cerdas Nusantara",
      logoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80",
      description: "Penyedia logistik pihak ketiga (3PL) berbasis AI dengan jaringan lebih dari 80 warehouse di seluruh Indonesia.",
      industry: "Logistics & Supply Chain",
      companyScale: "501-1000 Karyawan",
      officeAddress: "Jl. Margomulyo Indah Blok H-7, Tandes",
      city: "Surabaya",
      province: "Jawa Timur",
      companyEmail: "hr@logistikcerdas.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-16", type: "required", name: "Python" },
      { id: "demo-req-17", type: "required", name: "PyTorch" },
      { id: "demo-req-18", type: "required", name: "MLOps" },
      { id: "demo-req-19", type: "preferred", name: "FastAPI" },
      { id: "demo-req-20", type: "preferred", name: "Docker" },
    ],
  },
  {
    id: "demo-job-product-manager",
    organizationId: "org-demo-edutech",
    organizationName: "PT Belajar Pintar Media",
    title: "Product Manager (Talent & Assessment Ecosystem)",
    description:
      "Pimpin perumusan visi produk dari discovery hingga deliverable fitur assessment kompetensi mahasiswa dan matching peluang magang nasional.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "onsite",
    location: "Yogyakarta, D.I. Yogyakarta",
    publishedAt: "2026-08-15T10:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-14T10:00:00.000Z",
    updatedAt: "2026-08-15T10:00:00.000Z",
    salaryMin: 11000000,
    salaryMax: 17000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "3_5_years",
    minEducation: "bachelor",
    jobCategory: "product_management",
    responsibilities:
      "• Menulis PRD (Product Requirement Document) detail dengan metrik kesuksesan terukur.\n• Memimpin sprint planning bersama squad engineer dan product designer.\n• Menganalisis funnel konversi pengguna dan mengiterasi fitur berbasis data analitik.",
    qualifications:
      "• Berpengalaman 3+ tahun sebagai Product Manager di ekosistem Edutech atau HR-Tech.\n• Kemampuan komunikasi lintas divisi yang lugas dan berorientasi solusi.\n• Terbiasa dengan tools analitik produk (Mixpanel, PostHog, atau Amplitude).",
    benefits: [
      "Lingkungan Kerja Santai & Kreatif di Kota Pendidikan",
      "Makan Siang Katering Harian Disediakan",
      "BPJS Kesehatan & Ketenagakerjaan",
      "Fasilitas Pembelajaran Online Terbuka Sepuasnya",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-10-25T23:59:59.000Z",
    organization: {
      id: "org-demo-edutech",
      name: "PT Belajar Pintar Media",
      logoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop&q=80",
      description: "Platform teknologi edukasi dan sertifikasi keterampilan siap kerja nomor satu di Jawa Tengah dan DIY.",
      industry: "Education Technology",
      companyScale: "51-200 Karyawan",
      officeAddress: "Jl. Kaliurang Km 5.2 No. 19, Depok, Sleman",
      city: "Sleman",
      province: "D.I. Yogyakarta",
      companyEmail: "talent@belajarpintar.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-21", type: "required", name: "Product Roadmap" },
      { id: "demo-req-22", type: "required", name: "Data Analytics" },
      { id: "demo-req-23", type: "required", name: "Agile / Scrum" },
      { id: "demo-req-24", type: "preferred", name: "User Research" },
    ],
  },
  {
    id: "demo-job-devops-engineer",
    organizationId: "org-demo-nusantara",
    organizationName: "PT Nusantara Teknologi Kreatif",
    title: "Cloud Infrastructure & DevOps Engineer",
    description:
      "Kelola infrastruktur multi-region Kubernetes, CI/CD automated pipeline, dan zero-trust observability stack untuk mendukung jutaan verifikasi kredensial.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Jakarta Selatan, DKI Jakarta",
    publishedAt: "2026-08-16T11:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-15T11:00:00.000Z",
    updatedAt: "2026-08-16T11:00:00.000Z",
    salaryMin: 14000000,
    salaryMax: 21000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "3_5_years",
    minEducation: "bachelor",
    jobCategory: "engineering_it",
    responsibilities:
      "• Mengonfigurasi dan memelihara klaster Kubernetes (EKS/GKE) menggunakan Terraform.\n• Mengotomatisasi deployment release dengan GitHub Actions dan ArgoCD.\n• Memonitor sistem dengan Prometheus, Grafana, dan centralized logging.",
    qualifications:
      "• Minimal 3 tahun pengalaman mengelola infrastruktur cloud (AWS / GCP / Azure).\n• Mahir Terraform (IaC), Docker, Kubernetes, Linux sysadmin, dan Bash scripting.\n• Memahami security hardening, IAM policy, dan disaster recovery testing.",
    benefits: [
      "Fasilitas Laptop Kerja High-Spec & Monitor 4K",
      "Asuransi Kesehatan Swasta Premium",
      "Budget Ujian Sertifikasi Cloud (AWS/CKA) Reimbursable",
      "Subsidi Pulsa & Internet Bulanan",
    ],
    vacanciesCount: 2,
    expiresAt: "2026-11-10T23:59:59.000Z",
    organization: {
      id: "org-demo-nusantara",
      name: "PT Nusantara Teknologi Kreatif",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      description: "Pionir pengembang solusi SDM dan verified talent discovery terdepan di Indonesia.",
      industry: "Technology",
      companyScale: "51-200 Karyawan",
      officeAddress: "Gedung Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said Kav. X-5 No. 13",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      companyEmail: "careers@nusantaralabs.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-25", type: "required", name: "Kubernetes" },
      { id: "demo-req-26", type: "required", name: "Terraform" },
      { id: "demo-req-27", type: "required", name: "CI/CD Pipeline" },
      { id: "demo-req-28", type: "preferred", name: "AWS / GCP" },
      { id: "demo-req-29", type: "preferred", name: "Prometheus" },
    ],
  },
  {
    id: "demo-job-qa-automation",
    organizationId: "org-demo-karya",
    organizationName: "PT Karya Digital Gemilang",
    title: "QA Automation Engineer (Playwright & TypeScript)",
    description:
      "Pastikan kualitas dan kehandalan aplikasi web ProofyLink dengan merancang skenario automated E2E testing, API integration testing, dan performance benchmark.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "remote",
    location: "Bandung, Jawa Barat (Remote WFA)",
    publishedAt: "2026-08-17T08:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-16T08:00:00.000Z",
    updatedAt: "2026-08-17T08:00:00.000Z",
    salaryMin: 9000000,
    salaryMax: 14000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "1_3_years",
    minEducation: "diploma",
    jobCategory: "engineering_it",
    responsibilities:
      "• Menulis script automated test Playwright berbasis TypeScript untuk seluruh alur pengguna utama.\n• Mengembangkan test automation untuk REST API dan integrasi webhook.\n• Mengelola test report otomatis dalam pipeline CI/CD GitHub Actions.",
    qualifications:
      "• Minimal 1-3 tahun pengalaman dalam automated testing web UI.\n• Menguasai Playwright atau Cypress dengan bahasa TypeScript / JavaScript.\n• Teliti dan memiliki pemahaman mendalam tentang bug lifecycle.",
    benefits: [
      "100% WFA Fleksibel Seluruh Indonesia",
      "BPJS Lengkap & Tunjangan Rawat Jalan",
      "THR & Bonus Tahunan",
    ],
    vacanciesCount: 2,
    expiresAt: "2026-11-15T23:59:59.000Z",
    organization: {
      id: "org-demo-karya",
      name: "PT Karya Digital Gemilang",
      logoUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80",
      description: "Rekayasa perangkat lunak modern untuk transformasi digital finansial dan ketenagakerjaan.",
      industry: "Financial Services",
      companyScale: "11-50 Karyawan",
      officeAddress: "Dago Tech Hub Lt. 4, Jl. Ir. H. Juanda No. 128",
      city: "Bandung",
      province: "Jawa Barat",
      companyEmail: "halo@karyadigital.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-30", type: "required", name: "Playwright" },
      { id: "demo-req-31", type: "required", name: "TypeScript" },
      { id: "demo-req-32", type: "required", name: "API Testing" },
      { id: "demo-req-33", type: "preferred", name: "CI/CD" },
    ],
  },
  {
    id: "demo-job-mobile-flutter",
    organizationId: "org-demo-retail",
    organizationName: "PT Retail Solusi Mandiri",
    title: "Mobile Application Developer (Flutter / iOS / Android)",
    description:
      "Kembangkan aplikasi mobile POS dan loyalty merchant modern dengan Flutter, arsitektur clean BLoC, dan integrasi offline-first SQLite database.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "onsite",
    location: "Tangerang, Banten",
    publishedAt: "2026-08-18T08:30:00.000Z",
    closedAt: null,
    createdAt: "2026-08-17T08:30:00.000Z",
    updatedAt: "2026-08-18T08:30:00.000Z",
    salaryMin: 10000000,
    salaryMax: 15000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "1_3_years",
    minEducation: "diploma",
    jobCategory: "engineering_it",
    responsibilities:
      "• Membangun dan merilis aplikasi Flutter multi-platform (Android & iOS) ke Google Play Store & Apple App Store.\n• Mengimplementasikan state management BLoC/Riverpod dan navigasi clean architecture.\n• Menghubungkan BLE (Bluetooth Low Energy) untuk printer kasir dan scanner barcode.",
    qualifications:
      "• Minimal 2 tahun pengalaman pengembangan mobile app menggunakan Dart & Flutter framework.\n• Pernah mempublikasikan minimal 1 aplikasi ke App Store atau Play Store.\n• Memahami offline persistence, background sync, dan push notification (FCM).",
    benefits: [
      "Kantor Modern di Kawasan BSD City",
      "Tunjangan Kesehatan & BPJS Lengkap",
      "Bonus Tahunan & Insentif Kinerja",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-11-10T23:59:59.000Z",
    organization: {
      id: "org-demo-retail",
      name: "PT Retail Solusi Mandiri",
      logoUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80",
      description: "Penyedia platform point-of-sale dan automasi inventori untuk 10.000+ ritel UMKM di Indonesia.",
      industry: "Retail & Commerce",
      companyScale: "51-200 Karyawan",
      officeAddress: "Green Office Park 9, BSD City, Cisauk",
      city: "Tangerang",
      province: "Banten",
      companyEmail: "karir@retailsolusi.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-34", type: "required", name: "Flutter" },
      { id: "demo-req-35", type: "required", name: "Dart" },
      { id: "demo-req-36", type: "required", name: "REST API" },
      { id: "demo-req-37", type: "preferred", name: "BLoC State" },
    ],
  },
  {
    id: "demo-job-content-marketing",
    organizationId: "org-demo-edutech",
    organizationName: "PT Belajar Pintar Media",
    title: "Content Marketing & Social Media Specialist",
    description:
      "Rancang strategi konten edukasi karir di TikTok, LinkedIn, dan Instagram yang engaging untuk memotivasi generasi muda menemukan potensi terbaiknya.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Yogyakarta, D.I. Yogyakarta",
    publishedAt: "2026-08-19T09:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-18T09:00:00.000Z",
    updatedAt: "2026-08-19T09:00:00.000Z",
    salaryMin: 5500000,
    salaryMax: 8500000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "fresh_graduate",
    minEducation: "diploma",
    jobCategory: "marketing_pr",
    responsibilities:
      "• Memproduksi video pendek (Reels, TikTok, Shorts) bertema tips karir dan pembuatan CV profesional.\n• Menulis artikel blog SEO bertema pengembangan talenta dan tips wawancara kerja.\n• Mengelola jadwal editorial dan menganalisis engagement rate setiap kanal distribusi.",
    qualifications:
      "• Fresh graduate atau 1 tahun pengalaman di bidang Content Creation / Digital Marketing.\n• Kreatif, komunikatif di depan kamera, dan mahir editing video (CapCut/Premiere).\n• Memahami tren algoritma media sosial dan tone-of-voice Gen Z.",
    benefits: [
      "Studio Konten Lengkap dengan Perlengkapan Kamera & Audio Profesional",
      "Tunjangan Komunikasi & Transportasi",
      "Lingkungan Kerja Suportif & Ramah Fresh Graduate",
    ],
    vacanciesCount: 2,
    expiresAt: "2026-10-31T23:59:59.000Z",
    organization: {
      id: "org-demo-edutech",
      name: "PT Belajar Pintar Media",
      logoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop&q=80",
      description: "Platform teknologi edukasi dan sertifikasi keterampilan siap kerja nomor satu di Jawa Tengah dan DIY.",
      industry: "Education Technology",
      companyScale: "51-200 Karyawan",
      officeAddress: "Jl. Kaliurang Km 5.2 No. 19, Depok, Sleman",
      city: "Sleman",
      province: "D.I. Yogyakarta",
      companyEmail: "talent@belajarpintar.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-38", type: "required", name: "Social Media Strategy" },
      { id: "demo-req-39", type: "required", name: "Video Editing" },
      { id: "demo-req-40", type: "required", name: "Copywriting" },
      { id: "demo-req-41", type: "preferred", name: "SEO Basic" },
    ],
  },
  {
    id: "demo-job-frontend-specialist",
    organizationId: "org-demo-nusantara",
    organizationName: "PT Nusantara Teknologi Kreatif",
    title: "Senior Frontend Engineer (Next.js & Performance)",
    description:
      "Optimalkan Core Web Vitals, implementasikan micro-interactions yang presisi, dan kembangkan komponen UI modular dengan Tailwind CSS dan Radix Primitives.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "remote",
    location: "Jakarta Selatan, DKI Jakarta (Remote Indonesia)",
    publishedAt: "2026-08-20T10:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
    salaryMin: 14000000,
    salaryMax: 22000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "3_5_years",
    minEducation: "bachelor",
    jobCategory: "engineering_it",
    responsibilities:
      "• Membangun web application responsif yang accessible (WCAG AA compliant) dengan Next.js App Router.\n• Melakukan audit rendering performance, bundle size optimization, dan image asset pipeline.\n• Mengembangkan shared design token components bersama tim Design System.",
    qualifications:
      "• Minimal 3 tahun pengalaman intensif membangun web frontend dengan TypeScript & React.\n• Pemahaman mendalam mengenai RSC (React Server Components), hydration, dan streaming SSR.\n• Memiliki mata tajam untuk detail visual, spacing rhythm, dan keindahan antarmuka pengguna.",
    benefits: [
      "100% WFA dari Seluruh Indonesia",
      "Peralatan Kerja M-Series MacBook & 4K External Display",
      "Asuransi Kesehatan Swasta Premium (Keluarga)",
      "Budget Langganan AI Tools & Kursus Frontend Master",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-11-20T23:59:59.000Z",
    organization: {
      id: "org-demo-nusantara",
      name: "PT Nusantara Teknologi Kreatif",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
      description: "Pionir pengembang solusi SDM dan verified talent discovery terdepan di Indonesia.",
      industry: "Technology",
      companyScale: "51-200 Karyawan",
      officeAddress: "Gedung Cyber 2 Tower Lt. 18, Jl. H.R. Rasuna Said Kav. X-5 No. 13",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      companyEmail: "careers@nusantaralabs.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-42", type: "required", name: "Next.js App Router" },
      { id: "demo-req-43", type: "required", name: "TypeScript" },
      { id: "demo-req-44", type: "required", name: "Tailwind CSS" },
      { id: "demo-req-45", type: "preferred", name: "Web Accessibility (a11y)" },
    ],
  },
  {
    id: "demo-job-hr-generalist",
    organizationId: "org-demo-fintek",
    organizationName: "PT Artha Solusi Finansial",
    title: "HR & People Operations Specialist",
    description:
      "Kelola operasional SDM, onboarding talenta baru, administrasi benefit karyawan, dan bantu ciptakan kultur kerja kolaboratif yang inklusif di lingkungan fintech.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "onsite",
    location: "Jakarta Pusat, DKI Jakarta",
    publishedAt: "2026-08-21T09:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-21T09:00:00.000Z",
    salaryMin: 8000000,
    salaryMax: 12000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "1_3_years",
    minEducation: "bachelor",
    jobCategory: "operations_hr",
    responsibilities:
      "• Mengelola end-to-end employee onboarding dan program orientasi budaya perusahaan.\n• Memfasilitasi kepatuhan BPJS Ketenagakerjaan, BPJS Kesehatan, dan pelaporan ketenagakerjaan resmi.\n• Mengkoordinasikan program engagement karyawan rutin, team building, dan performance review.",
    qualifications:
      "• Minimal 2 tahun pengalaman kerja di bidang People Operations atau HR Generalist.\n• Lulusan S1 Psikologi, Manajemen SDM, Hukum, atau bidang relevan.\n• Memahami dasar Undang-Undang Ketenagakerjaan Indonesia dan hubungan industrial.",
    benefits: [
      "Asuransi Rawat Inap & Jalan Kelas 1",
      "Tunjangan Makan Siang & Parkir Gedung",
      "Bonus Tahunan Berbasis Kinerja",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-11-05T23:59:59.000Z",
    organization: {
      id: "org-demo-fintek",
      name: "PT Artha Solusi Finansial",
      logoUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80",
      description: "Platform infrastruktur pembayaran digital dan agregator finansial B2B terlisensi Bank Indonesia.",
      industry: "Financial Services",
      companyScale: "201-500 Karyawan",
      officeAddress: "Pacific Century Place Lt. 24, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      companyEmail: "recruitment@arthasolusi.co.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-46", type: "required", name: "People Operations" },
      { id: "demo-req-47", type: "required", name: "Employee Onboarding" },
      { id: "demo-req-48", type: "required", name: "Labor Law Compliance" },
      { id: "demo-req-49", type: "preferred", name: "HRIS Software" },
    ],
  },
  {
    id: "demo-job-intern-uiux",
    organizationId: "org-demo-karya",
    organizationName: "PT Karya Digital Gemilang",
    title: "UI/UX Design Intern (Paid Internship)",
    description:
      "Program magang berbayar 6 bulan untuk mahasiswa tingkat akhir atau fresh graduate bertalenta yang ingin belajar langsung dari Senior Product Designer.",
    status: "published",
    employmentType: "internship",
    workArrangement: "hybrid",
    location: "Bandung, Jawa Barat",
    publishedAt: "2026-08-22T10:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-21T10:00:00.000Z",
    updatedAt: "2026-08-22T10:00:00.000Z",
    salaryMin: 3500000,
    salaryMax: 4500000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: false,
    hideSalary: false,
    experienceLevel: "fresh_graduate",
    minEducation: "sma_smk",
    jobCategory: "design_creative",
    responsibilities:
      "• Membantu pembuatan wireframe dan mockup antarmuka fitur baru menggunakan Figma.\n• Menyusun dokumentasi aset visual dan icon library untuk design system internal.\n• Berpartisipasi dalam sesi observasi usability testing dengan pengguna nyata.",
    qualifications:
      "• Mahasiswa tingkat akhir atau fresh graduate D3/S1 DKV, Informatika, Sistem Informasi, atau serumpun.\n• Memiliki portofolio desain UI (Behance / Dribbble / PDF / Figma link).\n• Mau belajar, komunikatif, dan menerima masukan konstruktif.",
    benefits: [
      "Uang Saku Bulanan Kompetitif",
      "Mentorship 1-on-1 dengan Senior Designer",
      "Peluang Konversi Karyawan Full-time Berdasarkan Performa",
      "Surat Rekomendasi Magang Resmi",
    ],
    vacanciesCount: 3,
    expiresAt: "2026-10-15T23:59:59.000Z",
    organization: {
      id: "org-demo-karya",
      name: "PT Karya Digital Gemilang",
      logoUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80",
      description: "Rekayasa perangkat lunak modern untuk transformasi digital finansial dan ketenagakerjaan.",
      industry: "Financial Services",
      companyScale: "11-50 Karyawan",
      officeAddress: "Dago Tech Hub Lt. 4, Jl. Ir. H. Juanda No. 128",
      city: "Bandung",
      province: "Jawa Barat",
      companyEmail: "halo@karyadigital.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-50", type: "required", name: "Figma" },
      { id: "demo-req-51", type: "required", name: "UI Design" },
      { id: "demo-req-52", type: "preferred", name: "Design System Basic" },
      { id: "demo-req-53", type: "preferred", name: "Prototyping" },
    ],
  },
  {
    id: "demo-job-cybersecurity",
    organizationId: "org-demo-fintek",
    organizationName: "PT Artha Solusi Finansial",
    title: "Information Security & Compliance Analyst",
    description:
      "Jaga keamanan ekosistem data perbankan dan API open finance melalui vulnerability assessment teratur, code audit, dan kepatuhan standar ISO 27001.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Jakarta Pusat, DKI Jakarta",
    publishedAt: "2026-08-23T08:00:00.000Z",
    closedAt: null,
    createdAt: "2026-08-22T08:00:00.000Z",
    updatedAt: "2026-08-23T08:00:00.000Z",
    salaryMin: 13000000,
    salaryMax: 19000000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "3_5_years",
    minEducation: "bachelor",
    jobCategory: "engineering_it",
    responsibilities:
      "• Menjalankan pentest berkala dan vulnerability assessment pada aplikasi web dan endpoint API.\n• Membantu audit sertifikasi ISO/IEC 27001 dan audit regulasi OJK / Bank Indonesia.\n• Merumuskan incident response plan dan pelatihan kesadaran keamanan siber bagi seluruh staf.",
    qualifications:
      "• Minimal 3 tahun pengalaman di bidang Information Security / Cyber Defense.\n• Memahami OWASP Top 10, penetration testing methodology, dan network security.\n• Memiliki sertifikasi seperti CEH, CompTIA Security+, atau OSCP merupakan nilai tambah kuat.",
    benefits: [
      "Asuransi Kesehatan Swasta Premium",
      "Sponsor Ujian Sertifikasi Keamanan Internasional",
      "Tunjangan Hari Raya & Bonus Kinerja Tahunan",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-11-25T23:59:59.000Z",
    organization: {
      id: "org-demo-fintek",
      name: "PT Artha Solusi Finansial",
      logoUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80",
      description: "Platform infrastruktur pembayaran digital dan agregator finansial B2B terlisensi Bank Indonesia.",
      industry: "Financial Services",
      companyScale: "201-500 Karyawan",
      officeAddress: "Pacific Century Place Lt. 24, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      companyEmail: "recruitment@arthasolusi.co.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-54", type: "required", name: "Vulnerability Assessment" },
      { id: "demo-req-55", type: "required", name: "OWASP Top 10" },
      { id: "demo-req-56", type: "required", name: "ISO 27001" },
      { id: "demo-req-57", type: "preferred", name: "Penetration Testing" },
    ],
  },
  {
    id: "demo-job-product-analyst",
    organizationId: "org-demo-logistik",
    organizationName: "PT Logistik Cerdas Nusantara",
    title: "Product Growth & BI Analyst",
    description:
      "Eksplorasi data transaksi rantai pasok untuk menemukan pola retensi pelanggan, menganalisis cohort ekspedisi, dan menghasilkan actionable insights bagi tim kepemimpinan.",
    status: "published",
    employmentType: "full_time",
    workArrangement: "hybrid",
    location: "Surabaya, Jawa Timur",
    publishedAt: "2026-08-24T09:30:00.000Z",
    closedAt: null,
    createdAt: "2026-08-23T09:30:00.000Z",
    updatedAt: "2026-08-24T09:30:00.000Z",
    salaryMin: 9500000,
    salaryMax: 14500000,
    salaryCurrency: "IDR",
    salaryPeriod: "monthly",
    isSalaryNegotiable: true,
    hideSalary: false,
    experienceLevel: "1_3_years",
    minEducation: "bachelor",
    jobCategory: "engineering_it",
    responsibilities:
      "• Menulis query SQL kompleks untuk mengekstrak data operasional harian dari data warehouse.\n• Membangun dashboard visual interaktif menggunakan Metabase / Tableau.\n• Melakukan A/B test analysis dan evaluasi dampak peluncuran fitur baru.",
    qualifications:
      "• Minimal 2 tahun pengalaman sebagai Product Analyst, Data Analyst, atau Business Intelligence.\n• Sangat mahir SQL (window functions, CTEs) dan Python atau R untuk analisis statistik dasar.\n• Kemampuan storytelling berbasis data yang runtut dan mudah dipahami stakeholder non-teknis.",
    benefits: [
      "Asuransi Kesehatan Karyawan & Tunjangan Rawat Jalan",
      "Tunjangan Makan Siang & Lembur Sesuai Aturan",
      "Kultur Kerja Berbasis Metrik dan Pembelajaran Berkelanjutan",
    ],
    vacanciesCount: 1,
    expiresAt: "2026-11-18T23:59:59.000Z",
    organization: {
      id: "org-demo-logistik",
      name: "PT Logistik Cerdas Nusantara",
      logoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80",
      description: "Penyedia logistik pihak ketiga (3PL) berbasis AI dengan jaringan lebih dari 80 warehouse di seluruh Indonesia.",
      industry: "Logistics & Supply Chain",
      companyScale: "501-1000 Karyawan",
      officeAddress: "Jl. Margomulyo Indah Blok H-7, Tandes",
      city: "Surabaya",
      province: "Jawa Timur",
      companyEmail: "hr@logistikcerdas.id",
      verificationStatus: "approved",
    },
    requirements: [
      { id: "demo-req-58", type: "required", name: "Advanced SQL" },
      { id: "demo-req-59", type: "required", name: "Data Visualization" },
      { id: "demo-req-60", type: "required", name: "A/B Testing" },
      { id: "demo-req-61", type: "preferred", name: "Python / Pandas" },
    ],
  },
];

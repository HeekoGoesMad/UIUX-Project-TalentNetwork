export interface PersonalityTypeConfig {
  type: string;
  name: string;
  label?: string;
  category: "analyst" | "diplomat" | "sentinel" | "explorer";
  categoryLabel: string;
  tagline: string;
  badgeClass: string;
}

export const PERSONALITY_CATEGORIES = {
  analyst: {
    label: "Analis",
    color: "purple",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  diplomat: {
    label: "Diplomat",
    color: "emerald",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  sentinel: {
    label: "Pengawal",
    color: "blue",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  explorer: {
    label: "Penjelajah",
    color: "amber",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
} as const;

export const PERSONALITY_TYPES: PersonalityTypeConfig[] = [
  // Analis (Intuitive & Thinking) - Ungu
  {
    type: "INTJ",
    name: "Arsitek",
    category: "analyst",
    categoryLabel: "Analis",
    tagline: "Pemikir strategis dan imajinatif dengan rencana untuk segala hal.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    type: "INTP",
    name: "Ahli Logika",
    category: "analyst",
    categoryLabel: "Analis",
    tagline: "Penemu inovatif dengan kehausan tak terpuaskan akan pengetahuan.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    type: "ENTJ",
    name: "Komandan",
    category: "analyst",
    categoryLabel: "Analis",
    tagline: "Pemimpin berani dan berkemauan keras yang selalu menemukan solusi.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    type: "ENTP",
    name: "Pendebat",
    category: "analyst",
    categoryLabel: "Analis",
    tagline: "Pemikir cerdas dan ingin tahu yang tidak bisa menolak tantangan intelektual.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },

  // Diplomat (Intuitive & Feeling) - Hijau
  {
    type: "INFJ",
    name: "Advokat",
    category: "diplomat",
    categoryLabel: "Diplomat",
    tagline: "Idealis yang tenang dan mistis, namun sangat menginspirasi dan tak kenal lelah.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    type: "INFP",
    name: "Mediator",
    category: "diplomat",
    categoryLabel: "Diplomat",
    tagline: "Puitis, baik hati, dan altruistik, selalu bersemangat membantu tujuan baik.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    type: "ENFJ",
    name: "Protagonis",
    category: "diplomat",
    categoryLabel: "Diplomat",
    tagline: "Pemimpin karismatik dan inspiratif, mampu memikat para pendengarnya.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    type: "ENFP",
    name: "Juru Kampanye",
    category: "diplomat",
    categoryLabel: "Diplomat",
    tagline: "Penuh semangat, kreatif, dan bebas yang selalu dapat menemukan alasan untuk tersenyum.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  // Pengawal (Observant & Judging) - Biru
  {
    type: "ISTJ",
    name: "Logistikus",
    category: "sentinel",
    categoryLabel: "Pengawal",
    tagline: "Individu yang praktis dan mengutamakan fakta, keandalannya tidak diragukan.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    type: "ISFJ",
    name: "Pembela",
    category: "sentinel",
    categoryLabel: "Pengawal",
    tagline: "Pelindung yang sangat berdedikasi dan hangat, selalu siap membela orang terdekatnya.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    type: "ESTJ",
    name: "Eksekutif",
    category: "sentinel",
    categoryLabel: "Pengawal",
    tagline: "Administrator ulung, tak tertandingi dalam mengelola berbagai hal atau orang.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    type: "ESFJ",
    name: "Konsul",
    category: "sentinel",
    categoryLabel: "Pengawal",
    tagline: "Sangat peduli, sosial, dan populer, selalu siap membantu rekan tim.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },

  // Penjelajah (Observant & Prospecting) - Oranye/Kuning
  {
    type: "ISTP",
    name: "Virtuoso",
    category: "explorer",
    categoryLabel: "Penjelajah",
    tagline: "Eksperimentator yang berani dan praktis, menguasai semua jenis alat.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    type: "ISFP",
    name: "Petualang",
    category: "explorer",
    categoryLabel: "Penjelajah",
    tagline: "Seniman yang fleksibel dan menawan, selalu siap menjelajahi hal baru.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    type: "ESTP",
    name: "Pengusaha",
    category: "explorer",
    categoryLabel: "Penjelajah",
    tagline: "Cerdas, energik, dan sangat perseptif, yang benar-benar menikmati hidup di tepi tantangan.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    type: "ESFP",
    name: "Penghibur",
    category: "explorer",
    categoryLabel: "Penjelajah",
    tagline: "Spontan, energik, dan antusias — hidup tidak pernah membosankan di sekitar mereka.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export const OFFICIAL_16PERSONALITIES_URL = "https://www.16personalities.com/id/tes-kepribadian";

export function getPersonalityConfig(type?: string): PersonalityTypeConfig | undefined {
  if (!type) return undefined;
  const upper = type.trim().toUpperCase();
  return PERSONALITY_TYPES.find((p) => p.type === upper);
}

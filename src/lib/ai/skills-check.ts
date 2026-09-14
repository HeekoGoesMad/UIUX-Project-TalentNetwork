export interface SkillQualityResult {
  isPlausible: boolean;
  hasDummySkills: boolean;
  dummySkills: string[];
  validSkills: string[];
  cleanedSkills: string[];
  recommendedSkillsForRole: string[];
  competencyFeedback: string;
}

const DUMMY_WORDS = [
  "plo", "pluh", "plar", "asdf", "test", "testing", "dummy", "sample",
  "contoh", "foo", "bar", "baz", "xxx", "qwerty", "tes", "percobaan",
  "random", "coba", "lorem", "ipsum", "bla", "blabla", "xyz"
];

const ALLOWED_SHORT_ACRONYMS = new Set([
  "ui", "ux", "ai", "bi", "qa", "it", "hr", "pr", "sql", "aws", "gcp",
  "seo", "sem", "css", "git", "api"
]);

const COMMON_KNOWN_SKILL_KEYWORDS = [
  "figma", "ui", "ux", "design", "desain", "research", "riset", "wireframing", "prototyping",
  "javascript", "typescript", "react", "next", "vue", "angular", "html", "css",
  "tailwind", "node", "express", "python", "django", "fastapi", "java", "spring", "golang",
  "sql", "postgresql", "mysql", "mongodb", "git", "github", "gitlab",
  "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "devops",
  "product", "scrum", "agile", "kanban", "analytics", "marketing", "seo", "sem",
  "copywriting", "accounting", "finance", "sales", "communication", "komunikasi",
  "leadership", "kepemimpinan", "testing", "qa", "quality assurance",
  "flutter", "kotlin", "swift", "android", "ios", "management", "strategy", "strategi",
  "data", "tableau", "power bi", "machine learning", "deep learning", "nlp",
  "cybersecurity", "network", "linux"
];

export function getRecommendedSkillsForRole(targetRole: string): string[] {
  const roleLower = targetRole.toLowerCase();

  if (roleLower.includes("design") || roleLower.includes("ui") || roleLower.includes("ux") || roleLower.includes("desain")) {
    return ["Figma", "UI Design", "Riset Pengguna (User Research)", "Prototyping", "Standar Desain (Design System)"];
  }
  if (roleLower.includes("frontend") || roleLower.includes("front-end") || roleLower.includes("web") || roleLower.includes("react")) {
    return ["React.js", "TypeScript", "Next.js", "Tailwind CSS", "Pengelolaan REST API"];
  }
  if (roleLower.includes("backend") || roleLower.includes("back-end") || roleLower.includes("software engineer") || roleLower.includes("developer")) {
    return ["Node.js / Python / Go", "Database SQL (PostgreSQL)", "RESTful API", "Git", "Docker"];
  }
  if (roleLower.includes("product") || roleLower.includes("pm") || roleLower.includes("owner")) {
    return ["Strategi Produk", "Riset & Validasi Pengguna", "Metodologi Agile/Scrum", "Analisis Data", "Penyusunan Roadmap"];
  }
  if (roleLower.includes("data") || roleLower.includes("analyst") || roleLower.includes("analis")) {
    return ["SQL", "Python untuk Analisis Data", "Visualisasi Data (Tableau/Power BI)", "Analisis Statistik", "Business Intelligence"];
  }
  if (roleLower.includes("marketing") || roleLower.includes("pemasaran") || roleLower.includes("growth")) {
    return ["Pemasaran Digital (Digital Marketing)", "Analisis Kampanye & Metrik", "SEO / SEM", "Penyusunan Konten", "Copywriting"];
  }
  if (roleLower.includes("qa") || roleLower.includes("tester") || roleLower.includes("quality")) {
    return ["Manual Testing", "Automated Testing (Cypress/Playwright)", "Penyusunan Test Case", "API Testing (Postman)", "Bug Tracking"];
  }

  return ["Komunikasi Profesional", "Manajemen Proyek & Waktu", "Pemecahan Masalah (Problem Solving)", "Alat Kerja Spesifik Bidang"];
}

export function checkSkillsQuality(skills: string[], targetRole: string): SkillQualityResult {
  const cleanedSkills = (skills || []).map((s) => s.trim()).filter((s) => s.length > 0);
  const recommendedSkills = getRecommendedSkillsForRole(targetRole);

  const dummySkills: string[] = [];
  const validSkills: string[] = [];

  for (const skill of cleanedSkills) {
    const sLower = skill.toLowerCase();
    const isExplicitDummy = DUMMY_WORDS.some((d) => sLower === d || sLower.includes(d));
    const isVeryShortUnrecognized = sLower.length <= 4 && !ALLOWED_SHORT_ACRONYMS.has(sLower) && !COMMON_KNOWN_SKILL_KEYWORDS.some((k) => sLower.includes(k));

    if (isExplicitDummy || isVeryShortUnrecognized) {
      dummySkills.push(skill);
    } else {
      validSkills.push(skill);
    }
  }

  const hasDummySkills = dummySkills.length > 0;
  const hasRecognizedSkill = validSkills.some((s) =>
    COMMON_KNOWN_SKILL_KEYWORDS.some((k) => s.toLowerCase().includes(k))
  );

  // If there are dummy skills present, or if NO recognized skills exist among inputs
  const isPlausible = !hasDummySkills && hasRecognizedSkill && validSkills.length >= 2;

  let competencyFeedback = "";
  if (!isPlausible) {
    if (hasDummySkills) {
      competencyFeedback = `Keahlian yang tercantum (${dummySkills.join(", ")}) belum jelas dan belum sesuai dengan kebutuhan posisi ${targetRole}. Perbaiki kompetensi agar sesuai dengan peran yang dituju (misalnya: ${recommendedSkills.slice(0, 3).join(", ")}).`;
    } else if (cleanedSkills.length < 2) {
      competencyFeedback = `Daftar keahlian masih terlalu sedikit untuk posisi ${targetRole}. Lengkapi kompetensi dengan keahlian inti seperti ${recommendedSkills.slice(0, 3).join(", ")}.`;
    } else {
      competencyFeedback = `Keahlian yang tercantum belum mencerminkan kompetensi utama untuk posisi ${targetRole}. Sesuaikan daftar keahlian dengan kebutuhan industri (misalnya: ${recommendedSkills.slice(0, 3).join(", ")}).`;
    }
  } else {
    competencyFeedback = `Keahlian yang dicantumkan (${validSkills.slice(0, 3).join(", ")}) sudah relevan dengan target posisi ${targetRole}.`;
  }

  return {
    isPlausible,
    hasDummySkills,
    dummySkills,
    validSkills,
    cleanedSkills,
    recommendedSkillsForRole: recommendedSkills,
    competencyFeedback,
  };
}

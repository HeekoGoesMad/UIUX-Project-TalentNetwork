import { Candidate, CareerStatus, IndustryCategory, TalentCategory } from "@/types";

const names = [
  "Ayu Lestari", "Budi Santoso", "Citra Dewi", "Dimas Anggara", "Eka Putri",
  "Fajar Hidayat", "Gita Savitri", "Hendra Wijaya", "Indah Permata", "Joko Susilo",
  "Kartika Sari", "Lukman Hakim", "Maya Safitri", "Naufal Rizki", "Olivia Tan",
  "Pratama Yudha", "Qori Andayani", "Rian Pratama", "Siti Rahma", "Taufik Hidayat",
  "Utami Ningsih", "Vino Bastian", "Winda Utami", "Xavier Malik", "Yolanda Putri",
  "Zainal Abidin", "Aditya Nugraha", "Bella Chyntia", "Candra Kirana", "Dian Sastro",
];

const roles = [
  "UI/UX Designer", "Product Designer", "Frontend Developer", "Fullstack Developer",
  "Growth Marketer", "Brand Strategist", "Data Analyst", "Operations Lead",
  "HR Generalist", "Account Executive",
];

const cities = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Bali", "Remote Indonesia"];

const skills = [
  "Figma", "User Research", "Wireframing", "Prototyping", "Design Systems",
  "React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js",
  "Data Analysis", "SQL", "Python", "A/B Testing", "SEO",
  "Performance Marketing", "Content Strategy", "Copywriting", "HR Operations", "Talent Acquisition",
];

const industries: IndustryCategory[] = [
  "technology-software", "product-design", "technology-software", "technology-software",
  "marketing-digital", "marketing-digital", "data-analytics", "human-capital",
  "human-capital", "sales-bizdev",
];

const toolsList = ["Figma", "Excel", "Notion", "Looker Studio", "Jira", "Meta Ads", "Google Workspace", "HRIS"];

export const candidates: Candidate[] = names.map((name, i) => ({
  id: `candidate-${i + 1}`,
  name,
  initials: name.split(" ").map((n) => n[0]).join(""),
  role: roles[i % roles.length],
  location: cities[i % cities.length],
  experience: 3 + (i % 8),
  availability: i % 3 === 0 ? "Tersedia sekarang" : i % 3 === 1 ? "Notice 2 minggu" : "Terbuka tawaran",
  skills: [skills[i % skills.length], skills[(i + 2) % skills.length], skills[(i + 5) % skills.length]],
  tools: [toolsList[i % toolsList.length], toolsList[(i + 3) % toolsList.length]],
  education: ["Universitas Indonesia","ITB","UGM","Binus University"][i % 4],
  salary: `Rp ${(12 + (i % 8) * 3).toLocaleString("id-ID")} jt – ${(22 + (i % 8) * 4).toLocaleString("id-ID")} jt / bln`,
  summary: `Profesional ${roles[i % roles.length]} dengan rekam jejak teruji dalam mengubah tantangan kompleks menjadi solusi nyata dan berdampak bagi bisnis.`,
  endorsements: ["Komunikator handal", "Pemikir sistematis", "Mentor yang suportif"].slice(0, 2 + (i % 2)),
  certifications: i % 2 ? ["Google Analytics Certified"] : ["AWS Certified Practitioner", "Scrum Alliance CSM"],
  portfolio: ["https://portfolio.example.com/case-study", "https://github.com/example/projects"],
  email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
  phone: "+62 812 5555 0192",
  linkedin: `https://linkedin.com/in/${name.toLowerCase().replaceAll(" ", "-")}`,
  history: [
    { company: ["Tokopedia","Gojek","Traveloka","Kredivo"][i % 4], role: roles[i % roles.length], years: `${2021 - (i % 3)} — Sekarang` },
    { company: "Independent Studio", role: "Konsultan", years: "2019 — 2021" },
  ],
  careerStatus: careerStatuses[i % careerStatuses.length],
  talentCategory: talentCategories[i],
  industry: industries[i % roles.length],
}));

export const findCandidate = (id: string) => candidates.find((candidate) => candidate.id === id);

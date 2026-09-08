import { Candidate, CareerStatus, IndustryCategory, TalentCategory } from "@/types";

const names = ["Nadia Putri","Rizky Pratama","Clara Wijaya","Bima Santoso","Maya Kusuma","Aditya Ramadhan","Salsabila Noor","Kevin Hartono","Dewi Lestari","Fajar Nugroho","Sarah Tan","Dimas Haryanto","Anisa Rahma","Bagas Permana","Citra Anggraini","Yoga Saputra","Larasati Dewi","Rafi Maulana","Intan Sari","Gilang Wibowo","Mei Chen","Arif Setiawan","Nina Kurnia","Rendra Wijaya","Vania Putri","Teguh Adi","Alya Prameswari","Raka Putra","Wulan Sari","Hendra Gunawan"];
const roles = ["Senior Product Designer","Frontend Engineer","Growth Marketing Lead","Data Scientist","Product Manager","UX Researcher","Backend Engineer","Brand Strategist"];
const cities = ["Jakarta","Bandung","Surabaya","Yogyakarta","Bali","Tangerang","Semarang","Medan"];
const skills = ["Figma","React","TypeScript","SQL","Product strategy","Research","Python","Go","Brand systems","Analytics"];

const careerStatuses: CareerStatus[] = ["open-to-work","open-for-opportunities","freelance-available","internship-available","not-available"];

// ~40% DJoin Verified, ~60% Public — realistic distribution
const talentCategories: TalentCategory[] = [
  "djoin-verified","djoin-verified","public","public","public",
  "djoin-verified","public","public","djoin-verified","public",
  "public","djoin-verified","public","public","djoin-verified",
  "public","public","djoin-verified","public","public",
  "djoin-verified","public","public","djoin-verified","public",
  "public","djoin-verified","public","public","public",
];

// Map roles to industries
const industries: IndustryCategory[] = [
  "product-design",    // Senior Product Designer
  "technology-software",// Frontend Engineer
  "marketing-digital", // Growth Marketing Lead
  "data-analytics",    // Data Scientist
  "product-design",    // Product Manager
  "human-capital",     // UX Researcher
  "technology-software",// Backend Engineer
  "sales-bizdev",      // Brand Strategist
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

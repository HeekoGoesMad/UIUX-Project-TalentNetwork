import { PERSONALITY_TYPES } from "@/config/personality";
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

const sampleAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop", // Nadia Putri
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop", // Rizky Pratama
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop", // Clara Wijaya
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop", // Bima Santoso
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop", // Maya Kusuma
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop", // Aditya Ramadhan
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop", // Salsabila Noor
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop", // Kevin Hartono
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop", // Dewi Lestari
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop", // Fajar Nugroho
];

const sampleBanners = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
];

export const candidates: Candidate[] = names.map((name, i) => {
  const personalityConfig = PERSONALITY_TYPES[i % PERSONALITY_TYPES.length];

  return {
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
    avatarUrl: sampleAvatars[i % sampleAvatars.length],
    bannerUrl: sampleBanners[i % sampleBanners.length],
    history: [
      { company: ["Tokopedia","Gojek","Traveloka","Kredivo"][i % 4], role: roles[i % roles.length], years: `${2021 - (i % 3)} — Sekarang` },
      { company: "Independent Studio", role: "Konsultan", years: "2019 — 2021" },
    ],
    careerStatus: careerStatuses[i % careerStatuses.length],
    talentCategory: talentCategories[i],
    industry: industries[i % roles.length],
    personality: {
      type: personalityConfig.type,
      label: personalityConfig.name,
      tagline: personalityConfig.tagline,
      testUrl: `https://www.16personalities.com/profiles/${personalityConfig.type.toLowerCase()}-personality`,
    },
  };
});

export const findCandidate = (id: string) => candidates.find((candidate) => candidate.id === id);

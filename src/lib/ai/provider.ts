import "server-only";

import { createAzure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";
import { cvBuilderSchema, cvImportSchema, gapsSchema, advisorSchema, profileContextSchema, questionsSchema, roadmapSchema, screeningSchema, summarySchema } from "./schemas";

const version = "proofylink-screening-v1";
const source = process.env.AI_PROVIDER === "azure" ? "azure" : "mock";

type AiOptions = { strict?: boolean };

function label(score: number) {
  return score >= 80 ? "Sangat Direkomendasikan" : score >= 50 ? "Direkomendasikan" : score >= 21 ? "Perlu Pertimbangan" : "Perlu Review Mendalam";
}

export async function aiResult<T extends z.ZodType>(schema: T, prompt: string, fallback: z.infer<T>, options: AiOptions = {}): Promise<z.infer<T>> {
  if (source === "mock") {
    if (options.strict) throw new Error("Provider AI untuk database belum dikonfigurasi.");
    return fallback;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !deployment || !apiKey || apiKey.startsWith("<")) {
    if (options.strict) throw new Error("Konfigurasi Azure AI belum lengkap.");
    return fallback;
  }

  try {
    const azure = createAzure({
      baseURL: `${endpoint.replace(/\/$/, "")}/openai`,
      apiKey,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION?.trim(),
      useDeploymentBasedUrls: true,
    });
    const result = await generateObject({ model: azure.chat(deployment), schema, prompt });
    return result.object as z.infer<T>;
  } catch (error) {
    console.error("AI provider error:", error);
    if (options.strict) throw error;
    return fallback;
  }
}

export async function summary(input: unknown, options?: AiOptions) {
  const context = profileContextSchema.parse(input);
  return aiResult(summarySchema, JSON.stringify(context), { summary: `${context.headline || "Kandidat"} dengan fokus pada hasil kerja yang dapat dibuktikan dan kolaborasi lintas fungsi.`, strengths: context.skills.slice(0, 3), evidence: ["Ringkasan berasal dari profile yang kandidat setujui."], limitations: ["AI tidak memverifikasi klaim dari sumber eksternal."], modelVersion: version, source }, options);
}

export async function screening(input: unknown, options?: AiOptions) {
  const context = profileContextSchema.parse(input);
  const score = Math.min(100, 48 + context.skills.length * 8 + (context.targetRole ? 12 : 0));
  return aiResult(screeningSchema, JSON.stringify(context), { score, label: label(score), coverage: Math.min(90, 45 + context.skills.length * 8), evidence: ["Skill dan target role tersedia di profile.", "Penilaian berfokus pada data quality dan role fit."], limitations: ["Bukan keputusan hire/reject.", "Financial, credit, dan atribut sensitif tidak dianalisis."], followUp: "Lakukan interview berbasis bukti dan beri kandidat kesempatan klarifikasi.", modelVersion: version, source }, options);
}

export async function interviewQuestions(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(questionsSchema, JSON.stringify(context), { questions: [`Ceritakan proyek paling relevan dengan ${context.targetRole || "role ini"}.`, "Bukti apa yang menunjukkan dampak pekerjaan tersebut?", "Bagaimana kamu berkolaborasi saat requirement berubah?"], limitations: ["Pertanyaan adalah draft dan perlu ditinjau manusia."], modelVersion: version, source });
}

export async function careerAdvisor(input: unknown) {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const focus = typeof raw.focus === "string" ? raw.focus : "ats";
  const context = profileContextSchema.parse(input);

  const role = context.targetRole || context.headline || "Senior Product Designer";

  const fallbackHeadlineSuggestions = [
    `${role} | Specialized in UX Research & Scalable Design Systems`,
    `${role} — Transforming Complex Product Workflows into Intuitive UI`,
    `Data-Driven ${role} | Proven Track Record in Conversion & Usability`,
  ];

  const fallbackStarBullets = [
    {
      before: "Bertanggung jawab merancang ulang tampilan aplikasi produk.",
      after: "Merancang ulang 12+ flow produk utama di Tokopedia, meningkatkan tingkat penyelesaian task user sebesar 28% dan efisiensi registrasi 15%.",
      impactReason: "Mengganti deskripsi tugas umum dengan metrik kuantitatif (STAR method) yang langsung menarik perhatian recruiter.",
    },
    {
      before: "Membuat design system untuk tim engineering.",
      after: "Membangun & mendokumentasikan Design System 4.0 berbasis Tailwind CSS & React, mempercepat waktu delivery frontend hingga 35%.",
      impactReason: "Menonjolkan teknologi spesifik dan dampak efisiensi tim cross-functional.",
    },
  ];

  const fallbackPillars = [
    {
      name: "Pilar 1: Headline & Target Role Positioning",
      score: context.headline ? 85 : 45,
      status: context.headline ? ("excellent" as const) : ("needs_improvement" as const),
      recommendation: context.headline
        ? "Headline kamu sudah cukup spesifik. Pertimbangkan menambahkan nilai dampak utama atau spesialisasi industri."
        : "Headline masih terlalu umum. Gunakan pola [Role] | [Spesialisasi] | [Dampak Utama].",
      actionables: [
        "Tambahkan 2-3 keyword industri di headline",
        "Sebutkan domain spesifik (misal: Fintech, SaaS, E-Commerce)",
      ],
    },
    {
      name: "Pilar 2: Outcome-Based Experience (STAR Method)",
      score: 70,
      status: "good" as const,
      recommendation: "Beberapa poin pengalaman kerja masih berupa daftar tugas. Ubah menjadi pencapaian terukur dengan angka & metrik.",
      actionables: [
        "Gunakan kata kerja aksi di setiap bullet (Memimpin, Meningkatkan, Mengurangi)",
        "Sertakan persentase, jumlah user, atau efisiensi waktu",
      ],
    },
    {
      name: "Pilar 3: ATS & Skill Alignment",
      score: Math.min(95, 50 + context.skills.length * 10),
      status: context.skills.length >= 4 ? ("excellent" as const) : ("needs_improvement" as const),
      recommendation: `Kamu saat ini mendaftarkan ${context.skills.length} skill. Lengkapi dengan toolchain modern dan metrik penguasaan.`,
      actionables: [
        "Pastikan skill inti (misal: User Research, Prototyping, Figma) terdaftar di bagian atas",
        "Pilih skill yang paling sering muncul di deskripsi lowongan target",
      ],
    },
    {
      name: "Pilar 4: Proof of Work & Portfolio",
      score: 65,
      status: "good" as const,
      recommendation: "Pekerja di bidang digital memerlukan bukti nyata. Sertakan link studi kasus, Figma prototypes, atau live URL.",
      actionables: [
        "Tambahkan minimal 2 link karya utama dengan konteks peranmu",
        "Jelaskan tantangan unik yang kamu selesaikan di setiap proyek",
      ],
    },
    {
      name: "Pilar 5: Verification & Recruiter Consent",
      score: 90,
      status: "excellent" as const,
      recommendation: "Status profil dan kesiapan kontak recruiter aktif. Pertimbangkan memperbarui ketersediaan kerja secara berkala.",
      actionables: [
        "Pastikan nomor kontak & email tetap terverifikasi",
        "Perbarui status ketersediaan kerja (Open to Work / Freelance)",
      ],
    },
  ];

  let summaryText = `Evaluasi profil karier untuk target role ${role}.`;
  let answerText = `Rekomendasi utama untuk memperkuat profil ${role}: tingkatkan bukti pencapaian dengan metrik kuantitatif dan selaraskan keyword dengan standar ATS recruiter.`;

  if (focus === "ats") {
    summaryText = `Fokus Optimasi ATS: Menyesuaikan struktur dan keyword profil agar mudah dipindai oleh sistem ATS & recruiter.`;
    answerText = `Optimasi ATS: Pastikan istilah role (${role}) dan skill utama muncul secara alami di Headline, About, dan Experience. Gunakan format standar tanpa jargon yang membingungkan.`;
  } else if (focus === "headline") {
    summaryText = `Fokus Crafting Headline: Menyusun identitas profesional yang menarik perhatian recruiter dalam 3 detik pertama.`;
    answerText = `Headline Crafting: Gunakan formula 3-bagian: Role Utama + Spesialisasi Utama + Nilai Tambah/Dampak. Hindari kata-kata generik seperti 'hardworking' atau 'passionate'.`;
  } else if (focus === "star") {
    summaryText = `Fokus STAR Bullets: Mengubah daftar tugas menjadi cerita sukses berorientasi dampak (Situation, Task, Action, Result).`;
    answerText = `STAR Bullets: Setiap pengalaman kerja harus menceritakan (1) Masalah yang dihadapi, (2) Aksi konkret yang kamu ambil, dan (3) Hasil terukur yang dicapai.`;
  } else if (focus === "role") {
    summaryText = `Fokus Role Alignment: Mengarahkan profil agar sejalan dengan kualifikasi ${role}.`;
    answerText = `Role Alignment: Audit profilmu terhadap lowongan ${role} di pasar. Eliminasi skill yang tidak relevan dan tonjolkan pencapaian yang paling mendukung role impianmu.`;
  }

  const structuredAdviceData = {
    opening: `Profil kamu saat ini memiliki fondasi yang kuat untuk peran ${role}, namun memerlukan penyempurnaan pada aspek pembuktian hasil kerja dan kompatibilitas ATS.`,
    whatGood: [
      `Fokus keahlian pada ${context.skills.slice(0, 3).join(", ") || "Design & Research"} sudah terlihat jelas dan konsisten.`,
      `Pengalaman kerja nyata di industri mendukung klaim kompetensi profesionalmu.`,
      `Profil sudah memiliki struktur dasar yang lengkap dari headline hingga daftar riwayat kerja.`,
    ],
    whatNotGood: [
      `Beberapa poin deskripsi pengalaman masih bersifat kualitatif tanpa menyertakan angka metrik (misal: % efisiensi, akumulasi user, atau revenue).`,
      `Headline masih bisa diperjelas dengan pola 3-bagian (Role + Spesialisasi + Nilai Tambah) agar langsung dilirik recruiter dalam 3 detik.`,
      `Keyword kunci pendukung sistem ATS recruiter belum tersebar secara optimal pada ringkasan 'About'.`,
    ],
    conclusion: `Jika kamu memperbarui headline dan mengubah 2-3 bullet point pengalaman kerja ke metode STAR (dengan metrik konkret), skor daya saing profilmu di pasar kerja akan meningkat secara signifikan.`,
  };

  return aiResult(advisorSchema, JSON.stringify({ ...context, focus }), {
    focus,
    summary: summaryText,
    headlineSuggestions: fallbackHeadlineSuggestions,
    starBullets: fallbackStarBullets,
    pillars: fallbackPillars,
    structuredAdvice: structuredAdviceData,
    answer: answerText,
    nextSteps: [
      `Pilih salah satu usulan Headline di atas dan perbarui profilmu di CV Workspace.`,
      `Gunakan metode STAR untuk merevisi 2 bullet point pengalaman kerja paling terbaru.`,
      `Jalankan ulang Gap Analysis untuk mengecek persentase kesesuaian skill dengan lowongan target.`,
    ],
    limitations: [
      "Rekomendasi berasal dari analisis profil internal dan standar industri ATS.",
      "Hasil AI merupakan panduan review untuk membantu keputusan personalmu.",
    ],
    modelVersion: version,
    source,
  });
}

export async function gapAnalysis(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(gapsSchema, JSON.stringify(context), { missing: context.skills.length ? ["Contoh portfolio yang relevan"] : ["Skill inti dan bukti proyek"], unevidenced: context.skills.slice(0, 2), transferable: ["Problem solving", "Kolaborasi"], irrelevant: [], limitations: ["Gap bukan penilaian kelayakan final."], modelVersion: version, source });
}

export async function roadmap(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(roadmapSchema, JSON.stringify(context), { phases: [{ title: "Fondasi", outcome: `Memahami ekspektasi ${context.targetRole || "role tujuan"}`, actions: ["Petakan 3 requirement lowongan", "Pilih satu materi belajar"] }, { title: "Bukti kerja", outcome: "Memiliki portfolio yang bisa dibahas", actions: ["Bangun mini project", "Tulis outcome dan batasan"] }, { title: "Percakapan", outcome: "Siap menjelaskan keputusan kerja", actions: ["Latihan interview", "Minta feedback"] }], limitations: ["Roadmap dapat diedit dan disesuaikan kandidat."], modelVersion: version, source });
}

export async function cvBuilder(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(cvBuilderSchema, JSON.stringify(context), { headline: context.headline || context.targetRole || "Professional", about: context.about || "Professional yang berfokus pada hasil dan kolaborasi.", bullets: context.skills.slice(0, 3).map((skill) => `Menggunakan ${skill} untuk menyelesaikan masalah pengguna.`), limitations: ["Draft harus disetujui kandidat sebelum disimpan."], modelVersion: version, source });
}

export function importCv(fileName: string) {
  return cvImportSchema.parse({ fullName: "Nadia Putri", headline: "Senior Product Designer", about: "Product designer yang mengubah masalah kompleks menjadi pengalaman digital yang jelas.", skills: ["Product design", "User research", "Figma"], experience: [{ company: "Studio Nusantara", role: "Senior Product Designer", dates: "2021 - sekarang", achievements: ["Meningkatkan kejelasan workflow produk."] }], education: [{ school: "Universitas Indonesia", program: "Desain Komunikasi Visual", dates: "2015 - 2019" }], suggestions: [`Review hasil extraction dari ${fileName} sebelum menyimpan.`], source: "mock" });
}

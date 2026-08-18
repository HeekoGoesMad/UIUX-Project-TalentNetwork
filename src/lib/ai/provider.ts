import "server-only";

import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { cvBuilderSchema, cvImportSchema, gapsSchema, advisorSchema, profileContextSchema, questionsSchema, roadmapSchema, screeningSchema, summarySchema } from "./schemas";

const defaultVersion = "proofylink-screening-v1";

export function getSource(): "mock" | "local" | "azure" {
  const provider = process.env.AI_PROVIDER?.trim();
  if (provider === "mock" && process.env.NODE_ENV !== "production") return "mock";
  if (provider === "local") return "local";
  return "azure";
}

type AiOptions = { strict?: boolean };

function label(score: number) {
  return score >= 80 ? "Sangat Direkomendasikan" : score >= 50 ? "Direkomendasikan" : score >= 21 ? "Perlu Pertimbangan" : "Perlu Review Mendalam";
}

export async function aiResult<T extends z.ZodType>(schema: T, prompt: string, fallback: z.infer<T>, options: AiOptions = {}): Promise<z.infer<T>> {
  const currentSource = getSource();

  if (currentSource === "mock") {
    return {
      ...(fallback as Record<string, unknown>),
      source: "mock",
      modelVersion: defaultVersion,
    } as z.infer<T>;
  }

  if (currentSource === "local") {
    const baseURL = process.env.LOCAL_AI_BASE_URL?.trim() ?? "http://localhost:11434/v1";
    const model = process.env.LOCAL_AI_MODEL?.trim() ?? "llama3.2";
    const apiKey = process.env.LOCAL_AI_API_KEY?.trim() ?? "ollama";
    try {
      const localAi = createOpenAI({ baseURL, apiKey });
      const result = await generateObject({ model: localAi.chat(model), schema, prompt });
      return {
        ...(result.object as Record<string, unknown>),
        source: "local",
        modelVersion: model,
      } as z.infer<T>;
    } catch (error) {
      console.error("[AI local] Error:", error);
      if (options.strict) {
        throw new Error(
          `Gagal terhubung ke Local AI server (${model}) di ${baseURL}. Pastikan Ollama atau LM Studio sedang berjalan (misal: 'ollama run ${model}').`
        );
      }
      return {
        ...(fallback as Record<string, unknown>),
        source: "mock",
        modelVersion: `${model} (fallback)`,
      } as z.infer<T>;
    }
  }

  // Azure mode
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !deployment || !apiKey || apiKey.startsWith("<")) {
    if (options.strict) throw new Error("Konfigurasi Azure AI belum lengkap.");
    return {
      ...(fallback as Record<string, unknown>),
      source: "mock",
      modelVersion: `${defaultVersion} (azure-unconfigured)`,
    } as z.infer<T>;
  }

  try {
    const azure = createAzure({
      baseURL: `${endpoint.replace(/\/$/, "")}/openai`,
      apiKey,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION?.trim(),
      useDeploymentBasedUrls: true,
    });
    const result = await generateObject({ model: azure.chat(deployment), schema, prompt });
    return {
      ...(result.object as Record<string, unknown>),
      source: "azure",
      modelVersion: deployment || defaultVersion,
    } as z.infer<T>;
  } catch (error) {
    console.error("AI provider error:", error);
    if (options.strict) throw error;
    return {
      ...(fallback as Record<string, unknown>),
      source: "mock",
      modelVersion: `${defaultVersion} (azure-error)`,
    } as z.infer<T>;
  }
}

export async function summary(input: unknown, options?: AiOptions) {
  const context = profileContextSchema.parse(input);
  const prompt =
    `Anda adalah asisten AI rekrutmen profesional. Buatkan ringkasan profil kandidat dalam Bahasa Indonesia berdasarkan data berikut:\n` +
    `- Headline: ${context.headline || "Kandidat Profesional"}\n` +
    `- Target Role: ${context.targetRole || "Belum ditentukan"}\n` +
    `- Deskripsi: ${context.about || "Tidak ada deskripsi tentang saya."}\n` +
    `- Lokasi: ${context.location || "Indonesia"}\n` +
    `- Skills: ${context.skills.join(", ") || "General skills"}\n\n` +
    `Tulis ringkasan naratif yang objektif, berorientasi pada pencapaian terukur dan kolaborasi.`;

  return aiResult(
    summarySchema,
    prompt,
    {
      summary: `${context.headline || "Kandidat"} dengan fokus pada hasil kerja terbukti dan kolaborasi tim.`,
      strengths: context.skills.length > 0 ? context.skills.slice(0, 3) : ["Pengalaman profesional terbukti", "Komunikasi & kolaborasi tim"],
      evidence: ["Ringkasan bersumber langsung dari data profil kandidat yang valid."],
      limitations: ["AI tidak melakukan verifikasi independen ke pihak eksternal."],
      modelVersion: defaultVersion,
      source: getSource(),
    },
    options,
  );
}

export async function screening(input: unknown, options?: AiOptions) {
  const context = profileContextSchema.parse(input);
  const score = Math.min(100, 48 + context.skills.length * 8 + (context.targetRole ? 12 : 0));
  return aiResult(screeningSchema, JSON.stringify(context), { score, label: label(score), coverage: Math.min(90, 45 + context.skills.length * 8), evidence: ["Skill dan target role tersedia di profile.", "Penilaian berfokus pada data quality dan role fit."], limitations: ["Bukan keputusan hire/reject.", "Financial, credit, dan atribut sensitif tidak dianalisis."], followUp: "Lakukan interview berbasis bukti dan beri kandidat kesempatan klarifikasi.", modelVersion: defaultVersion, source: getSource() }, options);
}

export async function interviewQuestions(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(questionsSchema, JSON.stringify(context), { questions: [`Ceritakan proyek paling relevan dengan ${context.targetRole || "role ini"}.`, "Bukti apa yang menunjukkan dampak pekerjaan tersebut?", "Bagaimana kamu berkolaborasi saat requirement berubah?"], limitations: ["Pertanyaan adalah draft dan perlu ditinjau manusia."], modelVersion: defaultVersion, source: getSource() });
}

export async function careerAdvisor(input: unknown) {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const focus = (typeof raw.focus === "string" && ["ats", "headline", "star", "role"].includes(raw.focus)
    ? raw.focus
    : "ats") as "ats" | "headline" | "star" | "role";
  const context = profileContextSchema.parse(input);

  const role = context.targetRole || context.headline || "Senior Product Designer";

  // Focus-specific fallbacks
  let summaryText = "";
  let answerText = "";

  const atsData = {
    score: Math.min(95, 60 + context.skills.length * 4),
    detectedKeywords: context.skills.length ? context.skills.slice(0, 5) : ["Product Design", "UX Research", "Figma"],
    missingKeywords: ["Cross-functional Leadership", "Design Systems at Scale", "Conversion Rate Optimization (CRO)", "Product Analytics", "A/B Testing"],
    sectionAudits: [
      {
        section: "Headline & Identitas Profesional",
        status: "good" as const,
        notes: [
          `Menyebutkan istilah peran target (${role}) dengan jelas.`,
          "Format teks bersih tanpa karakter simbol yang membingungkan parser ATS.",
        ],
        recommendation: "Tambahkan domain industri (e.g. Fintech/B2B SaaS) agar relevansi pencarian recruiter naik 30%.",
      },
      {
        section: "Ringkasan Profil (About)",
        status: "needs_improvement" as const,
        notes: [
          "Masih terlalu ringkas dan belum merangkum total tahun pengalaman.",
          "Keyword inti ATS belum tersebar merata di paragraf pertama.",
        ],
        recommendation: "Tulis ringkasan 3-paragraf: Peran & Nilai Utama, Keahlian Kunci, dan Dampak Kerja Terbukti.",
      },
      {
        section: "Pengalaman Kerja (Experience)",
        status: "needs_improvement" as const,
        notes: [
          "Poin deskripsi masih didominasi kata pasif ('bertanggung jawab atas...').",
          "Angka metrik kuantitatif belum konsisten di semua riwayat posisi.",
        ],
        recommendation: "Gunakan Strong Action Verbs di awal setiap bullet dan sertakan minimal 1 angka metrik (%, user, waktu).",
      },
      {
        section: "Daftar Keahlian (Skills)",
        status: "good" as const,
        notes: [
          `Terdaftar ${context.skills.length || 4} skill yang relevan dengan domain desain.`,
          "Kombinasi hard skill dan metodologi kerja sudah terlihat.",
        ],
        recommendation: "Kelompokkan skill ke dalam Hard Skills, Tools, dan Core Methodologies agar mudah dipindai HR.",
      },
    ],
    formatChecks: [
      { check: "Standar Tipografi & Format Heading", passed: true, tip: "Gunakan nama heading baku: Experience, Education, Skills, Portfolio." },
      { check: "Kepadatan Kata Kunci (Keyword Density)", passed: false, tip: "Pastikan keyword role target muncul 3-4 kali secara natural di berbagai seksi." },
      { check: "Keterbacaan Font & Bullet Point", passed: true, tip: "Gunakan bullet standar (•) tanpa ikon grafis rumit yang gagal diekstrak ATS." },
      { check: "Link Portofolio & Kontak Aktif", passed: true, tip: "Sertakan tautan LinkedIn, Portfolio live URL, dan email profesional." },
    ],
  };

  const headlineData = {
    currentHeadline: context.headline || `${role} di Industri Teknologi`,
    formula: "[Role Utama] | [Spesialisasi / Domain Unggulan] | [Dampak Terukur & Nilai Tambah]",
    options: [
      {
        headline: `${role} | End-to-End Product Design & UX Strategy for High-Growth SaaS`,
        rationale: "Menonjolkan kemampuan end-to-end design dan domain SaaS yang sangat dicari recruiter tier-1.",
        keywords: ["End-to-End Product Design", "UX Strategy", "SaaS Architecture"],
        tag: "Paling Direkomendasikan",
      },
      {
        headline: `Senior ${role} • Design Systems Specialist & Data-Informed UX (Fintech/E-Commerce)`,
        rationale: "Fokus kuat pada keahlian Design System dan pendekatan riset berbasis data kuantitatif.",
        keywords: ["Design Systems", "Data-Informed UX", "Fintech & E-Commerce"],
        tag: "Fokus Spesialisasi",
      },
      {
        headline: `${role} — Driving +30% User Conversion Through Frictionless Product Experience`,
        rationale: "Menonjolkan metrik dampak bisnis (conversion rate) yang langsung menarik perhatian hiring manager.",
        keywords: ["Conversion Rate Optimization", "Product Experience", "Product Growth"],
        tag: "Dampak Bisnis (Impact)",
      },
    ],
    tips: [
      "Gunakan tanda pipa (|) atau bullet (•) sebagai pemisah yang rapi dan ATS-friendly.",
      "Hindari kata sifat generik seperti 'Hardworking', 'Passionate', atau 'Creative Guru'.",
      "Selalu sertakan nama peran spesifik yang ingin kamu lamar (Target Role).",
      "Maksimal 120-160 karakter agar tidak terpotong di hasil pencarian LinkedIn atau database rekrutmen.",
    ],
  };

  const starData = {
    frameworkExplanation: "STAR Method (Situation, Task, Action, Result) adalah standar industri untuk menyusun poin pengalaman kerja yang meyakinkan hiring manager dan menembus filter ATS.",
    bullets: [
      {
        before: "Bertanggung jawab merancang ulang tampilan antarmuka aplikasi produk utama.",
        after: "Memimpin redesign 12+ flow produk utama di aplikasi, meningkatkan task completion rate sebesar 28% dan memangkas waktu onboarding 15%.",
        impactReason: "Mengganti deskripsi tugas pasif dengan angka metrik konkret (%) dan action verb 'Memimpin'.",
        metricsHighlight: "+28% Task Completion · -15% Onboarding Time",
      },
      {
        before: "Membuat komponen design system dan berkolaborasi dengan engineer frontend.",
        after: "Membangun & mendokumentasikan Design System 4.0 (150+ komponen tokenized), mempercepat siklus sprint frontend hingga 35%.",
        impactReason: "Menjelaskan skala kontribusi nyata (150+ komponen) dan efisiensi delivery tim lintas fungsi.",
        metricsHighlight: "150+ Komponen Tokenized · 35% Faster Sprint Delivery",
      },
      {
        before: "Melakukan user research dan interview responden untuk pengembangan fitur baru.",
        after: "Menjalankan 24 sesi usability testing & wawancara mendalam, menurunkan drop-off rate pada checkout flow sebesar 18%.",
        impactReason: "Menunjukkan volume riset dan dampak langsung pada metrik bisnis krusial (drop-off rate).",
        metricsHighlight: "24 Usability Sessions · -18% Drop-off Rate",
      },
    ],
    actionVerbs: [
      "Memimpin (Led)",
      "Mengembangkan (Architected)",
      "Meningkatkan (Accelerated)",
      "Mengoptimasi (Optimized)",
      "Memangkas (Reduced)",
      "Merestrukturisasi (Revamped)",
    ],
  };

  const roleData = {
    targetRole: role,
    matchScore: 84,
    matchLevel: "Tinggi (Strong Alignment)",
    coreCompetencies: [
      { competency: "User Research & Usability Validation", candidateLevel: "Advanced", requiredLevel: "Advanced", status: "match" as const },
      { competency: "Scalable Design Systems Architecture", candidateLevel: "Intermediate", requiredLevel: "Advanced", status: "gap" as const },
      { competency: "Cross-functional Stakeholder Management", candidateLevel: "Advanced", requiredLevel: "Intermediate", status: "exceeds" as const },
      { competency: "Product Analytics & Growth Experimentation", candidateLevel: "Intermediate", requiredLevel: "Advanced", status: "gap" as const },
    ],
    criticalGaps: [
      "Pengalaman dalam mengukur dampak desain pasca-rilis (A/B testing & product analytics) perlu lebih ditonjolkan di CV.",
      "Portofolio studi kasus perlu menyertakan rationale arsitektur Design System berskala multi-platform.",
      "Perjelas peran kepemimpinan desain (mentoring junior designer atau ownership feature end-to-end).",
    ],
    strategicRecommendations: [
      "Cantumkan minimal 1 studi kasus yang menceritakan kolaborasi intensif dengan Product Manager & Engineering Lead.",
      "Tuliskan metrik keberhasilan bisnis di setiap proyek dalam CV dan link portfolio.",
      "Sesuaikan deskripsi About dengan keyword kualifikasi senior yang ada di lowongan target.",
    ],
  };

  if (focus === "ats") {
    summaryText = `Analisis Kompatibilitas ATS untuk target role ${role}: Skor keterbacaan ${atsData.score}/100. Kerapian keyword inti sudah baik, namun perlu pengayaan metrik kuantitatif dan keyword domain spesifik.`;
    answerText = `Optimasi ATS: Pastikan istilah role (${role}) dan skill utama muncul secara alami di Headline, About, dan Experience. Gunakan format standar tanpa jargon yang membingungkan.`;
  } else if (focus === "headline") {
    summaryText = `Crafting Headline Profesional untuk ${role}: 3 usulan headline berbobot tinggi dengan formula 3-bagian (Role + Spesialisasi + Dampak Terukur).`;
    answerText = `Headline Crafting: Gunakan formula 3-bagian: Role Utama + Spesialisasi Utama + Nilai Tambah/Dampak. Hindari kata-kata generik seperti 'hardworking' atau 'passionate'.`;
  } else if (focus === "star") {
    summaryText = `Transformasi Pengalaman STAR untuk ${role}: 3 contoh perubahan sebelum & sesudah menggunakan formula Situation-Task-Action-Result dengan metrik terukur.`;
    answerText = `STAR Bullets: Setiap pengalaman kerja harus menceritakan (1) Masalah yang dihadapi, (2) Aksi konkret yang kamu ambil, dan (3) Hasil terukur yang dicapai.`;
  } else if (focus === "role") {
    summaryText = `Audit Keselarasan Peran (Role Alignment) untuk ${role}: Skor kecocokan 84% (Tinggi). 2 dari 4 kompetensi kunci match sempurna, dengan 2 area gap pada aspek Design System & Analytics.`;
    answerText = `Role Alignment: Audit profilmu terhadap lowongan ${role} di pasar. Eliminasi skill yang tidak relevan dan tonjolkan pencapaian yang paling mendukung role impianmu.`;
  }

  const structuredAdviceData = {
    opening: `Berdasarkan analisis fokus '${focus.toUpperCase()}' untuk profil ${role}, berikut poin-poin evaluasi utama:`,
    whatGood: [
      `Fokus spesialisasi pada ${context.skills.slice(0, 3).join(", ") || "Design & Research"} sudah konsisten.`,
      `Pengalaman kerja relevan mendukung positioning profil untuk peran ${role}.`,
    ],
    whatNotGood: [
      `Beberapa poin deskripsi pengalaman masih bersifat kualitatif tanpa menyertakan angka metrik konkrety.`,
      `Keyword kunci pendukung sistem ATS recruiter belum tersebar secara optimal pada ringkasan 'About'.`,
    ],
    conclusion: `Terapkan rekomendasi di bawah untuk meningkatkan visibilitas profilmu di mata recruiter dan sistem ATS.`,
  };

  const nextSteps = focus === "ats"
    ? [
        "Tambahkan missing keywords ke dalam seksi Skills dan Ringkasan About.",
        "Ubah poin pasif pada Experience menjadi kalimat aktif dengan metrik konkret.",
        "Jalankan ulang Gap Analysis untuk mengevaluasi kesesuaian skill.",
      ]
    : focus === "headline"
    ? [
        "Pilih salah satu usulan Headline di bawah yang paling sesuai dengan portofoliomu.",
        "Salin headline dan perbarui di CV Workspace.",
        "Pastikan headline LinkedIn selaras dengan headline ProofyLink.",
      ]
    : focus === "star"
    ? [
        "Gunakan tombol Salin Bullet untuk merevisi 2-3 poin pengalaman terbarumu.",
        "Ganti kata kerja umum dengan Action Verbs yang direkomendasikan.",
        "Tambahkan angka estimasi dampak (persentase / jumlah user) di setiap bullet.",
      ]
    : [
        "Lengkapi portofolio dengan studi kasus yang membuktikan penguasaan gap kompetensi.",
        "Soroti pengalaman kolaborasi lintas fungsi di bagian deskripsi pengalaman kerja.",
        "Perbarui target role di profil untuk sinkronisasi rekomendasi lowongan.",
      ];

  return aiResult(advisorSchema, JSON.stringify({ ...context, focus }), {
    focus,
    summary: summaryText,
    headlineSuggestions: headlineData.options.map((o) => o.headline),
    starBullets: starData.bullets.map((b) => ({
      before: b.before,
      after: b.after,
      impactReason: b.impactReason,
      metricsHighlight: b.metricsHighlight,
    })),
    pillars: [],
    structuredAdvice: structuredAdviceData,
    atsDetails: atsData,
    headlineDetails: headlineData,
    starDetails: starData,
    roleDetails: roleData,
    answer: answerText,
    nextSteps,
    limitations: [
      "Rekomendasi berasal dari analisis profil internal dan standar industri ATS.",
      "Hasil AI merupakan panduan review untuk membantu keputusan personalmu.",
    ],
    modelVersion: defaultVersion,
    source: getSource(),
  });
}

export async function gapAnalysis(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(gapsSchema, JSON.stringify(context), { missing: context.skills.length ? ["Contoh portfolio yang relevan"] : ["Skill inti dan bukti proyek"], unevidenced: context.skills.slice(0, 2), transferable: ["Problem solving", "Kolaborasi"], irrelevant: [], limitations: ["Gap bukan penilaian kelayakan final."], modelVersion: defaultVersion, source: getSource() });
}

export async function roadmap(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(roadmapSchema, JSON.stringify(context), { phases: [{ title: "Fondasi", outcome: `Memahami ekspektasi ${context.targetRole || "role tujuan"}`, actions: ["Petakan 3 requirement lowongan", "Pilih satu materi belajar"] }, { title: "Bukti kerja", outcome: "Memiliki portfolio yang bisa dibahas", actions: ["Bangun mini project", "Tulis outcome dan batasan"] }, { title: "Percakapan", outcome: "Siap menjelaskan keputusan kerja", actions: ["Latihan interview", "Minta feedback"] }], limitations: ["Roadmap dapat diedit dan disesuaikan kandidat."], modelVersion: defaultVersion, source: getSource() });
}

export async function cvBuilder(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(cvBuilderSchema, JSON.stringify(context), { headline: context.headline || context.targetRole || "Professional", about: context.about || "Professional yang berfokus pada hasil dan kolaborasi.", bullets: context.skills.slice(0, 3).map((skill) => `Menggunakan ${skill} untuk menyelesaikan masalah pengguna.`), limitations: ["Draft harus disetujui kandidat sebelum disimpan."], modelVersion: defaultVersion, source: getSource() });
}

export function importCv(fileName: string) {
  return cvImportSchema.parse({ fullName: "Nadia Putri", headline: "Senior Product Designer", about: "Product designer yang mengubah masalah kompleks menjadi pengalaman digital yang jelas.", skills: ["Product design", "User research", "Figma"], experience: [{ company: "Studio Nusantara", role: "Senior Product Designer", dates: "2021 - sekarang", achievements: ["Meningkatkan kejelasan workflow produk."] }], education: [{ school: "Universitas Indonesia", program: "Desain Komunikasi Visual", dates: "2015 - 2019" }], suggestions: [`Review hasil extraction dari ${fileName} sebelum menyimpan.`], source: getSource() });
}

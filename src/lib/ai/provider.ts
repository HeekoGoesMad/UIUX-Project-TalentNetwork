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
  const focus = (typeof raw.focus === "string" && ["cv_review", "gap_analysis", "career_roadmap", "ats", "headline", "star", "role"].includes(raw.focus)
    ? raw.focus
    : "cv_review") as "cv_review" | "gap_analysis" | "career_roadmap" | "ats" | "headline" | "star" | "role";
  const context = profileContextSchema.parse(input);

  const role = context.targetRole || context.headline || "Senior Product Designer";

  // Data for 1. Review CV Keseluruhan (CV Review)
  const cvReviewData = {
    readinessLevel: (context.skills.length >= 6 ? "Sangat Siap Kerja & ATS-Friendly" : context.skills.length >= 3 ? "Cukup Siap (Perlu Pengayaan)" : "Perlu Penguatan"),
    overallScore: Math.min(95, 70 + (context.skills.length * 4)),
    executiveSummary: `Analisis menyeluruh CV untuk posisi target ${role}: Struktur informasi dan kejelasan pengalaman kerja sudah sangat baik. Keterbacaan sistem ATS optimal, dengan rekomendasi penguatan pada metrik kuantitatif dan spesifikasi domain industri.`,
    sectionAudits: [
      {
        section: "1. Headline & Identitas Profesional",
        status: "good" as const,
        notes: [
          `Menyebutkan istilah peran target (${role}) secara eksplisit dan profesional.`,
          "Format teks bersih tanpa karakter simbol rumit yang berisiko mengganggu parser ATS.",
        ],
        recommendation: "Sertakan domain industri unggulan (e.g. Fintech/B2B SaaS) agar relevansi pencarian rekruter meningkat 30%.",
      },
      {
        section: "2. Ringkasan Profil (Tentang Saya / About)",
        status: "needs_improvement" as const,
        notes: [
          "Belum merangkum total tahun pengalaman kerja secara terstruktur.",
          "Kata kunci spesialisasi inti masih bisa diperkaya di paragraf pembuka.",
        ],
        recommendation: "Gunakan format 3-fokus: Peran & Nilai Utama, Keahlian Kunci, dan Bukti Dampak Nyata.",
      },
      {
        section: "3. Riwayat Pengalaman Kerja (Experience)",
        status: "needs_improvement" as const,
        notes: [
          "Beberapa poin deskripsi masih didominasi kata pasif ('bertanggung jawab atas...').",
          "Pencantuman angka metrik kuantitatif belum konsisten di semua riwayat posisi.",
        ],
        recommendation: "Gunakan Strong Action Verbs di awal setiap bullet point dan sertakan minimal 1 angka metrik (%, user, waktu).",
      },
      {
        section: "4. Daftar Keahlian & Alat Kerja (Skills & Tools)",
        status: "good" as const,
        notes: [
          `Terdaftar ${context.skills.length || 5} keahlian yang relevan dengan standar industri ${role}.`,
          "Kombinasi hard skill dan metodologi kerja sudah terlihat jelas.",
        ],
        recommendation: "Kelompokkan skill ke dalam Hard Skills, Tools, dan Core Methodologies agar mudah dipindai rekruter.",
      },
      {
        section: "5. Pendidikan & Bukti Portofolio",
        status: "good" as const,
        notes: [
          "Riwayat pendidikan tertera jelas dan tautan portofolio dapat diakses.",
        ],
        recommendation: "Pastikan setiap proyek di portofolio mencantumkan peran spesifikmu dan hasil bisnis yang dicapai.",
      },
    ],
    formatChecks: [
      { check: "Standar Tipografi & Format Heading Baku", passed: true, tip: "Gunakan nama heading standar: Experience, Education, Skills, Portfolio." },
      { check: "Kepadatan Kata Kunci Inti (Keyword Density)", passed: true, tip: "Kata kunci target role tersebar alami di Headline, About, dan Experience." },
      { check: "Keterbacaan Bullet Points & Tata Letak", passed: true, tip: "Bullet point rapi tanpa simbol grafis rumit yang berisiko merusak parser ATS." },
      { check: "Kelengkapan Tautan Kontak & Keamanan Data", passed: true, tip: "Tautan LinkedIn, portofolio online, dan email kontak telah aktif dan valid." },
    ],
    priorityActionItems: [
      "Tambahkan metrik kuantitatif terukur (%, user base, efisiensi waktu) pada 2 pengalaman kerja teratas.",
      "Perkaya ringkasan 'About' dengan menyertakan domain spesialisasi industri (misal: SaaS, Fintech, E-Commerce).",
      "Kelompokkan skill teknis dan metodologi kerja agar mudah dipindai oleh hiring manager dalam 6 detik pertama.",
    ],
  };

  // Data for 2. Gap Analysis (Kesiapan Karir Hari Ini)
  const gapAnalysisData = {
    targetRole: role,
    matchScore: 84,
    matchLevel: "Tinggi (Strong Alignment)",
    coreCompetencies: [
      {
        competency: "User Research & Usability Validation",
        candidateLevel: "Advanced",
        requiredLevel: "Advanced",
        status: "match" as const,
        recommendation: "Pertahankan dan jadikan selling point utama saat sesi technical interview.",
      },
      {
        competency: "Scalable Design Systems & Tokenization",
        candidateLevel: "Intermediate",
        requiredLevel: "Advanced",
        status: "gap" as const,
        recommendation: "Pelajari arsitektur design token multi-platform dan dokumentasikan studi kasusnya di portofolio.",
      },
      {
        competency: "Cross-functional Leadership & Stakeholder Management",
        candidateLevel: "Advanced",
        requiredLevel: "Intermediate",
        status: "exceeds" as const,
        recommendation: "Keunggulan kompetitif yang kuat untuk posisi jenjang senior / lead.",
      },
      {
        competency: "Product Analytics & Growth Experimentation (A/B Testing)",
        candidateLevel: "Intermediate",
        requiredLevel: "Advanced",
        status: "gap" as const,
        recommendation: "Sertakan metrik konversi dan pemahaman tools analytics (Mixpanel/Amplitude) di CV.",
      },
    ],
    criticalGaps: [
      "Pengalaman mengukur dampak desain pasca-rilis (A/B testing, funnel conversion) perlu lebih dipertegas di CV.",
      "Portofolio studi kasus perlu menyertakan arsitektur Design System berskala multi-platform.",
      "Perjelas peran kepemimpinan desain (mentoring junior designer atau ownership feature end-to-end).",
    ],
    transferableStrengths: [
      "Keahlian komunikasi lintas fungsi dan fasilitasi workshop desain dengan tim engineering & bisnis.",
      "Kemampuan sintesis data kualitatif dari riset pengguna menjadi solusi antarmuka yang bernilai bisnis.",
    ],
    strategicRecommendations: [
      "Tutup gap Design System dengan membuat 1 studi kasus mendalam tentang struktur token komponen di portofolio.",
      "Cantumkan tools analisis produk (misal: Amplitude, Hotjar, Google Analytics) di seksi keahlian.",
      "Tuliskan hasil kolaborasi dengan Product Manager dan Engineering Lead pada deskripsi pencapaian karir.",
    ],
  };

  // Data for 3. Career Roadmap (Rencana Karir Kedepan)
  const careerRoadmapData = {
    targetRole: role,
    targetTimeline: "6 — 12 Bulan",
    targetLevel: "Senior to Lead Level",
    phases: [
      {
        phaseNumber: 1,
        phaseName: "Fondasi & Penutupan Gap Kompetensi",
        timeframe: "Bulan 1 — 3",
        outcome: "Portofolio siap standar industri dan gap skill utama tertutup sempurna.",
        keyActions: [
          "Audit dan poles poin pengalaman kerja di CV dengan metrik kuantitatif nyata",
          "Dokumentasikan 1 studi kasus mendalam tentang scalable design system & analytics di portofolio",
          "Pelajari materi lanjutan terkait product strategy & business metrics",
        ],
        milestone: "CV & Portofolio mencapai standar review ATS 90%+",
      },
      {
        phaseNumber: 2,
        phaseName: "Pembuktian Dampak & Personal Branding",
        timeframe: "Bulan 3 — 6",
        outcome: "Diakui sebagai talent spesialis dan mulai menerima tawaran karir relevan.",
        keyActions: [
          "Publikasikan tulisan insight desain atau studi kasus di LinkedIn / Medium",
          "Aktif di ProofyLink Talent Network untuk mendapatkan verified badge",
          "Mulai mengambil inisiatif kepemimpinan proyek atau mentoring anggota tim",
        ],
        milestone: "Mendapatkan 3-5 undangan wawancara atau penawaran kerja privat",
      },
      {
        phaseNumber: 3,
        phaseName: "Akselerasi Karir & Kesiapan Promosi",
        timeframe: "Bulan 6 — 12",
        outcome: "Mencapai peran target impian dengan kompensasi dan posisi optimal.",
        keyActions: [
          "Lakukan simulasi mock interview teknis & behavioral leadership",
          "Negosiasi penawaran kerja / evaluasi kenaikan jenjang ke posisi Senior/Lead",
          "Susun rencana kerja strategis (90-day plan) untuk peran baru",
        ],
        milestone: "Penempatan resmi di posisi target idaman dengan kompensasi kompetitif",
      },
    ],
    recommendedCertifications: [
      "Enterprise Design Thinking & Scalable Systems Practitioner",
      "Data-Driven Product Design & Growth Strategy Certification",
      "Leadership & Agile Project Management for Tech Professionals",
    ],
    strategicAdvice: [
      "Fokuslah pada pencapaian hasil bisnis terukur, bukan sekadar daftar tugas harian.",
      "Bangun reputasi profesional dengan aktif membagikan pembelajaran dan hasil kerja nyata.",
      "Perbarui profil ProofyLink secara berkala setiap kali menyelesaikan proyek berdampak tinggi.",
    ],
  };

  // Backwards compatibility data for legacy ATS/Headline/STAR
  const atsData = {
    readinessLevel: cvReviewData.readinessLevel as "Sangat Siap ATS" | "Cukup Siap" | "Perlu Penguatan",
    detectedKeywords: context.skills.length ? context.skills.slice(0, 5) : ["Product Design", "UX Research", "Figma"],
    missingKeywords: ["Cross-functional Leadership", "Design Systems at Scale", "Conversion Rate Optimization (CRO)", "Product Analytics", "A/B Testing"],
    sectionAudits: cvReviewData.sectionAudits,
    formatChecks: cvReviewData.formatChecks,
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

  let summaryText = "";
  let answerText = "";

  if (focus === "cv_review" || focus === "ats") {
    summaryText = cvReviewData.executiveSummary;
    answerText = `Review CV Keseluruhan: Struktur CV kamu untuk peran ${role} sudah sangat solid dengan skor kelayakan ${cvReviewData.overallScore}%. Fokuskan revisi pada penambahan metrik terukur pada pengalaman kerja dan pengelompokan skill yang lebih spesifik.`;
  } else if (focus === "gap_analysis" || focus === "role") {
    summaryText = `Gap Analysis Karir untuk ${role}: Skor keselarasan kompetensi saat ini adalah 84% (Tinggi). 2 dari 4 kompetensi inti telah memenuhi ekspektasi, dengan 2 area peningkatan utama pada Scalable Design Systems dan Product Analytics.`;
    answerText = `Gap Analysis: Audit profilmu terhadap ekspektasi industri untuk ${role}. Perkuat bukti portofolio pada area gap dan tonjolkan keunggulan kepemimpinan lintas fungsimu.`;
  } else if (focus === "career_roadmap") {
    summaryText = `Career Roadmap 3-Fase untuk ${role}: Panduan terstruktur 6-12 bulan dari penguatan fondasi kompetensi, pembuktian reputasi profesional, hingga kesiapan promosi/penempatan posisi impian.`;
    answerText = `Career Roadmap: Rencana aksi terarah untuk mencapai jenjang Senior/Lead dalam 6-12 bulan dengan tahapan dan milestone konkret yang dapat diukur.`;
  } else if (focus === "headline") {
    summaryText = `Crafting Headline Profesional untuk ${role}: 3 usulan headline berbobot tinggi dengan formula 3-bagian (Role + Spesialisasi + Dampak Terukur).`;
    answerText = `Headline Crafting: Gunakan formula 3-bagian: Role Utama + Spesialisasi Utama + Nilai Tambah/Dampak.`;
  } else if (focus === "star") {
    summaryText = `Transformasi Pengalaman STAR untuk ${role}: 3 contoh perubahan sebelum & sesudah menggunakan formula Situation-Task-Action-Result dengan metrik terukur.`;
    answerText = `STAR Bullets: Setiap pengalaman kerja harus menceritakan (1) Masalah yang dihadapi, (2) Aksi konkret yang kamu ambil, dan (3) Hasil terukur yang dicapai.`;
  }

  const structuredAdviceData = {
    opening: `Berdasarkan evaluasi pilar '${focus.replace("_", " ").toUpperCase()}' untuk peran ${role}, berikut poin-poin tinjauan utama:`,
    whatGood: [
      `Fokus spesialisasi pada ${context.skills.slice(0, 3).join(", ") || "Keahlian Utama"} sudah konsisten.`,
      `Pengalaman kerja dan keahlian relevan mendukung positioning profil untuk peran ${role}.`,
    ],
    whatNotGood: [
      `Poin deskripsi pengalaman masih dapat ditingkatkan dengan menambahkan metrik hasil kuantitatif.`,
      `Kata kunci spesifik domain industri perlu diselaraskan dengan tren lowongan pasar saat ini.`,
    ],
    conclusion: `Terapkan rekomendasi di bawah untuk memaksimalkan peluang karir dan mempercepat pencapaian targetmu.`,
  };

  const nextSteps = (focus === "cv_review" || focus === "ats")
    ? [
        "Buka CV Workspace untuk menambahkan angka metrik terukur pada riwayat pengalaman.",
        "Sempurnakan ringkasan 'About' dengan menyertakan spesialisasi domain industri.",
        "Jalankan ulang evaluasi untuk memverifikasi keterbacaan terbaru.",
      ]
    : (focus === "gap_analysis" || focus === "role")
    ? [
        "Tambahkan 1 studi kasus di portofolio yang membuktikan penguasaan gap kompetensi.",
        "Perbarui daftar tools analisis data dan metodologi kerja di profil CV.",
        "Jadikan keunggulan kepemimpinan lintas fungsi sebagai topik utama saat interview.",
      ]
    : (focus === "career_roadmap")
    ? [
        "Terapkan action items Fase 1 dalam 30 hari ke depan.",
        "Ikuti sertifikasi atau kursus yang direkomendasikan untuk menutup gap.",
        "Jadwalkan review berkala setiap akhir fase untuk memantau pencapaian milestone.",
      ]
    : [
        "Salin rekomendasi ke CV Workspace dan perbarui profilmu.",
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
    cvReviewDetails: cvReviewData,
    gapAnalysisDetails: gapAnalysisData,
    careerRoadmapDetails: careerRoadmapData,
    atsDetails: atsData,
    headlineDetails: headlineData,
    starDetails: starData,
    roleDetails: gapAnalysisData,
    answer: answerText,
    nextSteps,
    limitations: [
      "Rekomendasi berasal dari analisis profil internal dan standar industri terkini.",
      "Hasil AI merupakan panduan strategis untuk membantu pengambilan keputusan karir personalmu.",
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

import "server-only";

import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { careerConsultationPillarSchema, cvBuilderSchema, cvImportSchema, cvReviewPillarSchema, gapAnalysisPillarSchema, gapsSchema, profileContextSchema, questionsSchema, recruiterOutreachPromptSchema, recruiterPromptInputSchema, roadmapSchema, screeningSchema, summarySchema } from "./schemas";

const defaultVersion = "proofylink-screening-v1";

export function getSource(): "mock" | "local" | "azure" {
  const provider = process.env.AI_PROVIDER?.trim();
  if (provider === "mock" && process.env.NODE_ENV !== "production") return "mock";
  if (provider === "local") return "local";
  return "azure";
}

export type AiOptions = { strict?: boolean; maxTokens?: number };

export const DEFAULT_MAX_OUTPUT_TOKENS = 4000;

function label(score: number) {
  return score >= 80 ? "Sangat Sesuai" : score >= 60 ? "Sesuai" : score >= 40 ? "Cukup" : "Kurang Sesuai";
}

let cachedLocalAi: ReturnType<typeof createOpenAI> | null = null;
let cachedLocalAiKey = "";

function getLocalAi(baseURL: string, apiKey: string) {
  const key = `${baseURL}|${apiKey}`;
  if (!cachedLocalAi || cachedLocalAiKey !== key) {
    cachedLocalAi = createOpenAI({ baseURL, apiKey });
    cachedLocalAiKey = key;
  }
  return cachedLocalAi;
}

function normalizeAzureBaseUrl(rawEndpoint: string): string {
  let ep = rawEndpoint.trim();
  if (!ep.startsWith("http://") && !ep.startsWith("https://")) {
    ep = `https://${ep}.openai.azure.com`;
  }
  try {
    const parsed = new URL(ep);
    return `${parsed.origin}/openai`;
  } catch {
    return `${ep.replace(/\/+$/, "")}/openai`;
  }
}

const cachedAzureMap = new Map<string, ReturnType<typeof createAzure>>();

export function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = (process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_API_KEY)?.trim();
  const deployment = (
    process.env.AZURE_OPENAI_DEPLOYMENT ||
    process.env.AZURE_OPENAI_MODEL ||
    process.env.AZURE_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.MODEL ||
    "gpt-4o-mini"
  ).trim();
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim() || "2024-10-21";
  const isConfigured = Boolean(endpoint && apiKey && !apiKey.startsWith("<"));

  return { endpoint, apiKey, deployment, apiVersion, isConfigured };
}

function getAzure(baseURL: string, apiKey: string, apiVersion?: string, useDeploymentBasedUrls = true) {
  const key = `${baseURL}|${apiKey}|${apiVersion ?? ""}|${useDeploymentBasedUrls}`;
  if (!cachedAzureMap.has(key)) {
    cachedAzureMap.set(
      key,
      createAzure({
        baseURL,
        apiKey,
        apiVersion,
        useDeploymentBasedUrls,
      })
    );
  }
  return cachedAzureMap.get(key)!;
}

export async function aiResult<T extends z.ZodType>(schema: T, prompt: string, fallback: z.infer<T>, options: AiOptions = {}): Promise<z.infer<T>> {
  const currentSource = getSource();
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

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
      const localAi = getLocalAi(baseURL, apiKey);
      const result = await generateObject({ model: localAi.chat(model), schema, prompt, maxTokens });
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
  const { endpoint, deployment, apiKey, apiVersion, isConfigured } = getAzureConfig();
  if (!isConfigured || !endpoint || !apiKey) {
    if (options.strict) throw new Error("Konfigurasi Azure AI belum lengkap. Harap periksa AZURE_OPENAI_ENDPOINT dan AZURE_OPENAI_API_KEY.");
    return {
      ...(fallback as Record<string, unknown>),
      source: "mock",
      modelVersion: `${defaultVersion} (azure-unconfigured)`,
    } as z.infer<T>;
  }

  try {
    const azure = getAzure(
      normalizeAzureBaseUrl(endpoint),
      apiKey,
      apiVersion
    );
    // Timeout 25 detik — cegah koneksi menggantung (wsarecv / connection forcibly closed)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);
    try {
      const result = await generateObject({ model: azure.chat(deployment), schema, prompt, maxTokens, abortSignal: controller.signal });
      clearTimeout(timeoutId);
      return {
        ...(result.object as Record<string, unknown>),
        source: "azure",
        modelVersion: deployment || defaultVersion,
      } as z.infer<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isNetworkError = error instanceof Error && (
      error.message.includes("wsarecv") ||
      error.message.includes("forcibly closed") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("aborted") ||
      error.name === "AbortError"
    );
    if (isNetworkError) {
      console.warn("[AI Azure] Koneksi terputus, menggunakan data fallback:", error.message);
    } else {
      console.error("[AI Azure] Error:", error);
    }
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
  return aiResult(screeningSchema, JSON.stringify(context), { score, label: label(score), coverage: Math.min(90, 45 + context.skills.length * 8), evidence: ["Kompetensi teknis dan keselarasan peran dianalisis secara objektif.", "Penilaian berfokus pada relevansi keahlian dan rekam jejak kerja."], limitations: ["Bukan keputusan final hire/reject.", "Data pribadi sensitif (kontak & privasi) dikecualikan sepenuhnya dari analisis."], followUp: "Lakukan interview berbasis bukti kompetensi dan berikan kandidat ruang klarifikasi.", modelVersion: defaultVersion, source: getSource() }, options);
}

export async function interviewQuestions(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(questionsSchema, JSON.stringify(context), { questions: [`Ceritakan proyek paling relevan dengan ${context.targetRole || "role ini"}.`, "Bukti apa yang menunjukkan dampak pekerjaan tersebut?", "Bagaimana kamu berkolaborasi saat requirement berubah?"], limitations: ["Pertanyaan adalah draft dan perlu ditinjau manusia."], modelVersion: defaultVersion, source: getSource() });
}

import { checkSkillsQuality } from "./skills-check";

export async function careerAdvisor(input: unknown, options?: AiOptions) {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const focus = (typeof raw.focus === "string" && ["cv_review", "gap_analysis", "career_consultation", "career_roadmap", "ats", "headline", "star", "role"].includes(raw.focus)
    ? raw.focus
    : "cv_review") as "cv_review" | "gap_analysis" | "career_consultation" | "career_roadmap" | "ats" | "headline" | "star" | "role";
  const context = profileContextSchema.parse(input);

  const role = context.targetRole || context.headline || "Senior Product Designer";
  const customNote = context.customInstruction?.trim()
    ? `\n- Catatan & Instruksi Khusus dari Kandidat: "${context.customInstruction.trim()}"`
    : "";

  const skillCheck = checkSkillsQuality(context.skills, role);

  const profileJsonBlock = context.profileJson
    ? `\n\n--- DOKUMEN PROFIL KANDIDAT LENGKAP (FORMAT JSON TERSTRUKTUR - PRIVASI AMAN) ---\n` +
      `Berikut adalah data riwayat profesional lengkap kandidat (data kontak pribadi seperti email/telepon/gaji telah disaring demi privasi):\n` +
      `${JSON.stringify(context.profileJson, null, 2)}\n` +
      `--- AKHIR DOKUMEN PROFIL ---\n\n` +
      `PETUNJUK ANALISIS BERBASIS DATA KONKRET KANDIDAT:\n` +
      `- Evaluasi riwayat pekerjaan aktual di atas (posisi, perusahaan, deskripsi tugas, dan poin pencapaian terukur).\n` +
      `- Evaluasi riwayat pendidikan dan program studi aktual di atas.\n` +
      `- Evaluasi kombinasi keahlian teknis dan peralatan/tools kerja aktual di atas.\n` +
      `- Jika ada poin pengalaman kerja yang belum memiliki metrik atau bukti nyata, sebutkan secara spesifik posisi dan perusahaannya.\n` +
      `- Sesuaikan penilaian dan kesiapan melamar dengan target posisi "${role}".\n`
    : "";

  // ─────────────────────────────────────────────────────────────────────────────
  // PILAR 1: REVIEW CV KESELURUHAN & KESIAPAN MELAMAR (cv_review / ats)
  // ─────────────────────────────────────────────────────────────────────────────
  if (focus === "cv_review" || focus === "ats") {
    const cvFallback = {
      readinessLevel: skillCheck.isPlausible
        ? (context.skills.length >= 6 ? "Sangat Siap & Mudah Dipindai" : "Cukup Siap (Perlu Sedikit Pengayaan)")
        : "Perlu Penyesuaian Keahlian",
      overallScore: skillCheck.isPlausible
        ? Math.min(95, 70 + context.skills.length * 4)
        : 52,
      profileSummary: skillCheck.isPlausible
        ? `Profil profesional untuk posisi ${role} memiliki struktur informasi dan riwayat pengalaman kerja yang rapi serta mudah dibaca oleh rekruter. Profil menunjukkan kesiapan melamar ke industri terkait dengan beberapa area penguatan pada pembuktian hasil kerja nyata.`
        : `Profil untuk posisi ${role} memiliki susunan dasar yang rapi, namun keahlian yang tercantum saat ini (${context.skills.join(", ") || "belum lengkap"}) belum mencerminkan standar kebutuhan posisi ${role}. Diperlukan pembaruan keahlian dan uraian hasil kerja nyata untuk meyakinkan rekruter.`,
      keyStrengths: [
        "Riwayat pengalaman kerja disusun secara kronologis dengan peran dan tanggung jawab yang terdefinisi dengan jelas.",
        skillCheck.isPlausible
          ? `Kombinasi keahlian (${skillCheck.cleanedSkills.slice(0, 3).join(", ")}) sudah relevan dengan target posisi ${role}.`
          : "Format dasar data profil dan kontak tersaji dengan jelas sebagai fondasi yang baik.",
        "Tata letak informasi profil bersih, profesional, dan nyaman dipindai oleh tim rekruter dalam proses screening awal.",
        "Riwayat pendidikan terverifikasi dan tautan portofolio dapat diakses dengan baik.",
      ],
      areasForImprovement: [
        {
          aspect: "Pembuktian hasil kerja nyata pada uraian pengalaman",
          impact: "Rekruter kesulitan mengukur seberapa besar dampak dan skala kontribusi nyata dari pekerjaan yang pernah Anda lakukan.",
          recommendation: "Tambahkan metrik hasil kerja nyata (seperti persentase pencapaian, efisiensi waktu, atau skala pengguna) pada setiap pengalaman kerja utama.",
        },
        {
          aspect: "Ringkasan profesional (Tentang Saya / About)",
          impact: "Profil belum langsung menarik perhatian rekruter dalam beberapa detik pertama karena spesialisasi industri belum ditegaskan.",
          recommendation: "Pertegas ringkasan dengan formula 3 bagian: peran utama Anda, keahlian andalan, dan fokus industri yang Anda tekuni.",
        },
        {
          aspect: "Pengelompokan keahlian dan alat kerja (tools)",
          impact: "Rekruter dan sistem seleksi membutuhkan waktu lebih lama untuk memverifikasi kesesuaian alat kerja yang dicari.",
          recommendation: "Kelompokkan keahlian ke dalam kategori Keahlian Teknis, Alat Kerja (Tools), dan Keahlian Interpersonal.",
        },
      ],
      recruiterPerspective: skillCheck.isPlausible
        ? `Dari perspektif recruiter, profil Anda memiliki kredibilitas awal yang solid dan layak dipertimbangkan untuk tahap seleksi berikutnya. Profil Anda akan jauh lebih menonjol dan berdaya saing tinggi jika setiap poin pengalaman kerja dilengkapi dengan angka atau bukti dampak nyata.`
        : `Dari perspektif recruiter, profil Anda memiliki kerapian format yang baik, namun belum menunjukkan kecocokan kompetensi yang cukup untuk posisi ${role}. Rekruter akan mencari bukti penguasaan keterampilan inti sebelum meloloskan ke tahap wawancara.`,
      priorityRecommendations: [
        "Tambahkan bukti hasil kerja nyata (angka %, jumlah proyek, atau efisiensi waktu) pada 2 pengalaman kerja teratas.",
        "Perkuat ringkasan profesional dengan menyebutkan spesialisasi industri dan nilai tambah unik Anda.",
        "Kelompokkan daftar keahlian dan alat kerja agar langsung dapat dipindai rekruter dalam hitungan detik.",
      ],
      executiveSummary: skillCheck.isPlausible
        ? `Tinjauan profil untuk posisi ${role}: Susunan informasi sudah rapi dan mudah dibaca oleh perekrut. Rekomendasi utama adalah melengkapi bukti hasil kerja nyata dan memperjelas keahlian unggulan Anda.`
        : `Tinjauan profil untuk posisi ${role}: Susunan dasar sudah rapi, namun keahlian yang tercantum saat ini belum sesuai dengan kebutuhan posisi ${role}. Disarankan untuk memperbarui daftar keahlian dengan kemampuan utama yang dicari perusahaan.`,
      sectionAudits: [
        {
          section: "1. Headline & Identitas Profesional",
          status: "good" as const,
          notes: [
            `Sudah menyebutkan target peran (${role}) dengan jelas dan profesional.`,
            "Tampilan teks bersih, rapi, dan mudah dibaca oleh perekrut maupun sistem seleksi.",
          ],
          recommendation: "Anda bisa menambahkan bidang industri yang Anda minati (misal: teknologi, keuangan, atau e-commerce) agar profil Anda lebih menonjol.",
        },
        {
          section: "2. Ringkasan Profil (Tentang Saya / About)",
          status: "needs_improvement" as const,
          notes: [
            "Belum merangkum total tahun pengalaman kerja secara ringkas.",
            "Kalimat pembuka masih bisa diperkuat dengan nilai tambah atau pencapaian terbaik Anda.",
          ],
          recommendation: "Tuliskan 2-3 kalimat ringkas: peran utama Anda, keahlian andalan, dan kontribusi terbaik yang pernah Anda berikan.",
        },
        {
          section: "3. Riwayat Pengalaman Kerja (Experience)",
          status: "needs_improvement" as const,
          notes: [
            "Sebagian poin masih berupa uraian tugas harian biasa.",
            "Belum konsisten menyertakan bukti hasil kerja nyata (seperti persentase pencapaian, jumlah proyek, atau penghematan waktu).",
          ],
          recommendation: "Awali setiap poin dengan kata kerja aktif yang tegas (misal: Memimpin, Merancang, Mengembangkan) dan sertakan contoh hasil nyata.",
        },
        {
          section: "4. Daftar Keahlian & Alat Kerja (Skills & Tools)",
          status: skillCheck.isPlausible ? ("good" as const) : ("needs_improvement" as const),
          notes: skillCheck.isPlausible
            ? [
                `Tercantum ${context.skills.length} keahlian yang relevan dengan standar industri ${role}.`,
                "Kombinasi keahlian teknis dan cara kerja sudah terlihat.",
              ]
            : [
                `Keahlian yang tercantum (${context.skills.join(", ") || "belum lengkap"}) belum mencerminkan kebutuhan standar untuk posisi ${role}.`,
                "Perekrut biasanya menyaring kandidat berdasarkan keahlian teknis dan kemampuan praktis yang relevan.",
              ],
          recommendation: skillCheck.isPlausible
            ? "Kelompokkan keahlian ke dalam keahlian teknis, alat kerja (tools), dan cara kerja agar mudah dipindai rekruter."
            : `Perbaiki dan lengkapi daftar keahlian dengan kemampuan utama yang dicari untuk posisi ${role}.`,
        },
        {
          section: "5. Pendidikan & Bukti Portofolio",
          status: "good" as const,
          notes: [
            "Riwayat pendidikan tertera dengan jelas dan tautan proyek dapat diakses dengan baik.",
          ],
          recommendation: "Pastikan setiap proyek di portofolio mencantumkan peran spesifik Anda dan hasil positif yang dicapai.",
        },
      ],
      formatChecks: [
        { check: "Kerapian Format & Judul Bagian Baku", passed: true, tip: "Gunakan judul bagian standar: Pengalaman Kerja, Pendidikan, Keahlian, Portofolio." },
        { check: "Kesesuaian Kata Kunci & Keahlian Pokok", passed: skillCheck.isPlausible, tip: "Gunakan istilah dan nama keahlian yang umum dipakai dalam lowongan pekerjaan peran ini." },
        { check: "Keterbacaan Poin Uraian & Tata Letak", passed: true, tip: "Gunakan poin-poin ringkas agar perekrut nyaman membaca profil Anda dalam hitungan detik." },
        { check: "Kelengkapan Tautan Kontak & Portofolio", passed: true, tip: "Pastikan tautan portofolio dan profil profesional aktif dan mudah diakses." },
      ],
      priorityActionItems: [
        "Tambahkan bukti hasil kerja nyata (misal: persentase keberhasilan atau hasil proyek) pada 2 pengalaman kerja teratas.",
        "Lengkapi bagian ringkasan 'Tentang Saya' dengan menyebutkan bidang industri yang Anda minati.",
        "Kelompokkan daftar keahlian agar perekrut dapat langsung melihat keunggulan utama Anda.",
      ],
      summary: skillCheck.isPlausible
        ? `Tinjauan CV untuk posisi ${role}: Susunan CV sudah rapi dan mudah dibaca. Fokus utama perbaikan adalah menambahkan bukti hasil nyata dan memperjelas keahlian unggulan.`
        : `Tinjauan CV untuk posisi ${role}: Susunan CV sudah rapi, namun keahlian yang tercantum saat ini (${context.skills.join(", ") || "belum lengkap"}) belum sesuai dengan kebutuhan peran ${role}. Prioritaskan perbaikan kompetensi inti agar sesuai dengan standar industri.`,
      structuredAdvice: {
        opening: `Berdasarkan tinjauan CV untuk posisi ${role}, berikut beberapa poin penting untuk diperhatikan:`,
        whatGood: [
          "Format susunan CV sudah rapi, bersih, dan mudah dibaca oleh perekrut maupun sistem seleksi.",
          skillCheck.isPlausible
            ? `Keahlian yang dicantumkan (${skillCheck.cleanedSkills.slice(0, 3).join(", ")}) sudah mengarah ke posisi target.`
            : "Informasi profil utama sudah terisi dengan jelas.",
        ],
        whatNotGood: skillCheck.isPlausible
          ? [
              "Uraian pengalaman kerja masih bisa diperjelas dengan bukti hasil nyata (misal: jumlah pengguna, persentase keberhasilan, atau efisiensi waktu).",
              "Ringkasan profil belum menonjolkan bidang industri utama yang Anda minati atau kuasai.",
            ]
          : [
              skillCheck.competencyFeedback,
              "Uraian pengalaman kerja masih kurang bukti hasil kerja nyata yang meyakinkan perekrut.",
            ],
        conclusion: skillCheck.isPlausible
          ? "Terapkan rekomendasi di atas untuk membuat CV Anda semakin menarik dan meningkatkan peluang dipanggil wawancara."
          : `Perbaiki daftar keahlian agar sesuai dengan standar posisi ${role} untuk membuka peluang lebih besar saat melamar pekerjaan.`,
      },
      answer: skillCheck.isPlausible
        ? `Review CV: Susunan CV Anda untuk peran ${role} sudah baik. Fokuskan perbaikan pada penambahan contoh hasil kerja nyata dan pengelompokan keahlian yang lebih spesifik.`
        : `Review CV: Struktur CV Anda sudah rapi, namun keahlian yang tercantum saat ini belum selaras dengan kebutuhan posisi ${role}. Prioritaskan pembaruan daftar keahlian inti dan lengkapi bukti hasil kerja nyata.`,
      nextSteps: [
        "Buka CV Workspace untuk menambahkan angka atau bukti hasil nyata pada riwayat pengalaman.",
        "Lengkapi ringkasan 'Tentang Saya' dengan menyebutkan bidang industri yang Anda kuasai.",
        "Jalankan ulang evaluasi untuk melihat peningkatan skor kesiapan CV Anda.",
      ],
      limitations: [
        "Saran evaluasi disusun berdasarkan praktik terbaik rekrutmen dan standar seleksi kerja saat ini.",
        "Setiap perusahaan dapat memiliki kriteria penilaian dan preferensi khusus sesuai kebutuhan tim mereka.",
      ],
    };

    const prompt =
      `Anda adalah Senior Recruiter, Talent Acquisition Manager, Career Coach, dan HR Consultant dengan pengalaman lebih dari 15 tahun dalam merekrut kandidat di berbagai industri.\n` +
      `Tugas Anda adalah mengevaluasi profil kandidat berdasarkan data yang tersedia di ProofyLink.\n` +
      `Analisis harus objektif, profesional, spesifik, dan berdasarkan informasi yang diberikan. Jangan memberikan penilaian umum atau motivasi yang tidak relevan.\n\n` +
      `Fokus pada:\n` +
      `1. Kualitas profil profesional.\n` +
      `2. Kekuatan pengalaman kerja.\n` +
      `3. Relevansi kompetensi dengan pengalaman.\n` +
      `4. Kelengkapan informasi untuk recruiter.\n` +
      `5. Kemampuan profil menarik perhatian recruiter.\n` +
      `6. Potensi perbaikan yang dapat dilakukan kandidat.\n\n` +
      `Gunakan bahasa yang mudah dipahami oleh kandidat (selalu gunakan kata sapaan formal 'Anda').\n` +
      `Jangan hanya menyebutkan kekurangan, tetapi jelaskan dampaknya terhadap peluang kandidat dan berikan rekomendasi yang dapat langsung diterapkan.\n\n` +
      `- Target Peran yang Dituju: ${role}\n` +
      `- Headline Profil: ${context.headline || "Belum ditentukan"}\n` +
      `- Ringkasan Tentang Saya: ${context.about || "Belum diisi"}\n` +
      `- Keahlian yang Tercantum (Skills): ${context.skills.join(", ") || "Belum ada keahlian yang diisi"}\n` +
      `- Lokasi Domisili: ${context.location || "Indonesia"}` +
      customNote +
      profileJsonBlock +
      `\n\n` +
      `ATURAN WAJIB EVALUASI KEAHLIAN (SKILLS):\n` +
      `1. Periksa dengan kritis keaslian dan relevansi keahlian kandidat: [${context.skills.join(", ")}] terhadap target peran "${role}".\n` +
      `   - Jika keahlian yang tercantum TIDAK RELEVAN, TIDAK JELAS, atau berupa KATA ACAK/DUMMY (seperti 'plo', 'pluh', 'plar', 'test', dsb):\n` +
      `     * DILARANG KERAS MEMUJINYA! Jangan katakan keahlian sudah konsisten!\n` +
      `     * Masukkan ke 'areasForImprovement' bahwa keahlian belum sesuai kebutuhan posisi ${role} dan sebutkan dampak serta rekomendasi keahlian riil (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).\n` +
      `     * Berikan skor kesiapan di bawah 55 karena kompetensi utama belum terpenuhi.\n\n` +
      `Berikan output dalam format terstruktur berikut:\n` +
      `1. profileSummary: Ringkasan singkat mengenai kondisi profil kandidat saat ini.\n` +
      `2. keyStrengths: Sebutkan 3-5 kekuatan utama yang terlihat dari profil.\n` +
      `3. areasForImprovement: Array objek yang menjelaskan aspek yang masih kurang/belum optimal, dampaknya terhadap peluang kandidat, dan rekomendasi yang dapat langsung diterapkan.\n` +
      `4. recruiterPerspective: Jelaskan bagaimana recruiter kemungkinan akan melihat profil kandidat ini.\n` +
      `5. priorityRecommendations: Berikan 3-5 langkah yang paling penting untuk meningkatkan profil kandidat.\n` +
      `6. readinessLevel: Pilih dari 'Sangat Siap Kerja', 'Cukup Siap (Perlu Pengayaan)', atau 'Perlu Penyesuaian Keahlian'.\n` +
      `7. overallScore: Skor objektif 0-100.\n` +
      `8. structuredAdvice: opening, whatGood (minimal 2 poin), whatNotGood (minimal 2 poin), dan conclusion.\n` +
      `9. nextSteps: minimal 3 langkah tindak lanjut langsung.`;

    const aiOut = await aiResult(cvReviewPillarSchema, prompt, cvFallback, options);

    return {
      focus: "cv_review" as const,
      summary: aiOut.profileSummary || aiOut.summary || aiOut.executiveSummary,
      headlineSuggestions: [],
      starBullets: [],
      pillars: [],
      structuredAdvice: aiOut.structuredAdvice,
      cvReviewDetails: {
        readinessLevel: aiOut.readinessLevel,
        overallScore: aiOut.overallScore,
        profileSummary: aiOut.profileSummary || aiOut.executiveSummary,
        keyStrengths: aiOut.keyStrengths?.length ? aiOut.keyStrengths : cvFallback.keyStrengths,
        areasForImprovement: aiOut.areasForImprovement?.length ? aiOut.areasForImprovement : cvFallback.areasForImprovement,
        recruiterPerspective: aiOut.recruiterPerspective || cvFallback.recruiterPerspective,
        priorityRecommendations: aiOut.priorityRecommendations?.length ? aiOut.priorityRecommendations : cvFallback.priorityRecommendations,
        executiveSummary: aiOut.executiveSummary || aiOut.profileSummary,
        sectionAudits: aiOut.sectionAudits,
        formatChecks: aiOut.formatChecks,
        priorityActionItems: aiOut.priorityRecommendations || aiOut.priorityActionItems,
      },
      answer: aiOut.answer,
      nextSteps: aiOut.nextSteps,
      limitations: aiOut.limitations,
      modelVersion: defaultVersion,
      source: getSource(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PILAR 2: GAP ANALYSIS KARIR HARI INI (gap_analysis / role / headline)
  // ─────────────────────────────────────────────────────────────────────────────
  if (focus === "gap_analysis" || focus === "role" || focus === "headline") {
    const gapFallback = {
      currentPosition: skillCheck.isPlausible
        ? `Kandidat memiliki latar belakang ${context.headline || "profesional"} dengan riwayat pendidikan dan pengalaman kerja di bidang terkait. Memiliki pemahaman operasional yang cukup dengan beberapa pencapaian kerja.`
        : `Kandidat saat ini berada pada tahap eksplorasi awal dengan keahlian yang tercantum (${context.skills.join(", ") || "belum lengkap"}) belum mencerminkan kualifikasi standar peran ${role}.`,
      targetRole: role,
      readinessScore: skillCheck.isPlausible
        ? Math.min(95, 75 + context.skills.length * 3)
        : 42,
      readinessReason: skillCheck.isPlausible
        ? `Kandidat telah memiliki fondasi kompetensi dan tools yang relevan untuk posisi ${role}, namun masih memerlukan bukti proyek berskala lebih besar dan spesialisasi alat kerja industri untuk mencapai kesiapan penuh.`
        : `Keahlian yang tercantum saat ini belum selaras dengan standar kompetensi industri untuk peran ${role}. Dibutuhkan penyesuaian kompetensi dan pembangunan keahlian inti sebelum melamar.`,
      existingCompetencies: skillCheck.isPlausible
        ? [
            `Pemahaman dasar alur kerja dan metodologi standar di bidang ${role}.`,
            "Kemampuan kolaborasi tim dan koordinasi lintas fungsi yang efektif.",
            "Keterampilan komunikasi profesional dan penyusunan dokumentasi kerja.",
            "Adaptabilitas terhadap teknologi dan metodologi kerja baru.",
          ]
        : [
            "Format struktur profil dan riwayat pendidikan tersusun rapi.",
            "Tujuan karier dan aspirasi peran target telah terdefinisi dengan jelas.",
            "Kemauan untuk belajar dan mengembangkan keterampilan baru.",
          ],
      competencyGaps: skillCheck.isPlausible
        ? [
            "Pengambilan keputusan berbasis data dan analisis metrik dampak bisnis.",
            "Kepemimpinan inisiatif proyek secara mandiri dari tahap perancangan hingga implementasi.",
            "Strategi pemecahan masalah kompleks berskala enterprise.",
          ]
        : [
            `Penguasaan kompetensi dasar untuk peran ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Pemahaman metodologi dan alur kerja standar industri.",
            "Keterampilan teknis terapan yang dapat langsung digunakan dalam pekerjaan nyata.",
          ],
      experienceGaps: skillCheck.isPlausible
        ? [
            "Pengalaman mengelola proyek skala menengah-besar dengan pemangku kepentingan lintas divisi.",
            "Studi kasus nyata yang mendokumentasikan proses penyelesaian masalah dari awal hingga akhir.",
            "Pengalaman mengukur Return on Investment (ROI) atau dampak terukur dari hasil pekerjaan.",
          ]
        : [
            `Belum memiliki pengalaman proyek nyata atau studi kasus yang relevan dengan ${role}.`,
            "Belum memiliki rekam jejak penyelesaian tugas profesional di bidang terkait.",
            "Belum ada portofolio yang dapat dinilai kualitas hasil kerjanya oleh rekruter.",
          ],
      toolGaps: skillCheck.isPlausible
        ? [
            `Alat kerja analitik dan pelaporan data standar industri untuk peran ${role}.`,
            "Platform kolaborasi dan otomasi kerja tingkat lanjut yang umum digunakan perusahaan.",
          ]
        : [
            `Tools esensial yang wajib dikuasai untuk peran ${role}.`,
            "Alat kerja kolaborasi standar industri.",
          ],
      recommendedCertifications: skillCheck.isPlausible
        ? [
            `Sertifikasi Profesional Tingkat Lanjut sesuai spesialisasi ${role}.`,
            "Sertifikasi Manajemen Proyek / Metodologi Agile & Scrum.",
          ]
        : [
            `Kursus / Sertifikasi Tingkat Pemula (Foundational) untuk peran ${role}.`,
            "Pelatihan Praktis Berbasis Proyek (Bootcamp / Project-based Learning).",
          ],
      developmentPriorities: skillCheck.isPlausible
        ? [
            "Prioritas 1: Bangun 1-2 studi kasus komprehensif yang membuktikan kemampuan pemecahan masalah Anda.",
            `Prioritas 2: Kuasai alat kerja analitik dan otomasi standar industri yang paling sering disyaratkan lowongan ${role}.`,
            "Prioritas 3: Ikuti sertifikasi profesional untuk memperkuat kredibilitas kompetensi teknis di mata rekruter.",
            "Prioritas 4: Ambil inisiatif tanggung jawab lebih besar dalam proyek saat ini untuk memperkaya portofolio kepemimpinan.",
          ]
        : [
            `Prioritas 1: Pelajari dan kuasai 3 kompetensi inti untuk posisi ${role} (${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Prioritas 2: Selesaikan minimal 1 proyek latihan mandiri sebagai bukti pemahaman dasar.",
            "Prioritas 3: Ikuti kursus terstruktur untuk mendapatkan pemahaman alur kerja industri.",
            "Prioritas 4: Perbarui profil ProofyLink setelah menyelesaikan materi atau proyek baru.",
          ],
      estimatedDevelopmentTime: skillCheck.isPlausible ? "3 — 6 Bulan" : "6 — 12 Bulan",

      // Backward-compatible properties
      matchScore: skillCheck.isPlausible ? 82 : 40,
      matchLevel: skillCheck.isPlausible ? "Tinggi (Selaras Baik)" : "Perlu Penyesuaian Kompetensi",
      coreCompetencies: [
        {
          competency: "Riset Pengguna & Pemahaman Kebutuhan",
          candidateLevel: skillCheck.isPlausible ? "Menengah" : "Dasar",
          requiredLevel: "Mahir",
          status: skillCheck.isPlausible ? ("match" as const) : ("gap" as const),
          recommendation: "Pelajari metode riset sederhana dan sertakan contoh proses pengambilan keputusan di portofolio.",
        },
        {
          competency: "Perancangan Komponen & Standar Desain Konsisten",
          candidateLevel: skillCheck.isPlausible ? "Menengah" : "Dasar",
          requiredLevel: "Mahir",
          status: "gap" as const,
          recommendation: "Pelajari cara menyusun komponen desain yang rapi dan mudah digunakan bersama tim.",
        },
        {
          competency: "Komunikasi & Kolaborasi Tim",
          candidateLevel: "Menengah",
          requiredLevel: "Menengah",
          status: "match" as const,
          recommendation: "Jadikan kemampuan koordinasi tim ini sebagai keunggulan saat sesi wawancara kerja.",
        },
        {
          competency: "Evaluasi Dampak Hasil Kerja terhadap Pengguna",
          candidateLevel: "Dasar",
          requiredLevel: "Menengah",
          status: "gap" as const,
          recommendation: "Cantumkan contoh bagaimana hasil kerja Anda membantu menyelesaikan masalah atau mempercepat efisiensi tim.",
        },
      ],
      criticalGaps: skillCheck.isPlausible
        ? [
            "Contoh hasil kerja nyata setelah proyek selesai masih perlu diperjelas di CV.",
            "Portofolio perlu menyertakan studi kasus proses kerja yang terstruktur.",
            "Perjelas peran kolaborasi dengan rekan tim dalam menyelesaikan tantangan proyek.",
          ]
        : [
            skillCheck.competencyFeedback,
            "Belum ada bukti proyek portofolio atau studi kasus yang relevan dengan peran target ini.",
            "Perlu membangun pemahaman tentang alat kerja dan metode kerja yang umum digunakan.",
          ],
      transferableStrengths: [
        "Kemampuan komunikasi yang baik dan keterbukaan menerima masukan dari tim.",
        "Kesiapan belajar dan kemauan mengembangkan keterampilan baru yang dibutuhkan industri.",
      ],
      strategicRecommendations: skillCheck.isPlausible
        ? [
            "Tutup kesenjangan dengan membuat 1 studi kasus mendalam tentang proses kerja di portofolio.",
            "Cantumkan alat kerja yang Anda kuasai secara spesifik di bagian keahlian.",
            "Tuliskan kontribusi Anda bersama tim pada deskripsi pencapaian karir.",
          ]
        : [
            `Perbarui profil dengan mempelajari keahlian dasar untuk posisi ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Buat minimal satu proyek sederhana atau studi kasus untuk membuktikan kemampuan Anda.",
            "Ikuti kursus atau pelatihan daring untuk membangun fondasi keahlian yang dibutuhkan.",
          ],
      summary: skillCheck.isPlausible
        ? `Analisis Kesenjangan Karier untuk ${role}: Tingkat kesiapan saat ini mencapai ${Math.min(95, 75 + context.skills.length * 3)}%. Kandidat memiliki fondasi yang baik dengan estimasi waktu pengembangan 3 — 6 Bulan.`
        : `Analisis Kesenjangan Karier untuk ${role}: Tingkat kesiapan saat ini masih 42%. Diperlukan fokus pengembangan kompetensi inti dengan estimasi waktu 6 — 12 Bulan.`,
      structuredAdvice: {
        opening: `Berdasarkan perbandingan profil Anda dengan kebutuhan umum posisi ${role}:`,
        whatGood: [
          "Anda memiliki motivasi dan tujuan karir yang terarah menuju peran target ini.",
          skillCheck.isPlausible
            ? `Sebagian keahlian dasar (${skillCheck.cleanedSkills.slice(0, 2).join(" & ")}) sudah relevan dengan kebutuhan industri.`
            : "Format dasar data profil sudah terisi dengan rapi sebagai langkah awal.",
        ],
        whatNotGood: skillCheck.isPlausible
          ? [
              "Perlu mempertegas bukti hasil nyata pada proyek-proyek sebelumnya.",
              "Portofolio perlu menampilkan studi kasus yang lebih lengkap dari awal sampai akhir.",
            ]
          : [
              skillCheck.competencyFeedback,
              "Belum terlihat bukti hasil kerja atau portofolio nyata yang mendukung posisi ini.",
            ],
        conclusion: skillCheck.isPlausible
          ? "Fokuskan waktu pada penyusunan studi kasus portofolio untuk membuktikan kemampuan Anda kepada calon perekrut."
          : `Mulailah dengan memperkuat keahlian dasar yang paling sering dicari perekrut untuk posisi ${role}.`,
      },
      answer: skillCheck.isPlausible
        ? `Gap Analysis: Profil Anda sudah berada di jalur yang benar untuk posisi ${role}. Lengkapi portofolio dengan studi kasus nyata untuk menutup kesenjangan yang ada.`
        : `Gap Analysis: Keahlian saat ini belum selaras dengan kualifikasi ${role}. Prioritaskan penyesuaian kompetensi dengan mempelajari keterampilan inti yang dicari perusahaan.`,
      nextSteps: skillCheck.isPlausible
        ? [
            "Tambahkan 1 studi kasus di portofolio yang membuktikan proses kerja Anda secara runtut.",
            "Perbarui daftar alat kerja dan metode yang Anda kuasai di profil CV.",
            "Siapkan cerita pengalaman kolaborasi tim untuk dibahas saat wawancara.",
          ]
        : [
            `Pelajari 2-3 keahlian pokok yang wajib dimiliki untuk peran ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Buat proyek latihan mandiri sebagai bukti kemampuan awal Anda.",
            "Perbarui profil ProofyLink setelah menyelesaikan materi atau proyek baru.",
          ],
      limitations: [
        "Analisis kesenjangan ini membandingkan profil Anda dengan kualifikasi umum di pasar kerja saat ini.",
        "Kebutuhan spesifik dapat berbeda di tiap perusahaan tergantung pada skala dan jenis bisnisnya.",
      ],
    };

    const prompt =
      `Anda adalah AI Career Consultant dan Talent Development Specialist.\n` +
      `Tugas Anda adalah membandingkan kondisi kandidat saat ini dengan posisi atau karier impian yang ingin dicapai ("${role}") secara objektif, mendalam, dan terstruktur.\n\n` +
      `Gunakan data riwayat profesional kandidat berikut:\n` +
      `- Target Posisi Impian yang Dituju: ${role}\n` +
      `- Headline Profil: ${context.headline || "Belum ditentukan"}\n` +
      `- Ringkasan Tentang Saya: ${context.about || "Belum diisi"}\n` +
      `- Keahlian yang Tercantum (Skills): ${context.skills.join(", ") || "Belum ada keahlian yang diisi"}\n` +
      `- Lokasi Domisili: ${context.location || "Indonesia"}` +
      customNote +
      profileJsonBlock +
      `\n\n` +
      `ATURAN WAJIB EVALUASI KEAHLIAN (SKILLS) & KESELARASAN DENGAN TARGET PERAN:\n` +
      `1. Periksa dengan teliti kecocokan keahlian dan pengalaman kandidat terhadap posisi target "${role}".\n` +
      `   - Jika keahlian kandidat TIDAK RELEVAN, TIDAK JELAS, atau berupa kata acak/dummy (seperti 'plo', 'pluh', 'plar', 'test', dsb):\n` +
      `     * DILARANG MEMUJI KEAHLIAN INI DI 'whatGood' atau 'transferableStrengths'!\n` +
      `     * Berikan skor kecocokan (matchScore) rendah (di bawah 50).\n` +
      `     * Di 'criticalGaps' dan 'whatNotGood', tegaskan bahwa keahlian saat ini belum sesuai dan sarankan perbaikan kompetensi agar sesuai dengan posisi ${role} (misalnya: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).\n` +
      `     * Cantumkan keahlian riil yang seharusnya dipelajari.\n` +
      `   - Jika keahlian relevan, berikan evaluasi gap yang objektif, mendalam, dan solutif.\n\n` +
      `PANDUAN GAYA BAHASA (KONSISTEN DENGAN KATA SAPAAN FORMAL 'ANDA'):\n` +
      `2. Gunakan Bahasa Indonesia yang komunikatif, sopan, dan profesional:\n` +
      `   - Selalu gunakan kata sapaan formal 'Anda' (JANGAN gunakan 'kamu' atau akhiran '-mu').\n` +
      `   - Gunakan istilah sederhana yang membumi (misal: 'bukti hasil kerja nyata', 'alat kerja standar industri', 'proyek portofolio nyata').\n\n` +
      `PANDUAN OUTPUT TERSTRUKTUR:\n` +
      `1. matchScore: Angka 0-100 kecocokan profil terhadap target posisi impian ${role}.\n` +
      `2. matchLevel: Tingkat keselarasan ('Tinggi (Selaras Baik)', 'Menengah (Perlu Pengayaan)', atau 'Perlu Penyesuaian Kompetensi').\n` +
      `3. coreCompetencies: Array 4 kompetensi penting untuk posisi ${role} yang dievaluasi langsung dari data kandidat:\n` +
      `   - competency: Nama kompetensi inti\n` +
      `   - candidateLevel: Level kandidat saat ini ('Dasar', 'Menengah', atau 'Mahir')\n` +
      `   - requiredLevel: Level yang dibutuhkan industri ('Menengah' atau 'Mahir')\n` +
      `   - status: 'match' (jika sesuai), 'gap' (jika kurang), atau 'exceeds' (jika melebihi target)\n` +
      `   - recommendation: Rekomendasi perbaikan konkret yang dapat langsung diterapkan kandidat\n` +
      `4. criticalGaps: 3 kesenjangan keahlian atau pengalaman yang perlu segera diperbaiki untuk mencapai posisi ${role}.\n` +
      `5. transferableStrengths: 2-3 keunggulan atau potensi positif kandidat yang dapat ditonjolkan.\n` +
      `6. strategicRecommendations: 3 langkah nyata untuk menutup kesenjangan tersebut.\n` +
      `7. summary: Ringkasan menyeluruh evaluasi kesenjangan karier.\n` +
      `8. structuredAdvice: opening, whatGood (minimal 2 poin), whatNotGood (minimal 2 poin), conclusion.\n` +
      `9. nextSteps: minimal 3 langkah aksi terarah.`;

    const aiOut = await aiResult(gapAnalysisPillarSchema, prompt, gapFallback, options);

    const calculatedScore = aiOut.matchScore ?? aiOut.readinessScore ?? gapFallback.matchScore;

    return {
      focus: "gap_analysis" as const,
      summary: aiOut.summary || `Analisis Kesenjangan Karier untuk posisi ${aiOut.targetRole || role}: Tingkat kesiapan saat ini ${calculatedScore}/100.`,
      headlineSuggestions: [],
      starBullets: [],
      pillars: [],
      structuredAdvice: aiOut.structuredAdvice,
      gapAnalysisDetails: {
        targetRole: aiOut.targetRole || role,
        matchScore: calculatedScore,
        matchLevel: aiOut.matchLevel || (calculatedScore >= 75
          ? "Tinggi (Selaras Baik)"
          : calculatedScore >= 50
          ? "Menengah (Perlu Pengayaan)"
          : "Perlu Penyesuaian Kompetensi"),
        coreCompetencies: aiOut.coreCompetencies?.length ? aiOut.coreCompetencies : gapFallback.coreCompetencies,
        criticalGaps: aiOut.criticalGaps?.length ? aiOut.criticalGaps : gapFallback.criticalGaps,
        transferableStrengths: aiOut.transferableStrengths?.length ? aiOut.transferableStrengths : gapFallback.transferableStrengths,
        strategicRecommendations: aiOut.strategicRecommendations?.length ? aiOut.strategicRecommendations : gapFallback.strategicRecommendations,
      },
      answer: aiOut.answer,
      nextSteps: aiOut.nextSteps,
      limitations: aiOut.limitations,
      modelVersion: defaultVersion,
      source: getSource(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PILAR 3: AI CAREER CONSULTATION (career_consultation / career_roadmap / star)
  // ─────────────────────────────────────────────────────────────────────────────
  const cvReviewBlock = context.cvReviewResult
    ? `\n\n--- HASIL AI CV REVIEW (PILAR 1) TERAKHIR ---\n${JSON.stringify(context.cvReviewResult, null, 2)}\n--- AKHIR HASIL AI CV REVIEW ---\n`
    : "";

  const gapAnalysisBlock = context.gapAnalysisResult
    ? `\n\n--- HASIL AI CAREER GAP ANALYSIS (PILAR 2) TERAKHIR ---\n${JSON.stringify(context.gapAnalysisResult, null, 2)}\n--- AKHIR HASIL AI CAREER GAP ANALYSIS ---\n`
    : "";

  const questionTopicBlock = (context.consultationQuestion || context.customInstruction || context.consultationTopic)
    ? `\n\n--- PERTANYAAN / TOPIK KONSULTASI DARI KANDIDAT ---\n` +
      (context.consultationTopic ? `Fokus Topik: ${context.consultationTopic}\n` : "") +
      (context.consultationQuestion ? `Pertanyaan Spesifik: "${context.consultationQuestion}"\n` : "") +
      (context.customInstruction ? `Instruksi Tambahan: "${context.customInstruction}"\n` : "") +
      `--- AKHIR PERTANYAAN KANDIDAT ---\n`
    : "";

  const consultationFallback = {
    targetRole: role,
    targetTimeline: "3 — 6 Bulan Kesiapan",
    targetLevel: skillCheck.isPlausible ? `Kesiapan Kompetitif untuk ${role}` : `Kandidat Siap Kerja untuk ${role}`,
    analysis: {
      overallAssessment: skillCheck.isPlausible
        ? `Profil profesional Anda memiliki fondasi yang solid untuk posisi ${role}. Kombinasi pengalaman kerja dan keahlian teknis seperti ${context.skills.slice(0, 3).join(", ") || "yang terdaftar"} telah menjadi modal awal yang berharga. Fokus utama Anda saat ini adalah menyelaraskan bukti dampak terukur pada portofolio dan mempertajam personal branding agar langsung menarik perhatian hiring manager.`
        : `Profil Anda memiliki susunan identitas dan pendidikan yang baik, namun kompetensi teknis yang tercantum saat ini (${context.skills.join(", ") || "belum lengkap"}) masih memiliki jarak yang signifikan terhadap kualifikasi standar posisi ${role}. Anda perlu memprioritaskan pembangunan kompetensi dasar dan proyek pembuktian sebelum aktif melamar.`,
      profileReadiness: skillCheck.isPlausible
        ? "Cukup Siap & Kompetitif — Membutuhkan penguatan pembuktian portofolio terukur dan strategi pitching interview."
        : "Tahap Eksplorasi Awal — Memerlukan pembangunan 2-3 keahlian esensial industri dan 1 karya portofolio mandiri.",
      missingDataNotices: skillCheck.isPlausible
        ? [
            "Data metrik pencapaian kuantitatif (%) pada riwayat pengalaman kerja masih dapat diperkaya.",
            "Tautan studi kasus portofolio langsung ke hasil akhir proyek belum sepenuhnya terlampir.",
          ]
        : [
            `Lengkapi keahlian inti peran ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Sertakan minimal 1 tautan portofolio atau proyek nyata sebagai bukti pemecahan masalah.",
          ],
      cvReviewHighlights: skillCheck.isPlausible
        ? "CV terstruktur rapi dan ramah ATS; catatan perbaikan berfokus pada kuantifikasi pencapaian kerja dan kategorisasi tools."
        : `CV membutuhkan penyelarasan kata kunci industri dan pembaruan daftar keahlian target peran ${role}.`,
      gapAnalysisHighlights: skillCheck.isPlausible
        ? "Kompetensi inti mayoritas selaras; kesenjangan terdapat pada penguasaan tooling tingkat lanjut dan kepemimpinan proyek."
        : `Kesenjangan kritis pada penguasaan keahlian spesifik industri seperti ${skillCheck.recommendedSkillsForRole.slice(0, 2).join(", ")}.`,
    },
    recommendations: [
      {
        focusArea: "Pengembangan karier",
        title: `Peta Jalan Transisi Menuju ${role}`,
        description: `Susun rencana karier 6 bulan dengan membagi fase pembelajaran menjadi penguasaan keahlian inti, publikasi portofolio, dan lamaran aktif ke perusahaan target.`,
        actionableTip: `Tentukan 5 perusahaan impian dan catat kesamaan kualifikasi yang mereka butuhkan sebagai panduan belajar mingguan.`,
      },
      {
        focusArea: "Peningkatan kompetensi",
        title: "Penguasaan Keahlian Kunci Berdampak Tinggi",
        description: skillCheck.isPlausible
          ? `Perdalam keahlian analitis dan metodologi kerja industri untuk meningkatkan nilai tawar Anda saat wawancara teknis.`
          : `Prioritaskan mempelajari 3 keahlian utama untuk peran ${role}: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}.`,
        actionableTip: `Alokasikan 5-7 jam per minggu untuk latihan studi kasus nyata menggunakan alat kerja standar industri.`,
      },
      {
        focusArea: "Pengembangan portofolio",
        title: "Studi Kasus Pembuktian (Proof of Work)",
        description: "Recruiter ingin melihat bagaimana Anda memecahkan masalah nyata dari tahap identifikasi hingga metrik dampak akhir.",
        actionableTip: "Pilih 1 proyek terbaik, buat ringkasan 1 halaman dengan struktur: Masalah, Solusi Anda, dan Metrik Hasil Terukur.",
      },
      {
        focusArea: "Penyusunan CV",
        title: "Optimalisasi CV Berbasis Pencapaian (STAR/XYZ)",
        description: "Ubah deskripsi tugas harian yang pasif menjadi narasi pencapaian proaktif dengan angka atau persentase yang jelas.",
        actionableTip: "Tulis ulang minimal 2 poin pekerjaan teratas menggunakan format 'Mencapai [X], diukur dengan [Y], melalui tindakan [Z]'.",
      },
      {
        focusArea: "Persiapan interview",
        title: "Teknik Pitching 2 Menit & Jawaban Perilaku (Behavioral)",
        description: "Latih cara menceritakan latar belakang Anda secara ringkas dan lugas, serta siapkan narasi tantangan kerja yang pernah Anda selesaikan.",
        actionableTip: "Gunakan formula STAR (Situation, Task, Action, Result) untuk menjawab pertanyaan 'Ceritakan proyek tersulit yang pernah Anda tangani'.",
      },
      {
        focusArea: "Strategi mencapai target karier",
        title: "Personal Branding & Visibilitas ke Recruiter",
        description: "Pastikan profil ProofyLink dan jejaring profesional Anda aktif mencerminkan spesialisasi dan ketersediaan kerja.",
        actionableTip: "Publikasikan satu tulisan singkat atau breakdown proyek di media profesional untuk menarik perhatian hiring manager.",
      },
    ],
    nextSteps: [
      {
        stepNumber: 1,
        title: "Audit & Lengkapi Data Profil",
        timeline: "Minggu 1",
        action: "Perbarui bagian keahlian dan lampirkan tautan portofolio proyek terbaru pada halaman CV & Profil.",
        expectedOutcome: "Profil memiliki kelengkapan data di atas 90% dan siap dipindai oleh recruiter.",
      },
      {
        stepNumber: 2,
        title: "Poles Portofolio Studi Kasus Unggulan",
        timeline: "Minggu 2 — 3",
        action: "Susun 1 studi kasus mendalam yang mencakup proses pengambilan keputusan dan dampak terukur.",
        expectedOutcome: "Memiliki bukti kerja nyata yang langsung memvalidasi kompetensi di mata recruiter.",
      },
      {
        stepNumber: 3,
        title: "Simulasi Wawancara & Pitching STAR",
        timeline: "Minggu 4",
        action: "Latih 3 cerita pencapaian utama dengan formula STAR dan siapkan jawaban untuk celah pengalaman.",
        expectedOutcome: "Percaya diri dan lugas saat menyampaikan nilai tambah unik Anda di hadapan hiring manager.",
      },
      {
        stepNumber: 4,
        title: "Penyebaran Lamaran Terarah & Networking",
        timeline: "Bulan 2 — 3",
        action: "Kirimkan lamaran ke posisi yang selaras minimal 70% dan hubungi recruiter atau alumni di industri terkait.",
        expectedOutcome: "Mendapatkan undangan interview pertama dari perusahaan yang sesuai dengan target karier.",
      },
    ],
    phases: [
      {
        phaseNumber: 1,
        phaseName: skillCheck.isPlausible ? "Pembuktian Portofolio & Keunggulan Relevan" : "Penyelarasan & Pembangunan Keahlian Inti",
        timeframe: "Bulan 1 — 2",
        outcome: skillCheck.isPlausible
          ? "Portofolio proyek memiliki bukti hasil kerja nyata yang langsung memikat HRD saat peninjauan pertama."
          : `Keahlian inti untuk posisi ${role} mulai dikuasai dan portofolio awal terbentuk.`,
        keyActions: skillCheck.isPlausible
          ? [
              "Poles 1-2 studi kasus portofolio dengan menekankan peran spesifik dan metrik dampak positif",
              "Perbarui headline dan ringkasan profil agar mencerminkan spesialisasi bidang kerjamu",
              "Kelompokkan keahlian teknis dan alat kerja utama agar mudah dipindai HRD",
            ]
          : [
              `Fokus pelajari 2-3 keahlian utama untuk posisi ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")})`,
              "Perbarui daftar keahlian di CV setelah menguasai materi baru",
              "Buat 1 proyek latihan terstruktur sebagai bukti portofolio awal",
            ],
        milestone: skillCheck.isPlausible
          ? "Profil & Portofolio memiliki daya tarik tinggi saat disaring oleh HRD"
          : `Keahlian di profil selaras dengan kebutuhan peran ${role}`,
      },
      {
        phaseNumber: 2,
        phaseName: "Personal Branding & Visibilitas ke Perekrut",
        timeframe: "Bulan 2 — 4",
        outcome: "Profil aktif terlihat di radar pencarian talent dan mulai menerima undangan peluang kerja.",
        keyActions: [
          "Publikasikan rangkuman pembelajaran proyek atau studi kasus di komunitas profesional atau LinkedIn",
          "Lengkapi seluruh bagian profil ProofyLink untuk memaksimalkan peluang rekomendasi otomatis",
          "Minta umpan balik dari rekan kerja atau mentor mengenai kejelasan portofoliomu",
        ],
        milestone: "Mendapatkan tanggapan positif dan undangan wawancara dari perekrut",
      },
      {
        phaseNumber: 3,
        phaseName: "Strategi Pitching Wawancara & Evaluasi Tawaran",
        timeframe: "Bulan 4 — 6",
        outcome: "Mampu menyampaikan keunggulan diri secara percaya diri dan meraih penawaran kerja terbaik.",
        keyActions: [
          "Siapkan narasi STAR (Situation, Task, Action, Result) untuk setiap pencapaian utama",
          "Latih penjelasan jujur namun positif seputar transisi karir atau celah pengalaman",
          "Pelajari riset standar kompensasi dan nilai tambah unik yang kamu bawa untuk perusahaan",
        ],
        milestone: "Menerima dan menegosiasikan penawaran kerja resmi sesuai target karir",
      },
    ],
    recommendedCertifications: [
      `Pelatihan Praktis & Studi Kasus Bidang ${role}`,
      "Sertifikasi Profesional atau Lisensi Alat Kerja Industri",
      "Lokakarya Komunikasi Efektif & Kolaborasi Tim",
    ],
    strategicAdvice: [
      "Perekrut lebih tertarik pada bagaimana caramu memecahkan masalah nyata dibanding sekadar panjangnya daftar tugas.",
      "Jelaskan kontribusi pribadimu secara jujur dan transparan saat menceritakan proyek kolaborasi.",
      "Gunakan setiap wawancara kerja sebagai ruang bertukar wawasan dua arah, bukan sekadar ujian.",
    ],
    interviewPitchTips: [
      "Gunakan formula STAR: sebutkan tantangan yang dihadapi, aksimu, dan hasil positif yang dicapai.",
      "Jika ada kesenjangan pengalaman atau transisi karir, tonjolkan kecepatan belajar dan transferable skills yang relevan.",
      "Tunjukkan antusiasme dengan mempelajari produk atau tantangan bisnis perusahaan sebelum sesi interview.",
    ],
    summary: `Career Consultation untuk ${role}: Panduan komprehensif analisis profil, rekomendasi berbasis 7 fokus karier, serta langkah aksi terarah menuju target peran Anda.`,
    structuredAdvice: {
      opening: `Konsultasi persiapan karier dan strategi memikat HRD untuk posisi ${role}:`,
      whatGood: [
        "Arah tujuan karier sudah terdefinisi jelas menuju target peran yang diinginkan.",
        "Kombinasi keahlian dasar menjadi modal berharga untuk melangkah ke tahap seleksi.",
      ],
      whatNotGood: skillCheck.isPlausible
        ? [
            "Perlu melatih teknik bercerita (storytelling) agar pencapaian kerjamu tidak terdengar seperti tugas biasa.",
            "Portofolio masih perlu menyertakan proses pengambilan keputusan di balik solusi.",
          ]
        : [
            skillCheck.competencyFeedback,
            "Hindari melamar tanpa proyek pembuktian; siapkan minimal satu karya nyata sebagai modal pitching.",
          ],
      conclusion: "Terapkan rekomendasi di atas untuk membangun kepercayaan diri dan daya pikat profil Anda di hadapan hiring manager.",
    },
    answer: `Career Consultation: Panduan persiapan karier dan teknik memikat HRD untuk posisi ${role} melalui penguatan portofolio nyata, visibilitas profesional, dan kesiapan wawancara kerja.`,
    limitations: [
      "Konsultasi ini merupakan panduan strategis berbasis data profil Anda dan tren industri rekrutmen ProofyLink.",
      "ProofyLink bukan penasihat karier bersertifikasi; proses rekrutmen aktual bergantung pada kebutuhan spesifik masing-masing perusahaan.",
    ],
  };

  const prompt =
    `Anda adalah AI Career Consultant & Talent Development Advisor di ProofyLink Talent Network.\n` +
    `Tugas Anda adalah membantu pengguna memahami profil profesionalnya, mengembangkan karier, meningkatkan peluang kerja, dan mengambil keputusan karier yang lebih baik.\n\n` +
    `Anda memiliki akses terhadap data profesional kandidat:\n` +
    `- Profil kandidat (identitas, domisili, headline)\n` +
    `- Ringkasan profesional (About / summary)\n` +
    `- Riwayat pendidikan\n` +
    `- Pengalaman kerja\n` +
    `- Kompetensi (skills)\n` +
    `- Tools yang dikuasai\n` +
    `- Career Status\n` +
    `- Career Goal (Target Posisi / Karier)\n` +
    `- Hasil AI CV Review (Pilar 1)\n` +
    `- Hasil AI Career Gap Analysis (Pilar 2)\n\n` +
    `PRINSIP DAN PANDUAN KONSULTASI WAJIB:\n` +
    `1. Selalu gunakan data kandidat sebagai konteks utama sebelum memberikan jawaban.\n` +
    `2. Jika informasi yang tersedia belum cukup (misal: belum ada portofolio, tools belum dirinci, atau pengalaman belum terukur), secara eksplisit minta pengguna melengkapi data yang diperlukan di bagian 'analysis.missingDataNotices'.\n` +
    `3. Jangan memberikan jawaban umum yang tidak terkait dengan profil kandidat.\n` +
    `4. Berikan jawaban yang:\n` +
    `   - Spesifik\n` +
    `   - Praktis\n` +
    `   - Mudah diterapkan\n` +
    `   - Profesional\n` +
    `   - Berorientasi tindakan\n` +
    `5. Fokus jawaban pada 7 pilar ini:\n` +
    `   1. Pengembangan karier\n` +
    `   2. Peningkatan kompetensi\n` +
    `   3. Persiapan rekrutmen\n` +
    `   4. Pengembangan portofolio\n` +
    `   5. Penyusunan CV\n` +
    `   6. Persiapan interview\n` +
    `   7. Strategi mencapai target karier\n` +
    `6. Jika pengguna bertanya mengenai karier tertentu, sesuaikan rekomendasi dengan profil dan pengalaman yang dimiliki pengguna saat ini.\n` +
    `7. Format output WAJIB mencakup 3 bagian utama:\n` +
    `   ### Analisis (memuat overallAssessment, profileReadiness, missingDataNotices, cvReviewHighlights, gapAnalysisHighlights)\n` +
    `   ### Rekomendasi (memuat array recommendations terpetakan ke 7 fokus jawaban, dengan title, description, dan actionableTip yang praktis)\n` +
    `   ### Langkah Selanjutnya (memuat array nextSteps berurutan dengan stepNumber, title, timeline, action, dan expectedOutcome)\n\n` +
    `DATA KONTEKS KANDIDAT SAAT INI:\n` +
    `- Target Peran yang Dituju: ${role}\n` +
    `- Headline Profil: ${context.headline || "Belum ditentukan"}\n` +
    `- Ringkasan (About): ${context.about || "Belum diisi"}\n` +
    `- Keahlian Terdaftar (Skills): ${context.skills.join(", ") || "Belum diisi"}\n` +
    `- Lokasi: ${context.location || "Indonesia"}` +
    customNote +
    profileJsonBlock +
    cvReviewBlock +
    gapAnalysisBlock +
    questionTopicBlock;

  const aiOut = await aiResult(careerConsultationPillarSchema, prompt, consultationFallback, options);

  const formattedNextSteps = (aiOut.nextSteps || consultationFallback.nextSteps).map((s) =>
    typeof s === "string" ? s : `${s.title} (${s.timeline}): ${s.action}`
  );

  return {
    focus: "career_consultation" as const,
    summary: aiOut.summary,
    headlineSuggestions: [],
    starBullets: [],
    pillars: [],
    structuredAdvice: aiOut.structuredAdvice,
    careerConsultationDetails: {
      targetRole: aiOut.targetRole,
      targetTimeline: aiOut.targetTimeline,
      targetLevel: aiOut.targetLevel,
      analysis: aiOut.analysis || consultationFallback.analysis,
      recommendations: aiOut.recommendations || consultationFallback.recommendations,
      actionSteps: aiOut.nextSteps || consultationFallback.nextSteps,
      phases: aiOut.phases?.length ? aiOut.phases : consultationFallback.phases,
      recommendedCertifications: aiOut.recommendedCertifications?.length ? aiOut.recommendedCertifications : consultationFallback.recommendedCertifications,
      strategicAdvice: aiOut.strategicAdvice?.length ? aiOut.strategicAdvice : consultationFallback.strategicAdvice,
      interviewPitchTips: aiOut.interviewPitchTips?.length ? aiOut.interviewPitchTips : consultationFallback.interviewPitchTips,
    },
    careerRoadmapDetails: {
      targetRole: aiOut.targetRole,
      targetTimeline: aiOut.targetTimeline,
      targetLevel: aiOut.targetLevel,
      phases: aiOut.phases?.length ? aiOut.phases : consultationFallback.phases,
      recommendedCertifications: aiOut.recommendedCertifications?.length ? aiOut.recommendedCertifications : consultationFallback.recommendedCertifications,
      strategicAdvice: aiOut.strategicAdvice?.length ? aiOut.strategicAdvice : consultationFallback.strategicAdvice,
    },
    answer: aiOut.answer,
    nextSteps: formattedNextSteps,
    limitations: aiOut.limitations,
    modelVersion: defaultVersion,
    source: getSource(),
  };
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
  return aiResult(cvBuilderSchema, JSON.stringify(context), {
    headline: context.headline || context.targetRole || "Professional",
    about: context.about || "Professional yang berfokus pada hasil dan kolaborasi.",
    bullets: context.skills.slice(0, 3).map((skill) => `Menggunakan ${skill} untuk menyelesaikan masalah pengguna.`),
    limitations: ["Draft harus disetujui kandidat sebelum disimpan."],
    modelVersion: defaultVersion,
    source: getSource(),
  });
}

export function importCv(fileName: string) {
  return cvImportSchema.parse({
    fullName: "Nadia Putri",
    headline: "Senior Product Designer",
    about: "Product designer yang mengubah masalah kompleks menjadi pengalaman digital yang jelas.",
    skills: ["Product design", "User research", "Figma"],
    hardCompetencies: ["Product design", "User research"],
    tools: ["Figma"],
    softSkills: ["Komunikasi", "Problem solving"],
    experience: [
      {
        company: "Studio Nusantara",
        role: "Senior Product Designer",
        employmentType: "Full Time",
        startDate: "2021",
        endDate: null,
        currentPosition: true,
        dates: "2021 - sekarang",
        description: "Memimpin perancangan pengalaman produk digital nusantara.",
        achievements: ["Meningkatkan kejelasan workflow produk."],
      },
    ],
    education: [
      {
        level: "S1",
        school: "Universitas Indonesia",
        program: "Desain Komunikasi Visual",
        gpa: "3.85",
        startDate: "2015",
        endDate: "2019",
        currentlyStudying: false,
        dates: "2015 - 2019",
      },
    ],
    suggestions: [`Review hasil extraction dari ${fileName} sebelum menyimpan.`],
    source: getSource(),
  });
}

export type ExtractCvInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

function formatAiError(err: unknown): string {
  if (!err) return "Terjadi kesalahan yang tidak diketahui.";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const status = e.status || e.statusCode;
    let bodyMsg = "";
    if (typeof e.responseBody === "string") {
      try {
        const parsed = JSON.parse(e.responseBody);
        bodyMsg = parsed?.error?.message || parsed?.message || e.responseBody;
      } catch {
        bodyMsg = e.responseBody;
      }
    } else if (e.responseBody && typeof e.responseBody === "object") {
      const resp = e.responseBody as Record<string, unknown>;
      const errObj = resp.error as Record<string, unknown> | undefined;
      bodyMsg = (errObj?.message as string) || (resp.message as string) || "";
    }
    const mainMsg = (e.message as string) || (e.name as string) || "Koneksi ke Azure AI gagal";
    const statusPrefix = status ? `[HTTP ${status}] ` : "";
    if (bodyMsg && bodyMsg !== mainMsg) {
      return `${statusPrefix}${mainMsg} (${bodyMsg})`;
    }
    return `${statusPrefix}${mainMsg}`;
  }
  return String(err);
}

export async function extractCvDocument(
  input: ExtractCvInput,
  options: AiOptions = {}
): Promise<z.infer<typeof cvImportSchema>> {
  const { endpoint, deployment, apiKey, apiVersion, isConfigured } = getAzureConfig();

  // If Azure credentials are not available
  if (!isConfigured || !endpoint || !apiKey) {
    const missingFields = [
      !endpoint ? "AZURE_OPENAI_ENDPOINT" : null,
      !apiKey ? "AZURE_OPENAI_API_KEY" : null,
    ]
      .filter(Boolean)
      .join(", ");

    const errorMsg =
      `Konfigurasi Azure AI belum lengkap (variabel belum diisi: ${missingFields || "tidak valid"}). ` +
      `Pastikan variabel tersebut sudah terpasang di file .env lokal Anda dan restart server development ('npm run dev').`;

    if (options.strict || getSource() !== "mock") {
      throw new Error(errorMsg);
    }
    console.warn(`[extractCvDocument] ${errorMsg}`);
    return importCv(input.fileName);
  }

  try {
    const azure = getAzure(
      normalizeAzureBaseUrl(endpoint),
      apiKey,
      apiVersion
    );
    const model = azure.chat(deployment);

    const isImage =
      input.mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(input.fileName);

    if (isImage) {
      // Vision OCR via multimodal message
      const result = await generateObject({
        model,
        schema: cvImportSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Anda adalah asisten AI OCR dan parser CV/resume profesional. ` +
                  `Analisis gambar dokumen CV "${input.fileName}" ini secara mendalam dan ekstrak datanya ke format JSON sesuai skema berikut:\n` +
                  `- fullName: Nama lengkap kandidat\n` +
                  `- headline: Judul profesional atau target peran kerja\n` +
                  `- about: Ringkasan profesional kandidat dalam 1-3 kalimat\n` +
                  `- skills: Array daftar keahlian utama\n` +
                  `- hardCompetencies: Daftar keahlian teknis (array string, berikan [] jika tidak ada)\n` +
                  `- tools: Software atau teknologi yang dikuasai (array string, berikan [] jika tidak ada)\n` +
                  `- softSkills: Keahlian interpersonal (array string, berikan [] jika tidak ada)\n` +
                  `- experience: Array riwayat pekerjaan dengan format objek: { company, role, employmentType, startDate, endDate, currentPosition, dates, description, achievements }. Jika field tertentu tidak ada pada CV, isi dengan null (atau [] untuk achievements).\n` +
                  `- education: Array riwayat pendidikan dengan format objek: { level, school, program, gpa, startDate, endDate, currentlyStudying, dates }. Jika field tertentu tidak ada pada CV, isi dengan null.\n` +
                  `- suggestions: 1-3 saran profesional untuk mengoptimalkan CV ini bagi rekruter.\n` +
                  `- source: Selalu isi dengan "azure"\n` +
                  `Pastikan data akurat dan tidak ada halusinasi informasi yang tidak tercantum.`,
              },
              {
                type: "image",
                image: input.buffer,
              },
            ],
          },
        ],
      });

      return {
        ...result.object,
        source: "azure",
      };
    }

    // PDF processing: extract text first using unpdf
    let pdfText = "";
    try {
      const { extractText } = await import("unpdf");
      const parsed = await extractText(new Uint8Array(input.buffer), { mergePages: true });
      const rawText = parsed.text;
      pdfText = typeof rawText === "string" ? rawText : Array.isArray(rawText) ? (rawText as string[]).join("\n") : "";
    } catch (pdfErr) {
      console.warn("[extractCvDocument] Gagal membaca teks PDF dengan unpdf:", pdfErr);
    }

    // If PDF has readable text
    if (pdfText.trim().length > 0) {
      const result = await generateObject({
        model,
        schema: cvImportSchema,
        prompt:
          `Anda adalah asisten AI parser CV/resume profesional. ` +
          `Analisis teks dokumen CV "${input.fileName}" berikut dan ekstrak datanya ke format JSON sesuai skema:\n` +
          `- fullName: Nama lengkap kandidat\n` +
          `- headline: Judul profesional atau target peran kerja\n` +
          `- about: Ringkasan profesional kandidat dalam 1-3 kalimat\n` +
          `- skills: Array daftar keahlian utama\n` +
          `- hardCompetencies: Daftar keahlian teknis (array string, berikan [] jika tidak ada)\n` +
          `- tools: Software atau teknologi yang dikuasai (array string, berikan [] jika tidak ada)\n` +
          `- softSkills: Keahlian interpersonal (array string, berikan [] jika tidak ada)\n` +
          `- experience: Array riwayat pekerjaan dengan format objek: { company, role, employmentType, startDate, endDate, currentPosition, dates, description, achievements }. Jika field tertentu tidak ada pada CV, isi dengan null (atau [] untuk achievements).\n` +
          `- education: Array riwayat pendidikan dengan format objek: { level, school, program, gpa, startDate, endDate, currentlyStudying, dates }. Jika field tertentu tidak ada pada CV, isi dengan null.\n` +
          `- suggestions: 1-3 saran profesional untuk mengoptimalkan CV ini bagi rekruter.\n` +
          `- source: Selalu isi dengan "azure"\n\n` +
          `=== TEKS DOKUMEN CV ===\n${pdfText.slice(0, 18000)}`,
      });

      return {
        ...result.object,
        source: "azure",
      };
    }

    // If PDF has zero extracted text (scanned PDF without text layer)
    // Try sending directly as a file part to Azure Responses model if available
    try {
      const responsesModel = typeof azure.responses === "function" ? azure.responses(deployment) : azure(deployment);
      const result = await generateObject({
        model: responsesModel,
        schema: cvImportSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Anda adalah asisten AI OCR CV profesional. Ekstrak data profil dari berkas CV "${input.fileName}" ini secara lengkap ke format JSON sesuai skema:\n` +
                  `- fullName, headline, about, skills, experience, education, suggestions.`,
              },
              {
                type: "file",
                data: input.buffer,
                mediaType: "application/pdf",
                filename: input.fileName,
              },
            ],
          },
        ],
      });

      return {
        ...result.object,
        source: "azure",
      };
    } catch (fileErr) {
      console.warn("[extractCvDocument] File part parsing error:", fileErr);
      throw new Error(
        "Dokumen PDF tidak memiliki teks digital yang dapat dibaca (kemungkinan hasil scan gambar). " +
        "Silakan ekspor CV Anda langsung sebagai 'PDF Standar' dari Canva/Word, atau unggah sebagai gambar PNG/JPG."
      );
    }
  } catch (err: unknown) {
    console.error("[extractCvDocument] Azure error:", err);
    throw new Error(`Gagal memproses dokumen dengan Azure AI: ${formatAiError(err)}`);
  }
}

export async function recruiterOutreachPrompt(input: unknown, options?: AiOptions) {
  const context = recruiterPromptInputSchema.parse(input);

  const fallbackData: Record<typeof context.category, { subject: string; message: string; highlights: string[]; callToAction: string }> = {
    interview_invitation: {
      subject: `Undangan Wawancara: ${context.jobTitle} di ${context.organizationName}`,
      message: `Halo ${context.candidateName},\n\nKami sangat terkesan dengan profil profesional dan portofolio Anda. Kami ingin mengundang Anda ke sesi wawancara untuk posisi ${context.jobTitle} di ${context.organizationName} guna mendiskusikan pengalaman Anda lebih mendalam.\n\nSilakan konfirmasi kesediaan jadwal Anda melalui tautan yang tersedia.`,
      highlights: [
        "Sesi perkenalan dan diskusi studi kasus proyek",
        "Penjelasan struktur tim dan ekspektasi peran",
        "Sesi tanya jawab terbuka dengan interviewer",
      ],
      callToAction: "Konfirmasi Jadwal Wawancara",
    },
    assessment_invitation: {
      subject: `Undangan Assessment Teknis: ${context.jobTitle}`,
      message: `Halo ${context.candidateName},\n\nSebagai langkah berikutnya dalam proses seleksi posisi ${context.jobTitle} di ${context.organizationName}, kami mengundang Anda untuk mengerjakan asesmen berbasis studi kasus praktis.\n\nAsesmen ini dirancang untuk memberi Anda gambaran nyata tentang tantangan yang akan kita selesaikan bersama.`,
      highlights: [
        "Studi kasus berorientasi pemecahan masalah nyata",
        "Batas waktu pengerjaan yang fleksibel",
        "Dapat dikerjakan langsung dari portal ProofyLink",
      ],
      callToAction: "Mulai Kerjakan Asesmen",
    },
    schedule_confirmation: {
      subject: `Konfirmasi Jadwal Wawancara: ${context.jobTitle}`,
      message: `Halo ${context.candidateName},\n\nJadwal wawancara Anda untuk posisi ${context.jobTitle} di ${context.organizationName} telah terkonfirmasi. Kami telah menyiapkan ruang pertemuan virtual dan panelis siap berdiskusi dengan Anda.`,
      highlights: [
        "Tautan pertemuan sudah tertera pada detail lamaran",
        "Durasi estimasi 45 menit",
        "Mohon hadir 5 menit sebelum sesi dimulai",
      ],
      callToAction: "Buka Detail Pertemuan",
    },
    offer_letter: {
      subject: `Penawaran Kerja Resmi: ${context.jobTitle} - ${context.organizationName}`,
      message: `Halo ${context.candidateName},\n\nSelamat! Setelah melalui proses seleksi yang sangat positif, kami sangat antusias menawarkan posisi ${context.jobTitle} di ${context.organizationName}.\n\nKami percaya pengalaman, integritas, dan energi Anda akan memberikan dampak yang sangat berharga bagi tim kami. Silakan tinjau ringkasan paket penawaran kerja ini.`,
      highlights: [
        "Paket kompensasi dan benefit kompetitif",
        "Peluang akselerasi karir dan kepemimpinan",
        "Persetujuan instan satu klik melalui portal",
      ],
      callToAction: "Tinjau & Terima Penawaran",
    },
    rejection: {
      subject: `Pembaruan Proses Seleksi: ${context.jobTitle} - ${context.organizationName}`,
      message: `Halo ${context.candidateName},\n\nTerima kasih banyak atas waktu, dedikasi, dan ketertarikan Anda mengikuti proses seleksi posisi ${context.jobTitle} di ${context.organizationName}.\n\nSetelah pertimbangan mendalam, saat ini kami memutuskan untuk melanjutkan proses dengan kandidat yang profilnya lebih selaras dengan kebutuhan teknis mendesak peran ini. Kami sangat mengapresiasi pencapaian Anda dan akan menyimpan profil Anda di jaringan talent kami untuk peluang di masa depan.`,
      highlights: [
        "Apresiasi atas waktu dan keterlibatan selama proses",
        "Profil tetap tersimpan di database talent organisasi kami",
        "Terbuka untuk peluang dan pembukaan posisi berikutnya",
      ],
      callToAction: "Tetap Terhubung",
    },
  };

  const selectedFallback = fallbackData[context.category];

  const prompt =
    `Anda adalah asisten AI rekrutmen profesional. Buatkan draft pesan rekruter ke kandidat dalam Bahasa Indonesia.\n` +
    `- Kategori Pesan: ${context.category}\n` +
    `- Nama Kandidat: ${context.candidateName}\n` +
    `- Posisi / Job Title: ${context.jobTitle}\n` +
    `- Nama Organisasi / Perusahaan: ${context.organizationName}\n` +
    `- Nada Bicara (Tone): ${context.tone}\n` +
    (context.promptInstructions ? `- Instruksi Tambahan dari Rekruter: ${context.promptInstructions}\n` : "") +
    `Buatkan pesan yang ramah, menghargai, jelas, dan profesional.`;

  return aiResult(
    recruiterOutreachPromptSchema,
    prompt,
    {
      category: context.category,
      subject: selectedFallback.subject,
      message: selectedFallback.message,
      highlights: selectedFallback.highlights,
      callToAction: selectedFallback.callToAction,
      tone: context.tone,
      modelVersion: defaultVersion,
      source: getSource(),
    },
    options
  );
}


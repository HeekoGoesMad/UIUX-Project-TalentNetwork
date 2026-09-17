import "server-only";

import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { cvBuilderSchema, cvImportSchema, gapsSchema, cvReviewPillarSchema, gapAnalysisPillarSchema, careerConsultationPillarSchema, profileContextSchema, questionsSchema, recruiterOutreachPromptSchema, recruiterPromptInputSchema, roadmapSchema, screeningSchema, summarySchema } from "./schemas";

const defaultVersion = "proofylink-screening-v1";

export function getSource(): "mock" | "local" | "azure" {
  const provider = process.env.AI_PROVIDER?.trim();
  if (provider === "mock" && process.env.NODE_ENV !== "production") return "mock";
  if (provider === "local") return "local";
  return "azure";
}

type AiOptions = { strict?: boolean };

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
      const result = await generateObject({ model: azure.chat(deployment), schema, prompt, abortSignal: controller.signal });
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
      executiveSummary: skillCheck.isPlausible
        ? `Tinjauan CV untuk posisi ${role}: Susunan informasi dan riwayat pengalaman kerja sudah rapi serta mudah dibaca oleh perekrut. Rekomendasi utama adalah melengkapi bukti hasil kerja nyata dan memperjelas keahlian unggulanmu.`
        : `Tinjauan CV untuk posisi ${role}: Susunan dasar CV sudah rapi, namun keahlian yang tercantum saat ini (${context.skills.join(", ") || "belum lengkap"}) belum sesuai dengan kebutuhan posisi ${role}. Disarankan untuk memperbarui daftar keahlian dengan kemampuan utama yang dicari perusahaan serta melengkapi uraian pengalaman dengan contoh hasil kerja nyata.`,
      sectionAudits: [
        {
          section: "1. Headline & Identitas Profesional",
          status: "good" as const,
          notes: [
            `Sudah menyebutkan target peran (${role}) dengan jelas dan profesional.`,
            "Tampilan teks bersih, rapi, dan mudah dibaca oleh perekrut maupun sistem seleksi.",
          ],
          recommendation: "Kamu bisa menambahkan bidang industri yang kamu minati (misal: teknologi, keuangan, atau e-commerce) agar profilmu lebih menonjol.",
        },
        {
          section: "2. Ringkasan Profil (Tentang Saya / About)",
          status: "needs_improvement" as const,
          notes: [
            "Belum merangkum total tahun pengalaman kerja secara ringkas.",
            "Kalimat pembuka masih bisa diperkuat dengan nilai tambah atau pencapaian terbaikmu.",
          ],
          recommendation: "Tuliskan 2-3 kalimat ringkas: peran utamamu, keahlian andalan, dan kontribusi terbaik yang pernah kamu berikan.",
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
          recommendation: "Pastikan setiap proyek di portofolio mencantumkan peran spesifikmu dan hasil positif yang dicapai.",
        },
      ],
      formatChecks: [
        { check: "Kerapian Format & Judul Bagian Baku", passed: true, tip: "Gunakan judul bagian standar: Pengalaman Kerja, Pendidikan, Keahlian, Portofolio." },
        { check: "Kesesuaian Kata Kunci & Keahlian Pokok", passed: skillCheck.isPlausible, tip: "Gunakan istilah dan nama keahlian yang umum dipakai dalam lowongan pekerjaan peran ini." },
        { check: "Keterbacaan Poin Uraian & Tata Letak", passed: true, tip: "Gunakan poin-poin ringkas agar perekrut nyaman membaca profilmu dalam hitungan detik." },
        { check: "Kelengkapan Tautan Kontak & Portofolio", passed: true, tip: "Pastikan email, nomor kontak, dan tautan profil profesional aktif dan mudah dihubungi." },
      ],
      priorityActionItems: skillCheck.isPlausible
        ? [
            "Tambahkan bukti hasil kerja nyata (misal: persentase keberhasilan atau hasil proyek) pada 2 pengalaman kerja teratas.",
            "Lengkapi bagian ringkasan 'Tentang Saya' dengan menyebutkan bidang industri yang kamu minati.",
            "Kelompokkan daftar keahlian agar perekrut dapat langsung melihat keunggulan utamamu.",
          ]
        : [
            `Perbarui daftar keahlian di CV agar sesuai dengan kompetensi peran ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Tambahkan bukti hasil kerja nyata pada uraian pengalaman kerja agar rekruter lebih yakin.",
            "Tulis ringkasan singkat di bagian 'Tentang Saya' yang menjelaskan keunggulan dan minat karirmu.",
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
            : "Informasi profil dan kontak utama sudah terisi dengan jelas.",
        ],
        whatNotGood: skillCheck.isPlausible
          ? [
              "Uraian pengalaman kerja masih bisa diperjelas dengan bukti hasil nyata (misal: jumlah pengguna, persentase keberhasilan, atau efisiensi waktu).",
              "Ringkasan profil belum menonjolkan bidang industri utama yang kamu minati atau kuasai.",
            ]
          : [
              skillCheck.competencyFeedback,
              "Uraian pengalaman kerja masih kurang bukti hasil kerja nyata yang meyakinkan perekrut.",
            ],
        conclusion: skillCheck.isPlausible
          ? "Terapkan rekomendasi di atas untuk membuat CV kamu semakin menarik dan meningkatkan peluang dipanggil wawancara."
          : `Perbaiki daftar keahlian agar sesuai dengan standar posisi ${role} untuk membuka peluang lebih besar saat melamar pekerjaan.`,
      },
      answer: skillCheck.isPlausible
        ? `Review CV: Susunan CV kamu untuk peran ${role} sudah baik. Fokuskan perbaikan pada penambahan contoh hasil kerja nyata dan pengelompokan keahlian yang lebih spesifik.`
        : `Review CV: Struktur CV kamu sudah rapi, namun keahlian yang tercantum saat ini belum selaras dengan kebutuhan posisi ${role}. Prioritaskan pembaruan daftar keahlian inti dan lengkapi bukti hasil kerja nyata.`,
      nextSteps: skillCheck.isPlausible
        ? [
            "Buka CV Workspace untuk menambahkan angka atau bukti hasil nyata pada riwayat pengalaman.",
            "Lengkapi ringkasan 'Tentang Saya' dengan menyebutkan bidang industri yang kamu kuasai.",
            "Jalankan ulang evaluasi untuk melihat peningkatan skor kesiapan CV kamu.",
          ]
        : [
            `Buka CV Workspace dan perbarui daftar keahlian agar sesuai dengan posisi ${role}.`,
            "Tambahkan pengalaman kerja atau proyek latihan yang membuktikan kemampuan barumu.",
            "Jalankan kembali evaluasi untuk memantau peningkatan kesiapan karirmu.",
          ],
      limitations: [
        "Saran evaluasi disusun berdasarkan praktik terbaik rekrutmen dan standar seleksi kerja saat ini.",
        "Setiap perusahaan dapat memiliki kriteria penilaian dan preferensi khusus sesuai kebutuhan tim mereka.",
      ],
    };

    const prompt =
      `Anda adalah Career Coach & Senior Recruiter di ProofyLink Talent Network.\n` +
      `Tugas Anda: Lakukan Review CV Keseluruhan dan kesiapan melamar kerja secara ramah, mudah dipahami, komunikatif, dan objektif dalam Bahasa Indonesia untuk kandidat berikut:\n\n` +
      `- Target Peran yang Dituju: ${role}\n` +
      `- Headline Profil: ${context.headline || "Belum ditentukan"}\n` +
      `- Ringkasan Tentang Saya: ${context.about || "Belum diisi"}\n` +
      `- Keahlian yang Tercantum (Skills): ${context.skills.join(", ") || "Belum ada keahlian yang diisi"}\n` +
      `- Lokasi: ${context.location || "Indonesia"}` +
      customNote +
      `\n\n` +
      `ATURAN WAJIB EVALUASI KEAHLIAN (SKILLS):\n` +
      `1. Periksa dengan kritis keaslian dan relevansi keahlian kandidat: [${context.skills.join(", ")}] terhadap target peran "${role}".\n` +
      `   - Jika keahlian yang tercantum TIDAK RELEVAN, TIDAK JELAS, atau berupa KATA ACANG/DUMMY (seperti 'plo', 'pluh', 'plar', 'test', 'asdf', teks tanpa arti, atau keahlian yang tidak berkaitan dengan ${role}):\n` +
      `     * DILARANG KERAS MEMUJINYA DI 'whatGood'! JANGAN katakan fokus peran atau keahlian sudah konsisten!\n` +
      `     * Berikan status 'needs_improvement' pada audit keahlian (Skills & Tools).\n` +
      `     * Masukkan ke 'whatNotGood' saran perbaikan kompetensi yang tegas dan jelas: "Keahlian yang tercantum saat ini (${context.skills.join(", ")}) belum sesuai dengan kebutuhan posisi ${role}. Perbaiki kompetensi agar sesuai dengan peran yang dituju (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")})."\n` +
      `     * Masukkan ke 'priorityActionItems': "Perbarui daftar keahlian di profil agar relevan dengan posisi ${role}."\n` +
      `     * Berikan skor kesiapan yang wajar (skor di bawah 55) karena kompetensi utama belum terpenuhi.\n` +
      `   - Jika keahlian kandidat valid dan relevan dengan ${role}, baru apresiasi di 'whatGood' dan sarankan pengelompokan keahlian.\n\n` +
      `PANDUAN GAYA BAHASA (GENERAL & MUDAH DIPAHAMI KANDIDAT):\n` +
      `2. Gunakan Bahasa Indonesia yang ramah, sopan, dan mudah dipahami oleh kandidat tanpa istilah teknikal yang membingungkan:\n` +
      `   - JANGAN gunakan istilah 'parser ATS' atau 'kegagalan parser ATS'. Gunakan: 'sistem seleksi otomatis dan tim perekrut'.\n` +
      `   - JANGAN gunakan 'metrik kuantitatif' atau 'metrik kuantitatif nyata (%, angka, efisiensi)'. Gunakan: 'bukti hasil kerja nyata (angka %, jumlah proyek, efisiensi waktu)'.\n` +
      `   - JANGAN gunakan 'domain industri spesifik'. Gunakan: 'bidang industri yang ditekuni (misal: teknologi, perbankan, retail)'.\n` +
      `   - JANGAN gunakan 'strong action verbs' atau 'metode STAR' tanpa penjelasan. Gunakan: 'kata kerja aktif yang jelas (misal: Memimpin, Merancang, Mengembangkan)'.\n\n` +
      `PANDUAN STRUKTUR OUTPUT:\n` +
      `1. readinessLevel: Pilih dari 'Sangat Siap Kerja', 'Cukup Siap (Perlu Pengayaan)', atau 'Perlu Penyesuaian Keahlian'.\n` +
      `2. overallScore: Berikan skor 0-100 yang adil dan objektif.\n` +
      `3. executiveSummary: 2-3 kalimat rangkuman ramah mengenai kondisi CV saat ini dan saran utama pengembangannya.\n` +
      `4. sectionAudits: Wajib mencakup 5 bagian CV:\n` +
      `   - '1. Headline & Identitas Profesional'\n` +
      `   - '2. Ringkasan Profil (Tentang Saya / About)'\n` +
      `   - '3. Riwayat Pengalaman Kerja (Experience)'\n` +
      `   - '4. Daftar Keahlian & Alat Kerja (Skills & Tools)'\n` +
      `   - '5. Pendidikan & Bukti Portofolio'\n` +
      `   Untuk setiap bagian tentukan status ('good' atau 'needs_improvement'), notes (minimal 2 observasi jelas), dan recommendation (solusi perbaikan yang mudah dipahami).\n` +
      `5. formatChecks: Evaluasi 4 aspek kerapian CV:\n` +
      `   - 'Kerapian Format & Judul Bagian Baku'\n` +
      `   - 'Kesesuaian Kata Kunci & Keahlian Pokok'\n` +
      `   - 'Keterbacaan Poin Uraian & Tata Letak'\n` +
      `   - 'Kelengkapan Tautan Kontak & Portofolio'\n` +
      `6. priorityActionItems: 3 langkah aksi paling mendesak dan mudah dijalankan.\n` +
      `7. structuredAdvice: opening, whatGood (minimal 2 poin), whatNotGood (minimal 2 poin), dan conclusion.\n` +
      `8. nextSteps: minimal 3 langkah tindak lanjut langsung.`;

    const aiOut = await aiResult(cvReviewPillarSchema, prompt, cvFallback, options);

    return {
      focus: "cv_review" as const,
      summary: aiOut.summary || aiOut.executiveSummary,
      headlineSuggestions: [],
      starBullets: [],
      pillars: [],
      structuredAdvice: aiOut.structuredAdvice,
      cvReviewDetails: {
        readinessLevel: aiOut.readinessLevel,
        overallScore: aiOut.overallScore,
        executiveSummary: aiOut.executiveSummary,
        sectionAudits: aiOut.sectionAudits,
        formatChecks: aiOut.formatChecks,
        priorityActionItems: aiOut.priorityActionItems,
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
      targetRole: role,
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
          recommendation: "Cantumkan contoh bagaimana hasil kerjamu membantu menyelesaikan masalah atau mempercepat efisiensi tim.",
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
            "Cantumkan alat kerja yang kamu kuasai secara spesifik di bagian keahlian.",
            "Tuliskan kontribusimu bersama tim pada deskripsi pencapaian karir.",
          ]
        : [
            `Perbarui profil dengan mempelajari keahlian dasar untuk posisi ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Buat minimal satu proyek sederhana atau studi kasus untuk membuktikan kemampuanmu.",
            "Ikuti kursus atau pelatihan daring untuk membangun fondasi keahlian yang dibutuhkan.",
          ],
      summary: skillCheck.isPlausible
        ? `Evaluasi Kesenjangan Karir untuk ${role}: Tingkat keselarasan saat ini mencapai 82%. Keunggulan utama pada komunikasi dan kolaborasi tim, dengan area peningkatan pada pembuktian dampak kerja.`
        : `Evaluasi Kesenjangan Karir untuk ${role}: Tingkat keselarasan saat ini masih 40%. Diperlukan perbaikan kompetensi agar daftar keahlian selaras dengan kebutuhan peran ${role}.`,
      structuredAdvice: {
        opening: `Berdasarkan perbandingan profilmu dengan kebutuhan umum posisi ${role}:`,
        whatGood: [
          "Kamu memiliki motivasi dan tujuan karir yang terarah menuju peran target ini.",
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
          ? "Fokuskan waktu pada penyusunan studi kasus portofolio untuk membuktikan kemampuanmu kepada calon perekrut."
          : `Mulailah dengan memperkuat keahlian dasar yang paling sering dicari perekrut untuk posisi ${role}.`,
      },
      answer: skillCheck.isPlausible
        ? `Gap Analysis: Profilmu sudah berada di jalur yang benar untuk posisi ${role}. Lengkapi portofolio dengan studi kasus nyata untuk menutup kesenjangan yang ada.`
        : `Gap Analysis: Keahlian saat ini belum selaras dengan kualifikasi ${role}. Prioritaskan penyesuaian kompetensi dengan mempelajari keterampilan inti yang dicari perusahaan.`,
      nextSteps: skillCheck.isPlausible
        ? [
            "Tambahkan 1 studi kasus di portofolio yang membuktikan proses kerjamu secara runtut.",
            "Perbarui daftar alat kerja dan metode yang kamu kuasai di profil CV.",
            "Siapkan cerita pengalaman kolaborasi tim untuk dibahas saat wawancara.",
          ]
        : [
            `Pelajari 2-3 keahlian pokok yang wajib dimiliki untuk peran ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Buat proyek latihan mandiri sebagai bukti kemampuan awalmu.",
            "Perbarui profil ProofyLink setelah menyelesaikan materi atau proyek baru.",
          ],
      limitations: [
        "Analisis kesenjangan ini membandingkan profilmu dengan kualifikasi umum di pasar kerja saat ini.",
        "Kebutuhan spesifik dapat berbeda di tiap perusahaan tergantung pada skala dan jenis bisnisnya.",
      ],
    };

    const prompt =
      `Anda adalah Career Coach & Senior Recruiter di ProofyLink Talent Network.\n` +
      `Tugas Anda: Lakukan Analisis Kesenjangan Karir (Gap Analysis) antara profil kandidat saat ini dengan kualifikasi umum untuk posisi target secara ramah, komunikatif, dan mudah dipahami dalam Bahasa Indonesia.\n\n` +
      `- Target Peran yang Dituju: ${role}\n` +
      `- Headline Profil: ${context.headline || "Belum ditentukan"}\n` +
      `- Ringkasan Tentang Saya: ${context.about || "Belum diisi"}\n` +
      `- Keahlian yang Tercantum (Skills): ${context.skills.join(", ") || "Belum ada keahlian yang diisi"}\n` +
      `- Lokasi: ${context.location || "Indonesia"}` +
      customNote +
      `\n\n` +
      `ATURAN WAJIB EVALUASI KEAHLIAN (SKILLS):\n` +
      `1. Periksa dengan teliti apakah keahlian kandidat: [${context.skills.join(", ")}] cocok dengan posisi target "${role}".\n` +
      `   - Jika keahlian kandidat TIDAK RELEVAN, TIDAK JELAS, atau berupa kata acak/dummy (seperti 'plo', 'pluh', 'plar', 'test', dsb):\n` +
      `     * DILARANG MEMUJI KEAHLIAN INI DI 'whatGood'!\n` +
      `     * Berikan skor kecocokan rendah (di bawah 50).\n` +
      `     * Di 'criticalGaps' dan 'whatNotGood', tegaskan bahwa keahlian saat ini belum sesuai dan sarankan perbaikan kompetensi agar sesuai dengan posisi ${role} (misalnya: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).\n` +
      `     * Cantumkan keahlian riil yang seharusnya dipelajari.\n` +
      `   - Jika keahlian relevan, berikan evaluasi gap yang objektif dan solutif.\n\n` +
      `PANDUAN GAYA BAHASA (MUDAH DIPAHAMI & GENERAL):\n` +
      `2. Gunakan Bahasa Indonesia yang komunikatif, ramah, dan membumi. Hindari istilah teknis yang berlebihan (hindari kata-kata rumit seperti 'tokenization', 'A/B testing mutlak', 'metrik kuantitatif'). Gunakan istilah sederhana seperti 'bukti hasil nyata', 'riset pengguna', 'alat kerja standar'.\n\n` +
      `PANDUAN OUTPUT:\n` +
      `1. matchScore: Angka 0-100 kecocokan profil terhadap target posisi ${role}.\n` +
      `2. matchLevel: Tingkat keselarasan ('Tinggi', 'Menengah', atau 'Perlu Penyesuaian Kompetensi').\n` +
      `3. coreCompetencies: 4 kompetensi penting untuk posisi ${role} lengkap dengan candidateLevel, requiredLevel, status ('match', 'gap', atau 'exceeds'), dan recommendation yang mudah dipahami.\n` +
      `4. criticalGaps: 3 kesenjangan keahlian atau pengalaman yang perlu segera diperbaiki.\n` +
      `5. transferableStrengths: 2-3 keunggulan atau potensi positif kandidat.\n` +
      `6. strategicRecommendations: 3 langkah nyata untuk menutup kesenjangan tersebut.\n` +
      `7. structuredAdvice: opening, whatGood (minimal 2 poin), whatNotGood (minimal 2 poin), conclusion.\n` +
      `8. nextSteps: minimal 3 langkah aksi terarah.`;

    const aiOut = await aiResult(gapAnalysisPillarSchema, prompt, gapFallback, options);

    return {
      focus: "gap_analysis" as const,
      summary: aiOut.summary,
      headlineSuggestions: [],
      starBullets: [],
      pillars: [],
      structuredAdvice: aiOut.structuredAdvice,
      gapAnalysisDetails: {
        targetRole: aiOut.targetRole,
        matchScore: aiOut.matchScore,
        matchLevel: aiOut.matchLevel,
        coreCompetencies: aiOut.coreCompetencies,
        criticalGaps: aiOut.criticalGaps,
        transferableStrengths: aiOut.transferableStrengths,
        strategicRecommendations: aiOut.strategicRecommendations,
      },
      answer: aiOut.answer,
      nextSteps: aiOut.nextSteps,
      limitations: aiOut.limitations,
      modelVersion: defaultVersion,
      source: getSource(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PILAR 3: CAREER CONSULTATION & PERSIAPAN REKRUTMEN (career_consultation / career_roadmap / star)
  // ─────────────────────────────────────────────────────────────────────────────
  const consultationFallback = {
    targetRole: role,
    targetTimeline: "3 — 6 Bulan Kesiapan",
    targetLevel: skillCheck.isPlausible ? `Kesiapan Kompetitif untuk ${role}` : `Kandidat Siap Kerja untuk ${role}`,
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
    summary: `Career Consultation untuk ${role}: Panduan strategis kesiapan diri dalam 3-6 bulan yang berfokus pada pembuktian portofolio, visibilitas di mata HRD, dan penguasaan teknik pitching wawancara kerja.`,
    structuredAdvice: {
      opening: `Konsultasi persiapan karir dan strategi memikat HRD untuk posisi ${role}:`,
      whatGood: [
        "Arah tujuan karir sudah terdefinisi jelas menuju target peran yang diinginkan.",
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
      conclusion: "Terapkan rekomendasi di atas untuk membangun kepercayaan diri dan daya pikat profilmu di hadapan HRD.",
    },
    answer: `Career Consultation: Panduan persiapan karir dan teknik memikat HRD untuk posisi ${role} melalui penguatan portofolio nyata, visibilitas profesional, dan kesiapan wawancara kerja.`,
    nextSteps: skillCheck.isPlausible
      ? [
          "Pilih 1 proyek terbaik dan tuliskan ulang uraian hasilnya menggunakan metode STAR.",
          "Tinjau kelengkapan profil ProofyLink agar mudah ditemukan dalam pencarian talent.",
          "Latih pitching ringkas 2 menit tentang siapa dirimu dan keunggulan utamamu.",
        ]
      : [
          `Mulai pelajari 2-3 keahlian utama untuk posisi ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
          "Buat 1 proyek latihan sederhana untuk dijadikan portofolio awal.",
          "Jalankan kembali konsultasi ini setelah portofolio barumu siap.",
        ],
    limitations: [
      "Konsultasi ini merupakan panduan umum berbasis tren pasar kerja dan simulasi sudut pandang HRD sebagai referensi mandiri.",
      "ProofyLink bukan penasihat karir bersertifikasi; proses rekrutmen aktual bergantung pada kebutuhan spesifik masing-masing perusahaan.",
    ],
  };

  const prompt =
    `Anda adalah Lead Technical Recruiter & Talent Advisor di ProofyLink Talent Network.\n` +
    `Tugas Anda: Berikan Career Consultation (Konsultasi Karir & Kesiapan Rekrutmen) yang ramah, membumi, dan berorientasi pada sudut pandang HRD/perekrut dalam Bahasa Indonesia untuk membantu kandidat dilirik perusahaan.\n\n` +
    `- Target Peran yang Dituju: ${role}\n` +
    `- Headline Profil: ${context.headline || "Belum ditentukan"}\n` +
    `- Ringkasan (About): ${context.about || "Belum diisi"}\n` +
    `- Keahlian Terdaftar (Skills): ${context.skills.join(", ") || "Belum diisi"}\n` +
    `- Lokasi: ${context.location || "Indonesia"}` +
    customNote +
    `\n\n` +
    `ATURAN WAJIB EVALUASI KEAHLIAN (SKILLS):\n` +
    `1. Periksa keahlian kandidat: [${context.skills.join(", ")}] terhadap target peran "${role}".\n` +
    `   - Jika keahlian kandidat TIDAK RELEVAN atau berupa kata-kata dummy (seperti 'plo', 'pluh', 'plar', 'test', dsb):\n` +
    `     * JANGAN memujinya di 'whatGood'!\n` +
    `     * Fase 1 WAJIB difokuskan pada Penyelarasan & Pembangunan Keahlian Inti untuk posisi ${role} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).\n` +
    `     * Di 'whatNotGood', sampaikan dengan ramah bahwa kandidat perlu membangun kompetensi nyata terlebih dahulu sebelum siap dilirik HRD untuk peran ${role}.\n\n` +
    `PANDUAN GAYA BAHASA & SUDUT PANDANG REKRUTER (RAMAH & MEMBUMI):\n` +
    `2. Gunakan sudut pandang "Bagaimana HRD memandang profil ini". Berikan tips nyata agar kandidat tahu apa yang dicari HRD pada saat screening CV, peninjauan portofolio, dan sesi wawancara.\n` +
    `3. HINDARI janji pasti atau bahasa legal absolut. Jadikan konsultasi ini sebagai panduan umum yang memberdayakan kandidat.\n\n` +
    `Struktur Output yang Wajib Diisi:\n` +
    `1. targetTimeline: Berikan estimasi waktu realistis (misal: '3 — 6 Bulan Kesiapan').\n` +
    `2. targetLevel: Tentukan level target kompetensi kandidat.\n` +
    `3. phases: Tepat 3 tahapan strategis:\n` +
    `   - Fase 1: Penguatan Portofolio & Pembuktian Hasil Nyata\n` +
    `   - Fase 2: Personal Branding & Visibilitas ke Perekrut\n` +
    `   - Fase 3: Strategi Pitching Wawancara & Evaluasi Tawaran\n` +
    `   Setiap fase memiliki phaseNumber, phaseName, timeframe, outcome, minimal 3 keyActions, dan milestone.\n` +
    `4. recommendedCertifications: Sebutkan 3 sertifikasi atau topik pelatihan relevan.\n` +
    `5. strategicAdvice: Berikan 3 saran strategis dari kacamata HRD.\n` +
    `6. interviewPitchTips: Berikan 3 tips praktis cara mengkomunikasikan keunggulan diri saat wawancara (termasuk tips transisi karir / gap pengalaman).\n` +
    `7. structuredAdvice: opening, whatGood (min 2), whatNotGood (min 2), dan conclusion.\n` +
    `8. nextSteps: Minimal 3 aksi nyata langsung.\n` +
    `9. limitations: Sertakan disclaimer bahwa ini panduan umum berbasis tren pasar kerja dan ProofyLink bukan penasihat karir bersertifikasi.`;

  const aiOut = await aiResult(careerConsultationPillarSchema, prompt, consultationFallback, options);

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
      phases: aiOut.phases,
      recommendedCertifications: aiOut.recommendedCertifications,
      strategicAdvice: aiOut.strategicAdvice,
      interviewPitchTips: aiOut.interviewPitchTips || consultationFallback.interviewPitchTips,
    },
    careerRoadmapDetails: {
      targetRole: aiOut.targetRole,
      targetTimeline: aiOut.targetTimeline,
      targetLevel: aiOut.targetLevel,
      phases: aiOut.phases,
      recommendedCertifications: aiOut.recommendedCertifications,
      strategicAdvice: aiOut.strategicAdvice,
    },
    answer: aiOut.answer,
    nextSteps: aiOut.nextSteps,
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


import "server-only";

import { createAzure } from "@ai-sdk/azure";
import { generateObject } from "ai";
import { z } from "zod";
import { cvBuilderSchema, cvImportSchema, gapsSchema, advisorSchema, profileContextSchema, questionsSchema, roadmapSchema, screeningSchema, summarySchema } from "./schemas";

const version = "proofylink-screening-v1";
const source = process.env.AI_PROVIDER === "azure" ? "azure" : "mock";

function label(score: number) {
  return score >= 80 ? "Sangat Direkomendasikan" : score >= 50 ? "Direkomendasikan" : score >= 21 ? "Perlu Pertimbangan" : "Perlu Review Mendalam";
}

export async function aiResult<T extends z.ZodType>(schema: T, prompt: string, fallback: z.infer<T>): Promise<z.infer<T>> {
  if (source === "mock") return fallback;

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  if (!endpoint || !deployment || !apiKey || apiKey.startsWith("<")) {
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
    console.error("AI provider error, falling back to mock:", error);
    return fallback;
  }
}

export async function summary(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(summarySchema, JSON.stringify(context), { summary: `${context.headline || "Kandidat"} dengan fokus pada hasil kerja yang dapat dibuktikan dan kolaborasi lintas fungsi.`, strengths: context.skills.slice(0, 3), evidence: ["Ringkasan berasal dari profile yang kandidat setujui."], limitations: ["AI tidak memverifikasi klaim dari sumber eksternal."], modelVersion: version, source });
}

export async function screening(input: unknown) {
  const context = profileContextSchema.parse(input);
  const score = Math.min(100, 48 + context.skills.length * 8 + (context.targetRole ? 12 : 0));
  return aiResult(screeningSchema, JSON.stringify(context), { score, label: label(score), coverage: Math.min(90, 45 + context.skills.length * 8), evidence: ["Skill dan target role tersedia di profile.", "Penilaian berfokus pada data quality dan role fit."], limitations: ["Bukan keputusan hire/reject.", "Financial, credit, dan atribut sensitif tidak dianalisis."], followUp: "Lakukan interview berbasis bukti dan beri kandidat kesempatan klarifikasi.", modelVersion: version, source });
}

export async function interviewQuestions(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(questionsSchema, JSON.stringify(context), { questions: [`Ceritakan proyek paling relevan dengan ${context.targetRole || "role ini"}.`, "Bukti apa yang menunjukkan dampak pekerjaan tersebut?", "Bagaimana kamu berkolaborasi saat requirement berubah?"], limitations: ["Pertanyaan adalah draft dan perlu ditinjau manusia."], modelVersion: version, source });
}

export async function careerAdvisor(input: unknown) {
  const context = profileContextSchema.parse(input);
  return aiResult(advisorSchema, JSON.stringify(context), { answer: `Mulai dari memperkuat bukti untuk ${context.targetRole || "role tujuanmu"}, lalu pilih satu proyek kecil yang bisa selesai dalam 2 minggu.`, nextSteps: ["Pilih satu skill prioritas.", "Tambahkan outcome terukur ke experience.", "Review profile setelah proyek selesai."], limitations: ["Saran hanya memakai data profile kandidat."], modelVersion: version, source });
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

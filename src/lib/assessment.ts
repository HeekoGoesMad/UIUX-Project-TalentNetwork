import { z } from "zod";

export const assessmentQuestionTypes = ["multiple_choice", "free_text", "situational", "structured_response"] as const;
export const questionSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(assessmentQuestionTypes),
  prompt: z.string().trim().min(5, "Pertanyaan minimal 5 karakter.").max(2000, "Pertanyaan maksimal 2.000 karakter."),
  options: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
  required: z.boolean().default(true),
  order: z.number().int().min(0).max(49),
}).superRefine((question, ctx) => {
  if (question.type === "multiple_choice" && question.options.length < 2) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Pilihan ganda membutuhkan minimal 2 opsi." });
  }
  if (question.type !== "multiple_choice" && question.options.length) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Opsi hanya digunakan untuk pilihan ganda." });
  }
});

export const templateSchema = z.object({
  name: z.string().trim().min(3, "Nama assessment minimal 3 karakter.").max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  timeLimitMinutes: z.number().int().min(1).max(240).nullable().optional(),
  attemptLimit: z.number().int().min(1).max(5).default(1),
  questions: z.array(questionSchema).min(1, "Tambahkan minimal satu pertanyaan.").max(50),
}).strict().superRefine((value, ctx) => {
  const orders = value.questions.map((question) => question.order);
  if (new Set(orders).size !== orders.length) ctx.addIssue({ code: "custom", path: ["questions"], message: "Urutan pertanyaan harus unik." });
});

export const templatePatchSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  timeLimitMinutes: z.number().int().min(1).max(240).nullable().optional(),
  attemptLimit: z.number().int().min(1).max(5).optional(),
  questions: z.array(questionSchema).min(1).max(50).optional(),
}).strict().superRefine((value, ctx) => {
  if (!value.questions) return;
  const orders = value.questions.map((question) => question.order);
  if (new Set(orders).size !== orders.length) ctx.addIssue({ code: "custom", path: ["questions"], message: "Urutan pertanyaan harus unik." });
});
export const uuidSchema = z.string().uuid();

export const assessmentReviewStatuses = ["pending", "in_review", "completed", "disputed"] as const;
export const dimensionScoresSchema = z.record(z.string().trim().min(1).max(80), z.number().min(0).max(100)).superRefine((value, ctx) => {
  if (Object.keys(value).length > 20) ctx.addIssue({ code: "custom", message: "Maksimal 20 dimensi penilaian." });
});
export const assessmentReviewCreateSchema = z.object({
  status: z.enum(assessmentReviewStatuses).optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  dimensionScores: dimensionScoresSchema.optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  reviewedAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict();
export const assessmentReviewPatchSchema = assessmentReviewCreateSchema.extend({
  reviewedAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Masukkan minimal satu perubahan review.");

export function parseResponse(value: unknown) {
  if (typeof value === "string") return value.trim().slice(0, 10000);
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").slice(0, 10);
  if (value && typeof value === "object") return value;
  return null;
}

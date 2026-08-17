import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const candidateProfileSyncSchema = z.object({
  displayName: optionalText(160),
  avatarUrl: z.string().url("URL avatar tidak valid.").nullable().optional(),
  phone: optionalText(40),
  headline: optionalText(160),
  targetRole: optionalText(120),
  location: optionalText(120),
  summary: optionalText(4000),
  isPublished: z.boolean().optional(),
  completeness: z.number().int().min(0).max(100).optional(),
  sections: z.array(z.object({
    type: z.enum(["headline", "about", "experience", "education", "skills", "tools", "preferences", "portfolio"]),
    content: z.record(z.string(), z.unknown()).default({}),
    sortOrder: z.number().int().min(0).optional(),
  })).max(20).optional(),
}).strict();

export type CandidateProfileSync = z.infer<typeof candidateProfileSyncSchema>;

import { z } from "zod";

export const profileContextSchema = z.object({
  headline: z.string().max(160).default(""),
  about: z.string().max(2000).default(""),
  skills: z.array(z.string()).max(40).default([]),
  targetRole: z.string().max(120).default(""),
  location: z.string().max(120).default(""),
});

export const summarySchema = z.object({
  summary: z.string(), strengths: z.array(z.string()), evidence: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure"]),
});
export const screeningSchema = z.object({
  score: z.number().min(0).max(100), label: z.string(), coverage: z.number().min(0).max(100), evidence: z.array(z.string()), limitations: z.array(z.string()), followUp: z.string(), modelVersion: z.string(), source: z.enum(["mock", "azure"]),
});
export const questionsSchema = z.object({ questions: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure"]), });
export const advisorSchema = z.object({ answer: z.string(), nextSteps: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure"]), });
export const gapsSchema = z.object({ missing: z.array(z.string()), unevidenced: z.array(z.string()), transferable: z.array(z.string()), irrelevant: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure"]), });
export const roadmapSchema = z.object({ phases: z.array(z.object({ title: z.string(), outcome: z.string(), actions: z.array(z.string()) })), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure"]), });
export const cvBuilderSchema = z.object({ headline: z.string(), about: z.string(), bullets: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure"]), });
export const cvImportSchema = z.object({ fullName: z.string(), headline: z.string(), about: z.string(), skills: z.array(z.string()), experience: z.array(z.object({ company: z.string(), role: z.string(), dates: z.string(), achievements: z.array(z.string()) })), education: z.array(z.object({ school: z.string(), program: z.string(), dates: z.string() })), suggestions: z.array(z.string()), source: z.enum(["mock", "azure"]), });

export type ProfileContext = z.infer<typeof profileContextSchema>;

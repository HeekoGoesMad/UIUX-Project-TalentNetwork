import { z } from "zod";

export const profileContextSchema = z.object({
  headline: z.string().max(160).default(""),
  about: z.string().max(2000).default(""),
  skills: z.array(z.string()).max(40).default([]),
  targetRole: z.string().max(120).default(""),
  location: z.string().max(120).default(""),
});

export const summarySchema = z.object({
  summary: z.string(), strengths: z.array(z.string()), evidence: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]),
});
export const screeningSchema = z.object({
  score: z.number().min(0).max(100), label: z.string(), coverage: z.number().min(0).max(100), evidence: z.array(z.string()), limitations: z.array(z.string()), followUp: z.string(), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]),
});
export const questionsSchema = z.object({ questions: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]), });
export const advisorSchema = z.object({
  focus: z.enum(["ats", "headline", "star", "role", "general"]).default("ats"),
  summary: z.string(),
  headlineSuggestions: z.array(z.string()).default([]),
  starBullets: z.array(z.object({
    before: z.string(),
    after: z.string(),
    impactReason: z.string(),
    metricsHighlight: z.string().optional(),
  })).default([]),
  pillars: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    status: z.enum(["excellent", "good", "needs_improvement"]),
    recommendation: z.string(),
    actionables: z.array(z.string()),
  })).default([]),
  structuredAdvice: z.object({
    opening: z.string(),
    whatGood: z.array(z.string()),
    whatNotGood: z.array(z.string()),
    conclusion: z.string(),
  }).optional(),
  atsDetails: z.object({
    readinessLevel: z.enum(["Sangat Siap ATS", "Cukup Siap", "Perlu Penguatan"]).default("Cukup Siap"),
    detectedKeywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    sectionAudits: z.array(z.object({
      section: z.string(),
      status: z.enum(["good", "needs_improvement"]),
      notes: z.array(z.string()),
      recommendation: z.string(),
    })),
    formatChecks: z.array(z.object({
      check: z.string(),
      passed: z.boolean(),
      tip: z.string(),
    })),
  }).optional(),
  headlineDetails: z.object({
    currentHeadline: z.string(),
    formula: z.string(),
    options: z.array(z.object({
      headline: z.string(),
      rationale: z.string(),
      keywords: z.array(z.string()),
      tag: z.string(),
    })),
    tips: z.array(z.string()),
  }).optional(),
  starDetails: z.object({
    frameworkExplanation: z.string(),
    bullets: z.array(z.object({
      before: z.string(),
      after: z.string(),
      impactReason: z.string(),
      metricsHighlight: z.string(),
    })),
    actionVerbs: z.array(z.string()),
  }).optional(),
  roleDetails: z.object({
    targetRole: z.string(),
    matchScore: z.number().min(0).max(100),
    matchLevel: z.string(),
    coreCompetencies: z.array(z.object({
      competency: z.string(),
      candidateLevel: z.string(),
      requiredLevel: z.string(),
      status: z.enum(["match", "gap", "exceeds"]),
    })),
    criticalGaps: z.array(z.string()),
    strategicRecommendations: z.array(z.string()),
  }).optional(),
  answer: z.string(),
  nextSteps: z.array(z.string()),
  limitations: z.array(z.string()),
  modelVersion: z.string(),
  source: z.enum(["mock", "azure", "local"]),
});
export const gapsSchema = z.object({ missing: z.array(z.string()), unevidenced: z.array(z.string()), transferable: z.array(z.string()), irrelevant: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]), });
export const roadmapSchema = z.object({ phases: z.array(z.object({ title: z.string(), outcome: z.string(), actions: z.array(z.string()) })), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]), });
export const cvBuilderSchema = z.object({ headline: z.string(), about: z.string(), bullets: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]), });
export const cvImportSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  about: z.string(),
  skills: z.array(z.string()),
  hardCompetencies: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      employmentType: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      currentPosition: z.boolean().optional(),
      dates: z.string().optional().default(""),
      description: z.string().optional(),
      achievements: z.array(z.string()).default([]),
    })
  ),
  education: z.array(
    z.object({
      level: z.string().optional(),
      school: z.string(),
      program: z.string(),
      gpa: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      currentlyStudying: z.boolean().optional(),
      dates: z.string().optional().default(""),
    })
  ),
  suggestions: z.array(z.string()),
  source: z.enum(["mock", "azure", "local"]),
});

export type ProfileContext = z.infer<typeof profileContextSchema>;

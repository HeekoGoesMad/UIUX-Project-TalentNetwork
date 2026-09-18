import { z } from "zod";

export const profileContextSchema = z.object({
  headline: z.string().max(160).default(""),
  about: z.string().max(2000).default(""),
  skills: z.array(z.string()).max(40).default([]),
  targetRole: z.string().max(120).default(""),
  location: z.string().max(120).default(""),
  customInstruction: z.string().max(1000).optional().default(""),
  profileJson: z.record(z.string(), z.unknown()).optional(),
  cvReviewResult: z.record(z.string(), z.unknown()).optional(),
  gapAnalysisResult: z.record(z.string(), z.unknown()).optional(),
  consultationTopic: z.string().optional(),
  consultationQuestion: z.string().max(1000).optional(),
});

export const summarySchema = z.object({
  summary: z.string(), strengths: z.array(z.string()), evidence: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]),
});
export const screeningSchema = z.object({
  score: z.number().min(0).max(100), label: z.string(), coverage: z.number().min(0).max(100), evidence: z.array(z.string()), limitations: z.array(z.string()), followUp: z.string(), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]),
});
export const questionsSchema = z.object({ questions: z.array(z.string()), limitations: z.array(z.string()), modelVersion: z.string(), source: z.enum(["mock", "azure", "local"]), });

export const structuredAdviceSchema = z.object({
  opening: z.string(),
  whatGood: z.array(z.string()),
  whatNotGood: z.array(z.string()),
  conclusion: z.string(),
});

export const improvementAreaSchema = z.object({
  aspect: z.string(),
  impact: z.string(),
  recommendation: z.string(),
});

export const cvReviewPillarSchema = z.object({
  readinessLevel: z.string(),
  overallScore: z.number().min(0).max(100),
  profileSummary: z.string(),
  keyStrengths: z.array(z.string()),
  areasForImprovement: z.array(improvementAreaSchema),
  recruiterPerspective: z.string(),
  priorityRecommendations: z.array(z.string()),
  executiveSummary: z.string().default(""),
  sectionAudits: z.array(
    z.object({
      section: z.string(),
      status: z.enum(["good", "needs_improvement"]),
      notes: z.array(z.string()),
      recommendation: z.string(),
    })
  ).default([]),
  formatChecks: z.array(
    z.object({
      check: z.string(),
      passed: z.boolean(),
      tip: z.string(),
    })
  ).default([]),
  priorityActionItems: z.array(z.string()).default([]),
  summary: z.string(),
  structuredAdvice: structuredAdviceSchema,
  answer: z.string(),
  nextSteps: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const gapAnalysisPillarSchema = z.object({
  targetRole: z.string(),
  matchScore: z.number().min(0).max(100),
  matchLevel: z.string(),
  currentPosition: z.string().default(""),
  readinessScore: z.number().min(0).max(100).default(70),
  readinessReason: z.string().default(""),
  existingCompetencies: z.array(z.string()).default([]),
  competencyGaps: z.array(z.string()).default([]),
  experienceGaps: z.array(z.string()).default([]),
  toolGaps: z.array(z.string()).default([]),
  recommendedCertifications: z.array(z.string()).default([]),
  developmentPriorities: z.array(z.string()).default([]),
  estimatedDevelopmentTime: z.string().default("3 — 6 Bulan"),
  coreCompetencies: z.array(
    z.object({
      competency: z.string(),
      candidateLevel: z.string(),
      requiredLevel: z.string(),
      status: z.enum(["match", "gap", "exceeds"]),
      recommendation: z.string().default(""),
    })
  ),
  criticalGaps: z.array(z.string()),
  transferableStrengths: z.array(z.string()),
  strategicRecommendations: z.array(z.string()),
  summary: z.string(),
  structuredAdvice: structuredAdviceSchema,
  answer: z.string(),
  nextSteps: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type GapAnalysisPillarData = z.infer<typeof gapAnalysisPillarSchema>;

export const careerRoadmapPillarSchema = z.object({
  targetRole: z.string(),
  targetTimeline: z.string(),
  targetLevel: z.string(),
  phases: z.array(
    z.object({
      phaseNumber: z.number(),
      phaseName: z.string(),
      timeframe: z.string(),
      outcome: z.string(),
      keyActions: z.array(z.string()),
      milestone: z.string(),
    })
  ),
  recommendedCertifications: z.array(z.string()),
  strategicAdvice: z.array(z.string()),
  summary: z.string(),
  structuredAdvice: structuredAdviceSchema,
  answer: z.string(),
  nextSteps: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const consultationRecommendationSchema = z.object({
  focusArea: z.string(),
  title: z.string(),
  description: z.string(),
  actionableTip: z.string(),
});

export const consultationNextStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  timeline: z.string(),
  action: z.string(),
  expectedOutcome: z.string(),
});

export const consultationAnalysisSchema = z.object({
  overallAssessment: z.string(),
  profileReadiness: z.string(),
  missingDataNotices: z.array(z.string()).default([]),
  cvReviewHighlights: z.string().default(""),
  gapAnalysisHighlights: z.string().default(""),
});

export const careerConsultationPillarSchema = z.object({
  targetRole: z.string(),
  targetTimeline: z.string(),
  targetLevel: z.string(),
  analysis: consultationAnalysisSchema,
  recommendations: z.array(consultationRecommendationSchema),
  nextSteps: z.array(consultationNextStepSchema),
  phases: z.array(
    z.object({
      phaseNumber: z.number(),
      phaseName: z.string(),
      timeframe: z.string(),
      outcome: z.string(),
      keyActions: z.array(z.string()),
      milestone: z.string(),
    })
  ).default([]),
  recommendedCertifications: z.array(z.string()).default([]),
  strategicAdvice: z.array(z.string()).default([]),
  interviewPitchTips: z.array(z.string()).default([]),
  summary: z.string(),
  structuredAdvice: structuredAdviceSchema,
  answer: z.string(),
  limitations: z.array(z.string()),
});

export const advisorSchema = z.object({
  focus: z.enum(["cv_review", "gap_analysis", "career_consultation", "career_roadmap", "ats", "headline", "star", "role", "general"]).default("cv_review"),
  summary: z.string(),
  headlineSuggestions: z.array(z.string()).default([]),
  starBullets: z.array(z.object({
    before: z.string(),
    after: z.string(),
    impactReason: z.string(),
    metricsHighlight: z.string().default(""),
  })).default([]),
  pillars: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    status: z.enum(["excellent", "good", "needs_improvement"]),
    recommendation: z.string(),
    actionables: z.array(z.string()),
  })).default([]),
  structuredAdvice: structuredAdviceSchema.optional(),
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
  cvReviewDetails: z.object({
    readinessLevel: z.string(),
    overallScore: z.number().min(0).max(100),
    executiveSummary: z.string(),
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
    priorityActionItems: z.array(z.string()),
  }).optional(),
  gapAnalysisDetails: z.object({
    targetRole: z.string(),
    matchScore: z.number().min(0).max(100),
    matchLevel: z.string(),
    coreCompetencies: z.array(z.object({
      competency: z.string(),
      candidateLevel: z.string(),
      requiredLevel: z.string(),
      status: z.enum(["match", "gap", "exceeds"]),
      recommendation: z.string().default(""),
    })),
    criticalGaps: z.array(z.string()),
    transferableStrengths: z.array(z.string()),
    strategicRecommendations: z.array(z.string()),
  }).optional(),
  careerConsultationDetails: z.object({
    targetRole: z.string(),
    targetTimeline: z.string(),
    targetLevel: z.string(),
    analysis: consultationAnalysisSchema.optional(),
    recommendations: z.array(consultationRecommendationSchema).default([]),
    actionSteps: z.array(consultationNextStepSchema).default([]),
    phases: z.array(z.object({
      phaseNumber: z.number(),
      phaseName: z.string(),
      timeframe: z.string(),
      outcome: z.string(),
      keyActions: z.array(z.string()),
      milestone: z.string(),
    })).default([]),
    recommendedCertifications: z.array(z.string()).default([]),
    strategicAdvice: z.array(z.string()).default([]),
    interviewPitchTips: z.array(z.string()).default([]),
  }).optional(),
  careerRoadmapDetails: z.object({
    targetRole: z.string(),
    targetTimeline: z.string(),
    targetLevel: z.string(),
    phases: z.array(z.object({
      phaseNumber: z.number(),
      phaseName: z.string(),
      timeframe: z.string(),
      outcome: z.string(),
      keyActions: z.array(z.string()),
      milestone: z.string(),
    })),
    recommendedCertifications: z.array(z.string()),
    strategicAdvice: z.array(z.string()),
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
  hardCompetencies: z.array(z.string()),
  tools: z.array(z.string()),
  softSkills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      employmentType: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      currentPosition: z.boolean().nullable(),
      dates: z.string(),
      description: z.string().nullable(),
      achievements: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      level: z.string().nullable(),
      school: z.string(),
      program: z.string(),
      gpa: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      currentlyStudying: z.boolean().nullable(),
      dates: z.string(),
    })
  ),
  suggestions: z.array(z.string()),
  source: z.enum(["mock", "azure", "local"]),
});

export type ProfileContext = z.infer<typeof profileContextSchema>;

export const recruiterPromptInputSchema = z.object({
  category: z.enum([
    "interview_invitation",
    "assessment_invitation",
    "schedule_confirmation",
    "offer_letter",
    "rejection",
  ]).default("interview_invitation"),
  candidateName: z.string().default("Kandidat"),
  jobTitle: z.string().default("Posisi Target"),
  organizationName: z.string().default("Perusahaan"),
  promptInstructions: z.string().optional().default(""),
  tone: z.enum(["formal", "friendly", "concise"]).default("friendly"),
  keyDetails: z.record(z.string(), z.unknown()).optional(),
});

export const recruiterOutreachPromptSchema = z.object({
  category: z.enum([
    "interview_invitation",
    "assessment_invitation",
    "schedule_confirmation",
    "offer_letter",
    "rejection",
  ]),
  subject: z.string(),
  message: z.string(),
  highlights: z.array(z.string()).default([]),
  callToAction: z.string(),
  tone: z.enum(["formal", "friendly", "concise"]).default("friendly"),
  modelVersion: z.string(),
  source: z.enum(["mock", "azure", "local"]),
});


import "server-only";

export type CvExtractionResult = {
  status: "not_started" | "suggestion_only";
  provider: "unconfigured";
  confidence: null;
};

/** Extraction is intentionally a provider boundary; OCR/text parsing is not part of Phase 1. */
export function getCvExtractionStatus(): CvExtractionResult {
  return { status: "suggestion_only", provider: "unconfigured", confidence: null };
}

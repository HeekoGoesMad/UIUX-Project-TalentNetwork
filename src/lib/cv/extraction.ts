import "server-only";
import { extractCvDocument, getAzureConfig, type ExtractCvInput } from "@/lib/ai/provider";

export type CvExtractionResult = {
  status: "not_started" | "suggestion_only" | "ready";
  provider: "unconfigured" | "azure" | "mock";
  confidence: number | null;
};

/** Extraction provider boundary: checks Azure AI credentials or mock fallback. */
export function getCvExtractionStatus(): CvExtractionResult {
  const provider = process.env.AI_PROVIDER?.trim();
  const { isConfigured } = getAzureConfig();

  if (provider === "mock" && !isConfigured) {
    return { status: "suggestion_only", provider: "mock", confidence: null };
  }
  if (isConfigured) {
    return { status: "ready", provider: "azure", confidence: 0.95 };
  }
  return { status: "suggestion_only", provider: "unconfigured", confidence: null };
}

export { extractCvDocument, type ExtractCvInput };


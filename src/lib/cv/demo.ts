import "server-only";

type DemoDocument = { id: string; candidateProfileId: string; storagePath: string; originalFileName: string; mimeType: string; sizeBytes: number; sha256: string; status: "uploaded" | "review" | "approved" | "rejected" | "deleted"; pageCount: number | null; extractionConfidence: null; createdAt: string; updatedAt: string };
type DemoVerification = { id: string; candidateProfileId: string; type: string; status: "pending" | "verified" | "expired" | "revoked" | "disputed"; evidence: Record<string, unknown>; provider: string | null; verifiedAt: string | null; expiresAt: string | null; revokedAt: string | null; disputeReason: string | null; createdAt: string; updatedAt: string };

const documents: DemoDocument[] = [];
const verifications: DemoVerification[] = [];
const demoCandidateProfileId = "00000000-0000-4000-8000-000000000001";

export function getDemoCandidateProfileId() { return demoCandidateProfileId; }
export function getDemoDocuments() { return documents; }
export function getDemoVerifications() { return verifications; }
export type { DemoDocument, DemoVerification };

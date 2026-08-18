import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAppUser } from "@/lib/api/auth";
import { candidateProfileForUser } from "@/lib/cv/api";
import { getCvExtractionStatus } from "@/lib/cv/extraction";
import { DocumentStorageConfigurationError, storeCvDocument } from "@/lib/cv/storage";
import { getDemoDocuments, getDemoCandidateProfileId } from "@/lib/cv/demo";

const MAX_BYTES = 5 * 1024 * 1024;
const metadataSchema = z.object({ originalFileName: z.string().trim().min(1).max(255), mimeType: z.literal("application/pdf"), sizeBytes: z.number().int().positive().max(MAX_BYTES) });

function pageCount(bytes: Uint8Array) {
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 1_000_000)));
  const count = [...text.matchAll(/\/Type\s*\/Page\b/g)].length;
  return count > 0 ? count : null;
}

export async function GET() {
  try {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") return NextResponse.json({ documents: getDemoDocuments(), demo: true });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Hanya kandidat yang dapat melihat CV." }, { status: 403 });
    const profile = await candidateProfileForUser(current.db, current.user.id);
    if (!profile) return NextResponse.json({ documents: [] });
    const documents = await current.db.select().from(schema.cvDocuments).where(eq(schema.cvDocuments.candidateProfileId, profile.id)).orderBy(desc(schema.cvDocuments.createdAt));
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("CV document list failed", error);
    return NextResponse.json({ error: "Dokumen CV belum dapat dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "File PDF wajib diunggah." }, { status: 400 });
      if (file.type !== "application/pdf") return NextResponse.json({ error: "Hanya PDF yang dapat diunggah." }, { status: 415 });
      if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran PDF harus lebih dari 0 dan maksimal 5 MB." }, { status: 413 });
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return NextResponse.json({ error: "File bukan PDF yang valid." }, { status: 400 });
      const now = new Date().toISOString();
      const document = { id: crypto.randomUUID(), candidateProfileId: getDemoCandidateProfileId(), storagePath: `development-mock/${crypto.randomUUID()}.pdf`, originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, sha256: createHash("sha256").update(bytes).digest("hex"), status: "uploaded" as const, pageCount: null, extractionConfidence: null, createdAt: now, updatedAt: now };
      getDemoDocuments().unshift(document);
      return NextResponse.json({ document, storage: { provider: "development-mock", status: "demo-only" }, extraction: getCvExtractionStatus(), demo: true }, { status: 201 });
    }
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Hanya kandidat yang dapat mengunggah CV." }, { status: 403 });
    const profile = await candidateProfileForUser(current.db, current.user.id);
    if (!profile) return NextResponse.json({ error: "Profil kandidat belum tersedia." }, { status: 409 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File PDF wajib diunggah." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Hanya PDF yang dapat diunggah." }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran PDF harus lebih dari 0 dan maksimal 5 MB." }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    if (header !== "%PDF-") return NextResponse.json({ error: "File bukan PDF yang valid." }, { status: 400 });
    const pages = pageCount(bytes);
    if (pages && pages > 50) return NextResponse.json({ error: "PDF terlalu panjang. Maksimal 50 halaman." }, { status: 413 });
    const metadata = metadataSchema.parse({ originalFileName: file.name, mimeType: file.type, sizeBytes: file.size });
    const key = `${profile.id}/${crypto.randomUUID()}.pdf`;
    const storage = await storeCvDocument({ key, bytes, contentType: metadata.mimeType });
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const [document] = await current.db.insert(schema.cvDocuments).values({ candidateProfileId: profile.id, storagePath: storage.storagePath, originalFileName: metadata.originalFileName, mimeType: metadata.mimeType, sizeBytes: metadata.sizeBytes, sha256, pageCount: pages, status: "uploaded" }).returning();
    await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: "cv.document.uploaded", entityType: "cv_document", entityId: document.id, metadata: { provider: storage.provider, storageStatus: storage.status, extraction: getCvExtractionStatus() } });
    return NextResponse.json({ document, storage, extraction: getCvExtractionStatus() }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentStorageConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("CV document upload failed", error);
    return NextResponse.json({ error: "Dokumen CV belum dapat disimpan." }, { status: 503 });
  }
}

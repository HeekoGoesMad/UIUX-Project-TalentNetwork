import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { ownedCvDocument, uuidSchema } from "@/lib/cv/api";
import { writeAuditLog } from "@/lib/audit";
import { getDemoDocuments } from "@/lib/cv/demo";

const patchSchema = z.object({ originalFileName: z.string().trim().min(1).max(255).optional(), status: z.enum(["uploaded", "review", "approved", "rejected", "deleted"]).optional() }).strict();

export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    if (!uuidSchema.safeParse(documentId).success) return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      const document = getDemoDocuments().find((item) => item.id === documentId);
      return document ? NextResponse.json({ document, demo: true }) : NextResponse.json({ error: "Dokumen CV tidak ditemukan." }, { status: 404 });
    }
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Akses kandidat diperlukan." }, { status: 403 });
    const document = await ownedCvDocument(current.db, documentId, current.user.id);
    if (!document) return NextResponse.json({ error: "Dokumen CV tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ document, review: { status: document.status, reviewerId: null, reviewedAt: null, notes: null }, limitations: ["Reviewer assignment, review notes, and document approval timestamp are not modeled in the existing schema."] });
  } catch (error) { console.error("CV document detail failed", error); return NextResponse.json({ error: "Dokumen CV belum dapat dimuat." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    if (!uuidSchema.safeParse(documentId).success) return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success || !Object.keys(parsed.data).length) return NextResponse.json({ error: "Metadata dokumen tidak valid." }, { status: 400 });
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      const document = getDemoDocuments().find((item) => item.id === documentId);
      if (!document) return NextResponse.json({ error: "Dokumen CV tidak ditemukan." }, { status: 404 });
      Object.assign(document, parsed.data, { updatedAt: new Date().toISOString() });
      return NextResponse.json({ document, demo: true });
    }
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Akses kandidat diperlukan." }, { status: 403 });
    const owned = await ownedCvDocument(current.db, documentId, current.user.id);
    if (!owned) return NextResponse.json({ error: "Dokumen CV tidak ditemukan." }, { status: 404 });
    const [document] = await current.db.update(schema.cvDocuments).set({ ...parsed.data, updatedAt: new Date(), deletedAt: parsed.data.status === "deleted" ? new Date() : undefined }).where(and(eq(schema.cvDocuments.id, documentId), eq(schema.cvDocuments.candidateProfileId, owned.candidateProfileId))).returning();
    await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: "cv.document.updated", entityType: "cv_document", entityId: documentId, metadata: { changes: parsed.data } });
    return NextResponse.json({ document });
  } catch (error) { console.error("CV document update failed", error); return NextResponse.json({ error: "Metadata dokumen belum dapat diperbarui." }, { status: 503 }); }
}

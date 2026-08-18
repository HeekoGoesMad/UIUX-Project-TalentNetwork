import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAppUser } from "@/lib/api/auth";
import { candidateProfileForUser, ownedCvDocument, uuidSchema } from "@/lib/cv/api";

const bodySchema = z.object({ template: z.enum(["ats", "creative"]), content: z.record(z.string(), z.unknown()).default({}) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  if (!uuidSchema.safeParse(documentId).success) return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Template atau isi versi tidak valid." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Hanya kandidat yang dapat membuat versi CV." }, { status: 403 });
    const profile = await candidateProfileForUser(current.db, current.user.id);
    const document = await ownedCvDocument(current.db, documentId, current.user.id);
    if (!profile || !document) return NextResponse.json({ error: "Dokumen CV tidak ditemukan." }, { status: 404 });
    if (["deleted", "rejected"].includes(document.status)) return NextResponse.json({ error: "Dokumen belum dapat dibuatkan versi." }, { status: 409 });
    const [latest] = await current.db.select({ versionNumber: schema.cvVersions.versionNumber }).from(schema.cvVersions).where(eq(schema.cvVersions.cvDocumentId, documentId)).orderBy(desc(schema.cvVersions.versionNumber)).limit(1);
    const [version] = await current.db.insert(schema.cvVersions).values({ cvDocumentId: documentId, candidateProfileId: profile.id, versionNumber: (latest?.versionNumber ?? 0) + 1, template: parsed.data.template, content: parsed.data.content, generatedAt: new Date() }).returning();
     await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: "cv.version.created", entityType: "cv_version", entityId: version.id, metadata: { documentId, template: version.template, versionNumber: version.versionNumber } });
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) { console.error("CV version creation failed", error); return NextResponse.json({ error: "Versi CV belum dapat dibuat." }, { status: 503 }); }
}

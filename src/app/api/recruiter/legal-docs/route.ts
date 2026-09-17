import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { storeLegalDocument } from "@/lib/recruiter/legal-docs-storage";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const { db, user } = current;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 400 });
    }

    if (!docType || !["nib", "npwp"].includes(docType)) {
      return NextResponse.json(
        { error: "Tipe dokumen tidak valid. Gunakan 'nib' atau 'npwp'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas maksimal 10MB." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/pdf";
    if (!ALLOWED_MIME_TYPES.includes(mimeType) && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Format berkas harus berupa PDF atau gambar (JPG, PNG, WebP)." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const rawExt = file.name.split(".").pop()?.toLowerCase();
    const ext = rawExt && ["pdf", "jpg", "jpeg", "png", "webp"].includes(rawExt) ? rawExt : "pdf";
    const storageKey = `${user.id}/${docType}-${Date.now()}.${ext}`;

    const storageResult = await storeLegalDocument({
      key: storageKey,
      bytes,
      contentType: mimeType,
    });

    // Find or link organization
    const [membership] = await db
      .select({ organizationId: schema.organizationMembers.organizationId })
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.userId, user.id))
      .limit(1);

    let orgId = membership?.organizationId;

    if (!orgId) {
      // Check if user already created an org
      const [existingOrg] = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.createdBy, user.id))
        .limit(1);

      if (existingOrg) {
        orgId = existingOrg.id;
        await db
          .insert(schema.organizationMembers)
          .values({ organizationId: orgId, userId: user.id, role: "owner" })
          .onConflictDoNothing();
      }
    }

    if (orgId) {
      const updateData =
        docType === "nib"
          ? { nibDocumentUrl: storageResult.storagePath, updatedAt: new Date() }
          : { npwpDocumentUrl: storageResult.storagePath, updatedAt: new Date() };

      await db
        .update(schema.organizations)
        .set(updateData)
        .where(eq(schema.organizations.id, orgId));
    }

    return NextResponse.json({
      success: true,
      storagePath: storageResult.storagePath,
      docType,
      fileName: file.name,
      organizationId: orgId ?? null,
    });
  } catch (error) {
    console.error("Gagal mengunggah dokumen legalitas:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

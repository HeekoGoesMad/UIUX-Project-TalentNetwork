import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import {
  storeLegalDocument,
  createLegalDocDownloadUrl,
} from "@/lib/recruiter/legal-docs-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_MIME_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET: Ambil signed URL berkas NIB atau NPWP milik perusahaan rekruter.
 * Query param: ?type=nib atau ?type=npwp
 */
export async function GET(request: Request) {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const { db, user } = current;
  const url = new URL(request.url);
  const docType = url.searchParams.get("type")?.toLowerCase();

  if (!docType || !["nib", "npwp"].includes(docType)) {
    return NextResponse.json(
      { error: "Parameter type harus bernilai 'nib' atau 'npwp'." },
      { status: 400 }
    );
  }

  try {
    const [membership] = await db
      .select({ organizationId: schema.organizationMembers.organizationId })
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.userId, user.id))
      .limit(1);

    let orgId = membership?.organizationId;
    if (!orgId) {
      const [existingOrg] = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.createdBy, user.id))
        .limit(1);
      orgId = existingOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan." }, { status: 404 });
    }

    const [organization] = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        nibDocumentUrl: schema.organizations.nibDocumentUrl,
        npwpDocumentUrl: schema.organizations.npwpDocumentUrl,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))
      .limit(1);

    if (!organization) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan." }, { status: 404 });
    }

    const storagePath =
      docType === "nib" ? organization.nibDocumentUrl : organization.npwpDocumentUrl;

    if (!storagePath) {
      return NextResponse.json({
        url: null,
        message: `Dokumen ${docType.toUpperCase()} belum diunggah.`,
      });
    }

    const signedUrl = await createLegalDocDownloadUrl(storagePath);

    if (!signedUrl) {
      if (storagePath.startsWith("development-mock/")) {
        return NextResponse.json({
          url: null,
          isMock: true,
          storagePath,
          message:
            "Dokumen ini diunggah dalam mode development mock (tidak ada berkas fisik tersimpan).",
        });
      }

      return NextResponse.json(
        { url: null, error: "Gagal membuat URL akses dokumen. Pastikan konfigurasi storage valid." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl,
      type: docType,
      storagePath,
    });
  } catch (error) {
    console.error("Gagal mengambil dokumen legalitas rekruter:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Unggah berkas NIB atau NPWP khusus format PDF.
 */
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
        { error: "Ukuran berkas PDF maksimal 10MB." },
        { status: 400 }
      );
    }

    const fileNameLower = file.name.toLowerCase();
    const isPdf =
      file.type === "application/pdf" ||
      ALLOWED_MIME_TYPES.includes(file.type) ||
      fileNameLower.endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          error:
            "Format berkas tidak didukung. Harap unggah dokumen resmi dalam format PDF (.pdf).",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const storageKey = `${user.id}/${docType}-${Date.now()}.pdf`;

    const storageResult = await storeLegalDocument({
      key: storageKey,
      bytes,
      contentType: "application/pdf",
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
    console.error("Gagal mengunggah dokumen legalitas PDF:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

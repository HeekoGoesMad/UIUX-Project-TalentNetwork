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

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET: Ambil signed download URL untuk berkas SK Kemitraan milik partner.
 */
export async function GET() {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const { db, user } = current;

  try {
    const [partnership] = await db
      .select({
        id: schema.partnerships.id,
        name: schema.partnerships.name,
        skDocumentUrl: schema.partnerships.skDocumentUrl,
        skNumber: schema.partnerships.skNumber,
      })
      .from(schema.partnerships)
      .where(eq(schema.partnerships.userId, user.id))
      .limit(1);

    if (!partnership) {
      return NextResponse.json({ error: "Data kemitraan belum dibuat." }, { status: 404 });
    }

    const storagePath = partnership.skDocumentUrl;
    if (!storagePath) {
      return NextResponse.json({
        url: null,
        message: "Dokumen SK Kemitraan belum diunggah.",
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
      type: "sk",
      storagePath,
    });
  } catch (error) {
    console.error("Gagal mengambil dokumen SK partner:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Unggah berkas SK Kemitraan (PDF, JPG, PNG, WEBP maks 10MB).
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

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas maksimal 10MB." },
        { status: 400 }
      );
    }

    const fileNameLower = file.name.toLowerCase();
    const isAllowedExtension =
      fileNameLower.endsWith(".pdf") ||
      fileNameLower.endsWith(".jpg") ||
      fileNameLower.endsWith(".jpeg") ||
      fileNameLower.endsWith(".png") ||
      fileNameLower.endsWith(".webp");

    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isAllowedMime && !isAllowedExtension) {
      return NextResponse.json(
        {
          error:
            "Format berkas tidak didukung. Harap unggah dokumen resmi dalam format PDF, JPG, atau PNG.",
        },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = "pdf";
    if (fileNameLower.endsWith(".png")) ext = "png";
    else if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) ext = "jpg";
    else if (fileNameLower.endsWith(".webp")) ext = "webp";

    const contentType = file.type || (ext === "pdf" ? "application/pdf" : `image/${ext}`);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const storageKey = `${user.id}/partner-sk-${Date.now()}.${ext}`;

    const storageResult = await storeLegalDocument({
      key: storageKey,
      bytes,
      contentType,
    });

    // Check if partnership already exists for this user, and update skDocumentUrl
    const [existing] = await db
      .select({ id: schema.partnerships.id })
      .from(schema.partnerships)
      .where(eq(schema.partnerships.userId, user.id))
      .limit(1);

    if (existing) {
      await db
        .update(schema.partnerships)
        .set({
          skDocumentUrl: storageResult.storagePath,
          updatedAt: new Date(),
        })
        .where(eq(schema.partnerships.id, existing.id));
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    return NextResponse.json({
      success: true,
      storagePath: storageResult.storagePath,
      fileName: file.name,
      fileSize: sizeStr,
      partnershipId: existing?.id ?? null,
    });
  } catch (error) {
    console.error("Gagal mengunggah dokumen SK Kemitraan:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

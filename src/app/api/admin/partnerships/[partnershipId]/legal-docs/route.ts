import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createLegalDocDownloadUrl } from "@/lib/recruiter/legal-docs-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ partnershipId: string }> }
) {
  try {
    const current = await requireAdmin();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const { partnershipId } = await params;
    const db = current.db;

    const [partnership] = await db
      .select({
        id: schema.partnerships.id,
        name: schema.partnerships.name,
        skDocumentUrl: schema.partnerships.skDocumentUrl,
        skNumber: schema.partnerships.skNumber,
      })
      .from(schema.partnerships)
      .where(eq(schema.partnerships.id, partnershipId))
      .limit(1);

    if (!partnership) {
      return NextResponse.json({ error: "Data kemitraan tidak ditemukan." }, { status: 404 });
    }

    const storagePath = partnership.skDocumentUrl;
    if (!storagePath) {
      return NextResponse.json({
        url: null,
        message: "Dokumen SK Kemitraan belum diunggah.",
      });
    }

    // Generate signed download URL
    const signedUrl = await createLegalDocDownloadUrl(storagePath);

    if (!signedUrl) {
      if (storagePath.startsWith("development-mock/")) {
        return NextResponse.json({
          url: null,
          isMock: true,
          storagePath,
          message: "Dokumen ini diunggah dalam mode development mock (tidak ada berkas fisik tersimpan).",
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
    console.error("Gagal mengambil URL dokumen SK kemitraan:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { createLegalDocDownloadUrl } from "@/lib/recruiter/legal-docs-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const current = await requireAdmin();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const { companyId } = await params;
    const url = new URL(request.url);
    const docType = url.searchParams.get("type")?.toLowerCase();

    if (!docType || !["nib", "npwp"].includes(docType)) {
      return NextResponse.json(
        { error: "Parameter type harus bernilai 'nib' atau 'npwp'." },
        { status: 400 }
      );
    }

    const db = current.db;
    const [organization] = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        nibDocumentUrl: schema.organizations.nibDocumentUrl,
        npwpDocumentUrl: schema.organizations.npwpDocumentUrl,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, companyId))
      .limit(1);

    if (!organization) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan." }, { status: 404 });
    }

    const storagePath = docType === "nib" ? organization.nibDocumentUrl : organization.npwpDocumentUrl;

    if (!storagePath) {
      return NextResponse.json({
        url: null,
        message: `Dokumen ${docType.toUpperCase()} belum diunggah.`,
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
      type: docType,
      storagePath,
    });
  } catch (error) {
    console.error("Gagal mengambil URL dokumen legalitas:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

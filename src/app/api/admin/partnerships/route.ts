import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { apiError } from "@/lib/api/request-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAMPLE_PARTNERSHIPS = [
  {
    name: "Universitas Indonesia",
    location: "Kota Depok, Jawa Barat",
    skNumber: "SK-DIKTI/2023/UI-091",
    skDocumentUrl: "/docs/sk-kemendikbud-ui.pdf",
    verificationStatus: "approved" as const,
    verificationNotes: "Dokumen SK Kemitraan terverifikasi resmi oleh Ditjen Dikti Kemendikbudristek.",
  },
  {
    name: "Institut Teknologi Bandung",
    location: "Kota Bandung, Jawa Barat",
    skNumber: "SK-DIKTI/2024/ITB-104",
    skDocumentUrl: "/docs/sk-kemendikbud-itb.pdf",
    verificationStatus: "approved" as const,
    verificationNotes: "MoU Career Center ITB aktif dan terhubung.",
  },
  {
    name: "Universitas Gadjah Mada",
    location: "Kab. Sleman, D.I. Yogyakarta",
    skNumber: "SK-DIKTI/2024/UGM-022",
    skDocumentUrl: "/docs/sk-kemendikbud-ugm.pdf",
    verificationStatus: "pending" as const,
    verificationNotes: null,
  },
  {
    name: "Telkom University",
    location: "Kab. Bandung, Jawa Barat",
    skNumber: "SK-YPT/2024/TEL-088",
    skDocumentUrl: "/docs/sk-kemendikbud-telkom.pdf",
    verificationStatus: "need_revision" as const,
    verificationNotes: "Surat penetapan penanggung jawab career center perlu diperbarui dengan SK dekanat terbaru.",
  },
  {
    name: "Politeknik Negeri Jakarta",
    location: "Kota Depok, Jawa Barat",
    skNumber: "SK-PNJ/2023/PNJ-015",
    skDocumentUrl: null,
    verificationStatus: "rejected" as const,
    verificationNotes: "Masa berlaku SK kemitraan telah kedaluwarsa dan belum ada pengajuan perpanjangan resmi.",
  },
];

export async function GET(request: Request) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const db = current.db;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    // Ambil semua kemitraan yang ada di database
    let rows = await db
      .select({
        partnership: schema.partnerships,
        ownerEmail: schema.users.email,
        ownerName: schema.profiles.displayName,
        reviewerEmail: sql<string | null>`(SELECT email FROM users WHERE users.id = ${schema.partnerships.reviewedBy})`,
      })
      .from(schema.partnerships)
      .leftJoin(schema.users, eq(schema.users.id, schema.partnerships.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.partnerships.userId))
      .orderBy(desc(schema.partnerships.createdAt));

    // Jika database kosong, lakukan bootstrap seeding data kemitraan awal
    if (rows.length === 0) {
      for (const sample of SAMPLE_PARTNERSHIPS) {
        await db.insert(schema.partnerships).values({
          name: sample.name,
          location: sample.location,
          skNumber: sample.skNumber,
          skDocumentUrl: sample.skDocumentUrl,
          verificationStatus: sample.verificationStatus,
          verificationNotes: sample.verificationNotes,
        }).onConflictDoNothing();
      }

      rows = await db
        .select({
          partnership: schema.partnerships,
          ownerEmail: schema.users.email,
          ownerName: schema.profiles.displayName,
          reviewerEmail: sql<string | null>`(SELECT email FROM users WHERE users.id = ${schema.partnerships.reviewedBy})`,
        })
        .from(schema.partnerships)
        .leftJoin(schema.users, eq(schema.users.id, schema.partnerships.userId))
        .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.partnerships.userId))
        .orderBy(desc(schema.partnerships.createdAt));
    }

    let filtered = rows;
    if (status && status !== "all") {
      filtered = filtered.filter((r) => r.partnership.verificationStatus === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.partnership.name?.toLowerCase().includes(s) ||
          r.partnership.location?.toLowerCase().includes(s) ||
          r.partnership.skNumber?.toLowerCase().includes(s) ||
          r.ownerEmail?.toLowerCase().includes(s)
      );
    }

    const partnerships = filtered.map((row) => ({
      id: row.partnership.id,
      userId: row.partnership.userId,
      name: row.partnership.name,
      skDocumentUrl: row.partnership.skDocumentUrl,
      skNumber: row.partnership.skNumber,
      location: row.partnership.location,
      verificationStatus: row.partnership.verificationStatus,
      verificationNotes: row.partnership.verificationNotes,
      reviewedBy: row.partnership.reviewedBy,
      reviewedAt: row.partnership.reviewedAt ? row.partnership.reviewedAt.toISOString() : null,
      reviewerEmail: row.reviewerEmail,
      createdAt: row.partnership.createdAt.toISOString(),
      updatedAt: row.partnership.updatedAt.toISOString(),
      owner: {
        userId: row.partnership.userId,
        email: row.ownerEmail,
        name: row.ownerName,
      },
    }));

    return NextResponse.json({ partnerships, total: partnerships.length });
  } catch (error) {
    return apiError("Gagal mengambil data kemitraan.", 500, error);
  }
}

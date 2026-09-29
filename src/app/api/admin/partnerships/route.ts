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
    institutionType: "Universitas Negeri (PTN)",
    officeAddress: "Gedung Rektorat Kampus UI Depok, Jl. Margonda Raya",
    website: "https://ui.ac.id",
    description: "Perguruan tinggi negeri riset komprehensif terkemuka di Indonesia penghasil talenta akademik dan profesional unggulan.",
    province: "Jawa Barat",
    city: "Kota Depok",
    location: "Kota Depok, Jawa Barat",
    picPosition: "Direktur Career Development Center (CDC)",
    picPhone: "0812-9876-5432",
    skNumber: "SK-DIKTI/2023/UI-091",
    skDocumentUrl: "/documents/sample-sk-mitra.pdf",
    verificationStatus: "approved" as const,
    verificationNotes: "Dokumen SK Kemitraan terverifikasi resmi oleh Ditjen Dikti Kemendikbudristek.",
  },
  {
    name: "Institut Teknologi Bandung",
    institutionType: "Universitas Negeri (PTN)",
    officeAddress: "Jl. Ganesha No. 10, Lebak Siliwangi, Coblong",
    website: "https://itb.ac.id",
    description: "Institusi pendidikan tinggi teknik dan sains terbaik di Indonesia dengan integrasi industri dan jejaring karier luas.",
    province: "Jawa Barat",
    city: "Kota Bandung",
    location: "Kota Bandung, Jawa Barat",
    picPosition: "Kepala Lembaga Pengembangan Inovasi & Karier",
    picPhone: "0813-2233-4455",
    skNumber: "SK-DIKTI/2024/ITB-104",
    skDocumentUrl: "/documents/sample-sk-mitra.pdf",
    verificationStatus: "approved" as const,
    verificationNotes: "MoU Career Center ITB aktif dan terhubung.",
  },
  {
    name: "Universitas Gadjah Mada",
    institutionType: "Universitas Negeri (PTN)",
    officeAddress: "Bulaksumur, Caturtunggal, Depok",
    website: "https://ugm.ac.id",
    description: "Universitas nasional berkelas dunia yang berkomitmen pada pengabdian dan penyaluran lulusan kompetitif.",
    province: "DI Yogyakarta",
    city: "Kabupaten Sleman",
    location: "Kab. Sleman, D.I. Yogyakarta",
    picPosition: "Kasubdit Hubungan Alumni & Penyaluran Kerja",
    picPhone: "0811-2345-6789",
    skNumber: "SK-DIKTI/2024/UGM-022",
    skDocumentUrl: "/documents/sample-sk-mitra.pdf",
    verificationStatus: "pending" as const,
    verificationNotes: null,
  },
  {
    name: "Telkom University",
    institutionType: "Universitas Swasta (PTS)",
    officeAddress: "Jl. Telekomunikasi No. 1, Terusan Buahbatu",
    website: "https://telkomuniversity.ac.id",
    description: "Kampus swasta berbasis teknologi informasi dan komunikasi terbaik di Indonesia.",
    province: "Jawa Barat",
    city: "Kabupaten Bandung",
    location: "Kab. Bandung, Jawa Barat",
    picPosition: "Manajer Career Center & Alumni",
    picPhone: "0812-4455-6677",
    skNumber: "SK-YPT/2024/TEL-088",
    skDocumentUrl: "/documents/sample-sk-mitra.pdf",
    verificationStatus: "need_revision" as const,
    verificationNotes: "Surat penetapan penanggung jawab career center perlu diperbarui dengan SK dekanat terbaru.",
  },
  {
    name: "Politeknik Negeri Jakarta",
    institutionType: "Institut / Politeknik Vokasi",
    officeAddress: "Jl. Prof. Dr. G.A. Siwabessy, Kampus Baru UI Depok",
    website: "https://pnj.ac.id",
    description: "Pendidikan tinggi vokasi berorientasi praktik industri dan kesiapan kerja lulusan tinggi.",
    province: "Jawa Barat",
    city: "Kota Depok",
    location: "Kota Depok, Jawa Barat",
    picPosition: "Ketua Unit Kemahasiswaan & Kerja Sama",
    picPhone: "0819-8765-4321",
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
        ownerPhone: schema.profiles.phone,
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
          institutionType: sample.institutionType,
          officeAddress: sample.officeAddress,
          website: sample.website,
          description: sample.description,
          province: sample.province,
          city: sample.city,
          picPosition: sample.picPosition,
          picPhone: sample.picPhone,
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
          ownerPhone: schema.profiles.phone,
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
          r.partnership.institutionType?.toLowerCase().includes(s) ||
          r.partnership.city?.toLowerCase().includes(s) ||
          r.partnership.province?.toLowerCase().includes(s) ||
          r.ownerEmail?.toLowerCase().includes(s) ||
          r.ownerName?.toLowerCase().includes(s)
      );
    }

    const partnerships = filtered.map((row) => ({
      id: row.partnership.id,
      userId: row.partnership.userId,
      name: row.partnership.name,
      institutionType: row.partnership.institutionType,
      officeAddress: row.partnership.officeAddress,
      website: row.partnership.website,
      description: row.partnership.description,
      province: row.partnership.province,
      city: row.partnership.city,
      picPosition: row.partnership.picPosition,
      picPhone: row.partnership.picPhone || row.ownerPhone,
      logoUrl: row.partnership.logoUrl,
      bannerUrl: row.partnership.bannerUrl,
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
        phone: row.partnership.picPhone || row.ownerPhone,
        title: row.partnership.picPosition,
      },
    }));

    return NextResponse.json({ partnerships, total: partnerships.length });
  } catch (error) {
    return apiError("Gagal mengambil data kemitraan.", 500, error);
  }
}

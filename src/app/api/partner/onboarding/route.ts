import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { extractIndonesianLocalPhone, formatToE164Indonesian, isValidWebsiteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const partnerOnboardingSchema = z.object({
  // PIC
  picName: z.string().trim().min(2, "Nama PIC minimal 2 karakter."),
  picPosition: z.string().trim().min(2, "Jabatan / posisi PIC di lembaga wajib diisi."),
  picEmail: z.string().trim().email("Format email PIC tidak valid."),
  picPhone: z
    .string()
    .trim()
    .refine((val) => {
      const digits = extractIndonesianLocalPhone(val);
      return digits.length >= 8 && digits.length <= 15;
    }, "Nomor WhatsApp / telepon PIC minimal 8 dan maksimal 15 digit angka."),

  // Lembaga
  institutionName: z.string().trim().min(2, "Nama lembaga minimal 2 karakter."),
  institutionType: z.string().trim().min(1, "Kategori lembaga wajib dipilih."),
  province: z.string().trim().min(1, "Provinsi domisili wajib dipilih."),
  city: z.string().trim().min(2, "Kota / kabupaten domisili wajib diisi."),
  officeAddress: z.string().trim().min(5, "Alamat kantor / sekretariat wajib diisi."),
  website: z
    .string()
    .trim()
    .min(3, "Website resmi lembaga wajib diisi.")
    .refine((val) => isValidWebsiteUrl(val), "Format URL website lembaga tidak valid (contoh: https://kampus.ac.id atau kampus.ac.id)."),
  description: z.string().trim().optional(),

  // Legalitas & SK
  skNumber: z.string().trim().min(3, "Nomor SK resmi wajib diisi."),
  skDocumentUrl: z.string().trim().min(1, "Dokumen Surat Keputusan (SK) resmi wajib dilampirkan."),
  skFileName: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

export async function GET() {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const db = current.db;
  const user = current.user;

  try {
    const [partnership] = await db
      .select()
      .from(schema.partnerships)
      .where(eq(schema.partnerships.userId, user.id))
      .limit(1);

    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, user.id))
      .limit(1);

    return NextResponse.json({
      partnership: partnership || null,
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.displayName || user.email.split("@")[0],
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data onboarding partner:", error);
    return NextResponse.json({ error: "Gagal memuat data onboarding." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const parsed = partnerOnboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Data onboarding kemitraan tidak valid.";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const { data } = parsed;
  const db = current.db;
  const user = current.user;

  // Format phone to standard Indonesian E.164 (+62...)
  const formattedPhone = formatToE164Indonesian(data.picPhone);

  // Normalize website url
  const normalizedWebsite =
    data.website.startsWith("http://") || data.website.startsWith("https://")
      ? data.website
      : `https://${data.website}`;

  // Format composite location string
  const resolvedLocation =
    data.location?.trim() ||
    [data.city?.trim(), data.province?.trim()].filter(Boolean).join(", ") ||
    "Indonesia";

  const resolvedSkDoc = data.skDocumentUrl.trim();

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Update or create profile PIC
      await tx
        .insert(schema.profiles)
        .values({
          userId: user.id,
          displayName: data.picName,
          phone: formattedPhone,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            displayName: data.picName,
            phone: formattedPhone,
            updatedAt: new Date(),
          },
        });

      // 2. Touch user updatedAt
      await tx
        .update(schema.users)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id));

      // 3. Update or create partnerships entry
      const existing = await tx
        .select({ id: schema.partnerships.id })
        .from(schema.partnerships)
        .where(eq(schema.partnerships.userId, user.id))
        .limit(1);

      let partnershipId: string;

      if (existing.length === 0) {
        const [created] = await tx
          .insert(schema.partnerships)
          .values({
            userId: user.id,
            name: data.institutionName,
            institutionType: data.institutionType || null,
            officeAddress: data.officeAddress || null,
            website: normalizedWebsite,
            description: data.description || null,
            province: data.province || null,
            city: data.city || null,
            picPosition: data.picPosition || null,
            picPhone: formattedPhone,
            skNumber: data.skNumber || null,
            skDocumentUrl: resolvedSkDoc,
            location: resolvedLocation,
            verificationStatus: "pending",
            verificationNotes: null,
          })
          .returning({ id: schema.partnerships.id });
        partnershipId = created.id;
      } else {
        partnershipId = existing[0].id;
        await tx
          .update(schema.partnerships)
          .set({
            name: data.institutionName,
            institutionType: data.institutionType || null,
            officeAddress: data.officeAddress || null,
            website: normalizedWebsite,
            description: data.description || null,
            province: data.province || null,
            city: data.city || null,
            picPosition: data.picPosition || null,
            picPhone: formattedPhone,
            skNumber: data.skNumber || null,
            skDocumentUrl: resolvedSkDoc,
            location: resolvedLocation,
            verificationStatus: "pending",
            verificationNotes: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.partnerships.id, partnershipId));
      }

      return { partnershipId };
    });

    return NextResponse.json({
      success: true,
      message: "Data kemitraan berhasil diajukan untuk review.",
      partnershipId: result.partnershipId,
    });
  } catch (error) {
    console.error("Gagal menyimpan onboarding kemitraan:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses pengajuan kemitraan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

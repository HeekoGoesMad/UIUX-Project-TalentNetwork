import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const partnerOnboardingSchema = z.object({
  institutionName: z.string().trim().min(2, "Nama lembaga minimal 2 karakter."),
  institutionType: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  location: z.string().trim().optional(),
  officeAddress: z.string().trim().optional(),
  website: z.string().trim().optional(),
  skNumber: z.string().trim().optional(),
  skDocumentUrl: z.string().trim().optional(),
  skFileName: z.string().trim().optional(),
  picName: z.string().trim().min(2, "Nama PIC minimal 2 karakter."),
  picEmail: z.string().email("Format email PIC tidak valid.").optional().or(z.literal("")),
  picPhone: z.string().trim().min(6, "Nomor kontak minimal 6 digit.").optional().or(z.literal("")),
  picPosition: z.string().trim().optional(),
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

  // Format composite location string
  const resolvedLocation =
    data.location?.trim() ||
    [data.city?.trim(), data.province?.trim()].filter(Boolean).join(", ") ||
    "Indonesia";

  const resolvedSkDoc = data.skDocumentUrl || (data.skFileName ? `/uploads/documents/${data.skFileName}` : "/documents/sample-sk-mitra.pdf");

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Update or create profile PIC
      await tx
        .insert(schema.profiles)
        .values({
          userId: user.id,
          displayName: data.picName,
          phone: data.picPhone || null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            displayName: data.picName,
            phone: data.picPhone || null,
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
    return NextResponse.json({ error: "Gagal memproses pengajuan kemitraan." }, { status: 500 });
  }
}

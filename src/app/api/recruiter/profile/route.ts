import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { isDevBypassEnabled } from "@/lib/config/server";
import { createClient } from "@/lib/supabase/server";

type IndustrySector = typeof schema.industrySector.enumValues[number];
type CompanyScale = typeof schema.companyScale.enumValues[number];

const INDUSTRY_VALUES = schema.industrySector.enumValues as unknown as readonly [
  IndustrySector,
  ...IndustrySector[],
];
const SCALE_VALUES = schema.companyScale.enumValues as unknown as readonly [
  CompanyScale,
  ...CompanyScale[],
];

// Demo hanya untuk mode demo eksplisit tanpa DB (DEV_AUTH_BYPASS + tanpa DATABASE_URL).
// Kegagalan auth/DB di luar kondisi ini harus selalu 401/503, bukan demo-200.
function isDemoWithoutDb() {
  return isDevBypassEnabled() && !process.env.DATABASE_URL?.trim();
}

// String kosong dari form dianggap tidak diisi agar select/URL opsional yang kosong lolos validasi.
function emptyToUndefined<T extends z.ZodType>(inner: T) {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    inner.optional()
  );
}

const updateProfileSchema = z
  .object({
    picName: z.string().trim().min(2, "Nama PIC minimal 2 karakter").max(120).optional(),
    picTitle: z.string().trim().min(2, "Jabatan / Role PIC minimal 2 karakter").max(120).optional(),
    picPhone: z.string().trim().min(6, "Nomor telepon tidak valid").max(32).optional(),
    companyName: z.string().trim().min(2, "Nama perusahaan minimal 2 karakter").max(160).optional(),
    industry: emptyToUndefined(
      z.enum(INDUSTRY_VALUES, { error: "Sektor industri tidak valid." })
    ),
    companySize: emptyToUndefined(
      z.enum(SCALE_VALUES, { error: "Skala perusahaan tidak valid." })
    ),
    description: z.string().trim().min(10, "Deskripsi perusahaan minimal 10 karakter").max(2000).optional(),
    websiteUrl: emptyToUndefined(
      z.string().trim().url("URL website tidak valid.").max(2048)
    ),
    linkedinUrl: emptyToUndefined(
      z.string().trim().url("URL LinkedIn tidak valid.").max(2048)
    ),
    officeAddress: z.string().trim().min(5, "Alamat kantor minimal 5 karakter").max(500).optional(),
    city: z.string().trim().min(2, "Kota kantor minimal 2 karakter").max(120).optional(),
    nibNumber: z.string().trim().max(32).optional().nullable(),
    npwpNumber: z.string().trim().max(32).optional().nullable(),
    nibDocumentUrl: z.string().trim().optional().nullable(),
    npwpDocumentUrl: z.string().trim().optional().nullable(),
    picEmail: z.string().optional().nullable(),
    verificationStatus: z.string().optional().nullable(),
  })
  .strip()
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Tidak ada perubahan yang dikirim.",
  });

// Kunci body yang menulis kolom organizations; butuh role owner|admin.
const ORG_WRITE_KEYS = [
  "companyName",
  "industry",
  "companySize",
  "description",
  "websiteUrl",
  "linkedinUrl",
  "city",
  "officeAddress",
  "nibNumber",
  "npwpNumber",
  "nibDocumentUrl",
  "npwpDocumentUrl",
] as const;

function emptyProfileData() {
  return {
    picName: null,
    picEmail: null,
    picTitle: null,
    picPhone: null,
    companyName: null,
    industry: null,
    companySize: null,
    description: null,
    websiteUrl: null,
    linkedinUrl: null,
    officeAddress: null,
    city: null,
    nibNumber: null,
    npwpNumber: null,
    nibDocumentUrl: null,
    npwpDocumentUrl: null,
    verificationStatus: null,
  };
}

export async function GET() {
  if (isDemoWithoutDb()) {
    return NextResponse.json({ data: emptyProfileData(), isDemo: true });
  }

  try {
    const current = await getCurrentAppUser({ allowPending: true });
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const { db, user } = current;

    const profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, user.id),
    });

    const [membership] = await db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.userId, user.id))
      .limit(1);

    const [org] = membership?.organizationId
      ? await db
          .select()
          .from(schema.organizations)
          .where(eq(schema.organizations.id, membership.organizationId))
          .limit(1)
      : [null];

    // Ambil picTitle dari Supabase auth user metadata (disimpan saat onboarding)
    let picTitle: string | null = null;
    try {
      const supabase = await createClient();
      const { data: authData } = await supabase.auth.getUser();
      picTitle =
        (typeof authData.user?.user_metadata?.picTitle === "string" ? authData.user.user_metadata.picTitle : "") ||
        (typeof authData.user?.user_metadata?.picPosition === "string" ? authData.user.user_metadata.picPosition : "") ||
        null;
    } catch {}

    return NextResponse.json({
      data: {
        picName: profile?.displayName ?? user.email.split("@")[0] ?? null,
        picEmail: user.email,
        picTitle: picTitle,
        picPhone: profile?.phone ?? null,
        companyName: org?.name ?? null,
        industry: org?.industry ?? null,
        companySize: org?.companyScale ?? null,
        description: org?.description ?? null,
        websiteUrl: org?.website ?? null,
        linkedinUrl: org?.linkedinUrl ?? null,
        officeAddress: org?.officeAddress ?? null,
        city: org?.city ?? null,
        nibNumber: org?.nib ?? null,
        npwpNumber: org?.npwp ?? null,
        nibDocumentUrl: org?.nibDocumentUrl ?? null,
        npwpDocumentUrl: org?.npwpDocumentUrl ?? null,
        verificationStatus: org?.verificationStatus ?? null,
      },
      isDemo: false,
    });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const parsed = updateProfileSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Format data tidak valid" },
      { status: 400 }
    );
  }

  const { data } = parsed;

  if (isDemoWithoutDb()) {
    return NextResponse.json({ success: true, data, isDemo: true });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const { db, user } = current;

    const wantsOrgWrite = ORG_WRITE_KEYS.some((k) => data[k] !== undefined);
    if (
      wantsOrgWrite &&
      scope.membership.organizationRole !== "owner" &&
      scope.membership.organizationRole !== "admin"
    ) {
      return NextResponse.json(
        { error: "Hanya owner atau admin organisasi yang dapat mengubah data perusahaan." },
        { status: 403 }
      );
    }

    // Perbarui picTitle ke Supabase auth user metadata jika dikirim
    if (data.picTitle !== undefined) {
      try {
        const supabase = await createClient();
        await supabase.auth.updateUser({
          data: {
            picTitle: data.picTitle,
          },
        });
      } catch (err) {
        console.error("Gagal memperbarui picTitle ke Supabase auth metadata:", err);
      }
    }

    await db.transaction(async (tx) => {
      // Kolom profil PIC (displayName/phone) boleh ditulis rekruter aktif mana pun di org.
      if (data.picName !== undefined || data.picPhone !== undefined) {
        const values: typeof schema.profiles.$inferInsert = { userId: user.id };
        if (data.picName !== undefined) values.displayName = data.picName;
        if (data.picPhone !== undefined) values.phone = data.picPhone;
        await tx
          .insert(schema.profiles)
          .values({ ...values, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: schema.profiles.userId,
            set: { ...values, updatedAt: new Date() },
          });
      }

      if (wantsOrgWrite) {
        const nullIfBlank = (v: string | null | undefined) =>
          !v || v.trim() === "" ? null : v;
        const orgSet: Partial<typeof schema.organizations.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (data.companyName !== undefined) orgSet.name = data.companyName;
        if (data.industry !== undefined) orgSet.industry = data.industry;
        if (data.companySize !== undefined) orgSet.companyScale = data.companySize;
        if (data.description !== undefined) orgSet.description = nullIfBlank(data.description);
        if (data.websiteUrl !== undefined) orgSet.website = nullIfBlank(data.websiteUrl);
        if (data.linkedinUrl !== undefined) orgSet.linkedinUrl = nullIfBlank(data.linkedinUrl);
        if (data.city !== undefined) orgSet.city = nullIfBlank(data.city);
        if (data.officeAddress !== undefined)
          orgSet.officeAddress = nullIfBlank(data.officeAddress);
        if (data.nibNumber !== undefined) orgSet.nib = nullIfBlank(data.nibNumber);
        if (data.npwpNumber !== undefined) orgSet.npwp = nullIfBlank(data.npwpNumber);
        if (data.nibDocumentUrl !== undefined)
          orgSet.nibDocumentUrl = nullIfBlank(data.nibDocumentUrl);
        if (data.npwpDocumentUrl !== undefined)
          orgSet.npwpDocumentUrl = nullIfBlank(data.npwpDocumentUrl);
        await tx
          .update(schema.organizations)
          .set(orgSet)
          .where(eq(schema.organizations.id, scope.membership.organizationId));
      }
    });

    return NextResponse.json({ success: true, data, isDemo: false });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

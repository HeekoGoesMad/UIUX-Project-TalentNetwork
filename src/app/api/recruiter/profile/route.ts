import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

type IndustrySector = typeof schema.industrySector.enumValues[number];
type CompanyScale = typeof schema.companyScale.enumValues[number];

function normalizeIndustry(val?: string | null): IndustrySector {
  if (!val) return "Other";
  const s = val.toLowerCase();
  if (s.includes("teknologi") || s.includes("saas") || s.includes("it") || s.includes("software") || s.includes("technology")) {
    return "Technology";
  }
  if (s.includes("fintech") || s.includes("keuangan") || s.includes("financial") || s.includes("bank")) {
    return "Financial Services";
  }
  if (s.includes("hospitality") || s.includes("hotel") || s.includes("pariwisata")) {
    return "Hospitality";
  }
  if (s.includes("retail") || s.includes("commerce") || s.includes("dagang")) {
    return "Retail";
  }
  if (s.includes("manufaktur") || s.includes("fmcg") || s.includes("manufacturing") || s.includes("pabrik")) {
    return "Manufacturing";
  }
  if (s.includes("edutech") || s.includes("pendidikan") || s.includes("education") || s.includes("sekolah")) {
    return "Education";
  }
  if (s.includes("kesehatan") || s.includes("medtech") || s.includes("farmasi") || s.includes("healthcare")) {
    return "Healthcare";
  }
  if (s.includes("logistik") || s.includes("transport") || s.includes("supply chain") || s.includes("logistics")) {
    return "Logistics";
  }
  if (s.includes("konsultan") || s.includes("profesional") || s.includes("professional") || s.includes("bisnis") || s.includes("layanan")) {
    return "Professional Services";
  }
  return "Other";
}

function normalizeCompanyScale(val?: string | null): CompanyScale {
  if (!val) return "1-10 Karyawan";
  const s = val.trim();
  if (s === "1-10" || s.startsWith("1 ") || s.includes("1-10")) return "1-10 Karyawan";
  if (s === "11-50" || s.includes("11-50") || s.includes("11 — 50")) return "11-50 Karyawan";
  if (s === "51-200" || s.includes("51-200") || s.includes("51 — 200")) return "51-200 Karyawan";
  if (s === "201-500" || s.includes("201-500") || s.includes("201 — 500")) return "201-500 Karyawan";
  if (s === "500+" || s.includes("500+") || s.includes("500")) return "500+ Karyawan";
  return "1-10 Karyawan";
}

const updateProfileSchema = z.object({
  picName: z.string().trim().min(2, "Nama PIC minimal 2 karakter"),
  picTitle: z.string().trim().optional(),
  picPhone: z.string().trim().min(6, "Nomor telepon tidak valid"),
  companyName: z.string().trim().min(2, "Nama perusahaan minimal 2 karakter"),
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),
  description: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  officeAddress: z.string().trim().optional(),
  city: z.string().trim().optional(),
  nibNumber: z.string().trim().optional(),
  npwpNumber: z.string().trim().optional(),
});

export async function GET() {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    // Fallback demo data jika offline / dev bypass
    return NextResponse.json({
      data: {
        picName: "Budi Santoso",
        picEmail: "budi@perusahaan.com",
        picTitle: "Head of Talent Acquisition",
        picPhone: "0812-9876-5432",
        companyName: "PT Berkah Sinarindo",
        industry: "Teknologi & Perangkat Lunak (SaaS / IT)",
        companySize: "51-200",
        description: "Perusahaan penyedia teknologi analitik data dan platform kecerdasan talenta digital.",
        websiteUrl: "https://berkahsinarindo.co.id",
        linkedinUrl: "https://linkedin.com/company/berkah-sinarindo",
        officeAddress: "Gedung Cyber 2 Lt. 18, Jl. HR Rasuna Said Blok X-5",
        city: "Jakarta Selatan, DKI Jakarta",
        nibNumber: "9120001234567",
        npwpNumber: "01.234.567.8-012.000",
        verificationStatus: "approved",
      },
      isDemo: true,
    });
  }

  const { db, user } = current;

  try {
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

    return NextResponse.json({
      data: {
        picName: profile?.displayName || user.email.split("@")[0] || "Budi Santoso",
        picEmail: user.email || "budi@perusahaan.com",
        picTitle: "Head of Talent Acquisition",
        picPhone: profile?.phone || "0812-9876-5432",
        companyName: org?.name || "PT Berkah Sinarindo",
        industry: org?.industry || "Technology",
        companySize: org?.companyScale || "51-200 Karyawan",
        description: org?.description || "Perusahaan penyedia teknologi analitik data dan platform kecerdasan talenta digital.",
        websiteUrl: org?.website || "https://berkahsinarindo.co.id",
        linkedinUrl: "https://linkedin.com/company/berkah-sinarindo",
        officeAddress: org?.officeAddress || "Gedung Cyber 2 Lt. 18, Jl. HR Rasuna Said Blok X-5",
        city: org?.city || "Jakarta Selatan, DKI Jakarta",
        nibNumber: org?.nib || "9120001234567",
        npwpNumber: org?.npwp || "01.234.567.8-012.000",
        verificationStatus: org?.verificationStatus || "approved",
      },
      isDemo: false,
    });
  } catch {
    return NextResponse.json({
      data: {
        picName: "Budi Santoso",
        picEmail: user.email,
        picTitle: "Head of Talent Acquisition",
        picPhone: "0812-9876-5432",
        companyName: "PT Berkah Sinarindo",
        industry: "Technology",
        companySize: "51-200 Karyawan",
        description: "Perusahaan penyedia teknologi analitik data dan platform kecerdasan talenta digital.",
        websiteUrl: "https://berkahsinarindo.co.id",
        linkedinUrl: "https://linkedin.com/company/berkah-sinarindo",
        officeAddress: "Gedung Cyber 2 Lt. 18, Jl. HR Rasuna Said Blok X-5",
        city: "Jakarta Selatan, DKI Jakarta",
        nibNumber: "9120001234567",
        npwpNumber: "01.234.567.8-012.000",
        verificationStatus: "approved",
      },
      isDemo: true,
    });
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentAppUser({ allowPending: true });
  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Format data tidak valid" },
      { status: 400 }
    );
  }

  const { data } = parsed;

  if ("error" in current) {
    // In demo mode, return the updated data successfully
    return NextResponse.json({
      success: true,
      data,
      isDemo: true,
    });
  }

  const { db, user } = current;

  try {
    await db.transaction(async (tx) => {
      // 1. Update profiles table
      await tx
        .insert(schema.profiles)
        .values({
          userId: user.id,
          displayName: data.picName,
          phone: data.picPhone,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            displayName: data.picName,
            phone: data.picPhone,
            updatedAt: new Date(),
          },
        });

      const [membership] = await tx
        .select()
        .from(schema.organizationMembers)
        .where(eq(schema.organizationMembers.userId, user.id))
        .limit(1);

      if (membership?.organizationId) {
        await tx
          .update(schema.organizations)
          .set({
            name: data.companyName,
            industry: normalizeIndustry(data.industry),
            companyScale: normalizeCompanyScale(data.companySize),
            description: data.description || null,
            website: data.websiteUrl || null,
            linkedinUrl: data.linkedinUrl || null,
            city: data.city || null,
            officeAddress: data.officeAddress || null,
            nib: data.nibNumber || null,
            npwp: data.npwpNumber || null,
            updatedAt: new Date(),
          })
          .where(eq(schema.organizations.id, membership.organizationId));
      }
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memperbarui profil rekruter" },
      { status: 500 }
    );
  }
}

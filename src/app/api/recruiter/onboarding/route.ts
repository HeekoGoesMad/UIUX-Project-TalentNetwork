import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

type IndustrySector = typeof schema.industrySector.enumValues[number];
type CompanyScale = typeof schema.companyScale.enumValues[number];

function normalizeIndustry(val?: string | null): IndustrySector | null {
  if (!val) return null;
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

function normalizeCompanyScale(val?: string | null): CompanyScale | null {
  if (!val) return null;
  const s = val.trim();
  if (s === "1-10" || s.startsWith("1 ") || s.includes("1-10")) return "1-10 Karyawan";
  if (s === "11-50" || s.includes("11-50") || s.includes("11 — 50")) return "11-50 Karyawan";
  if (s === "51-200" || s.includes("51-200") || s.includes("51 — 200")) return "51-200 Karyawan";
  if (s === "201-500" || s.includes("201-500") || s.includes("201 — 500")) return "201-500 Karyawan";
  if (s === "500+" || s.includes("500+") || s.includes("500")) return "500+ Karyawan";
  return "1-10 Karyawan";
}

const onboardingSchema = z.object({
  picName: z.string().trim().min(2),
  picEmail: z.string().email(),
  picPhone: z.string().trim().min(6),
  picPosition: z.string().trim().optional(),
  companyName: z.string().trim().min(2),
  description: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),
  city: z.string().trim().optional(),
  officeAddress: z.string().trim().optional(),
  website: z.string().trim().optional(),
  nibNumber: z.string().trim().optional(),
  nibFileName: z.string().trim().optional(),
  npwpNumber: z.string().trim().optional(),
  npwpFileName: z.string().trim().optional(),
  aktaFileName: z.string().trim().optional(),
  ktpFileName: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data onboarding rekruter tidak valid." }, { status: 400 });
  }

  const { data } = parsed;
  const db = current.db;
  const user = current.user;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Update or create Profile
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

      // 2. Create or update Organization
      const slug = `org-${user.authUserId}-${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
      const [existingOrgMember] = await tx
        .select({ organizationId: schema.organizationMembers.organizationId })
        .from(schema.organizationMembers)
        .where(eq(schema.organizationMembers.userId, user.id))
        .limit(1);

      const normalizedIndustry = normalizeIndustry(data.industry);
      const normalizedScale = normalizeCompanyScale(data.companySize);

      let orgId = existingOrgMember?.organizationId;
      if (!orgId) {
        const [newOrg] = await tx
          .insert(schema.organizations)
          .values({
            name: data.companyName,
            slug,
            createdBy: user.id,
            nib: data.nibNumber || null,
            npwp: data.npwpNumber || null,
            industry: normalizedIndustry,
            companyScale: normalizedScale,
            city: data.city || null,
            officeAddress: data.officeAddress || null,
            companyEmail: data.picEmail,
            website: data.website || null,
            description: data.description || null,
            verificationStatus: "pending",
          })
          .returning({ id: schema.organizations.id });
        orgId = newOrg.id;

        await tx.insert(schema.organizationMembers).values({
          organizationId: orgId,
          userId: user.id,
          role: "owner",
        }).onConflictDoNothing();

        await tx.insert(schema.tokenAccounts).values({
          organizationId: orgId,
        }).onConflictDoNothing();
      } else {
        await tx
          .update(schema.organizations)
          .set({
            name: data.companyName,
            nib: data.nibNumber || null,
            npwp: data.npwpNumber || null,
            industry: normalizedIndustry,
            companyScale: normalizedScale,
            city: data.city || null,
            officeAddress: data.officeAddress || null,
            companyEmail: data.picEmail,
            website: data.website || null,
            description: data.description || null,
            verificationStatus: "pending",
            updatedAt: new Date(),
          })
          .where(eq(schema.organizations.id, orgId));
      }

      // 3. Ensure recruiter status is pending review and clear previous rejection/revision reason
      await tx
        .update(schema.users)
        .set({
          recruiterProvisioningStatus: "pending",
          recruiterRejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id));

      return { success: true, organizationId: orgId };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal menyimpan data onboarding:", error);
    const detail = error instanceof Error ? error.message : "Gagal menyimpan data ke database.";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

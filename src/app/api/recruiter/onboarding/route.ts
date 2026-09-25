import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const { db, user } = current;

  // 1. Get profile
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  // 2. Get organization membership & organization
  const [membership] = await db
    .select({ organizationId: schema.organizationMembers.organizationId })
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.userId, user.id))
    .limit(1);

  let org = null;
  if (membership?.organizationId) {
    const [found] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, membership.organizationId))
      .limit(1);
    org = found ?? null;
  }
  if (!org) {
    const [foundByCreator] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.createdBy, user.id))
      .limit(1);
    org = foundByCreator ?? null;
  }

  // 3. Supabase user metadata for picTitle
  let picTitle = "";
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    picTitle =
      (typeof data.user?.user_metadata?.picTitle === "string" ? data.user.user_metadata.picTitle : "") ||
      (typeof data.user?.user_metadata?.picPosition === "string" ? data.user.user_metadata.picPosition : "") ||
      "";
  } catch {}

  const hasSubmittedOnboarding = Boolean(org?.nibDocumentUrl && org?.npwpDocumentUrl);
  const isRevision = user.recruiterProvisioningStatus === "revision_required";
  const revisionReason = user.recruiterRejectionReason || null;

  const orgName = org?.name || "";
  const isAutoPlaceholderOrg = orgName.endsWith("(Organization)");
  const initialCompanyName = isAutoPlaceholderOrg ? "" : orgName;
  const rawPicName = profile?.displayName?.trim() || "";
  const picName =
    (initialCompanyName && rawPicName.toLowerCase() === initialCompanyName.toLowerCase()) ||
    (user.email && rawPicName.toLowerCase() === user.email.split("@")[0].toLowerCase())
      ? ""
      : rawPicName;

  const form = {
    picName,
    picTitle: picTitle || "",
    picPhone: profile?.phone || "",
    picEmail: org?.companyEmail || user.email || "",
    companyName: initialCompanyName,
    industry: org?.industry || "",
    companySize: org?.companyScale || "",
    description: org?.description || "",
    websiteUrl: org?.website || "",
    linkedinUrl: org?.linkedinUrl || "",
    officeAddress: org?.officeAddress || "",
    city: org?.city || "",
    nibNumber: org?.nib || "",
    nibFileName: org?.nibDocumentUrl ? (org.nibDocumentUrl.split("/").pop() || "NIB_Document.pdf") : "",
    nibDocumentUrl: org?.nibDocumentUrl || "",
    npwpNumber: org?.npwp || "",
    npwpFileName: org?.npwpDocumentUrl ? (org.npwpDocumentUrl.split("/").pop() || "NPWP_Document.pdf") : "",
    npwpDocumentUrl: org?.npwpDocumentUrl || "",
    verificationStatus: isRevision ? "needs_revision" : hasSubmittedOnboarding ? "pending_review" : "draft",
  };

  return NextResponse.json({
    form,
    hasSubmittedOnboarding,
    isRevision,
    revisionReason,
    provisioningStatus: user.recruiterProvisioningStatus,
  });
}

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
  picTitle: z.string().trim().optional(),
  companyName: z.string().trim().min(2),
  description: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),
  city: z.string().trim().optional(),
  officeAddress: z.string().trim().optional(),
  website: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  nibNumber: z.string().trim().optional(),
  nibFileName: z.string().trim().optional(),
  nibDocumentUrl: z.string().trim().min(1, "Dokumen NIB (PDF) wajib diunggah."),
  npwpNumber: z.string().trim().optional(),
  npwpFileName: z.string().trim().optional(),
  npwpDocumentUrl: z.string().trim().min(1, "Dokumen NPWP (PDF) wajib diunggah."),
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
    const errorMsg = parsed.error.issues?.[0]?.message || "Data onboarding rekruter tidak valid.";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
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
            nibDocumentUrl: data.nibDocumentUrl || null,
            npwpDocumentUrl: data.npwpDocumentUrl || null,
            industry: normalizedIndustry,
            companyScale: normalizedScale,
            city: data.city || null,
            officeAddress: data.officeAddress || null,
            companyEmail: data.picEmail,
            website: data.websiteUrl || data.website || null,
            linkedinUrl: data.linkedinUrl || null,
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
            ...(data.nibDocumentUrl ? { nibDocumentUrl: data.nibDocumentUrl } : {}),
            ...(data.npwpDocumentUrl ? { npwpDocumentUrl: data.npwpDocumentUrl } : {}),
            industry: normalizedIndustry,
            companyScale: normalizedScale,
            city: data.city || null,
            officeAddress: data.officeAddress || null,
            companyEmail: data.picEmail,
            website: data.websiteUrl || data.website || null,
            linkedinUrl: data.linkedinUrl || null,
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

    if (data.picTitle || data.picPosition) {
      try {
        const supabase = await createClient();
        await supabase.auth.updateUser({
          data: {
            picTitle: data.picTitle || data.picPosition,
          },
        });
      } catch (err) {
        console.error("Gagal memperbarui picTitle ke Supabase auth metadata:", err);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal menyimpan data onboarding:", error);
    const errMessage = error instanceof Error ? error.message : "";
    const errCode = (error as { code?: string })?.code;

    if (errCode === "23505" || errMessage.includes("organizations_nib_unique") || errMessage.includes("organizations_npwp_unique")) {
      if (errMessage.includes("organizations_nib_unique") || errMessage.includes("(nib)")) {
        return NextResponse.json({ error: "Nomor NIB ini sudah terdaftar oleh perusahaan lain." }, { status: 400 });
      }
      if (errMessage.includes("organizations_npwp_unique") || errMessage.includes("(npwp)")) {
        return NextResponse.json({ error: "Nomor NPWP ini sudah terdaftar oleh perusahaan lain." }, { status: 400 });
      }
      return NextResponse.json({ error: "Nomor NIB atau NPWP sudah terdaftar di sistem." }, { status: 400 });
    }

    const detail = error instanceof Error ? error.message : "Gagal menyimpan data ke database.";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

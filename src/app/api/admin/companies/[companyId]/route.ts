import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { apiError } from "@/lib/api/request-error";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updateCompanySchema = z
  .object({
    verificationStatus: z
      .enum(["pending", "approved", "need_revision", "rejected", "suspended"])
      .optional(),
    verificationNotes: z.string().trim().max(1000).optional().nullable(),
    nib: z.string().trim().optional().nullable(),
    npwp: z.string().trim().optional().nullable(),
    industry: z
      .enum([
        "Technology",
        "Financial Services",
        "Hospitality",
        "Retail",
        "Manufacturing",
        "Education",
        "Healthcare",
        "Logistics",
        "Professional Services",
        "Other",
      ])
      .optional()
      .nullable(),
    companyScale: z
      .enum([
        "1-10 Karyawan",
        "11-50 Karyawan",
        "51-200 Karyawan",
        "201-500 Karyawan",
        "500+ Karyawan",
      ])
      .optional()
      .nullable(),
    province: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    companyEmail: z.string().email().optional().nullable(),
    website: z.string().trim().optional().nullable(),
    linkedinUrl: z.string().trim().optional().nullable(),
    subscriptionTier: z.enum(["trial", "starter", "professional", "enterprise"]).optional(),
    subscriptionStatus: z.enum(["active", "expired", "suspended"]).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const { companyId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data perusahaan tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = current.db;
    const adminUser = current.user;

    const [existingOrg] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, companyId));

    if (!existingOrg) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.verificationStatus !== undefined) {
      updateData.verificationStatus = parsed.data.verificationStatus;
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = adminUser.id;
    }
    if (parsed.data.verificationNotes !== undefined) {
      updateData.verificationNotes = parsed.data.verificationNotes;
    }
    if (parsed.data.nib !== undefined) updateData.nib = parsed.data.nib;
    if (parsed.data.npwp !== undefined) updateData.npwp = parsed.data.npwp;
    if (parsed.data.industry !== undefined) updateData.industry = parsed.data.industry;
    if (parsed.data.companyScale !== undefined) updateData.companyScale = parsed.data.companyScale;
    if (parsed.data.province !== undefined) updateData.province = parsed.data.province;
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city;
    if (parsed.data.companyEmail !== undefined) updateData.companyEmail = parsed.data.companyEmail;
    if (parsed.data.website !== undefined) updateData.website = parsed.data.website;
    if (parsed.data.linkedinUrl !== undefined) updateData.linkedinUrl = parsed.data.linkedinUrl;
    if (parsed.data.subscriptionTier !== undefined) updateData.subscriptionTier = parsed.data.subscriptionTier;
    if (parsed.data.subscriptionStatus !== undefined) updateData.subscriptionStatus = parsed.data.subscriptionStatus;

    const [updatedOrg] = await db
      .update(schema.organizations)
      .set(updateData)
      .where(eq(schema.organizations.id, companyId))
      .returning();

    // SINKRONISASI: Jika perusahaan disetujui, otomatis aktifkan recruiter provisioning status untuk owner / PIC
    if (parsed.data.verificationStatus === "approved" && updatedOrg.createdBy) {
      await db
        .update(schema.users)
        .set({
          recruiterProvisioningStatus: "active",
          recruiterRejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, updatedOrg.createdBy));
    } else if (parsed.data.verificationStatus === "rejected" && updatedOrg.createdBy) {
      await db
        .update(schema.users)
        .set({
          recruiterProvisioningStatus: "rejected",
          recruiterRejectionReason: parsed.data.verificationNotes || "Pendaftaran perusahaan ditolak.",
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, updatedOrg.createdBy));
    } else if (parsed.data.verificationStatus === "need_revision" && updatedOrg.createdBy) {
      await db
        .update(schema.users)
        .set({
          recruiterProvisioningStatus: "revision_required",
          recruiterRejectionReason: parsed.data.verificationNotes || "Dokumen perusahaan memerlukan perbaikan.",
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, updatedOrg.createdBy));
    }

    // Catat ke Audit Log
    await writeAuditLog({
      db,
      actorUserId: adminUser.id,
      organizationId: companyId,
      action: `admin.company.${parsed.data.verificationStatus || "updated"}`,
      entityType: "organization",
      entityId: companyId,
      metadata: {
        previousStatus: existingOrg.verificationStatus,
        newStatus: parsed.data.verificationStatus || existingOrg.verificationStatus,
        notes: parsed.data.verificationNotes,
      },
    });

    return NextResponse.json({ success: true, company: updatedOrg });
  } catch (error) {
    return apiError("Gagal memperbarui data perusahaan.", 500, error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const { companyId } = await params;
    const db = current.db;
    const adminUser = current.user;

    const [existingOrg] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, companyId));

    if (!existingOrg) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan." }, { status: 404 });
    }

    // Hapus relasi turunan
    await db.delete(schema.organizationMembers).where(eq(schema.organizationMembers.organizationId, companyId));
    await db.delete(schema.tokenPurchases).where(eq(schema.tokenPurchases.organizationId, companyId));
    await db.delete(schema.tokenAccounts).where(eq(schema.tokenAccounts.organizationId, companyId));
    await db.delete(schema.savedSearches).where(eq(schema.savedSearches.organizationId, companyId));
    await db.delete(schema.searchAnalytics).where(eq(schema.searchAnalytics.organizationId, companyId));
    await db.delete(schema.billingAccounts).where(eq(schema.billingAccounts.organizationId, companyId));
    await db.delete(schema.shortlists).where(eq(schema.shortlists.organizationId, companyId));
    await db.delete(schema.jobs).where(eq(schema.jobs.organizationId, companyId));
    await db.delete(schema.conversations).where(eq(schema.conversations.organizationId, companyId));
    await db.delete(schema.assessmentTemplates).where(eq(schema.assessmentTemplates.organizationId, companyId));
    await db.delete(schema.interviews).where(eq(schema.interviews.organizationId, companyId));
    await db.delete(schema.offers).where(eq(schema.offers.organizationId, companyId));
    await db.delete(schema.skillAliases).where(eq(schema.skillAliases.organizationId, companyId));
    await db.delete(schema.screeningGovernanceVersions).where(eq(schema.screeningGovernanceVersions.organizationId, companyId));
    await db.delete(schema.screeningRuns).where(eq(schema.screeningRuns.organizationId, companyId));
    await db.delete(schema.consentRequestBatches).where(eq(schema.consentRequestBatches.organizationId, companyId));

    // Lepaskan referensi di audit logs
    await db.update(schema.auditLogs).set({ organizationId: null }).where(eq(schema.auditLogs.organizationId, companyId));

    // Hapus organization
    await db.delete(schema.organizations).where(eq(schema.organizations.id, companyId));

    // Reset status recruiter jika user tidak memiliki org lain
    if (existingOrg.createdBy) {
      const otherOrgs = await db
        .select({ id: schema.organizationMembers.id })
        .from(schema.organizationMembers)
        .where(eq(schema.organizationMembers.userId, existingOrg.createdBy))
        .limit(1);

      if (otherOrgs.length === 0) {
        await db
          .update(schema.users)
          .set({ recruiterProvisioningStatus: "pending", updatedAt: new Date() })
          .where(eq(schema.users.id, existingOrg.createdBy));
      }
    }

    await writeAuditLog({
      db,
      actorUserId: adminUser.id,
      action: "admin.company.deleted",
      entityType: "organization",
      entityId: companyId,
      metadata: { deletedCompanyName: existingOrg.name },
    });

    return NextResponse.json({ success: true, message: `Perusahaan ${existingOrg.name} berhasil dihapus.` });
  } catch (error) {
    return apiError("Gagal menghapus perusahaan.", 500, error);
  }
}


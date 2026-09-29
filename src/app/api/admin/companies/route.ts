import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { apiError } from "@/lib/api/request-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const db = current.db;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    // Ambil data organisasi beserta info token dan owner (hanya yang pemiliknya terdaftar)
    const query = db
      .select({
        organization: schema.organizations,
        tokenBalance: schema.tokenAccounts.balance,
        ownerEmail: schema.users.email,
        ownerName: schema.profiles.displayName,
        ownerPhone: schema.profiles.phone,
        ownerUserId: schema.users.id,
        ownerAuthUserId: schema.users.authUserId,
        reviewerEmail: sql<string | null>`(SELECT email FROM users WHERE users.id = ${schema.organizations.reviewedBy})`,
      })
      .from(schema.organizations)
      .leftJoin(schema.tokenAccounts, eq(schema.tokenAccounts.organizationId, schema.organizations.id))
      .innerJoin(schema.users, eq(schema.users.id, schema.organizations.createdBy))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.organizations.createdBy))
      .orderBy(desc(schema.organizations.createdAt));

    const rows = await query;

    let filtered = rows;
    if (status && status !== "all") {
      filtered = filtered.filter((r) => r.organization.verificationStatus === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.organization.name?.toLowerCase().includes(s) ||
          r.organization.nib?.toLowerCase().includes(s) ||
          r.organization.npwp?.toLowerCase().includes(s) ||
          r.organization.companyEmail?.toLowerCase().includes(s) ||
          r.organization.companyPhone?.toLowerCase().includes(s) ||
          r.organization.city?.toLowerCase().includes(s) ||
          r.organization.province?.toLowerCase().includes(s) ||
          r.ownerEmail?.toLowerCase().includes(s) ||
          r.ownerName?.toLowerCase().includes(s)
      );
    }

    // Ambil metadata picTitle dari Supabase Auth secara aman tanpa menyentuh tabel internal auth.users via SQL
    const userMetadataMap = new Map<string, string>();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (url && serviceKey) {
      try {
        const supabaseAdmin = createSupabaseClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (userList?.users) {
          for (const u of userList.users) {
            const title =
              (typeof u.user_metadata?.picTitle === "string" ? u.user_metadata.picTitle : "") ||
              (typeof u.user_metadata?.picPosition === "string" ? u.user_metadata.picPosition : "") ||
              "";
            if (title) userMetadataMap.set(u.id, title);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat user metadata dari Supabase Auth Admin:", e);
      }
    }

    // Ambil total unlock & financial screening per organisasi
    const companies = await Promise.all(
      filtered.map(async (row) => {
        const orgId = row.organization.id;

        // Total Talent Unlock untuk organisasi ini
        const [unlockRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.consentRequestItems)
          .innerJoin(
            schema.consentRequestBatches,
            eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId)
          )
          .where(
            and(
              eq(schema.consentRequestBatches.organizationId, orgId),
              eq(schema.consentRequestItems.status, "approved")
            )
          );

        // Total Financial Screening untuk organisasi ini
        const [screeningRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.screeningRuns)
          .where(eq(schema.screeningRuns.organizationId, orgId));

        // Aktivitas terakhir
        const [lastActivity] = await db
          .select({ createdAt: schema.auditLogs.createdAt, action: schema.auditLogs.action })
          .from(schema.auditLogs)
          .where(eq(schema.auditLogs.organizationId, orgId))
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(1);

        return {
          id: row.organization.id,
          name: row.organization.name,
          slug: row.organization.slug,
          nib: row.organization.nib,
          npwp: row.organization.npwp,
          nibDocumentUrl: row.organization.nibDocumentUrl,
          npwpDocumentUrl: row.organization.npwpDocumentUrl,
          industry: row.organization.industry,
          companyScale: row.organization.companyScale,
          province: row.organization.province,
          city: row.organization.city,
          officeAddress: row.organization.officeAddress,
          companyEmail: row.organization.companyEmail || row.ownerEmail,
          companyPhone: row.organization.companyPhone,
          logoUrl: row.organization.logoUrl,
          bannerUrl: row.organization.bannerUrl,
          website: row.organization.website,
          linkedinUrl: row.organization.linkedinUrl,
          description: row.organization.description,
          verificationStatus: row.organization.verificationStatus,
          verificationNotes: row.organization.verificationNotes,
          reviewedBy: row.organization.reviewedBy,
          reviewedAt: row.organization.reviewedAt,
          reviewerEmail: row.reviewerEmail,
          subscriptionTier: row.organization.subscriptionTier,
          subscriptionStatus: row.organization.subscriptionStatus,
          subscriptionStartDate: row.organization.subscriptionStartDate,
          subscriptionEndDate: row.organization.subscriptionEndDate,
          createdAt: row.organization.createdAt,
          updatedAt: row.organization.updatedAt,
          tokenBalance: row.tokenBalance ?? 0,
          owner: {
            userId: row.ownerUserId,
            name: row.ownerName,
            email: row.ownerEmail,
            phone: row.ownerPhone,
            title: row.ownerAuthUserId ? userMetadataMap.get(row.ownerAuthUserId) ?? null : null,
          },
          usage: {
            tokenBalance: row.tokenBalance ?? 0,
            talentUnlockCount: Number(unlockRes?.count ?? 0),
            financialScreeningCount: Number(screeningRes?.count ?? 0),
            lastActivity: lastActivity?.createdAt || row.organization.updatedAt,
          },
        };
      })
    );

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("[GET /api/admin/companies EXCEPTION]:", error);
    return apiError("Gagal memuat daftar perusahaan.", 500, error);
  }
}

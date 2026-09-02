import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser({ allowPending: true });
    const isProduction =
      process.env.NODE_ENV === "production" &&
      process.env.APP_ENV !== "development" &&
      process.env.NEXT_PUBLIC_DEMO_MODE !== "true";

    if (isProduction) {
      if ("error" in current) {
        return NextResponse.json({ error: current.error }, { status: current.status });
      }
      if (current.user.role !== "admin") {
        return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const db = "error" in current ? (await import("@/db")).getDb() : current.db;

    // Ambil data organisasi beserta info token dan owner
    const query = db
      .select({
        organization: schema.organizations,
        tokenBalance: schema.tokenAccounts.balance,
        ownerEmail: schema.users.email,
        ownerName: schema.profiles.displayName,
        ownerPhone: schema.profiles.phone,
        ownerUserId: schema.users.id,
        reviewerEmail: sql<string | null>`(SELECT email FROM users WHERE users.id = ${schema.organizations.reviewedBy})`,
      })
      .from(schema.organizations)
      .leftJoin(schema.tokenAccounts, eq(schema.tokenAccounts.organizationId, schema.organizations.id))
      .leftJoin(schema.users, eq(schema.users.id, schema.organizations.createdBy))
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
          r.organization.city?.toLowerCase().includes(s) ||
          r.ownerEmail?.toLowerCase().includes(s)
      );
    }

    // Ambil total unlock & financial screening per organisasi
    const companies = await Promise.all(
      filtered.map(async (row) => {
        const orgId = row.organization.id;

        // Total Talent Unlock untuk organisasi ini
        const [unlockRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.consentRequestItems)
          .where(eq(schema.consentRequestItems.status, "approved"));

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
          industry: row.organization.industry,
          companyScale: row.organization.companyScale,
          province: row.organization.province,
          city: row.organization.city,
          officeAddress: row.organization.officeAddress,
          companyEmail: row.organization.companyEmail || row.ownerEmail,
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
    console.error("GET companies error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar perusahaan." }, { status: 500 });
  }
}

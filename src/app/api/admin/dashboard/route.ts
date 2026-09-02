import { desc, eq, sql, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const current = await getCurrentAppUser({ allowPending: true });
    const db = "error" in current ? (await import("@/db")).getDb() : current.db;

    // 1. Hitung Perusahaan Berdasarkan Status
    const orgs = await db
      .select({
        id: schema.organizations.id,
        verificationStatus: schema.organizations.verificationStatus,
        createdAt: schema.organizations.createdAt,
      })
      .from(schema.organizations);

    const totalCompanies = orgs.length;
    const verifiedCompanies = orgs.filter((o) => o.verificationStatus === "approved").length;
    const pendingVerification = orgs.filter((o) => o.verificationStatus === "pending").length;
    const rejectedCompanies = orgs.filter((o) => o.verificationStatus === "rejected").length;

    // Monthly growth calculation
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthCompanies = orgs.filter((o) => new Date(o.createdAt) >= thisMonthStart).length;
    const lastMonthCompanies = orgs.filter(
      (o) => new Date(o.createdAt) >= lastMonthStart && new Date(o.createdAt) < thisMonthStart
    ).length;

    let monthlyGrowth = 0;
    if (lastMonthCompanies > 0) {
      monthlyGrowth = Math.round(((thisMonthCompanies - lastMonthCompanies) / lastMonthCompanies) * 100);
    } else if (thisMonthCompanies > 0) {
      monthlyGrowth = 100;
    }

    // 2. Akumulasi Token Aktif
    const tokenAccounts = await db
      .select({
        totalBalance: sql<number>`coalesce(sum(${schema.tokenAccounts.balance}), 0)`,
      })
      .from(schema.tokenAccounts);
    const totalActiveTokens = Number(tokenAccounts[0]?.totalBalance ?? 0);

    // 3. Akumulasi Total Talent Unlock (dari consent requests item status approved atau audit logs)
    const unlockCountRes = await db
      .select({ count: count() })
      .from(schema.consentRequestItems)
      .where(eq(schema.consentRequestItems.status, "approved"));
    const totalTalentUnlock = Number(unlockCountRes[0]?.count ?? 0);

    // 4. Akumulasi Total Financial Screening (dari screeningRuns completed)
    const screeningCountRes = await db
      .select({ count: count() })
      .from(schema.screeningRuns)
      .where(eq(schema.screeningRuns.status, "completed"));
    const totalFinancialScreening = Number(screeningCountRes[0]?.count ?? 0);

    // 5. Antrean Verifikasi Cepat (Quick Pending Review)
    const pendingList = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        industry: schema.organizations.industry,
        city: schema.organizations.city,
        createdAt: schema.organizations.createdAt,
        verificationStatus: schema.organizations.verificationStatus,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.verificationStatus, "pending"))
      .orderBy(desc(schema.organizations.createdAt))
      .limit(5);

    // 6. Aktivitas Terbaru Platform
    const recentActivities = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        createdAt: schema.auditLogs.createdAt,
        metadata: schema.auditLogs.metadata,
        actorEmail: schema.users.email,
        organizationName: schema.organizations.name,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .leftJoin(schema.organizations, eq(schema.organizations.id, schema.auditLogs.organizationId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(6);

    return NextResponse.json({
      metrics: {
        totalCompanies,
        verifiedCompanies,
        pendingVerification,
        rejectedCompanies,
        totalTalentUnlock,
        totalFinancialScreening,
        totalActiveTokens,
        monthlyGrowth,
      },
      pendingList,
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Gagal memuat metrik dashboard." }, { status: 500 });
  }
}

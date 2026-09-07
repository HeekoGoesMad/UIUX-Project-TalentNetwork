import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { apiError } from "@/lib/api/request-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const actionFilter = searchParams.get("action")?.trim() || "";

    const db = current.db;

    const rows = await db
      .select({
        log: schema.auditLogs,
        actorEmail: schema.users.email,
        organizationName: schema.organizations.name,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .leftJoin(schema.organizations, eq(schema.organizations.id, schema.auditLogs.organizationId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(300);

    let filtered = rows;
    if (actionFilter && actionFilter !== "all") {
      filtered = filtered.filter((r) => r.log.action.includes(actionFilter));
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.log.action.toLowerCase().includes(s) ||
          r.actorEmail?.toLowerCase().includes(s) ||
          r.organizationName?.toLowerCase().includes(s) ||
          r.log.entityType?.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ logs: filtered });
  } catch (error) {
    return apiError("Audit log belum tersedia.", 503, error);
  }
}

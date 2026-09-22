import { and, count, desc, eq, ilike, or } from "drizzle-orm";
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
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;
    const offset = (page - 1) * limit;

    const db = current.db;

    const conditions = [];

    if (actionFilter && actionFilter !== "all") {
      const keyword = actionFilter === "tokens" ? "token" : actionFilter;
      conditions.push(ilike(schema.auditLogs.action, `%${keyword}%`));
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(schema.auditLogs.action, pattern),
          ilike(schema.auditLogs.entityType, pattern),
          ilike(schema.users.email, pattern),
          ilike(schema.organizations.name, pattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ total: count() })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .leftJoin(schema.organizations, eq(schema.organizations.id, schema.auditLogs.organizationId))
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = await db
      .select({
        log: schema.auditLogs,
        actorEmail: schema.users.email,
        organizationName: schema.organizations.name,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .leftJoin(schema.organizations, eq(schema.organizations.id, schema.auditLogs.organizationId))
      .where(whereClause)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      logs: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return apiError("Audit log belum tersedia.", 503, error);
  }
}

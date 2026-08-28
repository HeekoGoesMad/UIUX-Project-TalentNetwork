import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { currentUserOrError } from "@/lib/billing/access";

export async function GET() {
  try {
    const current = await currentUserOrError();
    if ("error" in current && process.env.NODE_ENV === "production") return NextResponse.json({ error: current.error }, { status: current.status });
    if (!("error" in current) && current.user.role !== "admin" && process.env.NODE_ENV === "production") return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
    const db = "error" in current ? (await import("@/db")).getDb() : current.db;
    const logs = await db.select({ log: schema.auditLogs, actorEmail: schema.users.email }).from(schema.auditLogs).leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId)).orderBy(desc(schema.auditLogs.createdAt)).limit(200);
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Audit log belum tersedia." }, { status: 503 });
  }
}

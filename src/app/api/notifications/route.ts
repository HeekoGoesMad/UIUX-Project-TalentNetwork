import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const limitValue = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 50;
    const notifications = await current.db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, current.user.id))
      .orderBy(desc(schema.notifications.createdAt)).limit(limit);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

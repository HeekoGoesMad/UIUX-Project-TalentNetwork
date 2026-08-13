import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";

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
    const unread = await current.db.select({ id: schema.notifications.id }).from(schema.notifications)
      .where(and(eq(schema.notifications.userId, current.user.id), isNull(schema.notifications.readAt)));
    return NextResponse.json({ notifications, unreadCount: unread.length });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const payload = await request.json() as { notificationId?: string; id?: string };
    const notificationId = payload.notificationId ?? payload.id;
    if (!notificationId) return NextResponse.json({ error: "ID notifikasi diperlukan." }, { status: 400 });

    const [notification] = await current.db.update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, current.user.id)))
      .returning({ id: schema.notifications.id, readAt: schema.notifications.readAt });
    if (!notification) return NextResponse.json({ error: "Notifikasi tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ notification });
  } catch {
    return NextResponse.json({ error: "Notifikasi belum dapat diperbarui." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const payload = await request.json().catch(() => ({})) as { all?: boolean; action?: string };
    if (payload.all !== true && payload.action !== "mark_all_read") {
      return NextResponse.json({ error: "Gunakan all: true untuk menandai semua notifikasi." }, { status: 400 });
    }
    await current.db.update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(eq(schema.notifications.userId, current.user.id), isNull(schema.notifications.readAt)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notifikasi belum dapat diperbarui." }, { status: 503 });
  }
}

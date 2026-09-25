import { NextResponse } from "next/server";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

import { distillNotificationContent } from "@/lib/notifications/candidate-formatter";

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const limitValue = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 50;
    const [notifications, [unread]] = await Promise.all([
      current.db.select().from(schema.notifications)
        .where(eq(schema.notifications.userId, current.user.id))
        .orderBy(desc(schema.notifications.createdAt)).limit(limit),
      current.db.select({ value: count() }).from(schema.notifications)
        .where(and(eq(schema.notifications.userId, current.user.id), isNull(schema.notifications.readAt))),
    ]);

    const toUpdate: Array<{ id: string; title: string; body: string }> = [];
    const distilledList = notifications.map((notif) => {
      const distilled = distillNotificationContent({
        title: notif.title,
        body: notif.body,
        type: notif.type,
        data: notif.data,
      });
      if (distilled.changed) {
        toUpdate.push({ id: notif.id, title: distilled.title, body: distilled.body });
        return { ...notif, title: distilled.title, body: distilled.body };
      }
      return notif;
    });

    if (toUpdate.length > 0) {
      void Promise.all(
        toUpdate.map((item) =>
          current.db
            .update(schema.notifications)
            .set({ title: item.title, body: item.body })
            .where(eq(schema.notifications.id, item.id))
        )
      ).catch((err) => console.error("Auto-update notifications in DB failed:", err));
    }

    return NextResponse.json({ notifications: distilledList, unreadCount: unread?.value ?? 0 });
  } catch (err) {
    console.error("[GET /api/notifications Database Error]:", err);
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = z
      .object({ notificationId: z.string().uuid() })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "ID notifikasi tidak valid." }, { status: 400 });

    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const [notification] = await current.db.update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(eq(schema.notifications.id, parsed.data.notificationId), eq(schema.notifications.userId, current.user.id)))
      .returning({ id: schema.notifications.id, readAt: schema.notifications.readAt });
    if (!notification) return NextResponse.json({ error: "Notifikasi tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ notification });
  } catch (err) {
    console.error("[PATCH /api/notifications Database Error]:", err);
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
  } catch (err) {
    console.error("[POST /api/notifications Database Error]:", err);
    return NextResponse.json({ error: "Notifikasi belum dapat diperbarui." }, { status: 503 });
  }
}

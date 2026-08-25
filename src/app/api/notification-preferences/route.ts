import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { writeAuditLog } from "@/lib/audit";

const quietHours = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  timezone: z.string().max(80).optional(),
}).strict();
const updateSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  quietHours: quietHours.optional(),
}).strict();

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const [preferences] = await current.db.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, current.user.id)).limit(1);
    return NextResponse.json({ preferences: preferences ?? { inAppEnabled: true, emailEnabled: true, quietHours: {} } });
  } catch { return NextResponse.json({ error: "Preferensi notifikasi belum dapat dimuat." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Preferensi notifikasi tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    const preferences = await current.db.transaction(async (tx) => {
      const [existing] = await tx.select().from(schema.notificationPreferences)
        .where(eq(schema.notificationPreferences.userId, current.user.id)).limit(1);
      const values = {
        inAppEnabled: parsed.data.inAppEnabled ?? existing?.inAppEnabled ?? true,
        emailEnabled: parsed.data.emailEnabled ?? existing?.emailEnabled ?? true,
        quietHours: parsed.data.quietHours ?? existing?.quietHours ?? {},
      };
      const [saved] = await tx.insert(schema.notificationPreferences).values({ userId: current.user.id, ...values })
        .onConflictDoUpdate({ target: schema.notificationPreferences.userId, set: { ...values, updatedAt: new Date() } }).returning();
      await writeAuditLog({ db: tx, actorUserId: current.user.id, action: "notification.preferences.updated", entityType: "notification_preferences", entityId: saved.id, metadata: values });
      return saved;
    });
    return NextResponse.json({ preferences });
  } catch { return NextResponse.json({ error: "Preferensi notifikasi belum dapat disimpan." }, { status: 503 }); }
}

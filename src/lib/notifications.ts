import "server-only";

import { and, eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { schema, type Database } from "@/db";
import { sendNotificationEmail } from "@/lib/notifications/email";

type NotificationInsert = InferInsertModel<typeof schema.notifications>;

export function systemNotification(input: Pick<NotificationInsert, "userId" | "title" | "body" | "data">): NotificationInsert {
  return { ...input, type: "system" };
}

export function notificationData(eventKey: string, href: string, data: Record<string, unknown> = {}) {
  return { ...data, eventKey, href };
}

type DeliveryNotification = Pick<NotificationInsert, "userId" | "title" | "body" | "data" | "type">;

function quietHoursEnd(quietHours: Record<string, unknown>, now = new Date()) {
  const start = typeof quietHours.start === "string" ? quietHours.start : null;
  const end = typeof quietHours.end === "string" ? quietHours.end : null;
  if (!start || !end || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startValue = startHour * 60 + startMinute;
  const endValue = endHour * 60 + endMinute;
  const isQuiet = startValue === endValue || (startValue < endValue ? minutes >= startValue && minutes < endValue : minutes >= startValue || minutes < endValue);
  if (!isQuiet) return null;
  const result = new Date(now);
  const endDay = startValue < endValue || minutes < endValue ? result.getDate() : result.getDate() + 1;
  result.setDate(endDay);
  result.setHours(endHour, endMinute, 0, 0);
  return result;
}

export async function createNotificationWithDeliveries(db: Database, input: DeliveryNotification) {
  const [notification] = await db.insert(schema.notifications).values(input).returning();
  const [preference] = await db.select().from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, input.userId)).limit(1);
  const inAppEnabled = preference?.inAppEnabled ?? true;
  const emailEnabled = preference?.emailEnabled ?? true;
  const quietUntil = quietHoursEnd(preference?.quietHours ?? {});
  const deliveries = [];
  const eventKey = typeof input.data?.eventKey === "string" ? input.data.eventKey : notification.id;

  if (inAppEnabled) deliveries.push({ notificationId: notification.id, channel: "in_app" as const, status: "sent" as const, sentAt: new Date(), dedupeKey: `${eventKey}:in_app` });
  if (emailEnabled) deliveries.push({ notificationId: notification.id, channel: "email" as const, status: "pending" as const, nextAttemptAt: quietUntil, dedupeKey: `${eventKey}:email` });
  if (deliveries.length) await db.insert(schema.notificationDeliveries).values(deliveries).onConflictDoNothing({ target: schema.notificationDeliveries.dedupeKey });

  if (emailEnabled && !quietUntil) {
    const [delivery] = await db.select().from(schema.notificationDeliveries).where(and(eq(schema.notificationDeliveries.notificationId, notification.id), eq(schema.notificationDeliveries.channel, "email"))).limit(1);
    const [user] = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, input.userId)).limit(1);
    if (delivery && user) {
      try {
        const result = await sendNotificationEmail({ to: user.email, subject: notification.title, text: notification.body ?? notification.title });
        await db.update(schema.notificationDeliveries).set({ status: "sent", attemptCount: 1, providerMessageId: result.providerMessageId, sentAt: new Date(), nextAttemptAt: null, updatedAt: new Date() }).where(eq(schema.notificationDeliveries.id, delivery.id));
      } catch (error) {
        await db.update(schema.notificationDeliveries).set({ status: "failed", attemptCount: 1, lastError: error instanceof Error ? error.message : "Email delivery failed.", nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000), updatedAt: new Date() }).where(eq(schema.notificationDeliveries.id, delivery.id));
      }
    }
  }
  return notification;
}

export async function retryNotificationDelivery(db: Database, deliveryId: string) {
  const rows = await db.select({ delivery: schema.notificationDeliveries, notification: schema.notifications, email: schema.users.email })
    .from(schema.notificationDeliveries)
    .innerJoin(schema.notifications, eq(schema.notifications.id, schema.notificationDeliveries.notificationId))
    .innerJoin(schema.users, eq(schema.users.id, schema.notifications.userId))
    .where(eq(schema.notificationDeliveries.id, deliveryId)).limit(1);
  const row = rows[0];
  if (!row || row.delivery.channel !== "email" || row.delivery.status === "sent") return null;
  try {
    const result = await sendNotificationEmail({ to: row.email, subject: row.notification.title, text: row.notification.body ?? row.notification.title });
    return db.update(schema.notificationDeliveries).set({ status: "sent", attemptCount: row.delivery.attemptCount + 1, providerMessageId: result.providerMessageId, sentAt: new Date(), nextAttemptAt: null, lastError: null, updatedAt: new Date() }).where(eq(schema.notificationDeliveries.id, deliveryId)).returning();
  } catch (error) {
    return db.update(schema.notificationDeliveries).set({ status: "failed", attemptCount: row.delivery.attemptCount + 1, lastError: error instanceof Error ? error.message : "Email delivery failed.", nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000), updatedAt: new Date() }).where(eq(schema.notificationDeliveries.id, deliveryId)).returning();
  }
}

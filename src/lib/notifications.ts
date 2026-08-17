import "server-only";

import type { InferInsertModel } from "drizzle-orm";
import { schema } from "@/db";

type NotificationInsert = InferInsertModel<typeof schema.notifications>;

export function systemNotification(input: Pick<NotificationInsert, "userId" | "title" | "body" | "data">): NotificationInsert {
  return { ...input, type: "system" };
}

export function notificationData(eventKey: string, href: string, data: Record<string, unknown> = {}) {
  return { ...data, eventKey, href };
}

import { eq } from "drizzle-orm";
import { schema, type Database } from "@/db";
import { distillNotificationContent } from "./candidate-formatter";

export interface MigrationSummary {
  scanned: number;
  updated: number;
  updatedIds: string[];
}

/**
 * Scan notifications for a specific user and auto-update any legacy copy in-place.
 */
export async function autoMigrateUserNotifications(
  db: Database,
  userId: string
): Promise<MigrationSummary> {
  const rows = await db
    .select({
      id: schema.notifications.id,
      title: schema.notifications.title,
      body: schema.notifications.body,
      type: schema.notifications.type,
      data: schema.notifications.data,
    })
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId));

  const toUpdate: Array<{ id: string; title: string; body: string }> = [];

  for (const row of rows) {
    const distilled = distillNotificationContent({
      title: row.title,
      body: row.body,
      type: row.type,
      data: row.data,
    });

    if (distilled.changed) {
      toUpdate.push({
        id: row.id,
        title: distilled.title,
        body: distilled.body,
      });
    }
  }

  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map((item) =>
        db
          .update(schema.notifications)
          .set({
            title: item.title,
            body: item.body,
          })
          .where(eq(schema.notifications.id, item.id))
      )
    );
  }

  return {
    scanned: rows.length,
    updated: toUpdate.length,
    updatedIds: toUpdate.map((u) => u.id),
  };
}

/**
 * Migrate all notifications across the entire database in batches.
 */
export async function migrateAllNotifications(
  db: Database,
  options?: { batchSize?: number }
): Promise<MigrationSummary> {
  const batchSize = options?.batchSize ?? 100;
  let offset = 0;
  let totalScanned = 0;
  const allUpdatedIds: string[] = [];

  while (true) {
    const rows = await db
      .select({
        id: schema.notifications.id,
        title: schema.notifications.title,
        body: schema.notifications.body,
        type: schema.notifications.type,
        data: schema.notifications.data,
      })
      .from(schema.notifications)
      .limit(batchSize)
      .offset(offset);

    if (rows.length === 0) break;
    totalScanned += rows.length;

    const toUpdate: Array<{ id: string; title: string; body: string }> = [];

    for (const row of rows) {
      const distilled = distillNotificationContent({
        title: row.title,
        body: row.body,
        type: row.type,
        data: row.data,
      });

      if (distilled.changed) {
        toUpdate.push({
          id: row.id,
          title: distilled.title,
          body: distilled.body,
        });
      }
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((item) =>
          db
            .update(schema.notifications)
            .set({
              title: item.title,
              body: item.body,
            })
            .where(eq(schema.notifications.id, item.id))
        )
      );
      allUpdatedIds.push(...toUpdate.map((u) => u.id));
    }

    offset += rows.length;
    if (rows.length < batchSize) break;
  }

  return {
    scanned: totalScanned,
    updated: allUpdatedIds.length,
    updatedIds: allUpdatedIds,
  };
}

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";
import { distillNotificationContent } from "../src/lib/notifications/candidate-formatter.ts";

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not found in environment.");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("=== STARTING NOTIFICATION AUTO-MIGRATION ===");
  const rows = await db
    .select({
      id: schema.notifications.id,
      title: schema.notifications.title,
      body: schema.notifications.body,
      type: schema.notifications.type,
      data: schema.notifications.data,
    })
    .from(schema.notifications);

  console.log(`Found ${rows.length} total notifications in database.`);

  let updatedCount = 0;

  for (const row of rows) {
    const distilled = distillNotificationContent({
      title: row.title,
      body: row.body,
      type: row.type,
      data: row.data,
    });

    if (distilled.changed) {
      console.log(`\nUpgrading notification [${row.id}]:`);
      console.log(`  OLD TITLE: "${row.title}"`);
      console.log(`  NEW TITLE: "${distilled.title}"`);
      console.log(`  OLD BODY : "${row.body}"`);
      console.log(`  NEW BODY : "${distilled.body}"`);

      await db
        .update(schema.notifications)
        .set({
          title: distilled.title,
          body: distilled.body,
        })
        .where(eq(schema.notifications.id, row.id));

      updatedCount++;
    }
  }

  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Total scanned: ${rows.length}`);
  console.log(`Total updated: ${updatedCount}`);

  await client.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Programmatic database migration runner.
 *
 * Uses drizzle-orm migrator with postgres.js configured with:
 * - max: 1 (single dedicated migration connection)
 * - prepare: false (fully compatible with Supabase Transaction poolers on port 6543 and direct port 5432)
 * - Verbose error logging (prints exact failing SQL and PG error details rather than failing silently)
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const connectionUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

if (!connectionUrl) {
  console.error("Error: Neither DIRECT_URL nor DATABASE_URL is configured.");
  process.exit(1);
}

console.log("Connecting to database for migrations...");

const sql = postgres(connectionUrl, {
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 15,
});

const db = drizzle(sql);

try {
  console.log("Applying pending migrations from ./drizzle...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ All pending migrations applied successfully.");
} catch (error) {
  console.error("❌ Migration failed with error:");
  if (error && typeof error === "object") {
    const err = error;
    if ("message" in err) console.error("Message:", err.message);
    if ("detail" in err && err.detail) console.error("Detail:", err.detail);
    if ("hint" in err && err.hint) console.error("Hint:", err.hint);
    if ("code" in err && err.code) console.error("Code:", err.code);
    if ("stack" in err && err.stack) console.error(err.stack);
  } else {
    console.error(error);
  }
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}

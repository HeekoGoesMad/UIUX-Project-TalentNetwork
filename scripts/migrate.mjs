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

const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);

const candidates = [];

// In CI environments (e.g. GitHub Actions), runners are IPv4-only by default,
// whereas Supabase direct URLs (db.*.supabase.co) resolve to IPv6 only.
// Therefore, in CI we prioritize DATABASE_URL (the IPv4 pooler) and fall back to DIRECT_URL.
// Outside CI, we try DIRECT_URL first and fall back to DATABASE_URL.
if (isCI) {
  if (process.env.DATABASE_URL?.trim()) {
    candidates.push({ name: "DATABASE_URL (Pooler)", url: process.env.DATABASE_URL.trim() });
  }
  if (process.env.DIRECT_URL?.trim()) {
    candidates.push({ name: "DIRECT_URL (Direct)", url: process.env.DIRECT_URL.trim() });
  }
} else {
  if (process.env.DIRECT_URL?.trim()) {
    candidates.push({ name: "DIRECT_URL (Direct)", url: process.env.DIRECT_URL.trim() });
  }
  if (process.env.DATABASE_URL?.trim()) {
    candidates.push({ name: "DATABASE_URL (Pooler)", url: process.env.DATABASE_URL.trim() });
  }
}

if (candidates.length === 0) {
  console.error("Error: Neither DIRECT_URL nor DATABASE_URL is configured.");
  process.exit(1);
}

let activeSql = null;
let activeCandidate = null;

for (const candidate of candidates) {
  console.log(`Connecting to database via ${candidate.name}...`);
  const client = postgres(candidate.url, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Quick connection probe to verify network reachability and authentication
    await client`SELECT 1`;
    activeSql = client;
    activeCandidate = candidate;
    console.log(`✓ Connection established using ${candidate.name}.`);
    break;
  } catch (probeError) {
    await client.end({ timeout: 2 }).catch(() => {});
    const cause =
      probeError && typeof probeError === "object" && "cause" in probeError && probeError.cause
        ? probeError.cause
        : probeError;
    const errorCode = (cause && cause.code) || probeError?.code || "UNKNOWN";
    const errorMsg = (cause && cause.message) || probeError?.message || String(probeError);
    console.warn(`⚠️ Connection via ${candidate.name} failed (${errorCode}: ${errorMsg}).`);
  }
}

if (!activeSql) {
  console.error("❌ Could not establish a database connection with any provided credentials.");
  process.exit(1);
}

const db = drizzle(activeSql);

try {
  console.log(`Applying pending migrations from ./drizzle using ${activeCandidate.name}...`);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ All pending migrations applied successfully.");
} catch (error) {
  console.error("❌ Migration failed with error:");
  const err = error && typeof error === "object" ? error : { message: String(error) };
  const cause = "cause" in err && err.cause && typeof err.cause === "object" ? err.cause : null;

  if ("message" in err) console.error("Message:", err.message);
  if (cause && "message" in cause) console.error("Underlying Cause:", cause.message);
  if (cause && "detail" in cause && cause.detail) console.error("Detail:", cause.detail);
  if (cause && "hint" in cause && cause.hint) console.error("Hint:", cause.hint);
  if (cause && "code" in cause && cause.code) console.error("Code:", cause.code);
  if ("stack" in err && err.stack) console.error(err.stack);
  process.exit(1);
} finally {
  if (activeSql) {
    await activeSql.end({ timeout: 5 });
  }
}

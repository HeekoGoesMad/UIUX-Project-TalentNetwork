#!/usr/bin/env node
/**
 * Script to clean up old audit logs before September 15, 2026.
 * Target: delete rows from `audit_logs` where `created_at < '2026-09-15 00:00:00+00'`.
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const require = createRequire(path.join(projectRoot, "package.json"));

const dotenv = require("dotenv");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) {
  console.error("clean-old-audit-logs: DATABASE_URL (or DIRECT_URL fallback) is not set.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function main() {
  const CUTOFF_DATE = "2026-09-15 00:00:00+00";
  console.log(`[INFO] Checking audit logs before cutoff date: ${CUTOFF_DATE}...`);

  const [beforeCount] = await sql`
    SELECT count(*)::int as count 
    FROM audit_logs 
    WHERE created_at < ${CUTOFF_DATE};
  `;

  console.log(`[INFO] Found ${beforeCount.count} audit logs before ${CUTOFF_DATE}.`);

  if (beforeCount.count === 0) {
    console.log("[INFO] No logs to delete.");
  } else {
    console.log(`[INFO] Deleting ${beforeCount.count} old audit logs...`);
    const deleted = await sql`
      DELETE FROM audit_logs 
      WHERE created_at < ${CUTOFF_DATE}
      RETURNING id;
    `;
    console.log(`[SUCCESS] Successfully deleted ${deleted.length} audit logs.`);
  }

  const [totalRemaining] = await sql`
    SELECT count(*)::int as count, min(created_at) as earliest, max(created_at) as latest 
    FROM audit_logs;
  `;

  console.log(`[SUMMARY] Remaining audit logs in database: ${totalRemaining.count}`);
  console.log(`[SUMMARY] Earliest remaining log: ${totalRemaining.earliest}`);
  console.log(`[SUMMARY] Latest log: ${totalRemaining.latest}`);

  await sql.end();
}

main().catch((err) => {
  console.error("[ERROR] Failed to clean audit logs:", err);
  process.exit(1);
});

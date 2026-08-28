/* eslint-disable @typescript-eslint/no-require-imports */
const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function run() {
  try {
    console.log("Applying enum and column updates...");
    await sql.unsafe(`ALTER TYPE "recruiter_provisioning_status" ADD VALUE IF NOT EXISTS 'revision_required';`);
    console.log("✓ Added 'revision_required' to recruiter_provisioning_status enum");
    await sql.unsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recruiter_rejection_reason" text;`);
    console.log("✓ Added 'recruiter_rejection_reason' column to users table");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

run();

#!/usr/bin/env node
/**
 * Idempotent dev seed — inserts the minimum useful dev dataset.
 *
 * Rows (all fixed UUIDs / keys, safe to re-run):
 *   users (x2: demo recruiter + demo candidate), profiles (x2),
 *   organizations (x1: slug `demo-org`), organization_members (x1: owner),
 *   candidate_profiles (x1), token_accounts (x1, balance 100),
 *   token_ledger_entries (x1 grant, idempotency_key `seed:demo-org:initial-grant`)
 *
 * Auth note: this script does NOT touch Supabase Auth. `auth_user_id` values
 * below are placeholder UUIDs so FK/non-null constraints pass. To log in as a
 * demo user, create the real auth user via the app signup or the Supabase
 * dashboard with the same email, then update `users.auth_user_id` to the real
 * auth UID, e.g.:
 *   update users set auth_user_id = '<real-uid>' where email = 'demo.recruiter@example.com';
 *
 * Guards: refuses when NODE_ENV=production or APP_ENV=production (exit 1).
 * Idempotency: every INSERT uses ON CONFLICT DO NOTHING; re-runs skip.
 * Env: DATABASE_URL (preferred) or DIRECT_URL fallback, like drizzle.config.
 * Exit codes: 0 ok (even when everything skipped), 1 config/guard error.
 */

import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
  console.error("seed: refusing to run with NODE_ENV/APP_ENV=production (dev-only script).");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) {
  console.error("seed: DATABASE_URL (or DIRECT_URL fallback) is not set.");
  process.exit(1);
}

// Fixed demo identities — stable across re-runs so FK links never drift.
const RECRUITER = {
  id: "11111111-1111-4111-8111-111111111111",
  authUserId: "11111111-1111-4111-8111-111111111112", // placeholder, see header
  email: "demo.recruiter@example.com",
};
const CANDIDATE = {
  id: "22222222-2222-4222-8222-222222222222",
  authUserId: "22222222-2222-4222-8222-222222222223", // placeholder, see header
  email: "demo.candidate@example.com",
};
const ORG = { id: "33333333-3333-4333-8333-333333333333", slug: "demo-org" };
const GRANT_KEY = "seed:demo-org:initial-grant";

const sql = postgres(connectionString, { max: 1 });
const tally = { created: 0, skipped: 0 };

/** INSERT ... ON CONFLICT DO NOTHING; reports created vs skipped. */
async function seedOne(label, query) {
  const rows = await query;
  if (rows.length > 0) {
    tally.created += 1;
    console.log(`  created: ${label}`);
  } else {
    tally.skipped += 1;
    console.log(`  skipped (exists): ${label}`);
  }
}

try {
  await seedOne(`user ${RECRUITER.email}`, sql`
    insert into users (id, auth_user_id, email, role, recruiter_provisioning_status)
    values (${RECRUITER.id}, ${RECRUITER.authUserId}, ${RECRUITER.email}, 'recruiter', 'active')
    on conflict (email) do nothing returning id`);
  await seedOne(`user ${CANDIDATE.email}`, sql`
    insert into users (id, auth_user_id, email, role)
    values (${CANDIDATE.id}, ${CANDIDATE.authUserId}, ${CANDIDATE.email}, 'candidate')
    on conflict (email) do nothing returning id`);

  await seedOne(`profile ${RECRUITER.email}`, sql`
    insert into profiles (user_id, display_name)
    values (${RECRUITER.id}, 'Demo Recruiter')
    on conflict (user_id) do nothing returning id`);
  await seedOne(`profile ${CANDIDATE.email}`, sql`
    insert into profiles (user_id, display_name)
    values (${CANDIDATE.id}, 'Demo Candidate')
    on conflict (user_id) do nothing returning id`);

  await seedOne(`organization ${ORG.slug}`, sql`
    insert into organizations (id, name, slug, created_by, verification_status)
    values (${ORG.id}, 'Demo Org', ${ORG.slug}, ${RECRUITER.id}, 'approved')
    on conflict (slug) do nothing returning id`);
  await seedOne(`organization member (owner) ${RECRUITER.email}`, sql`
    insert into organization_members (organization_id, user_id, role)
    values (${ORG.id}, ${RECRUITER.id}, 'owner')
    on conflict (organization_id, user_id) do nothing returning id`);

  await seedOne(`candidate profile ${CANDIDATE.email}`, sql`
    insert into candidate_profiles (user_id, headline, target_role, location, is_published)
    values (${CANDIDATE.id}, 'Demo Candidate', 'Software Engineer', 'Jakarta', true)
    on conflict (user_id) do nothing returning id`);

  await seedOne(`token account ${ORG.slug}`, sql`
    insert into token_accounts (organization_id, balance)
    values (${ORG.id}, 100)
    on conflict (organization_id) do nothing returning id`);

  // Grant matches the account's initial balance; re-runs skip on idempotency key.
  await seedOne(`token grant ${GRANT_KEY}`, sql`
    insert into token_ledger_entries (token_account_id, type, amount, idempotency_key, metadata)
    select id, 'grant', 100, ${GRANT_KEY}, '{"seed":true}'::jsonb from token_accounts
    where organization_id = ${ORG.id}
    on conflict (idempotency_key) do nothing returning id`);

  console.log(`seed: done — ${tally.created} created, ${tally.skipped} skipped.`);
} catch (err) {
  console.error("seed: failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end();
}

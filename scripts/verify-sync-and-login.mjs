import postgres from "postgres";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

config({ path: ".env.local" });
config();

console.log("=== STEP 1: VERIFYING POSTGRESQL CONNECTION ===");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

try {
  const sql = postgres(connectionString, { max: 1, connect_timeout: 5 });
  await sql`SELECT 1 as test`;
  console.log("✓ PostgreSQL connection successful!");
  await sql.end();
} catch (e) {
  console.error("❌ PostgreSQL connection failed:", e.message);
  process.exit(1);
}

console.log("\n=== STEP 2: RUNNING DATABASE MIGRATIONS ===");
try {
  execSync("npm run db:migrate", { stdio: "inherit" });
  console.log("✓ Migrations applied successfully!");
} catch (e) {
  console.error("❌ Migrations failed:", e.message);
  process.exit(1);
}

console.log("\n=== STEP 3: RUNNING SCHEMA PARITY CHECK ===");
try {
  execSync("npm run db:verify", { stdio: "inherit" });
  console.log("✓ Schema parity verified!");
} catch (e) {
  console.error("❌ Schema parity failed:", e.message);
  process.exit(1);
}

console.log("\n=== STEP 4: VERIFYING E2E RECRUITER & CANDIDATE AUTH SYNC ===");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function testAccount(email, password, role) {
  console.log(`\nTesting ${role} account: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error(`❌ Supabase Auth failed for ${email}:`, authError.message);
    return false;
  }
  console.log(`✓ Supabase Auth OK! UID: ${authData.user.id}`);

  // Test /api/auth/sync
  const cookieHeader = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token=${encodeURIComponent(JSON.stringify(authData.session))}`;
  const syncRes = await fetch("http://localhost:3000/api/auth/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
      "Authorization": `Bearer ${authData.session.access_token}`,
    },
    body: JSON.stringify({ role, name: email.split("@")[0] }),
  });

  const syncBody = await syncRes.json().catch(() => ({}));
  if (!syncRes.ok) {
    console.error(`❌ /api/auth/sync failed (${syncRes.status}):`, syncBody);
    return false;
  }
  console.log(`✓ /api/auth/sync SUCCESS: role=${syncBody.role}, status=${syncBody.provisioningStatus}`);
  return true;
}

const recruiterOk = await testAccount(
  process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com",
  process.env.E2E_RECRUITER_PASSWORD || "123456",
  "recruiter"
);

const candidateOk = await testAccount(
  process.env.E2E_CANDIDATE_EMAIL || "lie.adriennekayana@gmail.com",
  process.env.E2E_CANDIDATE_PASSWORD || "123456",
  "candidate"
);

if (recruiterOk && candidateOk) {
  console.log("\n🎉 ALL CHECKS PASSED! Both test accounts can successfully authenticate and synchronize with database.");
} else {
  console.error("\n❌ Some accounts failed to authenticate/sync.");
  process.exit(1);
}

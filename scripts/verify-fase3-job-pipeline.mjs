import { chromium } from "playwright";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, anonKey);

async function getAuthCookie(email, password, role) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) {
    throw new Error(`Auth failed for ${email}: ${authError.message}`);
  }

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify(authData.session));

  // Sync to database
  await fetch("http://localhost:3000/api/auth/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `${cookieName}=${cookieValue}`,
      "Authorization": `Bearer ${authData.session.access_token}`,
    },
    body: JSON.stringify({ role, name: email.split("@")[0] }),
  });

  return {
    name: cookieName,
    value: cookieValue,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  };
}

async function run() {
  console.log("=== FASE 3 E2E VERIFICATION: JOB PIPELINE UNIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  try {
    const recruiterCookie = await getAuthCookie(
      process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com",
      process.env.E2E_RECRUITER_PASSWORD || "123456",
      "recruiter"
    );

    const context = await browser.newContext();
    await context.addCookies([recruiterCookie]);
    const page = await context.newPage();

    // 1. Visit recruiter jobs page
    console.log("1. Navigating to /recruiter/jobs...");
    await page.goto("http://localhost:3000/recruiter/jobs", { waitUntil: "networkidle" });

    // Verify job card has both Kelola Detail and Pipeline buttons
    const pipelineButton = page.locator("a:has-text('Pipeline')").first();
    await pipelineButton.waitFor({ state: "visible", timeout: 8000 });
    console.log("✓ Found Pipeline button on job card.");

    const detailButton = page.locator("a:has-text('Kelola Detail')").first();
    await detailButton.waitFor({ state: "visible", timeout: 8000 });
    console.log("✓ Found Kelola Detail button on job card.");

    // 2. Click Pipeline button
    const pipelineHref = await pipelineButton.getAttribute("href");
    console.log(`2. Clicking Pipeline button -> ${pipelineHref}`);
    await pipelineButton.click();
    await page.waitForLoadState("networkidle");

    // 3. Verify dedicated Job Pipeline view
    console.log("3. Verifying dedicated Job Pipeline view...");
    const breadcrumb = page.locator("nav:has-text('Pipeline Pelamar')");
    await breadcrumb.waitFor({ state: "visible", timeout: 8000 });
    console.log("✓ Breadcrumb navigation verified.");

    const headerBadge = page.locator("text=Lowongan Khusus");
    await headerBadge.waitFor({ state: "visible", timeout: 8000 });
    console.log("✓ 'Lowongan Khusus' badge verified.");

    const detailLink = page.locator("a:has-text('Detail Lowongan')");
    await detailLink.waitFor({ state: "visible", timeout: 8000 });
    console.log("✓ 'Detail Lowongan' quick button verified.");

    // Verify KPI metric strip is rendered
    const totalMetric = page.locator("text=Total Pelamar");
    await totalMetric.waitFor({ state: "visible", timeout: 8000 });
    console.log("✓ KPI Metrics strip is visible.");

    // 4. Verify candidate drawer functionality in job pipeline
    console.log("4. Verifying candidate drawer in scoped pipeline...");
    const candidateCard = page.locator("[draggable='true'], [draggable='false']").filter({ hasText: "Screening" }).first();
    if (await candidateCard.isVisible()) {
      await candidateCard.click();
      const drawer = page.locator("text=Detail Kandidat & Evaluasi");
      await drawer.waitFor({ state: "visible", timeout: 8000 });
      console.log("✓ Candidate detail drawer opened properly inside job pipeline.");

      // Close drawer
      const closeButton = page.locator("button[aria-label='Tutup laci']");
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }

    // 5. Test Breadcrumb Back Navigation
    console.log("5. Testing breadcrumb navigation back to /recruiter/jobs...");
    const backToJobs = page.locator("nav a:has-text('Daftar Lowongan')");
    await backToJobs.click();
    await page.waitForURL("**/recruiter/jobs", { timeout: 8000 });
    console.log(`✓ Navigated back to: ${page.url()}`);

    console.log("\n>>> ALL FASE 3 E2E CHECKS PASSED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

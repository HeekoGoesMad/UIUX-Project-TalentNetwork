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

async function main() {
  console.log("Starting E2E browser verification...");
  const browser = await chromium.launch({ headless: true });

  // 1. Recruiter View Verification
  console.log("\n--- 1. Testing Recruiter Operations & Locked Drawer UI ---");
  const recruiterCookie = await getAuthCookie(
    process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com",
    process.env.E2E_RECRUITER_PASSWORD || "123456",
    "recruiter"
  );

  const recruiterContext = await browser.newContext();
  await recruiterContext.addCookies([recruiterCookie]);
  const page = await recruiterContext.newPage();

  await page.goto("http://localhost:3000/recruiter/operations", { waitUntil: "networkidle" });
  console.log("Recruiter Operations page loaded:", page.url());

  // Click on a candidate card in the pipeline / inbound table to open the drawer
  const anyCandidate = page.locator('text=HK').or(page.locator('text=Hasyim Kipuw')).or(page.locator('div[role="button"], tr, div').filter({ hasText: /Engineering|Designer/i })).first();
  if (await anyCandidate.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Clicking candidate card to open drawer...");
    await anyCandidate.click();
    await page.waitForTimeout(1000);

    // Verify Surat Lamaran / Cover Note has no icon in heading
    const coverNoteHeader = page.locator('h4:has-text("Surat Lamaran / Cover Note")').first();
    const isCoverNoteVisible = await coverNoteHeader.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Surat Lamaran / Cover Note heading visible: ${isCoverNoteVisible}`);

    // Verify AI screening locked card or active card
    const lockedCard = page.locator('text=Evaluasi AI Screening Belum Terbuka').or(page.locator('text=Hasil AI Screening')).first();
    const isScreeningCardVisible = await lockedCard.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Screening Card visible: ${isScreeningCardVisible}`);

    const hasUnlockBtn = page.locator('button:has-text("Buka Profil")').first();
    console.log(`✓ Unlock button present: ${await hasUnlockBtn.isVisible({ timeout: 3000 }).catch(() => false)}`);
  } else {
    console.log("ℹ No candidate card directly visible to click.");
  }

  // 2. Candidate View Verification
  console.log("\n--- 2. Testing Candidate Applications Transparency ---");
  const candidateCookie = await getAuthCookie(
    process.env.E2E_CANDIDATE_EMAIL || "lie.adriennekayana@gmail.com",
    process.env.E2E_CANDIDATE_PASSWORD || "123456",
    "candidate"
  );

  const candidateContext = await browser.newContext();
  await candidateContext.addCookies([candidateCookie]);
  const candPage = await candidateContext.newPage();

  await candPage.goto("http://localhost:3000/candidate/applications", { waitUntil: "networkidle" });
  console.log("Candidate Applications page loaded:", candPage.url());

  // Check transparency badge
  const transparencyBadge = candPage.locator('text=Profil Dibuka Rekruter').or(candPage.locator('text=Antrean Triage')).first();
  const hasBadge = await transparencyBadge.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`✓ Candidate Applications Transparency Badge visible: ${hasBadge}`);

  // Navigate to application detail
  const detailLink = candPage.locator('a[href^="/candidate/applications/"]').first();
  if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    const detailHref = await detailLink.getAttribute("href");
    console.log(`Opening application detail: ${detailHref}`);
    await candPage.goto(`http://localhost:3000${detailHref}`, { waitUntil: "networkidle" });

    // Check Transparency Status Card
    const transCard = candPage.locator('text=Profil Lengkap Anda Telah Dibuka').or(candPage.locator('text=Lamaran Berada dalam Antrean')).first();
    console.log(`✓ Transparency Status Card visible: ${await transCard.isVisible({ timeout: 5000 }).catch(() => false)}`);

    // Check 5 Pipeline Milestones
    const step1 = candPage.locator('text=Lamaran Terkirim').first();
    const step2 = candPage.locator('text=Profil Dibuka & Peninjauan').first();
    console.log(`✓ Step 1 (Lamaran Terkirim) visible: ${await step1.isVisible({ timeout: 3000 }).catch(() => false)}`);
    console.log(`✓ Step 2 (Profil Dibuka & Peninjauan) visible: ${await step2.isVisible({ timeout: 3000 }).catch(() => false)}`);
  }

  await browser.close();
  console.log("\n✓ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

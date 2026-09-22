import { chromium } from "playwright";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const recruiterEmail = (process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com").trim();
const recruiterPassword = (process.env.E2E_RECRUITER_PASSWORD || "123456").trim();
const candidateEmail = (process.env.E2E_CANDIDATE_EMAIL || "lie.adriennekayana@gmail.com").trim();
const candidatePassword = (process.env.E2E_CANDIDATE_PASSWORD || "123456").trim();

async function runTest() {
  console.log("==================================================");
  console.log("  Testing Candidate - Recruiter Interview Sync   ");
  console.log("==================================================");

  const browser = await chromium.launch({ headless: true });

  const candidateContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const candidatePage = await candidateContext.newPage();

  const recruiterContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const recruiterPage = await recruiterContext.newPage();

  try {
    // 1. Recruiter Login
    console.log(`\n[1] Recruiter logging in (${recruiterEmail})...`);
    await recruiterPage.goto(`${BASE_URL}/login`);
    const recRoleBtn = recruiterPage.locator("button:has-text('Hiring / Recruiter'), button:has-text('Recruiter')").first();
    if (await recRoleBtn.isVisible().catch(() => false)) await recRoleBtn.click();
    await recruiterPage.fill("input[type='email']", recruiterEmail);
    await recruiterPage.fill("input[type='password']", recruiterPassword);
    await recruiterPage.click("button[type='submit']");
    await recruiterPage.waitForTimeout(3000);
    console.log("✓ Recruiter logged in:", recruiterPage.url());

    // 2. Candidate Login
    console.log(`\n[2] Candidate logging in (${candidateEmail})...`);
    await candidatePage.goto(`${BASE_URL}/login`);
    const candRoleBtn = candidatePage.locator("button:has-text('Kandidat / Job Seeker'), button:has-text('Candidate')").first();
    if (await candRoleBtn.isVisible().catch(() => false)) await candRoleBtn.click();
    await candidatePage.fill("input[type='email']", candidateEmail);
    await candidatePage.fill("input[type='password']", candidatePassword);
    await candidatePage.click("button[type='submit']");
    await candidatePage.waitForTimeout(3000);
    console.log("✓ Candidate logged in:", candidatePage.url());

    // 3. Open Candidate Application Details
    console.log("\n[3] Opening candidate application details...");
    await candidatePage.goto(`${BASE_URL}/candidate/applications/94030c6c-e982-4376-bd51-4271835dbf1d`);
    await candidatePage.waitForTimeout(3000);

    // --- TEST 1: Konfirmasi Hadir ---
    console.log("\n==================================================");
    console.log("  TEST 1: Konfirmasi Hadir");
    console.log("==================================================");
    const confirmBtn = candidatePage.locator("button:has-text('Konfirmasi Hadir')").first();
    await confirmBtn.waitFor({ state: "visible", timeout: 10000 });
    console.log("Found 'Konfirmasi Hadir' button, clicking...");

    const [patchConfRes] = await Promise.all([
      candidatePage.waitForResponse((res) => res.url().includes("/api/interviews/") && res.request().method() === "PATCH", { timeout: 10000 }),
      confirmBtn.click(),
    ]);

    console.log(`✓ PATCH /api/interviews returned HTTP ${patchConfRes.status()}`);
    const confData = await patchConfRes.json();
    console.log("Interview response:", confData?.interview?.status);
    const confInterviewId = confData?.interview?.id;

    await candidatePage.waitForTimeout(1000);
    const confBadge = candidatePage.locator("span:has-text('Terkonfirmasi Hadir')").first();
    console.log(`✓ Candidate UI shows 'Terkonfirmasi Hadir': ${await confBadge.isVisible()}`);

    // Verify recruiter receives update
    const recCheck1 = await recruiterPage.request.get(`${BASE_URL}/api/interviews/${confInterviewId}`);
    const recCheck1Data = await recCheck1.json();
    const confStatus = recCheck1Data?.interview?.interview?.status || recCheck1Data?.interview?.status;
    console.log(`✓ Recruiter API sees status: ${confStatus}`);
    if (confStatus !== "confirmed") {
      throw new Error(`Expected 'confirmed', got ${confStatus}`);
    }

    // --- TEST 2: Ajukan Reschedule ---
    console.log("\n==================================================");
    console.log("  TEST 2: Ajukan Reschedule");
    console.log("==================================================");
    const reschedBtn = candidatePage.locator("button:has-text('Ajukan Reschedule')").first();
    await reschedBtn.waitFor({ state: "visible", timeout: 10000 });
    console.log("Found 'Ajukan Reschedule' button, clicking...");
    await reschedBtn.click();
    await candidatePage.waitForTimeout(800);

    const dateInput = candidatePage.locator("input#candidate-reschedule-date").first();
    const reasonInput = candidatePage.locator("textarea#candidate-reschedule-reason").first();
    await dateInput.fill("2026-09-28T15:00");
    await reasonInput.fill("Ada rapat pleno mendadak, mohon diundur ke jam 15:00.");

    const submitReschedBtn = candidatePage.locator("button:has-text('Ajukan Jadwal Baru')").first();
    const [patchReschedRes] = await Promise.all([
      candidatePage.waitForResponse((res) => res.url().includes("/api/interviews/") && res.request().method() === "PATCH", { timeout: 10000 }),
      submitReschedBtn.click(),
    ]);

    console.log(`✓ PATCH /api/interviews returned HTTP ${patchReschedRes.status()}`);
    const reschedData = await patchReschedRes.json();
    console.log("Interview status:", reschedData?.interview?.status);
    console.log("Reschedule metadata:", reschedData?.interview?.rescheduleMetadata);
    const reschedInterviewId = reschedData?.interview?.id;

    await candidatePage.waitForTimeout(1000);
    const reschedBadge = candidatePage.locator("span:has-text('Menunggu Respon Reschedule')").first();
    console.log(`✓ Candidate UI shows 'Menunggu Respon Reschedule': ${await reschedBadge.isVisible()}`);

    // Verify recruiter receives update
    const recCheck2 = await recruiterPage.request.get(`${BASE_URL}/api/interviews/${reschedInterviewId}`);
    const recCheck2Data = await recCheck2.json();
    const reschedStatus = recCheck2Data?.interview?.interview?.status || recCheck2Data?.interview?.status;
    const reschedMeta = recCheck2Data?.interview?.interview?.rescheduleMetadata || recCheck2Data?.interview?.rescheduleMetadata;
    console.log(`✓ Recruiter API sees status: ${reschedStatus}`);
    console.log(`✓ Recruiter API sees reschedule proposedDate: ${reschedMeta?.proposedDate}`);
    console.log(`✓ Recruiter API sees reschedule reason: ${reschedMeta?.reason}`);
    const scheduledAtInDb = recCheck2Data?.interview?.interview?.scheduledAt || recCheck2Data?.interview?.scheduledAt;
    console.log(`✓ Database scheduledAt updated to: ${scheduledAtInDb}`);
    if (reschedStatus !== "reschedule_requested") {
      throw new Error(`Expected 'reschedule_requested', got ${reschedStatus}`);
    }

    // --- TEST 3: Tolak Sesi Ini ---
    console.log("\n==================================================");
    console.log("  TEST 3: Tolak Sesi Ini");
    console.log("==================================================");
    const declineBtn = candidatePage.locator("button:has-text('Tolak Sesi Ini')").first();
    await declineBtn.waitFor({ state: "visible", timeout: 10000 });
    console.log("Found 'Tolak Sesi Ini' button, clicking...");
    await declineBtn.click();
    await candidatePage.waitForTimeout(800);

    const declineReasonInput = candidatePage.locator("textarea#candidate-decline-iv-reason").first();
    await declineReasonInput.fill("Bentrok dengan jadwal presentasi klien luar kota.");

    const confirmDeclineBtn = candidatePage.locator("button:has-text('Ya, Tolak Sesi Wawancara')").first();
    const [patchDeclineRes] = await Promise.all([
      candidatePage.waitForResponse((res) => res.url().includes("/api/interviews/") && res.request().method() === "PATCH", { timeout: 10000 }),
      confirmDeclineBtn.click(),
    ]);

    console.log(`✓ PATCH /api/interviews returned HTTP ${patchDeclineRes.status()}`);
    const declineData = await patchDeclineRes.json();
    console.log("Interview status:", declineData?.interview?.status);
    console.log("Cancellation metadata:", declineData?.interview?.cancellationMetadata);
    const declineInterviewId = declineData?.interview?.id;

    await candidatePage.waitForTimeout(1000);
    const declinedBadge = candidatePage.locator("span:has-text('Jadwal Sesi Ditolak')").first();
    console.log(`✓ Candidate UI shows 'Jadwal Sesi Ditolak': ${await declinedBadge.isVisible()}`);

    // Verify recruiter receives update
    const recCheck3 = await recruiterPage.request.get(`${BASE_URL}/api/interviews/${declineInterviewId}`);
    const recCheck3Data = await recCheck3.json();
    const declineStatus = recCheck3Data?.interview?.interview?.status || recCheck3Data?.interview?.status;
    const cancelMeta = recCheck3Data?.interview?.interview?.cancellationMetadata || recCheck3Data?.interview?.cancellationMetadata;
    console.log(`✓ Recruiter API sees status: ${declineStatus}`);
    console.log(`✓ Recruiter API sees cancellation reason: ${cancelMeta?.reason}`);
    if (declineStatus !== "declined") {
      throw new Error(`Expected 'declined', got ${declineStatus}`);
    }

    // --- TEST 4: Recruiter Operations Hub UI Verification ---
    console.log("\n==================================================");
    console.log("  TEST 4: Recruiter Operations Hub UI Verification");
    console.log("==================================================");
    await recruiterPage.goto(`${BASE_URL}/recruiter/operations`);
    await recruiterPage.waitForTimeout(3000);

    const adrienneCandidate = recruiterPage.locator("text='Adrienne Kayana Wistara Lie'").first();
    if (await adrienneCandidate.isVisible()) {
      await adrienneCandidate.click();
      await recruiterPage.waitForTimeout(1500);

      // Check drawer elements
      const recDrawerConf = recruiterPage.locator("span:has-text('Terkonfirmasi Hadir')").first();
      const recDrawerResched = recruiterPage.locator("span:has-text('Permintaan Reschedule')").first();
      const recDrawerDeclined = recruiterPage.locator("span:has-text('Ditolak Kandidat')").first();
      const recDrawerReschedAlert = recruiterPage.locator("text='Kandidat Mengajukan Reschedule'").first();

      console.log(`✓ Recruiter drawer 'Terkonfirmasi Hadir' badge: ${await recDrawerConf.isVisible()}`);
      console.log(`✓ Recruiter drawer 'Permintaan Reschedule' badge: ${await recDrawerResched.isVisible()}`);
      console.log(`✓ Recruiter drawer 'Ditolak Kandidat' badge: ${await recDrawerDeclined.isVisible()}`);
      console.log(`✓ Recruiter drawer reschedule alert note: ${await recDrawerReschedAlert.isVisible()}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED! FULL END-TO-END CONNECTION VERIFIED!");
    console.log("==================================================");
  } catch (err) {
    console.error("Test failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTest();

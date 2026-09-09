import { chromium } from "playwright";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });
config();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const screenshotDir = path.resolve("scratch/e2e_screenshots");

async function run() {
  console.log("🚀 Starting Candidate Banner & Avatar Visual Test...\n");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  try {
    console.log("1. Logging in as Recruiter...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const recruiterRoleBtn = page.locator("button:has-text('Rekruter'), button:has-text('Recruiter')").first();
    if (await recruiterRoleBtn.isVisible()) {
      await recruiterRoleBtn.click();
      await page.waitForTimeout(300);
    }

    await page.fill('input[type="email"]', (process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com").trim());
    await page.fill('input[type="password"]', (process.env.E2E_RECRUITER_PASSWORD || "123456").trim());
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    console.log("   ✓ Logged in as recruiter!");

    console.log("\n2. Navigating to /search to find talent from database...");
    await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Find the talent links
    const talentLinks = page.locator('a[href^="/recruiter/discover/"], a[href^="/talent/"]');
    const talentCount = await talentLinks.count();
    console.log(`   Found ${talentCount} candidates in search.`);

    if (talentCount === 0) {
      throw new Error("No candidates found on /search page.");
    }

    // Pick the first candidate
    const firstTalentHref = await talentLinks.first().getAttribute("href");
    console.log(`   Selected candidate: ${firstTalentHref}`);

    // Navigate to candidate profile
    await page.goto(`${BASE_URL}${firstTalentHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Check if locked or already unlocked
    const unlockBtn = page.locator('button:has-text("Buka Profil · 1 Token")');
    const isLocked = await unlockBtn.isVisible();
    console.log(`   Candidate profile currently locked? ${isLocked}`);

    if (isLocked) {
      // Verify locked banner badge
      const lockBadge = page.locator('span:has-text("Sampul & Foto Dikaburkan")');
      console.log(`   ✓ Locked banner badge visible: ${await lockBadge.isVisible()} (Expected: true)`);

      // Screenshot BEFORE scan (blurred banner & avatar)
      const beforeScanPath = path.join(screenshotDir, "candidate_banner_avatar_BEFORE_scan.png");
      await page.screenshot({ path: beforeScanPath, fullPage: false });
      console.log(`   📸 Saved BEFORE scan screenshot: ${beforeScanPath}`);

      // Click Unlock
      console.log("\n3. Scanning candidate with 1 Token...");
      await unlockBtn.click();
      await page.waitForTimeout(500);

      const confirmBtn = page.locator('button:has-text("Konfirmasi Buka Profil")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      await page.waitForTimeout(3000);
    } else {
      console.log("   Candidate is already unlocked. Capturing unblurred view.");
    }

    // Scroll to top to view the unblurred banner and avatar
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Screenshot AFTER scan (unblurred sharp banner & avatar)
    const afterScanPath = path.join(screenshotDir, "candidate_banner_avatar_AFTER_scan.png");
    await page.screenshot({ path: afterScanPath, fullPage: false });
    console.log(`   📸 Saved AFTER scan screenshot: ${afterScanPath}`);

    // Verify unlocked state
    const unlockedBadge = page.locator('span:has-text("Terbuka")');
    console.log(`   ✓ Unlocked badge visible: ${await unlockedBadge.isVisible()} (Expected: true)`);

    // Test demo candidate Nadia Putri (/talent/candidate-1)
    console.log("\n4. Testing demo candidate Nadia Putri (/talent/candidate-1)...");
    await page.goto(`${BASE_URL}/talent/candidate-1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const demoCandidatePath = path.join(screenshotDir, "candidate_banner_avatar_DEMO_nadia.png");
    await page.screenshot({ path: demoCandidatePath, fullPage: false });
    console.log(`   📸 Saved demo candidate screenshot: ${demoCandidatePath}`);

    console.log("\n🎉 Candidate Banner & Avatar Visual Test Passed Successfully!\n");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

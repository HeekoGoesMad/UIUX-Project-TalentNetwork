import { chromium } from "playwright";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("1. Logging in as recruiter...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "adriennedeveloper@gmail.com");
  await page.fill('input[type="password"]', "123456");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
  console.log("   Logged in successfully!");

  console.log("2. Navigating to candidate profile (cd6ec533-5d1c-4f87-842c-888de3e825ec)...");
  await page.goto(`${BASE_URL}/talent/cd6ec533-5d1c-4f87-842c-888de3e825ec`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Check if already scanned or unlocked
  const unlockBtn = page.locator('button:has-text("Buka Profil · 1 Token")');
  if (await unlockBtn.isVisible()) {
    console.log("   Candidate is locked before scan. Checking floating bar...");
    const dockBefore = page.locator('aside[aria-label="Aksi Cepat Rekruter"]');
    const isDockVisibleBefore = await dockBefore.isVisible();
    console.log(`   Floating widget visible before scan? ${isDockVisibleBefore} (Expected: false)`);

    console.log("   Clicking unlock button...");
    await unlockBtn.click();
    await page.waitForTimeout(500);

    // Click confirm in dialog
    const confirmBtn = page.locator('button:has-text("Konfirmasi Buka Profil")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(3000);
  } else {
    console.log("   Candidate already unlocked/scanned in this session.");
  }

  // After unlock: check floating widget
  const dockAfter = page.locator('aside[aria-label="Aksi Cepat Rekruter"]');
  const isDockVisibleAfter = await dockAfter.isVisible();
  console.log(`   Floating widget visible after scan? ${isDockVisibleAfter} (Expected: true)`);

  // Check contact details
  const emailElem = page.locator('a[href^="mailto:"]').first();
  const emailText = await emailElem.textContent();
  console.log(`   Email displayed: "${emailText?.trim()}"`);

  const phoneElem = page.locator('a[href^="tel:"]').first();
  const phoneText = await phoneElem.textContent();
  console.log(`   Phone displayed: "${phoneText?.trim()}"`);

  // Take screenshot
  await page.screenshot({ path: "scratch/e2e_screenshots/06_scanned_candidate_side_widget.png", fullPage: true });
  console.log("   Screenshot saved to scratch/e2e_screenshots/06_scanned_candidate_side_widget.png");

  await browser.close();
  console.log("Test finished!");
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

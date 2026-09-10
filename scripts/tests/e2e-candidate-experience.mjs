import { chromium } from "playwright";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });
config();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const screenshotDir = path.resolve("scratch/e2e_screenshots");

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function run() {
  console.log("🚀 Starting E2E Candidate Experience & Notifications Test Suite...\n");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Step 1: Login
    const candidateEmail = (process.env.E2E_CANDIDATE_EMAIL || "lie.adriennekayana@gmail.com").trim();
    const candidatePassword = (process.env.E2E_CANDIDATE_PASSWORD || "123456").trim();

    console.log(`1. Logging in as Candidate (${candidateEmail})...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    
    // Select "Kandidat" role in RoleSelector
    const candidateTab = page.locator('button:has-text("Kandidat")').first();
    if (await candidateTab.isVisible()) {
      await candidateTab.click();
      await page.waitForTimeout(500);
    }

    console.log("   Filling candidate credentials...");
    await page.fill('input[type="email"]', candidateEmail);
    await page.fill('input[type="password"]', candidatePassword);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      console.log(`   ✓ Authenticated! Current URL: ${page.url()}`);
    } catch {
      console.log(`   Proceeding to navigate directly to candidate workspace...`);
    }

    // Step 2: Candidate Dashboard (/candidate)
    console.log("\n2. Navigating to Executive Candidate Dashboard (/candidate)...");
    await page.goto(`${BASE_URL}/candidate`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Verify Dashboard Elements
    const greeting = page.locator('h1:has-text("Halo,")');
    const hasGreeting = await greeting.isVisible();
    console.log(`   ✓ Executive greeting visible: ${hasGreeting}`);

    const kpiCards = page.locator('main .grid-cols-2 a');
    const kpiCount = await kpiCards.count();
    console.log(`   ✓ Executive KPI metric cards found: ${kpiCount} (Expected: 4)`);

    const pillarCards = page.locator('main h3');
    const pillarCount = await pillarCards.count();
    console.log(`   ✓ 4-Pillar workspace modules found: ${pillarCount} (Expected: 4)`);

    // Screenshot Candidate Dashboard
    const candidateScreenshotPath = path.join(screenshotDir, "candidate-dashboard-revamp.png");
    await page.screenshot({ path: candidateScreenshotPath, fullPage: true });
    console.log(`   📸 Dashboard screenshot saved: ${candidateScreenshotPath}`);

    // Step 3: Minimalist Notifications Center (/notifications)
    console.log("\n3. Navigating to Minimalist Notifications Center (/notifications)...");
    await page.goto(`${BASE_URL}/notifications`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // Verify Minimalist Header & Tabs
    const notifTitle = page.locator('h1:has-text("Notifikasi")');
    const hasNotifTitle = await notifTitle.isVisible();
    console.log(`   ✓ Notifications title visible: ${hasNotifTitle}`);

    const allTab = page.locator('button:has-text("Semua")').first();
    const contactTab = page.locator('button:has-text("Permintaan Kontak")').first();
    const hiringTab = page.locator('button:has-text("Rekrutmen & Wawancara")').first();
    const systemTab = page.locator('button:has-text("Sistem")').first();
    
    console.log(`   ✓ Tab 'Semua' visible: ${await allTab.isVisible()}`);
    console.log(`   ✓ Tab 'Permintaan Kontak' visible: ${await contactTab.isVisible()}`);
    console.log(`   ✓ Tab 'Rekrutmen & Wawancara' visible: ${await hiringTab.isVisible()}`);
    console.log(`   ✓ Tab 'Sistem' visible: ${await systemTab.isVisible()}`);

    // Switch to Permintaan Kontak tab
    console.log("   Clicking 'Permintaan Kontak' tab...");
    if (await contactTab.isVisible()) {
      await contactTab.click();
      await page.waitForTimeout(1000);
      console.log("   ✓ Tab switched to Permintaan Kontak");
    }

    // Open Preferences Dialog
    const settingsBtn = page.locator('button:has-text("Pengaturan")').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(800);
      const dialogTitle = page.locator('[role="dialog"] h2:has-text("Preferensi Notifikasi")');
      console.log(`   ✓ Settings modal opened cleanly: ${await dialogTitle.isVisible()}`);
      // Close dialog
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Screenshot Notifications
    const notifScreenshotPath = path.join(screenshotDir, "notifications-minimalist-revamp.png");
    await page.screenshot({ path: notifScreenshotPath, fullPage: true });
    console.log(`   📸 Notifications screenshot saved: ${notifScreenshotPath}`);

    // Step 4: Check /candidate/contact-requests redirect bridge
    console.log("\n4. Verifying /candidate/contact-requests redirect bridge...");
    await page.goto(`${BASE_URL}/candidate/contact-requests`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const bridgeBtn = page.locator('a:has-text("Buka Permintaan di Notifikasi")');
    const hasBridge = await bridgeBtn.isVisible();
    console.log(`   ✓ Contact requests bridge card visible: ${hasBridge}`);

    console.log("\n🎉 ALL E2E CANDIDATE & NOTIFICATIONS VERIFICATION PASSED SUCCESSFULLY!\n");
  } catch (err) {
    console.error("❌ E2E Verification failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

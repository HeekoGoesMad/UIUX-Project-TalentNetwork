import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/login");
  await p.fill('input[type="email"]', "adriennedeveloper@gmail.com");
  await p.fill('input[type="password"]', "123456");
  await p.click('button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("/login"));

  await p.goto("http://localhost:3000/talent/cd6ec533-5d1c-4f87-842c-888de3e825ec");
  await p.waitForTimeout(1500);

  const unlockBtn = p.locator('button:has-text("Buka Profil · 1 Token")');
  if (await unlockBtn.isVisible()) {
    console.log("Clicking unlock...");
    await unlockBtn.click();
    await p.waitForTimeout(500);
    const confirmBtn = p.locator('button:has-text("Konfirmasi Buka Profil")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await p.waitForTimeout(3000);
  }

  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(800);
  await p.screenshot({ path: "scratch/e2e_screenshots/talent_adrienne_unblurred_real.png" });
  console.log("Saved unblurred screenshot: scratch/e2e_screenshots/talent_adrienne_unblurred_real.png");
  await b.close();
}

main().catch(console.error);

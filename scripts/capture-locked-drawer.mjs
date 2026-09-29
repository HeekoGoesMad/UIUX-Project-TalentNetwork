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
  if (authError) throw new Error(authError.message);

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify(authData.session));

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
  const browser = await chromium.launch({ headless: true });
  const recruiterCookie = await getAuthCookie(
    process.env.E2E_RECRUITER_EMAIL || "adriennedeveloper@gmail.com",
    process.env.E2E_RECRUITER_PASSWORD || "123456",
    "recruiter"
  );

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([recruiterCookie]);
  const page = await context.newPage();

  console.log("Navigating to operations page...");
  await page.goto("http://localhost:3000/recruiter/operations", { waitUntil: "networkidle" });

  console.log("Searching for locked candidate card (HK or Masuk/Tolak)...");
  const hkCandidate = page.locator("text=HK").or(page.locator("text=Hasyim")).or(page.locator("text=1 Masuk/Tolak")).or(page.locator("button:has-text('Buka Profil')")).first();
  await hkCandidate.waitFor({ timeout: 10000 });
  await hkCandidate.click();

  await page.waitForTimeout(1500);
  await page.screenshot({ path: "scripts/locked-candidate-drawer-open.png" });
  console.log("Screenshot saved to scripts/locked-candidate-drawer-open.png");

  // Scroll down the drawer content
  await page.locator(".overflow-y-auto").last().evaluate(el => el.scrollTop = 500);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "scripts/locked-candidate-drawer-scrolled.png" });
  console.log("Scrolled screenshot saved to scripts/locked-candidate-drawer-scrolled.png");

  await browser.close();
}

run();

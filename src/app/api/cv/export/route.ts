import { NextResponse } from "next/server";
import { z } from "zod";
import type { Browser } from "playwright-core";
import { getCurrentAppUser } from "@/lib/api/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { buildCvHtml } from "@/lib/cv/templates";

const experienceItem = z.object({
  company: z.string().max(120),
  role: z.string().max(120),
  dates: z.string().max(60),
  achievements: z.array(z.string().max(300)).max(20),
});

const educationItem = z.object({
  level: z.string().max(40).optional(),
  school: z.string().max(160),
  program: z.string().max(160),
  gpa: z.string().max(40).optional(),
  startDate: z.string().max(60).optional(),
  endDate: z.string().max(60).optional(),
  currentlyStudying: z.boolean().optional(),
  dates: z.string().max(60).optional().default(""),
});

const profileSchema = z.object({
  id: z.string().max(100),
  fullName: z.string().max(120),
  headline: z.string().max(160),
  about: z.string().max(4000),
  location: z.string().max(120),
  email: z.string().max(200),
  phone: z.string().max(40),
  skills: z.array(z.string().max(60)).max(20),
  tools: z.array(z.string().max(60)).max(20),
  industries: z.array(z.string().max(80)).max(20),
  experience: z.array(experienceItem).max(20),
  education: z.array(educationItem).max(20),
  certifications: z.array(z.string().max(160)).max(20),
  portfolio: z.array(z.string().max(500)).max(20),
  targetRole: z.string().max(120),
  workArrangement: z.enum(["remote", "hybrid", "onsite"]),
  openToWork: z.boolean(),
  careerStatus: z.enum([
    "open-to-work",
    "open-for-opportunities",
    "freelance-available",
    "internship-available",
    "not-available",
  ]),
  sourceFileName: z.string().max(260).optional(),
  updatedAt: z.string().max(60),
});

const exportSchema = z.object({
  profile: profileSchema,
  templateId: z.enum(["ats", "modern", "sidebar", "minimal"]).default("ats"),
});

let cachedBrowserPromise: Promise<Browser> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const BROWSER_IDLE_TIMEOUT_MS = 30_000;

function resetIdleTimer(browser: Browser) {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    idleTimer = null;
    try {
      if (browser.isConnected()) {
        await browser.close();
      }
    } catch (e) {
      console.error("[cv/export] Error closing idle browser:", e);
    } finally {
      cachedBrowserPromise = null;
    }
  }, BROWSER_IDLE_TIMEOUT_MS);
}

async function getBrowser(): Promise<Browser> {
  if (cachedBrowserPromise) {
    try {
      const browser = await cachedBrowserPromise;
      if (browser.isConnected()) {
        return browser;
      }
    } catch {
      cachedBrowserPromise = null;
    }
  }

  cachedBrowserPromise = (async () => {
    let chromium;
    try {
      chromium = (await import("playwright")).chromium;
    } catch {
      chromium = (await import("playwright-core")).chromium;
    }

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    browser.on("disconnected", () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      cachedBrowserPromise = null;
    });

    return browser;
  })();

  return cachedBrowserPromise;
}

export async function POST(request: Request) {
  const current = await getCurrentAppUser();
  if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

  const rate = enforceRateLimit(`cv-export:${current.user.id}`, RATE_LIMITS.cvExport.limit, RATE_LIMITS.cvExport.windowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const payload = exportSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Data CV tidak valid." }, { status: 400 });
  }

  const { profile, templateId } = payload.data;
  const html = buildCvHtml(profile, templateId);
  const slug = profile.fullName
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50)
    .replace(/-+$/g, "");
  const safeFileName = `proofylink-cv-${slug || "cv"}.pdf`;

  let context: Awaited<ReturnType<Browser["newContext"]>> | undefined;
  let page: Awaited<ReturnType<Browser["newPage"]>> | undefined;

  try {
    const browser = await getBrowser();
    resetIdleTimer(browser);

    context = await browser.newContext();
    page = await context.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 10000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    resetIdleTimer(browser);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Content-Length": String(pdf.byteLength),
      },
    });
  } catch (error) {
    console.error("[cv/export] Playwright error:", error);
    return NextResponse.json(
      {
        error:
          "PDF generation membutuhkan browser runtime. Pastikan Playwright Chromium terpasang atau gunakan cetak browser.",
      },
      { status: 500 }
    );
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (pageError) {
        console.error("[cv/export] Failed to close page:", pageError);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (contextError) {
        console.error("[cv/export] Failed to close context:", contextError);
      }
    }
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import type { Browser } from "playwright-core";
import { getCurrentAppUser } from "@/lib/api/auth";
import { buildCvHtml } from "@/lib/cv/templates";

const experienceItem = z.object({
  company: z.string().max(120),
  role: z.string().max(120),
  dates: z.string().max(60),
  achievements: z.array(z.string().max(300)).max(20),
});

const educationItem = z.object({
  school: z.string().max(160),
  program: z.string().max(160),
  dates: z.string().max(60),
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

export async function POST(request: Request) {
  const current = await getCurrentAppUser();
  if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

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

  let browser: Browser | undefined;

  try {
    // Dynamically import playwright-core on demand
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin:
        templateId === "ats" || templateId === "minimal"
          ? { top: "18mm", bottom: "18mm", left: "20mm", right: "20mm" }
          : { top: "0", bottom: "0", left: "0", right: "0" },
    });

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
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("[cv/export] Failed to close browser instance:", closeError);
      }
    }
  }
}

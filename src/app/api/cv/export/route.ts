import { NextResponse } from "next/server";
import type { Browser } from "playwright-core";
import type { CvProfile } from "@/types";
import { type CvTemplateId, buildCvHtml } from "@/lib/cv/templates";
import { accessResponse, isApiAccess, requireApiAccess, withAccessMode } from "@/lib/api/access";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const access = await requireApiAccess("candidate");
  if (!isApiAccess(access)) return accessResponse(access);
  let profile: CvProfile;
  let templateId: CvTemplateId;
  let html: string;
  let safeFileName: string;

  try {
    const body = (await request.json()) as { profile: CvProfile; templateId: CvTemplateId };
    if (!body || typeof body.profile !== "object" || body.profile === null) throw new Error("invalid-profile");
    if (body.templateId !== undefined && !["ats", "modern", "sidebar", "minimal"].includes(body.templateId)) throw new Error("invalid-template");
    profile = body.profile;
    templateId = body.templateId ?? "ats";
    html = buildCvHtml(profile, templateId);
    safeFileName = `proofylink-cv-${(profile.fullName ?? "cv").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  const html = buildCvHtml(profile, templateId);
  const safeFileName = `proofylink-cv-${(profile.fullName ?? "cv").toLowerCase().replace(/\s+/g, "-")}.pdf`;

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

     if (access.mode === "database") await writeAuditLog({ db: access.db, actorUserId: access.user.id, action: "cv.exported", entityType: "cv", metadata: { exportKind: "profile_pdf", template: templateId } });
     return withAccessMode(new NextResponse(new Uint8Array(pdf), {
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
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
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

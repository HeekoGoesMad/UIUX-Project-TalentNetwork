import { NextResponse } from "next/server";
import type { CvProfile } from "@/types";
import { type CvTemplateId, buildCvHtml } from "@/lib/cv/templates";

export async function POST(request: Request) {
  let profile: CvProfile;
  let templateId: CvTemplateId;

  try {
    const body = (await request.json()) as { profile: CvProfile; templateId: CvTemplateId };
    profile = body.profile;
    templateId = body.templateId ?? "ats";
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  const html = buildCvHtml(profile, templateId);
  const safeFileName = `proofylink-cv-${(profile.fullName ?? "cv").toLowerCase().replace(/\s+/g, "-")}.pdf`;

  try {
    // Dynamically import playwright-core so it only loads on the server
    const { chromium } = await import("playwright-core");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: templateId === "ats" || templateId === "minimal"
        ? { top: "18mm", bottom: "18mm", left: "20mm", right: "20mm" }
        : { top: "0", bottom: "0", left: "0", right: "0" },
    });
    await browser.close();

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Content-Length": String(pdf.byteLength),
      },
    });
  } catch (error) {
    console.error("[cv/export] Playwright error:", error);
    // Fallback: return the HTML as a downloadable file with a helpful message
    return NextResponse.json(
      {
        error:
          "PDF generation membutuhkan Chromium. Jalankan `npx playwright install chromium` lalu coba lagi.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

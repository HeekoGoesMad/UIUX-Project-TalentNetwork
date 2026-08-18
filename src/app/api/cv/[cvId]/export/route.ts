import { NextResponse } from "next/server";
import { accessResponse, isApiAccess, requireApiAccess, withAccessMode } from "@/lib/api/access";
import { writeAuditLog } from "@/lib/audit";
function escapePdf(value: string) { return value.replace(/[()\\]/g, "\\$&").replace(/[^\x20-\x7e]/g, " ").slice(0, 180); }
export async function POST(request: Request, { params }: { params: Promise<{ cvId: string }> }) {
  const access = await requireApiAccess("candidate");
  if (!isApiAccess(access)) return accessResponse(access);
  const { cvId } = await params;
  const body = await request.json().catch(() => ({}));
  const title = escapePdf(String(body.fullName || "ProofyLink CV"));
  const text = `BT /F1 18 Tf 72 740 Td (${title}) Tj /F1 10 Tf 0 -28 Td (CV version ${escapePdf(cvId.slice(0, 8))} | Generated ${new Date().toISOString().slice(0, 10)}) Tj ET`;
  const pdf = `%PDF-1.4\n1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj\n2 0 obj<</Type /Pages /Kids [3 0 R] /Count 1>>endobj\n3 0 obj<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>>endobj\n4 0 obj<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>endobj\n5 0 obj<</Length ${text.length + 1}>>stream\n${text}\nendstream endobj\ntrailer<</Root 1 0 R>>\n%%EOF`;
   if (access.mode === "database") await writeAuditLog({ db: access.db, actorUserId: access.user.id, action: "cv.exported", entityType: "cv", entityId: /^[0-9a-f-]{36}$/i.test(cvId) ? cvId : null, metadata: { exportKind: "summary_pdf" } });
   return withAccessMode(new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="proofylink-${cvId.slice(0, 8)}.pdf"` } }), access);
}

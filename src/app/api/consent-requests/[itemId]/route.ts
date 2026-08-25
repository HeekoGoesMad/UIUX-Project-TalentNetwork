import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser } from "@/lib/api/auth";
import { ConsentService } from "@/lib/services/consent";

const decisionSchema = z.object({ decision: z.enum(["approved", "declined"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  if (!z.string().uuid().safeParse(itemId).success) {
    return NextResponse.json({ error: "Consent item ID tidak valid." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Decision harus approved atau declined." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    if (current.user.role !== "candidate") {
      return NextResponse.json({ error: "Hanya candidate yang dapat merespons consent." }, { status: 403 });
    }

    const result = await ConsentService.respondToConsent(current.db, {
      candidateUserId: current.user.id,
      itemId,
      decision: parsed.data.decision,
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

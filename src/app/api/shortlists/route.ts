import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ShortlistService } from "@/lib/services/shortlist";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ShortlistService.list(current.db, scope.membership.organizationId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = z
      .object({
        candidateProfileId: z.string().uuid(),
        shortlistId: z.string().uuid().optional(),
        notes: z.string().trim().max(2_000).optional(),
      })
      .safeParse(await request.json().catch(() => null));

    if (!parsed.success) return NextResponse.json({ error: "Candidate profile ID tidak valid." }, { status: 400 });

    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ShortlistService.addItem(current.db, {
      organizationId: scope.membership.organizationId,
      createdBy: current.user.id,
      candidateProfileId: parsed.data.candidateProfileId,
      shortlistId: parsed.data.shortlistId,
      notes: parsed.data.notes,
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = z
      .object({ itemId: z.string().uuid(), notes: z.string().trim().max(2_000) })
      .safeParse(await request.json().catch(() => null));

    if (!parsed.success) return NextResponse.json({ error: "Data catatan shortlist tidak valid." }, { status: 400 });

    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ShortlistService.updateNote(
      current.db,
      scope.membership.organizationId,
      parsed.data.itemId,
      parsed.data.notes
    );

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const parsed = z
      .object({ itemId: z.string().uuid() })
      .safeParse(await request.json().catch(() => null));

    if (!parsed.success) return NextResponse.json({ error: "Item shortlist tidak valid." }, { status: 400 });

    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ShortlistService.removeItem(
      current.db,
      scope.membership.organizationId,
      parsed.data.itemId
    );

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

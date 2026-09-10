import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ShortlistService } from "@/lib/services/shortlist";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paged = paginationSchema.safeParse({ page: url.searchParams.get("page") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    if (!paged.success) return NextResponse.json({ error: "Parameter pagination tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ShortlistService.list(current.db, scope.membership.organizationId, { page: paged.data.page, limit: paged.data.limit });
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

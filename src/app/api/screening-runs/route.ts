import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ScreeningService } from "@/lib/services/screening";

const startSchema = z.object({
  candidateProfileId: z.string().uuid(),
  consentRequestItemId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(8).max(200),
}).strict();

export async function POST(request: Request) {
  const payload = startSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Data mulai screening tidak valid." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ScreeningService.startRun(current.db, current.user, scope, {
      ...payload.data,
      idempotencyKey: `${scope.membership.organizationId}:${payload.data.idempotencyKey}`,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json(result, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    console.error("Gagal memulai screening", error);
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const candidateProfileId = new URL(request.url).searchParams.get("candidateProfileId");
  const candidateId = z.string().uuid().safeParse(candidateProfileId);
  if (!candidateId.success) {
    return NextResponse.json({ error: "Candidate profile ID tidak valid." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ScreeningService.getLatestRun(current.db, scope, candidateId.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ScreeningService } from "@/lib/services/screening";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!z.string().uuid().safeParse(runId).success) {
    return NextResponse.json({ error: "Screening run ID tidak valid." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const body = (await request.json().catch(() => ({}))) as { skills?: unknown };
    const requestSkills = z.array(z.string()).max(40).catch([]).parse(body.skills);

    const result = await ScreeningService.executeRunResult(
      current.db,
      current.user,
      scope,
      runId,
      requestSkills
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal memproses hasil screening run:", error);
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

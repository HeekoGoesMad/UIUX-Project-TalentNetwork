import { NextResponse } from "next/server";

import { getCurrentAppUser, getRecruiterScope, getRecruiterTokenAccount } from "@/lib/api/auth";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const token = await getRecruiterTokenAccount(current.db, scope.membership.organizationId);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

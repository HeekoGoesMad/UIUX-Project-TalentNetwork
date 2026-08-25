import { NextResponse } from "next/server";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ConsentService } from "@/lib/services/consent";

export async function getConsentRequests() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const isCandidate = current.user.role === "candidate";
    const scope = isCandidate ? null : await getRecruiterScope(current.db, current.user);
    if (scope && "error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ConsentService.getConsentRequests(current.db, current.user, scope);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

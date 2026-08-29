import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ConsentService } from "@/lib/services/consent";

const requestSchema = z.object({
  candidateProfileIds: z.array(z.string().uuid()).min(1).max(100),
  purpose: z.string().trim().min(1).max(500),
  message: z.string().trim().max(2_000).nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
}).superRefine((value, context) => {
  if (new Set(value.candidateProfileIds).size !== value.candidateProfileIds.length) {
    context.addIssue({ code: "custom", path: ["candidateProfileIds"], message: "Candidate profile IDs must be unique." });
  }
});

export async function GET() {
  try {
    const current = await getCurrentAppUser({ allowPending: true });
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const isCandidate = current.user.role === "candidate";
    const isPendingRecruiter = current.user.role === "recruiter" && current.user.recruiterProvisioningStatus !== "active";
    if (isPendingRecruiter) {
      return NextResponse.json({ requests: [] });
    }
    const scope = isCandidate ? null : await getRecruiterScope(current.db, current.user);
    if (scope && "error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ConsentService.getConsentRequests(current.db, current.user, scope);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data consent request tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await ConsentService.createBatch(current.db, {
      organizationId: scope.membership.organizationId,
      recruiterId: current.user.id,
      candidateProfileIds: parsed.data.candidateProfileIds,
      purpose: parsed.data.purpose,
      message: parsed.data.message,
      expiresAt: parsed.data.expiresAt,
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

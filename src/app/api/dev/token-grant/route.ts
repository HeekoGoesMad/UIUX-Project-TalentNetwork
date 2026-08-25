import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { TokenLedgerService } from "@/lib/services/token-ledger";

const grantSchema = z.object({
  amount: z.number().int().min(1).max(1000).default(25),
  idempotencyKey: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_TOKEN_GRANT_ENABLED !== "true") {
    return NextResponse.json({ error: "Development token grant tidak tersedia." }, { status: 404 });
  }

  const payload = grantSchema.safeParse(await request.json().catch(() => null) ?? {});
  if (!payload.success) return NextResponse.json({ error: "Grant token tidak valid." }, { status: 400 });

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const idempotencyKey = `dev-grant:${current.authUser.id}:${payload.data.idempotencyKey ?? "default"}`;
    const result = await TokenLedgerService.grant(current.db, {
      organizationId: scope.membership.organizationId,
      amount: payload.data.amount,
      idempotencyKey,
      metadata: { source: "development-token-grant", authUserId: current.authUser.id },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Development token grant failed", error);
    return NextResponse.json({ error: "Token grant belum dapat disimpan." }, { status: 503 });
  }
}

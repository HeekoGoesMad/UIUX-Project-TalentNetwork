import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";

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
    const result = await current.db.transaction(async (tx) => {
      const [account] = await tx.insert(schema.tokenAccounts)
        .values({ organizationId: scope.membership.organizationId })
        .onConflictDoNothing({ target: schema.tokenAccounts.organizationId })
        .returning({ id: schema.tokenAccounts.id });
      const accountId = account?.id ?? (await tx.select({ id: schema.tokenAccounts.id })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.organizationId, scope.membership.organizationId))
        .limit(1))[0]?.id;
      if (!accountId) throw new Error("TOKEN_ACCOUNT_MISSING");

      const [entry] = await tx.insert(schema.tokenLedgerEntries).values({
        tokenAccountId: accountId,
        type: "grant",
        amount: payload.data.amount,
        idempotencyKey,
        metadata: { source: "development-token-grant", authUserId: current.authUser.id },
      }).onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey }).returning({ id: schema.tokenLedgerEntries.id });

      if (entry) {
        await tx.update(schema.tokenAccounts)
          .set({ balance: sql`${schema.tokenAccounts.balance} + ${payload.data.amount}`, updatedAt: new Date() })
          .where(eq(schema.tokenAccounts.id, accountId));
      }

      const [updatedAccount] = await tx.select({ balance: schema.tokenAccounts.balance })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.id, accountId))
        .limit(1);
      return { balance: updatedAccount?.balance ?? 0, granted: Boolean(entry) };
    });

    return NextResponse.json({ ...result, idempotencyKey });
  } catch (error) {
    console.error("Development token grant failed", error);
    return NextResponse.json({ error: "Token grant belum dapat disimpan." }, { status: 503 });
  }
}

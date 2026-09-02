import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAppUser } from "@/lib/api/auth";

const grantSchema = z
  .object({
    organizationId: z.string().uuid(),
    amount: z.number().int().positive(),
    type: z.enum(["grant", "refund"]),
    reason: z.string().trim().min(1).max(500),
    idempotencyKey: z.string().trim().min(8).max(200),
  })
  .strict();

export async function GET() {
  try {
    const current = await getCurrentAppUser({ allowPending: true });
    const isProduction =
      process.env.NODE_ENV === "production" &&
      process.env.APP_ENV !== "development" &&
      process.env.NEXT_PUBLIC_DEMO_MODE !== "true";

    if (isProduction) {
      if ("error" in current) {
        return NextResponse.json({ error: current.error }, { status: current.status });
      }
      if (current.user.role !== "admin") {
        return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
      }
    }

    const db = "error" in current ? (await import("@/db")).getDb() : current.db;

    // Ambil token accounts beserta data organisasi
    const orgAccounts = await db
      .select({
        organizationId: schema.organizations.id,
        organizationName: schema.organizations.name,
        subscriptionTier: schema.organizations.subscriptionTier,
        tokenAccountId: schema.tokenAccounts.id,
        currentBalance: schema.tokenAccounts.balance,
      })
      .from(schema.organizations)
      .leftJoin(schema.tokenAccounts, eq(schema.tokenAccounts.organizationId, schema.organizations.id))
      .orderBy(desc(schema.organizations.createdAt));

    const accounts = await Promise.all(
      orgAccounts.map(async (row) => {
        const accountId = row.tokenAccountId;

        let totalPurchased = 0;
        let totalUsed = 0;
        let talentUnlockUsed = 0;
        let financialScreeningUsed = 0;
        const expiredTokens = 0;

        if (accountId) {
          // Ambil entri ledger
          const entries = await db
            .select()
            .from(schema.tokenLedgerEntries)
            .where(eq(schema.tokenLedgerEntries.tokenAccountId, accountId));

          for (const e of entries) {
            if (e.type === "grant") {
              totalPurchased += e.amount;
            } else if (e.type === "charge") {
              const absAmount = Math.abs(e.amount);
              totalUsed += absAmount;
              if (e.screeningRunId) {
                financialScreeningUsed += absAmount;
              } else {
                talentUnlockUsed += absAmount;
              }
            }
          }
        }

        return {
          organizationId: row.organizationId,
          organizationName: row.organizationName,
          subscriptionTier: row.subscriptionTier || "trial",
          totalPurchased,
          currentBalance: row.currentBalance ?? 0,
          totalUsed,
          talentUnlockUsed,
          financialScreeningUsed,
          expiredTokens,
        };
      })
    );

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Tokens GET error:", error);
    return NextResponse.json({ error: "Data pemantauan token belum tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentAppUser({ allowPending: true });
    const isProduction =
      process.env.NODE_ENV === "production" &&
      process.env.APP_ENV !== "development" &&
      process.env.NEXT_PUBLIC_DEMO_MODE !== "true";

    if (isProduction) {
      if ("error" in current) {
        return NextResponse.json({ error: current.error }, { status: current.status });
      }
      if (current.user.role !== "admin") {
        return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
      }
    }

    const parsed = grantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Penyesuaian token tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = "error" in current ? (await import("@/db")).getDb() : current.db;
    const actorUserId = "error" in current ? parsed.data.organizationId : current.user.id;

    const [account] = await db
      .insert(schema.tokenAccounts)
      .values({ organizationId: parsed.data.organizationId })
      .onConflictDoUpdate({
        target: schema.tokenAccounts.organizationId,
        set: { updatedAt: new Date() },
      })
      .returning();

    const signedAmount = parsed.data.type === "grant" ? parsed.data.amount : -parsed.data.amount;
    if (signedAmount < 0 && account.balance < parsed.data.amount) {
      return NextResponse.json({ error: "Saldo token tidak cukup untuk pengurangan." }, { status: 409 });
    }

    const [entry] = await db
      .insert(schema.tokenLedgerEntries)
      .values({
        tokenAccountId: account.id,
        type: parsed.data.type,
        amount: signedAmount,
        idempotencyKey: `admin:${parsed.data.idempotencyKey}`,
        metadata: { reason: parsed.data.reason, actorUserId },
      })
      .onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey })
      .returning();

    const newBalance = account.balance + (entry ? signedAmount : 0);
    if (entry) {
      await db
        .update(schema.tokenAccounts)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(schema.tokenAccounts.id, account.id));
    }

    await writeAuditLog({
      db,
      actorUserId,
      organizationId: parsed.data.organizationId,
      action: `admin.tokens.${parsed.data.type}`,
      entityType: "token_account",
      entityId: account.id,
      metadata: {
        amount: parsed.data.amount,
        reason: parsed.data.reason,
        idempotencyKey: parsed.data.idempotencyKey,
      },
    });

    return NextResponse.json(
      { entry: entry ?? { idempotent: true }, balance: newBalance },
      { status: entry ? 201 : 200 }
    );
  } catch (error) {
    console.error("Token POST error:", error);
    return NextResponse.json({ error: "Operasi token gagal." }, { status: 503 });
  }
}

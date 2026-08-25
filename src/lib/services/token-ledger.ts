import "server-only";

import { eq, sql } from "drizzle-orm";
import { schema, type Database } from "@/db";

export class TokenLedgerService {
  /**
   * Retrieve the token account for an organization.
   */
  static async getAccount(db: Database, organizationId: string) {
    const [account] = await db
      .select({
        id: schema.tokenAccounts.id,
        balance: schema.tokenAccounts.balance,
        updatedAt: schema.tokenAccounts.updatedAt,
      })
      .from(schema.tokenAccounts)
      .where(eq(schema.tokenAccounts.organizationId, organizationId))
      .limit(1);

    return {
      accountId: account?.id ?? null,
      balance: account?.balance ?? 0,
      updatedAt: account?.updatedAt ?? null,
    };
  }

  /**
   * Execute a token grant with idempotency.
   */
  static async grant(
    db: Database,
    params: {
      organizationId: string;
      amount: number;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return db.transaction(async (tx) => {
      const [account] = await tx
        .insert(schema.tokenAccounts)
        .values({ organizationId: params.organizationId })
        .onConflictDoNothing({ target: schema.tokenAccounts.organizationId })
        .returning({ id: schema.tokenAccounts.id });

      const accountId =
        account?.id ??
        (
          await tx
            .select({ id: schema.tokenAccounts.id })
            .from(schema.tokenAccounts)
            .where(eq(schema.tokenAccounts.organizationId, params.organizationId))
            .limit(1)
        )[0]?.id;

      if (!accountId) throw new Error("TOKEN_ACCOUNT_MISSING");

      const [entry] = await tx
        .insert(schema.tokenLedgerEntries)
        .values({
          tokenAccountId: accountId,
          type: "grant",
          amount: params.amount,
          idempotencyKey: params.idempotencyKey,
          metadata: params.metadata ?? {},
        })
        .onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey })
        .returning({ id: schema.tokenLedgerEntries.id });

      if (entry) {
        await tx
          .update(schema.tokenAccounts)
          .set({
            balance: sql`${schema.tokenAccounts.balance} + ${params.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.tokenAccounts.id, accountId));
      }

      const [updatedAccount] = await tx
        .select({ balance: schema.tokenAccounts.balance })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.id, accountId))
        .limit(1);

      return {
        balance: updatedAccount?.balance ?? 0,
        granted: Boolean(entry),
        idempotencyKey: params.idempotencyKey,
      };
    });
  }

  /**
   * Execute a token refund when a screening run fails.
   */
  static async refund(
    db: Database,
    params: {
      organizationId: string;
      amount: number;
      idempotencyKey: string;
      screeningRunId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return db.transaction(async (tx) => {
      const [account] = await tx
        .select({ id: schema.tokenAccounts.id })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.organizationId, params.organizationId))
        .limit(1);

      if (!account) throw new Error("Akun token organisasi tidak ditemukan saat refund.");

      const [refundEntry] = await tx
        .insert(schema.tokenLedgerEntries)
        .values({
          tokenAccountId: account.id,
          type: "refund",
          amount: params.amount,
          idempotencyKey: params.idempotencyKey,
          screeningRunId: params.screeningRunId ?? null,
          metadata: params.metadata ?? {},
        })
        .onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey })
        .returning({ id: schema.tokenLedgerEntries.id });

      if (refundEntry) {
        await tx
          .update(schema.tokenAccounts)
          .set({
            balance: sql`${schema.tokenAccounts.balance} + ${params.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.tokenAccounts.id, account.id));
      }

      return { refunded: true };
    });
  }
}

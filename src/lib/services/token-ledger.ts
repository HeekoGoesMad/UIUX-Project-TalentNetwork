import "server-only";

import { and, eq, sql } from "drizzle-orm";
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
   * Execute a token charge with idempotency and balance validation.
   */
  static async charge(
    db: Database,
    params: {
      organizationId: string;
      amount: number;
      idempotencyKey: string;
      screeningRunId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const chargeAmount = params.amount > 0 ? -params.amount : params.amount;
    const absAmount = Math.abs(chargeAmount);

    return db.transaction(async (tx) => {
      const [account] = await tx
        .select({ id: schema.tokenAccounts.id, balance: schema.tokenAccounts.balance })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.organizationId, params.organizationId))
        .limit(1);

      if (!account) {
        return { error: "Akun token organisasi belum tersedia.", status: 409 as const };
      }

      if (account.balance < absAmount) {
        return { error: "Token screening organisasi tidak mencukupi.", status: 402 as const };
      }

      const [ledger] = await tx
        .insert(schema.tokenLedgerEntries)
        .values({
          tokenAccountId: account.id,
          type: "charge",
          amount: chargeAmount,
          idempotencyKey: params.idempotencyKey,
          screeningRunId: params.screeningRunId ?? null,
          metadata: params.metadata ?? {},
        })
        .onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey })
        .returning({ id: schema.tokenLedgerEntries.id });

      if (!ledger) {
        // Idempotent hit: entry already exists
        const [existing] = await tx
          .select({
            id: schema.tokenLedgerEntries.id,
            screeningRunId: schema.tokenLedgerEntries.screeningRunId,
          })
          .from(schema.tokenLedgerEntries)
          .where(eq(schema.tokenLedgerEntries.idempotencyKey, params.idempotencyKey))
          .limit(1);

        return {
          idempotent: true,
          ledgerId: existing?.id,
          screeningRunId: existing?.screeningRunId,
          balance: account.balance,
        };
      }

      const [charged] = await tx
        .update(schema.tokenAccounts)
        .set({
          balance: sql`${schema.tokenAccounts.balance} - ${absAmount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.tokenAccounts.id, account.id), sql`${schema.tokenAccounts.balance} >= ${absAmount}`))
        .returning({ balance: schema.tokenAccounts.balance });

      if (!charged) {
        await tx.delete(schema.tokenLedgerEntries).where(eq(schema.tokenLedgerEntries.id, ledger.id));
        return { error: "Token screening organisasi tidak mencukupi.", status: 402 as const };
      }

      return {
        idempotent: false,
        ledgerId: ledger.id,
        balance: charged.balance,
      };
    });
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

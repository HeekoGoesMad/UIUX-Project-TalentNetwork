import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { schema, type Database } from "@/db";
import type { AppUser } from "@/lib/api/auth";
import { TokenLedgerService } from "./token-ledger";
import { screening, summary } from "@/lib/ai/provider";

export class ScreeningService {
  /**
   * Start a new screening run after verifying consent and charging tokens.
   */
  static async startRun(
    db: Database,
    user: AppUser,
    scope: { membership: { organizationId: string } },
    params: {
      candidateProfileId: string;
      consentRequestItemId: string;
      idempotencyKey: string;
    }
  ) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const [consent] = await tx
        .select({
          itemId: schema.consentRequestItems.id,
          status: schema.consentRequestItems.status,
          candidateProfileId: schema.consentRequestItems.candidateProfileId,
          expiresAt: schema.consentRequestBatches.expiresAt,
        })
        .from(schema.consentRequestItems)
        .innerJoin(
          schema.consentRequestBatches,
          eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId)
        )
        .where(
          and(
            eq(schema.consentRequestItems.id, params.consentRequestItemId),
            eq(schema.consentRequestItems.candidateProfileId, params.candidateProfileId),
            eq(schema.consentRequestBatches.organizationId, scope.membership.organizationId),
            eq(schema.consentRequestItems.status, "approved"),
            sql`(${schema.consentRequestBatches.expiresAt} is null or ${schema.consentRequestBatches.expiresAt} > ${now})`
          )
        )
        .limit(1);

      if (!consent) {
        return { error: "Consent kandidat belum disetujui atau sudah kedaluwarsa.", status: 403 as const };
      }

      const [account] = await tx
        .select({ id: schema.tokenAccounts.id })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.organizationId, scope.membership.organizationId))
        .limit(1);

      if (!account) {
        return { error: "Akun token organisasi belum tersedia.", status: 409 as const };
      }

      const runId = crypto.randomUUID();
      const [run] = await tx
        .insert(schema.screeningRuns)
        .values({
          id: runId,
          organizationId: scope.membership.organizationId,
          candidateProfileId: consent.candidateProfileId,
          consentRequestItemId: consent.itemId,
          requestedBy: user.id,
          status: "in_progress",
          tokenCost: 1,
          startedAt: now,
        })
        .returning({ id: schema.screeningRuns.id, status: schema.screeningRuns.status });

      const [ledger] = await tx
        .insert(schema.tokenLedgerEntries)
        .values({
          tokenAccountId: account.id,
          type: "charge",
          amount: -1,
          idempotencyKey: params.idempotencyKey,
          screeningRunId: run.id,
          metadata: {
            candidateProfileId: consent.candidateProfileId,
            consentRequestItemId: consent.itemId,
          },
        })
        .onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey })
        .returning({ id: schema.tokenLedgerEntries.id });

      if (!ledger) {
        await tx.delete(schema.screeningRuns).where(eq(schema.screeningRuns.id, run.id));
        const [existing] = await tx
          .select({ runId: schema.tokenLedgerEntries.screeningRunId })
          .from(schema.tokenLedgerEntries)
          .where(eq(schema.tokenLedgerEntries.idempotencyKey, params.idempotencyKey))
          .limit(1);

        const existingRunId = existing?.runId;
        if (!existingRunId) return { error: "Charge token tidak konsisten.", status: 409 as const };

        const [existingRun] = await tx
          .select({ id: schema.screeningRuns.id, status: schema.screeningRuns.status })
          .from(schema.screeningRuns)
          .where(eq(schema.screeningRuns.id, existingRunId))
          .limit(1);

        return {
          runId: existingRun?.id ?? existingRunId,
          runStatus: existingRun?.status ?? ("in_progress" as const),
          idempotent: true,
        };
      }

      const [charged] = await tx
        .update(schema.tokenAccounts)
        .set({ balance: sql`${schema.tokenAccounts.balance} - 1`, updatedAt: now })
        .where(and(eq(schema.tokenAccounts.id, account.id), sql`${schema.tokenAccounts.balance} > 0`))
        .returning({ balance: schema.tokenAccounts.balance });

      if (!charged) {
        await tx.delete(schema.tokenLedgerEntries).where(eq(schema.tokenLedgerEntries.id, ledger.id));
        await tx.delete(schema.screeningRuns).where(eq(schema.screeningRuns.id, run.id));
        return { error: "Token screening organisasi tidak mencukupi.", status: 402 as const };
      }

      return { runId: run.id, runStatus: run.status, balance: charged.balance, idempotent: false };
    });
  }

  /**
   * Get the latest screening run and score for a candidate.
   */
  static async getLatestRun(
    db: Database,
    scope: { membership: { organizationId: string } },
    candidateProfileId: string
  ) {
    const [run] = await db
      .select({
        id: schema.screeningRuns.id,
        status: schema.screeningRuns.status,
        startedAt: schema.screeningRuns.startedAt,
        completedAt: schema.screeningRuns.completedAt,
        score: schema.screeningScores,
      })
      .from(schema.screeningRuns)
      .leftJoin(
        schema.screeningScores,
        eq(schema.screeningScores.screeningRunId, schema.screeningRuns.id)
      )
      .where(
        and(
          eq(schema.screeningRuns.organizationId, scope.membership.organizationId),
          eq(schema.screeningRuns.candidateProfileId, candidateProfileId)
        )
      )
      .orderBy(sql`${schema.screeningRuns.createdAt} desc`)
      .limit(1);

    return { run: run ?? null };
  }

  /**
   * Execute screening result generation with non-blocking AI computation.
   */
  static async executeRunResult(
    db: Database,
    user: AppUser,
    scope: { membership: { organizationId: string } },
    runId: string,
    fallbackSkills?: string[]
  ) {
    // Step 1: Read Context
    const [run] = await db
      .select({
        id: schema.screeningRuns.id,
        organizationId: schema.screeningRuns.organizationId,
        candidateProfileId: schema.screeningRuns.candidateProfileId,
        status: schema.screeningRuns.status,
        tokenCost: schema.screeningRuns.tokenCost,
      })
      .from(schema.screeningRuns)
      .where(
        and(
          eq(schema.screeningRuns.id, runId),
          eq(schema.screeningRuns.organizationId, scope.membership.organizationId)
        )
      )
      .limit(1);

    if (!run) {
      return { error: "Screening run tidak ditemukan.", status: 404 as const };
    }

    const [profile] = await db
      .select({
        headline: schema.candidateProfiles.headline,
        summary: schema.candidateProfiles.summary,
        targetRole: schema.candidateProfiles.targetRole,
        location: schema.candidateProfiles.location,
      })
      .from(schema.candidateProfiles)
      .where(eq(schema.candidateProfiles.id, run.candidateProfileId))
      .limit(1);

    if (!profile) {
      return { error: "Profile kandidat tidak ditemukan.", status: 404 as const };
    }

    const sections = await db
      .select({ content: schema.candidateProfileSections.content })
      .from(schema.candidateProfileSections)
      .where(
        and(
          eq(schema.candidateProfileSections.candidateProfileId, run.candidateProfileId),
          eq(schema.candidateProfileSections.type, "skills")
        )
      )
      .limit(1);

    const storedSkills = sections[0]?.content.items;
    const skills = Array.isArray(storedSkills)
      ? storedSkills.filter((item): item is string => typeof item === "string").slice(0, 40)
      : Array.isArray(fallbackSkills)
      ? fallbackSkills.slice(0, 40)
      : [];

    const input = {
      headline: profile.headline ?? "",
      about: profile.summary ?? "",
      targetRole: profile.targetRole ?? "",
      location: profile.location ?? "",
      skills,
    };

    const [storedScore] = await db
      .select()
      .from(schema.screeningScores)
      .where(eq(schema.screeningScores.screeningRunId, run.id))
      .limit(1);

    if (storedScore) {
      const aiSummary = await summary(input, { strict: true });
      return { run, score: storedScore, aiSummary };
    }

    if (run.status !== "in_progress" && run.status !== "pending") {
      return { error: "Screening run tidak dapat diproses ulang.", status: 409 as const };
    }

    // Step 2: Execute LLM Outside of DB Transaction
    let insight: Awaited<ReturnType<typeof screening>>;
    let aiSummary: Awaited<ReturnType<typeof summary>>;

    try {
      [insight, aiSummary] = await Promise.all([
        screening(input, { strict: true }),
        summary(input, { strict: true }),
      ]);
    } catch (aiError) {
      console.error("Gagal memproses AI screening/summary:", aiError);

      try {
        await db.transaction(async (tx) => {
          await tx
            .update(schema.screeningRuns)
            .set({
              status: "failed",
              errorMessage: aiError instanceof Error ? aiError.message : "Hasil screening gagal dibuat oleh AI.",
            })
            .where(
              and(
                eq(schema.screeningRuns.id, run.id),
                sql`${schema.screeningRuns.status} in ('pending', 'in_progress')`
              )
            );
        });

        await TokenLedgerService.refund(db, {
          organizationId: run.organizationId,
          amount: run.tokenCost,
          idempotencyKey: `screening-refund:${run.id}`,
          screeningRunId: run.id,
          metadata: { reason: "screening_ai_failed" },
        });
      } catch (refundError) {
        console.error("Gagal mengembalikan token screening:", refundError);
      }

      return {
        error: "Screening gagal diproses oleh AI. Token telah dikembalikan ke akun Anda.",
        status: 502 as const,
      };
    }

    // Step 3: Fast Atomic Completion
    return db.transaction(async (tx) => {
      const [currentRun] = await tx
        .select({ id: schema.screeningRuns.id, status: schema.screeningRuns.status })
        .from(schema.screeningRuns)
        .where(
          and(
            eq(schema.screeningRuns.id, run.id),
            sql`${schema.screeningRuns.status} in ('pending', 'in_progress')`
          )
        )
        .limit(1);

      if (!currentRun) {
        const [existingScore] = await tx
          .select()
          .from(schema.screeningScores)
          .where(eq(schema.screeningScores.screeningRunId, run.id))
          .limit(1);

        if (existingScore) {
          return { run: { ...run, status: "completed" as const }, score: existingScore, aiSummary };
        }
        return { error: "Status screening run telah berubah.", status: 409 as const };
      }

      const [score] = await tx
        .insert(schema.screeningScores)
        .values({
          screeningRunId: run.id,
          score: insight.score,
          label: insight.label,
          coverage: insight.coverage,
          evidence: insight.evidence,
          limitations: insight.limitations,
          source: insight.source,
          modelVersion: insight.modelVersion,
        })
        .onConflictDoUpdate({
          target: schema.screeningScores.screeningRunId,
          set: {
            score: insight.score,
            label: insight.label,
            coverage: insight.coverage,
            evidence: insight.evidence,
            limitations: insight.limitations,
            source: insight.source,
            modelVersion: insight.modelVersion,
          },
        })
        .returning();

      await tx
        .update(schema.screeningRuns)
        .set({
          status: "completed",
          completedAt: new Date(),
          errorMessage: null,
        })
        .where(eq(schema.screeningRuns.id, run.id));

      return { run: { ...run, status: "completed" as const }, score, aiSummary };
    });
  }
}

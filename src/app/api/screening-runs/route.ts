import { NextResponse } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";

const startSchema = z.object({
  candidateProfileId: z.string().uuid(),
  consentRequestItemId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(8).max(200),
}).strict();

export async function POST(request: Request) {
  const payload = startSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Data mulai screening tidak valid." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await current.db.transaction(async (tx) => {
      const now = new Date();
      const [consent] = await tx.select({
        itemId: schema.consentRequestItems.id,
        status: schema.consentRequestItems.status,
        candidateProfileId: schema.consentRequestItems.candidateProfileId,
        expiresAt: schema.consentRequestBatches.expiresAt,
      }).from(schema.consentRequestItems)
        .innerJoin(schema.consentRequestBatches, eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId))
        .where(and(
          eq(schema.consentRequestItems.id, payload.data.consentRequestItemId),
          eq(schema.consentRequestItems.candidateProfileId, payload.data.candidateProfileId),
          eq(schema.consentRequestBatches.organizationId, scope.membership.organizationId),
          eq(schema.consentRequestItems.status, "approved"),
          sql`(${schema.consentRequestBatches.expiresAt} is null or ${schema.consentRequestBatches.expiresAt} > ${now})`,
        )).limit(1);
      if (!consent) return { error: "Consent kandidat belum disetujui atau sudah kedaluwarsa.", status: 403 as const };

      const [account] = await tx.select({ id: schema.tokenAccounts.id })
        .from(schema.tokenAccounts)
        .where(eq(schema.tokenAccounts.organizationId, scope.membership.organizationId))
        .limit(1);
      if (!account) return { error: "Akun token organisasi belum tersedia.", status: 409 as const };

      const runId = crypto.randomUUID();
      const [run] = await tx.insert(schema.screeningRuns).values({
        id: runId,
        organizationId: scope.membership.organizationId,
        candidateProfileId: consent.candidateProfileId,
        consentRequestItemId: consent.itemId,
        requestedBy: current.user.id,
        status: "in_progress",
        tokenCost: 1,
        startedAt: now,
      }).returning({ id: schema.screeningRuns.id, status: schema.screeningRuns.status, tokenCost: schema.screeningRuns.tokenCost, candidateProfileId: schema.screeningRuns.candidateProfileId });

      const [ledger] = await tx.insert(schema.tokenLedgerEntries).values({
        tokenAccountId: account.id,
        type: "charge",
        amount: -1,
        idempotencyKey: payload.data.idempotencyKey,
        screeningRunId: run.id,
        metadata: { candidateProfileId: consent.candidateProfileId, consentRequestItemId: consent.itemId },
      }).onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey }).returning({ id: schema.tokenLedgerEntries.id });

      if (!ledger) {
        await tx.delete(schema.screeningRuns).where(eq(schema.screeningRuns.id, run.id));
        const [existing] = await tx.select({ runId: schema.tokenLedgerEntries.screeningRunId })
          .from(schema.tokenLedgerEntries)
          .where(eq(schema.tokenLedgerEntries.idempotencyKey, payload.data.idempotencyKey)).limit(1);
        const existingRunId = existing?.runId;
        if (!existingRunId) return { error: "Charge token tidak konsisten.", status: 409 as const };
        const [existingRun] = await tx.select({ id: schema.screeningRuns.id, status: schema.screeningRuns.status })
          .from(schema.screeningRuns).where(eq(schema.screeningRuns.id, existingRunId)).limit(1);
        return { runId: existingRun?.id ?? existingRunId, runStatus: existingRun?.status ?? "in_progress" as const, idempotent: true };
      }

      const [charged] = await tx.update(schema.tokenAccounts)
        .set({ balance: sql`${schema.tokenAccounts.balance} - 1`, updatedAt: now })
        .where(and(eq(schema.tokenAccounts.id, account.id), gt(schema.tokenAccounts.balance, 0)))
        .returning({ balance: schema.tokenAccounts.balance });
      if (!charged) {
        await tx.delete(schema.tokenLedgerEntries).where(eq(schema.tokenLedgerEntries.id, ledger.id));
        await tx.delete(schema.screeningRuns).where(eq(schema.screeningRuns.id, run.id));
        return { error: "Token screening organisasi tidak mencukupi.", status: 402 as const };
      }

      await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: scope.membership.organizationId, action: "token.charge", entityType: "token_ledger_entry", entityId: ledger.id, metadata: { amount: 1, screeningRunId: run.id } });
      await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: scope.membership.organizationId, action: "screening.started", entityType: "screening_run", entityId: run.id, metadata: { tokenCost: run.tokenCost, candidateProfileId: run.candidateProfileId } });

      return { runId: run.id, runStatus: run.status, balance: charged.balance, idempotent: false };
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    console.error("Gagal memulai screening", error);
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const candidateProfileId = new URL(request.url).searchParams.get("candidateProfileId");
  const candidateId = z.string().uuid().safeParse(candidateProfileId);
  if (!candidateId.success) {
    return NextResponse.json({ error: "Candidate profile ID tidak valid." }, { status: 400 });
  }
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const [run] = await current.db.select({
      id: schema.screeningRuns.id,
      status: schema.screeningRuns.status,
      startedAt: schema.screeningRuns.startedAt,
      completedAt: schema.screeningRuns.completedAt,
      score: schema.screeningScores,
    }).from(schema.screeningRuns)
      .leftJoin(schema.screeningScores, eq(schema.screeningScores.screeningRunId, schema.screeningRuns.id))
      .where(and(eq(schema.screeningRuns.organizationId, scope.membership.organizationId), eq(schema.screeningRuns.candidateProfileId, candidateId.data)))
      .orderBy(sql`${schema.screeningRuns.createdAt} desc`).limit(1);
    return NextResponse.json({ run: run ?? null });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

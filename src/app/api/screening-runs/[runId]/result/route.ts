import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { schema } from "@/db";
import { screening, summary } from "@/lib/ai/provider";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!z.string().uuid().safeParse(runId).success) {
    return NextResponse.json({ error: "Screening run ID tidak valid." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    // Step 1: Read Screening Run and Candidate Context (No Long-Lived Database Transaction)
    const [run] = await current.db
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
      return NextResponse.json({ error: "Screening run tidak ditemukan." }, { status: 404 });
    }

    const [profile] = await current.db
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
      return NextResponse.json({ error: "Profile kandidat tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const sections = await current.db
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
    const requestSkills = z.array(z.string()).max(40).catch([]).parse((body as { skills?: unknown }).skills);
    const skills = Array.isArray(storedSkills)
      ? storedSkills.filter((item): item is string => typeof item === "string").slice(0, 40)
      : requestSkills;

    const input = {
      headline: profile.headline ?? "",
      about: profile.summary ?? "",
      targetRole: profile.targetRole ?? "",
      location: profile.location ?? "",
      skills,
    };

    // Check if score already exists (idempotent retrieval)
    const [storedScore] = await current.db
      .select()
      .from(schema.screeningScores)
      .where(eq(schema.screeningScores.screeningRunId, run.id))
      .limit(1);

    if (storedScore) {
      const aiSummary = await summary(input, { strict: true });
      return NextResponse.json({ run, score: storedScore, aiSummary });
    }

    if (run.status !== "in_progress" && run.status !== "pending") {
      return NextResponse.json({ error: "Screening run tidak dapat diproses ulang." }, { status: 409 });
    }

    // Step 2: Execute LLM Calls OUTSIDE of Database Transactions
    let insight: Awaited<ReturnType<typeof screening>>;
    let aiSummary: Awaited<ReturnType<typeof summary>>;

    try {
      [insight, aiSummary] = await Promise.all([
        screening(input, { strict: true }),
        summary(input, { strict: true }),
      ]);
    } catch (aiError) {
      console.error("Gagal memproses AI screening/summary:", aiError);

      // Trigger atomic refund and update run status to failed in a short micro-transaction
      let refunded = false;
      try {
        refunded = (
          await current.db.transaction(async (tx) => {
            const [activeRun] = await tx
              .select({
                id: schema.screeningRuns.id,
                organizationId: schema.screeningRuns.organizationId,
                tokenCost: schema.screeningRuns.tokenCost,
                status: schema.screeningRuns.status,
              })
              .from(schema.screeningRuns)
              .where(
                and(
                  eq(schema.screeningRuns.id, runId),
                  eq(schema.screeningRuns.organizationId, scope.membership.organizationId)
                )
              )
              .limit(1);

            if (!activeRun || activeRun.status === "completed" || activeRun.status === "failed") {
              return { refunded: false };
            }

            await tx
              .update(schema.screeningRuns)
              .set({
                status: "failed",
                errorMessage: aiError instanceof Error ? aiError.message : "Hasil screening gagal dibuat oleh AI.",
              })
              .where(
                and(
                  eq(schema.screeningRuns.id, activeRun.id),
                  sql`${schema.screeningRuns.status} in ('pending', 'in_progress')`
                )
              );

            const [account] = await tx
              .select({ id: schema.tokenAccounts.id })
              .from(schema.tokenAccounts)
              .where(eq(schema.tokenAccounts.organizationId, activeRun.organizationId))
              .limit(1);

            if (!account) throw new Error("Akun token organisasi tidak ditemukan saat refund.");

            const [refund] = await tx
              .insert(schema.tokenLedgerEntries)
              .values({
                tokenAccountId: account.id,
                type: "refund",
                amount: activeRun.tokenCost,
                idempotencyKey: `screening-refund:${activeRun.id}`,
                metadata: { screeningRunId: activeRun.id, reason: "screening_ai_failed" },
              })
              .onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey })
              .returning({ id: schema.tokenLedgerEntries.id });

            if (refund) {
              await tx
                .update(schema.tokenAccounts)
                .set({
                  balance: sql`${schema.tokenAccounts.balance} + ${activeRun.tokenCost}`,
                  updatedAt: new Date(),
                })
                .where(eq(schema.tokenAccounts.id, account.id));
            }

            return { refunded: true };
          })
        ).refunded;
      } catch (refundError) {
        console.error("Gagal mengembalikan token screening:", refundError);
        return NextResponse.json(
          { error: "Screening gagal dan token belum dapat dikembalikan. Silakan coba lagi." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: refunded
            ? "Screening gagal diproses oleh AI. Token telah dikembalikan ke akun Anda."
            : "Hasil screening belum dapat disiapkan. Silakan coba lagi.",
        },
        { status: 502 }
      );
    }

    // Step 3: Fast Atomic Completion (< 5ms database transaction)
    const result = await current.db.transaction(async (tx) => {
      // Re-verify run status optimistically
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

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal memproses hasil screening run:", error);
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

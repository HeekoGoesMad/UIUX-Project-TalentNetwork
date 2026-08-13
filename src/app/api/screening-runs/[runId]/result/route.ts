import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { schema } from "@/db";
import { screening, summary } from "@/lib/ai/provider";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!z.string().uuid().safeParse(runId).success) return NextResponse.json({ error: "Screening run ID tidak valid." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const result = await current.db.transaction(async (tx) => {
      const [run] = await tx.select({
        id: schema.screeningRuns.id,
        status: schema.screeningRuns.status,
        candidateProfileId: schema.screeningRuns.candidateProfileId,
      }).from(schema.screeningRuns).where(and(eq(schema.screeningRuns.id, runId), eq(schema.screeningRuns.organizationId, scope.membership.organizationId))).limit(1);
      if (!run) return { error: "Screening run tidak ditemukan.", status: 404 as const };
      const [profile] = await tx.select({ headline: schema.candidateProfiles.headline, summary: schema.candidateProfiles.summary, targetRole: schema.candidateProfiles.targetRole, location: schema.candidateProfiles.location })
        .from(schema.candidateProfiles).where(eq(schema.candidateProfiles.id, run.candidateProfileId)).limit(1);
      if (!profile) return { error: "Profile kandidat tidak ditemukan.", status: 404 as const };
      const body = await request.json().catch(() => ({}));
      const sections = await tx.select({ content: schema.candidateProfileSections.content })
        .from(schema.candidateProfileSections)
        .where(and(eq(schema.candidateProfileSections.candidateProfileId, run.candidateProfileId), eq(schema.candidateProfileSections.type, "skills")))
        .limit(1);
      const storedSkills = sections[0]?.content.items;
      const requestSkills = z.array(z.string()).max(40).catch([]).parse((body as { skills?: unknown }).skills);
      const skills = Array.isArray(storedSkills) ? storedSkills.filter((item): item is string => typeof item === "string").slice(0, 40) : requestSkills;
      const input = { headline: profile.headline ?? "", about: profile.summary ?? "", targetRole: profile.targetRole ?? "", location: profile.location ?? "", skills };
      const [stored] = await tx.select().from(schema.screeningScores).where(eq(schema.screeningScores.screeningRunId, run.id)).limit(1);
      if (stored) {
        const aiSummary = await summary(input, { strict: true });
        return { run, score: stored, aiSummary };
      }
      if (run.status !== "in_progress" && run.status !== "pending") return { error: "Screening run tidak dapat diproses ulang.", status: 409 as const };
      const [insight, aiSummary] = await Promise.all([screening(input, { strict: true }), summary(input, { strict: true })]);
      const [score] = await tx.insert(schema.screeningScores).values({ screeningRunId: run.id, score: insight.score, label: insight.label, coverage: insight.coverage, evidence: insight.evidence, limitations: insight.limitations, source: insight.source, modelVersion: insight.modelVersion }).returning();
      await tx.update(schema.screeningRuns).set({ status: "completed", completedAt: new Date(), errorMessage: null }).where(eq(schema.screeningRuns.id, run.id));
      return { run: { ...run, status: "completed" as const }, score, aiSummary };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal menyimpan hasil screening", error);
    return NextResponse.json({ error: "Hasil screening belum dapat disimpan." }, { status: 503 });
  }
}

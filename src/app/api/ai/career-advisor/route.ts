import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { schema } from "@/db";
import { careerAdvisor } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";
import { checkCareerAdvisorCooldown } from "@/lib/career-advisor/cooldown";
import type { CareerAdvisorSavedResult } from "@/types";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth({ allowedRoles: ["candidate"] });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data profil tidak valid." }, { status: 400 });
    }

    const focus = typeof body.focus === "string" ? body.focus : "cv_review";
    const isDev = process.env.NODE_ENV !== "production" || auth.context.isDevBypass;
    const allowDevForce = isDev && Boolean(body.devForce);

    // Check existing cooldown if user and db are available
    let existingPreferences: Record<string, unknown> = {};
    let candidateProfileId: string | null = null;

    if (auth.context.user && auth.context.db) {
      const db = auth.context.db;
      const [candidateProfile] = await db
        .select()
        .from(schema.candidateProfiles)
        .where(eq(schema.candidateProfiles.userId, auth.context.user.id))
        .limit(1);

      if (candidateProfile) {
        candidateProfileId = candidateProfile.id;
        const [preferencesSection] = await db
          .select()
          .from(schema.candidateProfileSections)
          .where(
            and(
              eq(schema.candidateProfileSections.candidateProfileId, candidateProfile.id),
              eq(schema.candidateProfileSections.type, "preferences")
            )
          )
          .limit(1);

        if (preferencesSection && preferencesSection.content && typeof preferencesSection.content === "object") {
          existingPreferences = preferencesSection.content as Record<string, unknown>;
          const existingAdvisorResults = (existingPreferences.careerAdvisorResults as Record<string, CareerAdvisorSavedResult> | undefined) || {};
          const lastRecord = existingAdvisorResults[focus];

          if (lastRecord?.generatedAt && !allowDevForce) {
            const cooldown = checkCareerAdvisorCooldown(lastRecord.generatedAt);
            if (cooldown.isCooldown) {
              return NextResponse.json(
                {
                  error: `Batas analisis tercapai untuk pilar ini. Anda dapat menganalisis ulang pada ${cooldown.nextAvailableFormatted} (${cooldown.daysRemaining} hari lagi).`,
                  cooldownUntil: cooldown.nextAvailableDate?.toISOString(),
                  cooldownActive: true,
                },
                { status: 429 }
              );
            }
          }
        }
      }
    }

    // Call AI Provider
    const result = await careerAdvisor(body);

    // Directly persist generated output in candidateProfileSections
    let savedRecord: CareerAdvisorSavedResult | undefined;
    if (auth.context.user && auth.context.db) {
      try {
        const db = auth.context.db;
        if (!candidateProfileId) {
          const [newProfile] = await db
            .insert(schema.candidateProfiles)
            .values({
              userId: auth.context.user.id,
              headline: typeof body.headline === "string" ? body.headline : null,
              targetRole: typeof body.targetRole === "string" ? body.targetRole : null,
            })
            .returning({ id: schema.candidateProfiles.id });
          if (newProfile) candidateProfileId = newProfile.id;
        }

        if (candidateProfileId) {
          const existingAdvisorResults = (existingPreferences.careerAdvisorResults as Record<string, CareerAdvisorSavedResult> | undefined) || {};
          const currentCount = existingAdvisorResults[focus]?.analysisCount || 0;

          savedRecord = {
            result,
            generatedAt: new Date().toISOString(),
            targetRole: typeof body.targetRole === "string" ? body.targetRole : undefined,
            analysisCount: currentCount + 1,
            ...(typeof body.consultationTopic === "string" && body.consultationTopic !== "Semua Fokus" ? { topic: body.consultationTopic } : {}),
            ...(typeof body.consultationQuestion === "string" && body.consultationQuestion.trim() ? { question: body.consultationQuestion.trim() } : {}),
          };

          const updatedPreferences = {
            ...existingPreferences,
            careerAdvisorResults: {
              ...existingAdvisorResults,
              [focus]: savedRecord,
            },
          };

          const now = new Date();
          await db
            .insert(schema.candidateProfileSections)
            .values({
              candidateProfileId,
              type: "preferences",
              content: updatedPreferences,
              sortOrder: 0,
            })
            .onConflictDoUpdate({
              target: [
                schema.candidateProfileSections.candidateProfileId,
                schema.candidateProfileSections.type,
              ],
              set: { content: updatedPreferences, updatedAt: now },
            });
        }
      } catch (saveError) {
        console.warn("[career-advisor] Auto-save database error (non-fatal):", saveError);
      }
    }

    return NextResponse.json({
      ...result,
      _savedRecord: savedRecord,
    });
  } catch (error) {
    console.error("Gagal memproses rekomendasi karier AI:", error);
    const message = error instanceof Error ? error.message : "Fitur AI belum dapat diproses. Coba lagi nanti.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

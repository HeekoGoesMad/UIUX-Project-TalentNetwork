import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { schema } from "@/db";
import { careerAdvisor } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";
import {
  acquireConcurrencyLock,
  releaseConcurrencyLock,
  enforceRateLimit,
  RATE_LIMITS,
} from "@/lib/api/rate-limit";
import type { CareerAdvisorSavedResult } from "@/types";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth({ allowedRoles: ["candidate"] });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.context.user?.id || "anonymous-candidate";
  const concurrencyKey = `career-hub:concurrency:${userId}`;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data profil tidak valid." }, { status: 400 });
    }

    const focus = typeof body.focus === "string" ? body.focus : "cv_review";
    const isDev = process.env.NODE_ENV !== "production" || auth.context.isDevBypass;
    const allowDevForce = isDev && Boolean(body.devForce);

    // ─── LAYER 1: CONCURRENT JOBS LOCK (1 active job per user) ───
    if (!allowDevForce && !acquireConcurrencyLock(concurrencyKey)) {
      return NextResponse.json(
        {
          error: "Analisis AI Anda sedang diproses. Mohon tunggu beberapa saat hingga selesai sebelum memulai analisis baru.",
          isConcurrentBusy: true,
        },
        { status: 409 }
      );
    }

    try {
      // ─── LAYER 2: BURST LIMIT (3 requests / 30 minutes) ───
      if (!allowDevForce) {
        const burstCheck = enforceRateLimit(
          `career-hub:burst:${userId}`,
          RATE_LIMITS.careerHubBurst.limit,
          RATE_LIMITS.careerHubBurst.windowMs
        );
        if (!burstCheck.allowed) {
          const minutesRemaining = Math.max(1, Math.ceil(burstCheck.retryAfterSeconds / 60));
          return NextResponse.json(
            {
              error: `Batas analisis cepat tercapai (${RATE_LIMITS.careerHubBurst.limit}x dalam 30 menit). Luangkan waktu untuk mengimplementasikan saran pada profil Anda sebelum menganalisis ulang (tersedia kembali dalam ${minutesRemaining} menit).`,
              rateLimited: true,
              limitType: "burst",
              retryAfterSeconds: burstCheck.retryAfterSeconds,
            },
            {
              status: 429,
              headers: { "Retry-After": String(burstCheck.retryAfterSeconds) },
            }
          );
        }
      }

      // ─── LAYER 3: DAILY LIMIT (10 requests / 24 hours) ───
      if (!allowDevForce) {
        const dailyCheck = enforceRateLimit(
          `career-hub:daily:${userId}`,
          RATE_LIMITS.careerHubDaily.limit,
          RATE_LIMITS.careerHubDaily.windowMs
        );
        if (!dailyCheck.allowed) {
          const hoursRemaining = Math.max(1, Math.ceil(dailyCheck.retryAfterSeconds / 3600));
          return NextResponse.json(
            {
              error: `Batas harian analisis (${RATE_LIMITS.careerHubDaily.limit}x per hari) telah tercapai. Kuota analisis harian Anda akan direset dalam ${hoursRemaining} jam.`,
              rateLimited: true,
              limitType: "daily",
              retryAfterSeconds: dailyCheck.retryAfterSeconds,
            },
            {
              status: 429,
              headers: { "Retry-After": String(dailyCheck.retryAfterSeconds) },
            }
          );
        }
      }

      // ─── LAYER 4: EXECUTE AI WITH 4K OUTPUT TOKEN CAP ───
      const result = await careerAdvisor(body, { maxTokens: 4000 });

      // Directly persist generated output in candidateProfileSections
      let savedRecord: CareerAdvisorSavedResult | undefined;
      if (auth.context.user && auth.context.db) {
        try {
          const db = auth.context.db;
          let candidateProfileId: string | null = null;

          const [candidateProfile] = await db
            .select()
            .from(schema.candidateProfiles)
            .where(eq(schema.candidateProfiles.userId, auth.context.user.id))
            .limit(1);

          if (candidateProfile) {
            candidateProfileId = candidateProfile.id;
          } else {
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
            let existingPreferences: Record<string, unknown> = {};
            const [preferencesSection] = await db
              .select()
              .from(schema.candidateProfileSections)
              .where(
                and(
                  eq(schema.candidateProfileSections.candidateProfileId, candidateProfileId),
                  eq(schema.candidateProfileSections.type, "preferences")
                )
              )
              .limit(1);

            if (preferencesSection && preferencesSection.content && typeof preferencesSection.content === "object") {
              existingPreferences = preferencesSection.content as Record<string, unknown>;
            }

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
    } finally {
      // Release concurrency lock when execution finishes or throws
      if (!allowDevForce) {
        releaseConcurrencyLock(concurrencyKey);
      }
    }
  } catch (error) {
    console.error("Gagal memproses rekomendasi karier AI:", error);
    const message = error instanceof Error ? error.message : "Fitur AI belum dapat diproses. Coba lagi nanti.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


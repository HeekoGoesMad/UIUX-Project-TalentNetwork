import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { respondToOffer } from "@/lib/services/recruiter-hiring";

const updateOfferSchema = z.object({
  status: z.enum(["accepted", "declined", "withdrawn", "expired"]),
  reason: z.string().trim().max(1000).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  try {
    const { offerId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const [offer] = await current.db
      .select({
        offer: schema.offers,
        jobTitle: schema.jobs.title,
        organizationName: schema.organizations.name,
        candidateName: schema.profiles.displayName,
      })
      .from(schema.offers)
      .innerJoin(schema.applications, eq(schema.applications.id, schema.offers.applicationId))
      .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.offers.organizationId))
      .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(eq(schema.offers.id, offerId))
      .limit(1);

    if (!offer) {
      return NextResponse.json({ error: "Penawaran tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Get offer error:", error);
    return NextResponse.json({ error: "Gagal memuat penawaran." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  try {
    const { offerId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const body = await request.json().catch(() => null);
    const parsed = updateOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data respons tidak valid." }, { status: 400 });
    }

    if (parsed.data.status === "accepted" || parsed.data.status === "declined") {
      const updated = await respondToOffer(current.db, {
        offerId,
        status: parsed.data.status,
        actorUserId: current.user.id,
        isCandidate: current.user.role === "candidate",
        reason: parsed.data.reason,
      });

      return NextResponse.json({ offer: updated });
    }

    // Direct status update (e.g. withdrawn by recruiter)
    const [updated] = await current.db
      .update(schema.offers)
      .set({
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.offers.id, offerId))
      .returning();

    return NextResponse.json({ offer: updated });
  } catch (error) {
    console.error("Update offer error:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui status penawaran.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

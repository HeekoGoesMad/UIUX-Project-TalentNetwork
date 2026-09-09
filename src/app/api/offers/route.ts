import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { createOffer, listOffersForOrganization } from "@/lib/services/recruiter-hiring";

const createOfferSchema = z
  .object({
    applicationId: z.string().uuid().optional(),
    candidateProfileId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    status: z.enum(["draft", "sent"]).optional(),
    terms: z.object({
      salary: z.string().trim().min(1, "Besaran gaji wajib diisi."),
      currency: z.string().trim().default("IDR"),
      benefits: z.string().trim().optional(),
      employmentType: z.string().trim().optional(),
      startDate: z.string().trim().optional(),
      notes: z.string().trim().optional(),
    }),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Format batas waktu tidak valid.").optional(),
  })
  .refine((data) => Boolean(data.applicationId || data.candidateProfileId), {
    message: "applicationId atau candidateProfileId wajib diberikan.",
  });

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const url = new URL(request.url);
    const applicationId = url.searchParams.get("applicationId") ?? undefined;

    const offers = await listOffersForOrganization(current.db, scope.membership.organizationId, {
      applicationId,
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("List offers error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar penawaran." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const body = await request.json().catch(() => null);
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data penawaran tidak valid." }, { status: 400 });
    }

    const offer = await createOffer(current.db, {
      applicationId: parsed.data.applicationId,
      candidateProfileId: parsed.data.candidateProfileId,
      jobId: parsed.data.jobId,
      organizationId: scope.membership.organizationId,
      recruiterUserId: current.user.id,
      status: parsed.data.status ?? "sent",
      terms: parsed.data.terms,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("Create offer error:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat penawaran kerja.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { listInterviewsForOrganization, scheduleInterview } from "@/lib/services/recruiter-hiring";

const createInterviewSchema = z
  .object({
    applicationId: z.string().uuid().optional(),
    candidateProfileId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    title: z.string().trim().min(3, "Judul wawancara minimal 3 karakter.").max(200),
    scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Format tanggal wawancara tidak valid."),
    durationMinutes: z.number().int().min(15).max(240).optional(),
    timezone: z.string().trim().max(50).optional(),
    meetingUrl: z.string().trim().max(500).optional(),
    panelMemberUserIds: z.array(z.string().uuid()).optional(),
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
    const limit = Number(url.searchParams.get("limit")) || 50;

    const interviews = await listInterviewsForOrganization(current.db, scope.membership.organizationId, {
      applicationId,
      limit,
    });

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("List interviews error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar wawancara." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const body = await request.json().catch(() => null);
    const parsed = createInterviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data jadwal tidak valid." }, { status: 400 });
    }

    const interview = await scheduleInterview(current.db, {
      applicationId: parsed.data.applicationId,
      candidateProfileId: parsed.data.candidateProfileId,
      jobId: parsed.data.jobId,
      organizationId: scope.membership.organizationId,
      recruiterUserId: current.user.id,
      title: parsed.data.title,
      scheduledAt: new Date(parsed.data.scheduledAt),
      durationMinutes: parsed.data.durationMinutes,
      timezone: parsed.data.timezone,
      meetingUrl: parsed.data.meetingUrl,
      panelMemberUserIds: parsed.data.panelMemberUserIds,
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    console.error("Schedule interview error:", error);
    const message = error instanceof Error ? error.message : "Gagal menjadwalkan wawancara.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

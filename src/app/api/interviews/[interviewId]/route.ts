import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import {
  deleteInterview,
  getInterviewById,
  respondToInterviewAsCandidate,
  updateInterview,
} from "@/lib/services/recruiter-hiring";

const updateSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled", "confirmed", "reschedule_requested", "declined"]).optional(),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Format tanggal tidak valid.").optional(),
  durationMinutes: z.number().int().min(15).max(240).optional(),
  timezone: z.string().trim().max(50).optional(),
  meetingUrl: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(1000).optional(),
});

const candidateActionSchema = z.object({
  action: z.enum(["confirm", "reschedule", "decline"]).optional(),
  status: z.enum(["confirmed", "reschedule_requested", "declined"]).optional(),
  rescheduleProposedDate: z.string().trim().max(100).optional(),
  rescheduleReason: z.string().trim().max(1000).optional(),
  declineReason: z.string().trim().max(1000).optional(),
  cancellationReason: z.string().trim().max(1000).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const { interviewId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = current.user.role === "recruiter" ? await getRecruiterScope(current.db, current.user) : null;
    if (scope && "error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const interview = await getInterviewById(
      current.db,
      interviewId,
      scope && "membership" in scope ? scope.membership.organizationId : undefined
    );

    if (!interview) {
      return NextResponse.json({ error: "Wawancara tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("Get interview error:", error);
    return NextResponse.json({ error: "Gagal memuat data wawancara." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const { interviewId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    if (current.user.role === "candidate") {
      const body = await request.json().catch(() => null);
      const parsed = candidateActionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Aksi wawancara kandidat tidak valid." },
          { status: 400 }
        );
      }

      const action =
        parsed.data.action ||
        (parsed.data.status === "confirmed"
          ? "confirm"
          : parsed.data.status === "reschedule_requested"
          ? "reschedule"
          : "decline");

      const updated = await respondToInterviewAsCandidate(current.db, {
        interviewId,
        candidateUserId: current.user.id,
        action,
        rescheduleProposedDate: parsed.data.rescheduleProposedDate,
        rescheduleReason: parsed.data.rescheduleReason,
        declineReason: parsed.data.declineReason || parsed.data.cancellationReason,
      });

      return NextResponse.json({ interview: updated });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data update tidak valid." }, { status: 400 });
    }

    const updated = await updateInterview(current.db, {
      interviewId,
      organizationId: scope.membership.organizationId,
      actorUserId: current.user.id,
      status: parsed.data.status,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      durationMinutes: parsed.data.durationMinutes,
      timezone: parsed.data.timezone,
      meetingUrl: parsed.data.meetingUrl,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ interview: updated });
  } catch (error) {
    console.error("Update interview error:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui wawancara.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const { interviewId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    await deleteInterview(current.db, {
      interviewId,
      organizationId: scope.membership.organizationId,
      actorUserId: current.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete interview error:", error);
    const message = error instanceof Error ? error.message : "Gagal menghapus wawancara.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


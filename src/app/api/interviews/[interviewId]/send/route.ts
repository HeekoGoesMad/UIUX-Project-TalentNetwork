import { NextResponse } from "next/server";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { sendInterviewInvitation } from "@/lib/services/recruiter-hiring";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ interviewId: string }> }
) {
  try {
    const { interviewId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const result = await sendInterviewInvitation(current.db, {
      interviewId,
      organizationId: scope.membership.organizationId,
      recruiterUserId: current.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Send interview invitation error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengirim undangan wawancara.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

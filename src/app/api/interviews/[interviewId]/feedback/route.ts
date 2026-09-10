import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { submitInterviewFeedback } from "@/lib/services/recruiter-hiring";

const feedbackSchema = z.object({
  recommendation: z.enum(["strong_yes", "yes", "mixed", "no", "strong_no"]).optional(),
  overallScore: z.number().int().min(0).max(100).optional(),
  comments: z.string().trim().max(5000).optional(),
  ratings: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const { interviewId } = await params;
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const body = await request.json().catch(() => null);
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data feedback tidak valid." }, { status: 400 });
    }

    const result = await submitInterviewFeedback(current.db, {
      interviewId,
      reviewerUserId: current.user.id,
      recommendation: parsed.data.recommendation,
      overallScore: parsed.data.overallScore,
      comments: parsed.data.comments,
      ratings: parsed.data.ratings,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Submit feedback error:", error);
    const message = error instanceof Error ? error.message : "Gagal menyimpan feedback wawancara.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

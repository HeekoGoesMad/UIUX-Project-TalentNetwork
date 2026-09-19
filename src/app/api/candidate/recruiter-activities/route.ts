import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { INITIAL_DEMO_ACTIVITIES } from "@/lib/recruiter-activity";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      // In dev or unauthenticated demo fallback, return structured seed data
      return NextResponse.json({ activities: INITIAL_DEMO_ACTIVITIES });
    }

    if (current.user.role !== "candidate") {
      return NextResponse.json({ activities: [] });
    }

    // Attempt to locate candidate profile
    const [candidateProfile] = await current.db
      .select({ id: schema.candidateProfiles.id })
      .from(schema.candidateProfiles)
      .where(eq(schema.candidateProfiles.userId, current.user.id))
      .limit(1);

    if (!candidateProfile) {
      return NextResponse.json({ activities: INITIAL_DEMO_ACTIVITIES });
    }

    // In a live system, we can aggregate actual interviews and shortlist items
    const rawInterviews = await current.db
      .select({
        id: schema.interviews.id,
        title: schema.interviews.title,
        status: schema.interviews.status,
        scheduledAt: schema.interviews.scheduledAt,
        durationMinutes: schema.interviews.durationMinutes,
        meetingUrl: schema.interviews.meetingUrl,
        createdAt: schema.interviews.createdAt,
        organizationName: schema.organizations.name,
        organizationIndustry: schema.organizations.industry,
      })
      .from(schema.interviews)
      .innerJoin(schema.applications, eq(schema.applications.id, schema.interviews.applicationId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.interviews.organizationId))
      .where(eq(schema.applications.candidateProfileId, candidateProfile.id))
      .orderBy(desc(schema.interviews.createdAt))
      .limit(20);

    const interviewActivities = rawInterviews.map((item) => ({
      id: `live-int-${item.id}`,
      type: "interview_invited" as const,
      companyName: item.organizationName,
      companyInitial: item.organizationName.slice(0, 3).toUpperCase(),
      companyIndustry: item.organizationIndustry ?? "Perusahaan Mitra",
      recruiterName: "Hiring Team",
      recruiterRole: "Talent Acquisition",
      title: item.title,
      snippet: `Jadwal wawancara pada ${new Date(item.scheduledAt).toLocaleString("id-ID")}.`,
      metadata: {
        scheduledAt: item.scheduledAt.toISOString(),
        durationMinutes: item.durationMinutes ?? 45,
        meetingType: item.meetingUrl ? ("online" as const) : ("offline" as const),
        meetingUrl: item.meetingUrl ?? undefined,
      },
      createdAt: item.createdAt.toISOString(),
      isRead: false,
      actionUrl: "/candidate/messages",
    }));

    const combined = [...interviewActivities, ...INITIAL_DEMO_ACTIVITIES.filter((a) => a.type !== "interview_invited")];
    return NextResponse.json({ activities: combined });
  } catch (error) {
    console.error("Failed to load recruiter activities", error);
    return NextResponse.json({ activities: INITIAL_DEMO_ACTIVITIES });
  }
}

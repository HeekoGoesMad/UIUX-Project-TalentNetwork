import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { MessagingService } from "@/lib/services/messaging";

const createConversationSchema = z.object({
  candidateProfileId: z.string().uuid(),
  consentRequestItemId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const limitParam = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const result = await MessagingService.listConversations(current.db, current.user.id, limitParam);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Candidate profile ID tidak valid." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const result = current.user.role === "candidate"
      ? parsed.data.consentRequestItemId
        ? await MessagingService.createOrGetConversationForCandidate(
          current.db,
          current.user.id,
          parsed.data.candidateProfileId,
          parsed.data.consentRequestItemId
        )
        : { error: "Consent request item diperlukan untuk membuka percakapan.", status: 400 as const }
      : await (async () => {
        const scope = await getRecruiterScope(current.db, current.user);
        if ("error" in scope) return scope;
        return MessagingService.createOrGetConversation(
          current.db,
          current.user,
          scope,
          parsed.data.candidateProfileId
        );
      })();

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result, { status: result.reused ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

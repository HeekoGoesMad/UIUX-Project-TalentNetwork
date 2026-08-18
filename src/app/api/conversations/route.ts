import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";

const createConversationSchema = z.object({
  candidateProfileId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const limitValue = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 50;
    const rows = await current.db.select({
      id: schema.conversations.id,
      organizationId: schema.conversations.organizationId,
      status: schema.conversations.status,
      createdAt: schema.conversations.createdAt,
      updatedAt: schema.conversations.updatedAt,
      participantId: schema.conversationParticipants.userId,
      participantName: schema.profiles.displayName,
      participantAvatarUrl: schema.profiles.avatarUrl,
      participantEmail: schema.users.email,
    })
      .from(schema.conversationParticipants)
      .innerJoin(schema.conversations, eq(schema.conversations.id, schema.conversationParticipants.conversationId))
      .innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.conversationParticipants.userId))
      .where(and(eq(schema.conversationParticipants.userId, current.user.id), isNull(schema.conversationParticipants.leftAt)))
      .orderBy(desc(schema.conversations.updatedAt))
      .limit(limit);

    const conversations = await Promise.all(rows.map(async (row) => {
      const participants = await current.db.select({
        id: schema.conversationParticipants.userId,
        name: schema.profiles.displayName,
        avatarUrl: schema.profiles.avatarUrl,
        email: schema.users.email,
      })
        .from(schema.conversationParticipants)
        .innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId))
        .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.conversationParticipants.userId))
        .where(and(eq(schema.conversationParticipants.conversationId, row.id), isNull(schema.conversationParticipants.leftAt)));
      const [lastMessage] = await current.db.select({
        id: schema.messages.id,
        body: schema.messages.body,
        senderId: schema.messages.senderId,
        createdAt: schema.messages.createdAt,
      })
        .from(schema.messages)
        .where(and(eq(schema.messages.conversationId, row.id), isNull(schema.messages.deletedAt)))
        .orderBy(desc(schema.messages.createdAt))
        .limit(1);
      return { ...row, participants, lastMessage: lastMessage ?? null };
    }));

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 }); }
  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Candidate profile ID tidak valid." }, { status: 400 });

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const [approved] = await current.db.select({
      candidateUserId: schema.candidateProfiles.userId,
      organizationId: schema.consentRequestBatches.organizationId,
      consentRequestItemId: schema.consentRequestItems.id,
    })
      .from(schema.consentRequestItems)
      .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.consentRequestItems.candidateProfileId))
      .innerJoin(schema.consentRequestBatches, eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId))
      .where(and(
        eq(schema.consentRequestItems.candidateProfileId, parsed.data.candidateProfileId),
        eq(schema.consentRequestItems.status, "approved"),
        eq(schema.consentRequestBatches.organizationId, scope.membership.organizationId),
      ))
      .limit(1);
    if (!approved) return NextResponse.json({ error: "Percakapan hanya dapat dibuat setelah consent disetujui." }, { status: 403 });

    const recruiterConversations = await current.db.select({ id: schema.conversations.id })
      .from(schema.conversations)
      .innerJoin(schema.conversationParticipants, eq(schema.conversationParticipants.conversationId, schema.conversations.id))
      .where(and(
        eq(schema.conversations.organizationId, approved.organizationId),
        eq(schema.conversationParticipants.userId, current.user.id),
        eq(schema.conversations.status, "active"),
       ));
    for (const conversation of recruiterConversations) {
      const [candidateParticipant] = await current.db.select({ id: schema.conversationParticipants.id })
        .from(schema.conversationParticipants)
        .where(and(
          eq(schema.conversationParticipants.conversationId, conversation.id),
          eq(schema.conversationParticipants.userId, approved.candidateUserId),
          isNull(schema.conversationParticipants.leftAt),
        )).limit(1);
      if (candidateParticipant) return NextResponse.json({ conversationId: conversation.id, reused: true });
    }

    const result = await current.db.transaction(async (tx) => {
      const [conversation] = await tx.insert(schema.conversations).values({
        organizationId: approved.organizationId,
        createdBy: current.user.id,
        consentRequestItemId: approved.consentRequestItemId,
        retentionExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      }).returning({ id: schema.conversations.id });
      await tx.insert(schema.conversationParticipants).values([
        { conversationId: conversation.id, userId: current.user.id },
        { conversationId: conversation.id, userId: approved.candidateUserId },
      ]);
      return conversation;
    });
    return NextResponse.json({ conversationId: result.id, reused: false }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

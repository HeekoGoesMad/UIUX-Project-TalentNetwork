import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { schema, type Database } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4_000),
});

async function getParticipant(db: Database, conversationId: string, userId: string) {
  const [participant] = await db.select({ id: schema.conversationParticipants.id, status: schema.conversations.status })
    .from(schema.conversationParticipants)
    .innerJoin(schema.conversations, eq(schema.conversations.id, schema.conversationParticipants.conversationId))
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId), isNull(schema.conversationParticipants.leftAt)))
    .limit(1);
  return participant;
}

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const conversationId = new URL(request.url).searchParams.get("conversationId");
    if (!conversationId || !z.string().uuid().safeParse(conversationId).success) return NextResponse.json({ error: "Conversation ID tidak valid." }, { status: 400 });
    if (!await getParticipant(current.db, conversationId, current.user.id)) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    const messages = await current.db.select({
      id: schema.messages.id,
      conversationId: schema.messages.conversationId,
      senderId: schema.messages.senderId,
      senderName: schema.profiles.displayName,
      isMine: eq(schema.messages.senderId, current.user.id),
      body: schema.messages.body,
      createdAt: schema.messages.createdAt,
      editedAt: schema.messages.editedAt,
    }).from(schema.messages)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.messages.senderId))
      .where(and(eq(schema.messages.conversationId, conversationId), isNull(schema.messages.deletedAt)))
      .orderBy(asc(schema.messages.createdAt));
    return NextResponse.json({ messages });
  } catch { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 }); }
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Pesan harus diisi dan maksimal 4.000 karakter." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const participant = await getParticipant(current.db, parsed.data.conversationId, current.user.id);
    if (!participant) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    if (participant.status !== "active") return NextResponse.json({ error: "Percakapan ini tidak lagi aktif." }, { status: 409 });

    const result = await current.db.transaction(async (tx) => {
      const [message] = await tx.insert(schema.messages).values({ conversationId: parsed.data.conversationId, senderId: current.user.id, body: parsed.data.body }).returning();
      await tx.update(schema.conversations).set({ updatedAt: new Date() }).where(eq(schema.conversations.id, parsed.data.conversationId));
      const recipients = await tx.select({ userId: schema.conversationParticipants.userId })
        .from(schema.conversationParticipants)
        .where(and(eq(schema.conversationParticipants.conversationId, parsed.data.conversationId), isNull(schema.conversationParticipants.leftAt)));
      const otherRecipients = recipients.filter((recipient) => recipient.userId !== current.user.id);
      if (otherRecipients.length) await tx.insert(schema.notifications).values(otherRecipients.map((recipient) => ({
        userId: recipient.userId,
        type: "message_received" as const,
        title: "Pesan baru",
        body: parsed.data.body.length > 120 ? `${parsed.data.body.slice(0, 117)}...` : parsed.data.body,
        data: { conversationId: parsed.data.conversationId, messageId: message.id },
      })));
      return message;
    });
    return NextResponse.json({ message: { ...result, isMine: true }, }, { status: 201 });
  } catch { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
}

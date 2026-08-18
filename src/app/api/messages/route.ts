import { NextResponse } from "next/server";
import { and, desc, eq, isNull, lt, ne } from "drizzle-orm";
import { z } from "zod";

import { schema, type Database } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4_000),
  attachment: z.object({ name: z.string().trim().min(1).max(255), mimeType: z.string().trim().max(120), size: z.number().int().positive().max(25_000_000) }).optional(),
});

export async function getParticipant(db: Database, conversationId: string, userId: string) {
  const [participant] = await db.select({ id: schema.conversationParticipants.id, status: schema.conversations.status, retentionExpiresAt: schema.conversations.retentionExpiresAt, consentStatus: schema.consentRequestItems.status })
    .from(schema.conversationParticipants)
    .innerJoin(schema.conversations, eq(schema.conversations.id, schema.conversationParticipants.conversationId))
    .leftJoin(schema.consentRequestItems, eq(schema.consentRequestItems.id, schema.conversations.consentRequestItemId))
    .where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId), isNull(schema.conversationParticipants.leftAt)))
    .limit(1);
  return participant;
}

function expired(retentionExpiresAt: Date | null) { return Boolean(retentionExpiresAt && retentionExpiresAt.getTime() <= Date.now()); }

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const params = new URL(request.url).searchParams;
    const conversationId = params.get("conversationId");
    if (!conversationId || !z.string().uuid().safeParse(conversationId).success) return NextResponse.json({ error: "Conversation ID tidak valid." }, { status: 400 });
    const participant = await getParticipant(current.db, conversationId, current.user.id);
    if (!participant) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    if (expired(participant.retentionExpiresAt) || (participant.consentStatus && participant.consentStatus !== "approved")) return NextResponse.json({ error: "Akses percakapan tidak lagi tersedia karena consent atau masa penyimpanan berakhir." }, { status: 410 });
    const [peer] = await current.db.select({ lastReadAt: schema.conversationParticipants.lastReadAt }).from(schema.conversationParticipants).where(and(eq(schema.conversationParticipants.conversationId, conversationId), ne(schema.conversationParticipants.userId, current.user.id))).limit(1);
    const limitValue = Number(params.get("limit") ?? 30);
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 30;
    const cursor = params.get("before");
    const conditions = [eq(schema.messages.conversationId, conversationId), isNull(schema.messages.deletedAt)];
    if (cursor) conditions.push(lt(schema.messages.createdAt, new Date(cursor)));
    const rows = await current.db.select({
      id: schema.messages.id, conversationId: schema.messages.conversationId, senderId: schema.messages.senderId,
      senderName: schema.profiles.displayName, isMine: eq(schema.messages.senderId, current.user.id), body: schema.messages.body,
      createdAt: schema.messages.createdAt, editedAt: schema.messages.editedAt, attachmentName: schema.messages.attachmentName,
      attachmentMimeType: schema.messages.attachmentMimeType, attachmentSize: schema.messages.attachmentSize,
      attachmentScanStatus: schema.messages.attachmentScanStatus,
    }).from(schema.messages).leftJoin(schema.profiles, eq(schema.profiles.userId, schema.messages.senderId))
      .where(and(...conditions)).orderBy(desc(schema.messages.createdAt)).limit(limit + 1);
    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit).reverse();
    return NextResponse.json({ messages, readAt: peer?.lastReadAt ?? null, hasMore, nextCursor: hasMore ? messages[0]?.createdAt : null });
  } catch { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 }); }
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Pesan harus diisi dan lampiran harus berupa metadata yang valid." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const participant = await getParticipant(current.db, parsed.data.conversationId, current.user.id);
    if (!participant) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    if (expired(participant.retentionExpiresAt) || (participant.consentStatus && participant.consentStatus !== "approved")) return NextResponse.json({ error: "Akses percakapan tidak lagi tersedia karena consent atau masa penyimpanan berakhir." }, { status: 410 });
    if (participant.status !== "active") return NextResponse.json({ error: "Percakapan ini tidak lagi aktif." }, { status: 409 });
    const attachment = parsed.data.attachment;
    const result = await current.db.transaction(async (tx) => {
      const [message] = await tx.insert(schema.messages).values({ conversationId: parsed.data.conversationId, senderId: current.user.id, body: parsed.data.body, attachmentName: attachment?.name ?? null, attachmentMimeType: attachment?.mimeType ?? null, attachmentSize: attachment?.size ?? null, attachmentScanStatus: attachment ? "pending" : "not_applicable" }).returning();
      await tx.update(schema.conversations).set({ updatedAt: new Date() }).where(eq(schema.conversations.id, parsed.data.conversationId));
      const recipients = await tx.select({ userId: schema.conversationParticipants.userId }).from(schema.conversationParticipants).where(and(eq(schema.conversationParticipants.conversationId, parsed.data.conversationId), isNull(schema.conversationParticipants.leftAt)));
      const otherRecipients = recipients.filter((recipient) => recipient.userId !== current.user.id);
      if (otherRecipients.length) await tx.insert(schema.notifications).values(otherRecipients.map((recipient) => ({ userId: recipient.userId, type: "message_received" as const, title: "Pesan baru", body: parsed.data.body.slice(0, 120), data: { conversationId: parsed.data.conversationId, messageId: message.id } })));
      return message;
    });
    return NextResponse.json({ message: { ...result, isMine: true, senderName: current.user.email } }, { status: 201 });
  } catch { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
}

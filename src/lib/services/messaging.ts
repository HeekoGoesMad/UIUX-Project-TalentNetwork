import "server-only";

import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { schema, type Database } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import type { AppUser } from "@/lib/api/auth";

function encodeMessageCursor(createdAt: Date | string, id: string): string {
  const c = (createdAt instanceof Date ? createdAt : new Date(createdAt)).toISOString();
  return Buffer.from(JSON.stringify({ c, id }), "utf8").toString("base64url");
}

function decodeMessageCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const { c, id } = parsed as { c?: unknown; id?: unknown };
    if (typeof c !== "string" || typeof id !== "string" || id.length === 0) return null;
    const createdAt = new Date(c);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

export class MessagingService {
  /**
   * List conversations for a user, fetching participants and last messages in batched queries.
   */
  static async listConversations(db: Database, userId: string, limitValue = 50) {
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 100) : 50;

    const rows = await db
      .select({
        id: schema.conversations.id,
        organizationId: schema.conversations.organizationId,
        status: schema.conversations.status,
        createdAt: schema.conversations.createdAt,
        updatedAt: schema.conversations.updatedAt,
      })
      .from(schema.conversationParticipants)
      .innerJoin(
        schema.conversations,
        eq(schema.conversations.id, schema.conversationParticipants.conversationId)
      )
      .where(
        and(
          eq(schema.conversationParticipants.userId, userId),
          isNull(schema.conversationParticipants.leftAt)
        )
      )
      .orderBy(desc(schema.conversations.updatedAt))
      .limit(limit);

    if (rows.length === 0) {
      return { conversations: [] };
    }

    const conversationIds = rows.map((row) => row.id);

    // Single query: Batch fetch all participants for all retrieved conversations
    const allParticipants = await db
      .select({
        conversationId: schema.conversationParticipants.conversationId,
        id: schema.conversationParticipants.userId,
        name: schema.profiles.displayName,
        avatarUrl: schema.profiles.avatarUrl,
        email: schema.users.email,
      })
      .from(schema.conversationParticipants)
      .innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.conversationParticipants.userId))
      .where(
        and(
          inArray(schema.conversationParticipants.conversationId, conversationIds),
          isNull(schema.conversationParticipants.leftAt)
        )
      );

    // Single bounded query: newest non-deleted message per conversation
    // (DISTINCT ON returns at most one row per conversation in the page).
    const idList = sql.join(
      conversationIds.map((id) => sql`${id}`),
      sql`, `
    );
    const latestMessages = (await db.execute(sql`
      SELECT DISTINCT ON (m."conversation_id")
        m."id" AS "id",
        m."conversation_id" AS "conversationId",
        m."body" AS "body",
        m."sender_id" AS "senderId",
        m."created_at" AS "createdAt"
      FROM "messages" m
      WHERE m."conversation_id" IN (${idList}) AND m."deleted_at" IS NULL
      ORDER BY m."conversation_id", m."created_at" DESC, m."id" DESC
    `)) as unknown as {
      id: string;
      conversationId: string;
      body: string;
      senderId: string;
      createdAt: Date;
    }[];
    const latestByConversation = new Map(latestMessages.map((m) => [m.conversationId, m]));

    // Map participants and latest message to each conversation in memory
    const conversations = rows.map((row) => {
      const participants = allParticipants.filter((p) => p.conversationId === row.id);
      const lastMessage = latestByConversation.get(row.id) ?? null;
      return {
        ...row,
        participants,
        lastMessage,
      };
    });

    return { conversations };
  }

  /**
   * Create a new conversation or return an existing active conversation.
   */
  static async createOrGetConversation(
    db: Database,
    user: AppUser,
    scope: { membership: { organizationId: string } },
    candidateProfileId: string
  ) {
    const [approved] = await db
      .select({
        candidateUserId: schema.candidateProfiles.userId,
        organizationId: schema.consentRequestBatches.organizationId,
      })
      .from(schema.consentRequestItems)
      .innerJoin(
        schema.candidateProfiles,
        eq(schema.candidateProfiles.id, schema.consentRequestItems.candidateProfileId)
      )
      .innerJoin(
        schema.consentRequestBatches,
        eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId)
      )
      .where(
        and(
          eq(schema.consentRequestItems.candidateProfileId, candidateProfileId),
          eq(schema.consentRequestItems.status, "approved"),
          eq(schema.consentRequestBatches.organizationId, scope.membership.organizationId)
        )
      )
      .limit(1);

    if (!approved) {
      return {
        error: "Percakapan hanya dapat dibuat setelah consent disetujui.",
        status: 403 as const,
      };
    }

    // Serialize concurrent creates per organization: the existence checks and
    // the insert run in one transaction behind a FOR UPDATE lock on the parent
    // organization row, so a racing POST waits, then sees the winner's row.
    return db.transaction(async (tx) => {
      await tx
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(eq(schema.organizations.id, approved.organizationId))
        .for("update");

      // Check if an active conversation already exists between both users in this org
      const existingConversations = await tx
        .select({ id: schema.conversations.id })
        .from(schema.conversations)
        .innerJoin(
          schema.conversationParticipants,
          eq(schema.conversationParticipants.conversationId, schema.conversations.id)
        )
        .where(
          and(
            eq(schema.conversations.organizationId, approved.organizationId),
            eq(schema.conversationParticipants.userId, user.id),
            eq(schema.conversations.status, "active")
          )
        );

      if (existingConversations.length > 0) {
        const existingIds = existingConversations.map((c) => c.id);
        const [shared] = await tx
          .select({ conversationId: schema.conversationParticipants.conversationId })
          .from(schema.conversationParticipants)
          .where(
            and(
              inArray(schema.conversationParticipants.conversationId, existingIds),
              eq(schema.conversationParticipants.userId, approved.candidateUserId),
              isNull(schema.conversationParticipants.leftAt)
            )
          )
          .limit(1);

        if (shared) {
          return { conversationId: shared.conversationId, reused: true };
        }
      }

      // Create new conversation and add participants
      const [conversation] = await tx
        .insert(schema.conversations)
        .values({
          organizationId: approved.organizationId,
          createdBy: user.id,
        })
        .returning({ id: schema.conversations.id });

      await tx.insert(schema.conversationParticipants).values([
        { conversationId: conversation.id, userId: user.id },
        { conversationId: conversation.id, userId: approved.candidateUserId },
      ]);

      return { conversationId: conversation.id, reused: false };
    });
  }

  /**
   * List messages in a conversation (newest page first, returned oldest-first).
   */
  static async listMessages(
    db: Database,
    userId: string,
    conversationId: string,
    options: { cursor?: string | null; limit?: number } = {}
  ) {
    const [participant] = await db
      .select({ id: schema.conversationParticipants.id })
      .from(schema.conversationParticipants)
      .where(
        and(
          eq(schema.conversationParticipants.conversationId, conversationId),
          eq(schema.conversationParticipants.userId, userId),
          isNull(schema.conversationParticipants.leftAt)
        )
      )
      .limit(1);

    if (!participant) {
      return { error: "Anda bukan peserta percakapan ini.", status: 403 as const };
    }

    const limit = Number.isInteger(options.limit)
      ? Math.min(Math.max(options.limit as number, 1), 100)
      : 50;

    let cursorCondition = undefined;
    if (options.cursor) {
      const decoded = decodeMessageCursor(options.cursor);
      if (!decoded) {
        return { error: "Cursor tidak valid.", status: 400 as const };
      }
      cursorCondition = or(
        lt(schema.messages.createdAt, decoded.createdAt),
        and(
          eq(schema.messages.createdAt, decoded.createdAt),
          lt(schema.messages.id, decoded.id)
        )
      );
    }

    const rows = await db
      .select({
        id: schema.messages.id,
        conversationId: schema.messages.conversationId,
        senderId: schema.messages.senderId,
        senderName: schema.profiles.displayName,
        isMine: eq(schema.messages.senderId, userId),
        body: schema.messages.body,
        createdAt: schema.messages.createdAt,
        editedAt: schema.messages.editedAt,
        attachmentName: schema.messages.attachmentName,
        attachmentMimeType: schema.messages.attachmentMimeType,
        attachmentSize: schema.messages.attachmentSize,
        attachmentScanStatus: schema.messages.attachmentScanStatus,
      })
      .from(schema.messages)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.messages.senderId))
      .where(
        and(
          eq(schema.messages.conversationId, conversationId),
          isNull(schema.messages.deletedAt),
          cursorCondition
        )
      )
      .orderBy(desc(schema.messages.createdAt), desc(schema.messages.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const messages = (hasMore ? rows.slice(0, limit) : rows).reverse();
    const nextCursor =
      hasMore && messages.length > 0
        ? encodeMessageCursor(messages[0].createdAt, messages[0].id)
        : null;

    return { messages, nextCursor, hasMore };
  }

  /**
   * Send a message and dispatch recipient notifications.
   */
  static async sendMessage(
    db: Database,
    userId: string,
    conversationId: string,
    body: string,
    attachment?: {
      name: string;
      mimeType: string;
      sizeBytes: number;
      storagePath: string;
    } | null
  ) {
    const [participant] = await db
      .select({
        id: schema.conversationParticipants.id,
        status: schema.conversations.status,
      })
      .from(schema.conversationParticipants)
      .innerJoin(
        schema.conversations,
        eq(schema.conversations.id, schema.conversationParticipants.conversationId)
      )
      .where(
        and(
          eq(schema.conversationParticipants.conversationId, conversationId),
          eq(schema.conversationParticipants.userId, userId),
          isNull(schema.conversationParticipants.leftAt)
        )
      )
      .limit(1);

    if (!participant) {
      return { error: "Anda bukan peserta percakapan ini.", status: 403 as const };
    }

    if (participant.status !== "active") {
      return { error: "Percakapan ini tidak lagi aktif.", status: 409 as const };
    }

    return db.transaction(async (tx) => {
      const [message] = await tx
        .insert(schema.messages)
        .values({
          conversationId,
          senderId: userId,
          body,
          attachmentName: attachment?.name ?? null,
          attachmentMimeType: attachment?.mimeType ?? null,
          attachmentSize: attachment?.sizeBytes ?? null,
          attachmentStoragePath: attachment?.storagePath ?? null,
          attachmentScanStatus: attachment ? "pending" : "not_applicable",
        })
        .returning();

      await tx
        .update(schema.conversations)
        .set({ updatedAt: new Date() })
        .where(eq(schema.conversations.id, conversationId));

      const recipients = await tx
        .select({ userId: schema.conversationParticipants.userId })
        .from(schema.conversationParticipants)
        .where(
          and(
            eq(schema.conversationParticipants.conversationId, conversationId),
            isNull(schema.conversationParticipants.leftAt)
          )
        );

      const otherRecipients = recipients.filter((recipient) => recipient.userId !== userId);
      if (otherRecipients.length) {
        await tx.insert(schema.notifications).values(
          otherRecipients.map((recipient) => ({
            userId: recipient.userId,
            type: "message_received" as const,
            title: "Pesan baru",
            body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
            data: { conversationId, messageId: message.id },
          }))
        );
      }

      await writeAuditLog({
        db: tx,
        actorUserId: userId,
        action: "message.sent",
        entityType: "message",
        entityId: message.id,
        metadata: {
          conversationId,
          ...(attachment ? { hasAttachment: true, attachmentName: attachment.name } : {}),
        },
      });

      return { message: { ...message, isMine: true } };
    });
  }
}

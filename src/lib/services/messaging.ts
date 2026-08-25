import "server-only";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { schema, type Database } from "@/db";
import type { AppUser } from "@/lib/api/auth";

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

    // Single query: Batch fetch messages to identify the latest message per conversation
    const allMessages = await db
      .select({
        id: schema.messages.id,
        conversationId: schema.messages.conversationId,
        body: schema.messages.body,
        senderId: schema.messages.senderId,
        createdAt: schema.messages.createdAt,
      })
      .from(schema.messages)
      .where(
        and(
          inArray(schema.messages.conversationId, conversationIds),
          isNull(schema.messages.deletedAt)
        )
      )
      .orderBy(desc(schema.messages.createdAt));

    // Map participants and latest message to each conversation in memory
    const conversations = rows.map((row) => {
      const participants = allParticipants.filter((p) => p.conversationId === row.id);
      const lastMessage = allMessages.find((m) => m.conversationId === row.id) ?? null;
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

    // Check if an active conversation already exists between both users in this org
    const existingConversations = await db
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
      const [shared] = await db
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
    return db.transaction(async (tx) => {
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
   * List messages in a conversation.
   */
  static async listMessages(db: Database, userId: string, conversationId: string) {
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

    const messages = await db
      .select({
        id: schema.messages.id,
        conversationId: schema.messages.conversationId,
        senderId: schema.messages.senderId,
        senderName: schema.profiles.displayName,
        isMine: eq(schema.messages.senderId, userId),
        body: schema.messages.body,
        createdAt: schema.messages.createdAt,
        editedAt: schema.messages.editedAt,
      })
      .from(schema.messages)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.messages.senderId))
      .where(
        and(
          eq(schema.messages.conversationId, conversationId),
          isNull(schema.messages.deletedAt)
        )
      )
      .orderBy(asc(schema.messages.createdAt));

    return { messages };
  }

  /**
   * Send a message and dispatch recipient notifications.
   */
  static async sendMessage(db: Database, userId: string, conversationId: string, body: string) {
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
        .values({ conversationId, senderId: userId, body })
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

      return { message: { ...message, isMine: true } };
    });
  }
}

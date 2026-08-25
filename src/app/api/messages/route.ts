import { NextResponse } from "next/server";
import { z } from "zod";

import { and, eq } from "drizzle-orm";
import { getCurrentAppUser } from "@/lib/api/auth";
import { MessagingService } from "@/lib/services/messaging";
import { schema, type Database } from "@/db";

export async function getParticipant(db: Database, conversationId: string, userId: string) {
  const [participant] = await db
    .select()
    .from(schema.conversationParticipants)
    .where(
      and(
        eq(schema.conversationParticipants.conversationId, conversationId),
        eq(schema.conversationParticipants.userId, userId)
      )
    )
    .limit(1);
  return participant ?? null;
}

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4_000),
  attachment: z.object({ name: z.string().trim().min(1).max(255), mimeType: z.string().trim().max(120), size: z.number().int().positive().max(25_000_000) }).optional(),
});

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const conversationId = new URL(request.url).searchParams.get("conversationId");
    if (!conversationId || !z.string().uuid().safeParse(conversationId).success) {
      return NextResponse.json({ error: "Conversation ID tidak valid." }, { status: 400 });
    }

    const result = await MessagingService.listMessages(current.db, current.user.id, conversationId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

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

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pesan harus diisi dan maksimal 4.000 karakter." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const result = await MessagingService.sendMessage(
      current.db,
      current.user.id,
      parsed.data.conversationId,
      parsed.data.body
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

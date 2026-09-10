import { NextResponse } from "next/server";
import { z } from "zod";

import { and, eq } from "drizzle-orm";
import { getCurrentAppUser } from "@/lib/api/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { MessagingService } from "@/lib/services/messaging";
import { schema, type Database } from "@/db";
import { validateAttachment, sanitizeAttachmentName } from "@/lib/messages/validation";
import { storeMessageAttachment, MessageStorageConfigurationError } from "@/lib/messages/storage";

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
});

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const params = new URL(request.url).searchParams;
    const conversationId = params.get("conversationId");
    if (!conversationId || !z.string().uuid().safeParse(conversationId).success) {
      return NextResponse.json({ error: "Conversation ID tidak valid." }, { status: 400 });
    }

    // `cursor` is canonical; `before` is the legacy alias sent by the client.
    const cursor = params.get("cursor") ?? params.get("before");
    const limitParam = params.get("limit");
    const result = await MessagingService.listMessages(current.db, current.user.id, conversationId, {
      cursor,
      limit: limitParam === null ? undefined : Number(limitParam),
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let conversationId = "";
  let bodyText = "";
  let fileToUpload: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      conversationId = String(formData.get("conversationId") ?? "");
      bodyText = String(formData.get("body") ?? "");
      const rawFile = formData.get("file");
      if (rawFile instanceof File && rawFile.size > 0) {
        fileToUpload = rawFile;
      }
    } catch {
      return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
    }

    const jsonParsed = messageSchema.safeParse(body);
    if (!jsonParsed.success) {
      return NextResponse.json({ error: "Pesan harus diisi dan maksimal 4.000 karakter." }, { status: 400 });
    }
    conversationId = jsonParsed.data.conversationId;
    bodyText = jsonParsed.data.body;
  }

  const parsed = messageSchema.safeParse({ conversationId, body: bodyText });
  if (!parsed.success) {
    return NextResponse.json({ error: "Pesan harus diisi dan maksimal 4.000 karakter." }, { status: 400 });
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const rate = enforceRateLimit(`messages:${current.user.id}`, RATE_LIMITS.messages.limit, RATE_LIMITS.messages.windowMs);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const participant = await getParticipant(current.db, parsed.data.conversationId, current.user.id);
    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    }

    let attachmentData: {
      name: string;
      mimeType: string;
      sizeBytes: number;
      storagePath: string;
    } | null = null;

    if (fileToUpload) {
      const bytes = new Uint8Array(await fileToUpload.arrayBuffer());
      const validation = validateAttachment({ bytes, name: fileToUpload.name });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: validation.status });
      }

      const safeName = sanitizeAttachmentName(fileToUpload.name);
      const messageUuid = crypto.randomUUID();
      const key = `conversations/${parsed.data.conversationId}/${messageUuid}/${safeName}`;

      try {
        const stored = await storeMessageAttachment({
          key,
          bytes,
          contentType: validation.mime,
        });
        attachmentData = {
          name: safeName,
          mimeType: validation.mime,
          sizeBytes: validation.sizeBytes,
          storagePath: stored.storagePath,
        };
      } catch (err) {
        if (err instanceof MessageStorageConfigurationError) {
          return NextResponse.json({ error: err.message }, { status: 503 });
        }
        throw err;
      }
    }

    const result = await MessagingService.sendMessage(
      current.db,
      current.user.id,
      parsed.data.conversationId,
      parsed.data.body,
      attachmentData
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

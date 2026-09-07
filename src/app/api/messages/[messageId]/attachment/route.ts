import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { getParticipant } from "@/app/api/messages/route";
import { createMessageDownloadUrl } from "@/lib/messages/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await context.params;
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const [message] = await current.db
      .select({
        id: schema.messages.id,
        conversationId: schema.messages.conversationId,
        attachmentStoragePath: schema.messages.attachmentStoragePath,
      })
      .from(schema.messages)
      .where(and(eq(schema.messages.id, messageId), isNull(schema.messages.deletedAt)))
      .limit(1);

    if (!message || !message.attachmentStoragePath) {
      return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
    }

    const participant = await getParticipant(current.db, message.conversationId, current.user.id);
    if (!participant || participant.leftAt) {
      return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    }

    const downloadUrl = await createMessageDownloadUrl(message.attachmentStoragePath);
    if (!downloadUrl) {
      return NextResponse.json({ error: "Unduhan lampiran belum tersedia." }, { status: 503 });
    }

    return NextResponse.json({ downloadUrl });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { getParticipant } from "@/app/api/messages/route";

const actionSchema = z.object({ action: z.enum(["read", "block", "unblock"]) });

export async function PATCH(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Aksi percakapan tidak valid." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const participant = await getParticipant(current.db, conversationId, current.user.id);
    if (!participant) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    if (parsed.data.action === "read") {
      await current.db.update(schema.conversationParticipants).set({ lastReadAt: new Date() }).where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, current.user.id)));
    } else {
      await current.db.update(schema.conversations).set({ status: parsed.data.action === "block" ? "blocked" : "active", updatedAt: new Date() }).where(eq(schema.conversations.id, conversationId));
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Percakapan belum dapat diperbarui." }, { status: 503 }); }
}

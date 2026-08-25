import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { getParticipant } from "@/app/api/messages/route";

const editSchema = z.object({ body: z.string().trim().min(1).max(4_000) });
const reportSchema = z.object({ reason: z.string().trim().min(5).max(500) });

export async function PATCH(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await context.params;
  const parsed = editSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Isi pesan tidak valid." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const [message] = await current.db.select().from(schema.messages).where(and(eq(schema.messages.id, messageId), isNull(schema.messages.deletedAt))).limit(1);
    if (!message) return NextResponse.json({ error: "Pesan tidak ditemukan." }, { status: 404 });
    if (message.senderId !== current.user.id) return NextResponse.json({ error: "Anda hanya dapat mengubah pesan sendiri." }, { status: 403 });
    if (!await getParticipant(current.db, message.conversationId, current.user.id)) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    const [updated] = await current.db.update(schema.messages).set({ body: parsed.data.body, editedAt: new Date() }).where(eq(schema.messages.id, messageId)).returning();
    return NextResponse.json({ message: updated });
  } catch { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await context.params;
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const [message] = await current.db.select().from(schema.messages).where(eq(schema.messages.id, messageId)).limit(1);
    if (!message) return NextResponse.json({ error: "Pesan tidak ditemukan." }, { status: 404 });
    if (message.senderId !== current.user.id) return NextResponse.json({ error: "Anda hanya dapat menghapus pesan sendiri." }, { status: 403 });
    if (!await getParticipant(current.db, message.conversationId, current.user.id)) return NextResponse.json({ error: "Anda bukan peserta percakapan ini." }, { status: 403 });
    await current.db.update(schema.messages).set({ deletedAt: new Date(), body: "Pesan dihapus oleh pengirim." }).where(eq(schema.messages.id, messageId));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
}

export async function POST(request: Request, context: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await context.params;
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Alasan laporan wajib diisi." }, { status: 400 });
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const [message] = await current.db.select({ conversationId: schema.messages.conversationId }).from(schema.messages).where(eq(schema.messages.id, messageId)).limit(1);
    if (!message || !await getParticipant(current.db, message.conversationId, current.user.id)) return NextResponse.json({ error: "Pesan tidak ditemukan." }, { status: 404 });
    await current.db.insert(schema.messageReports).values({ conversationId: message.conversationId, messageId, reporterId: current.user.id, reason: parsed.data.reason });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Laporan belum dapat disimpan." }, { status: 503 }); }
}

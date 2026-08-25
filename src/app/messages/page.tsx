"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { Archive, Check, FileText, MessageCircle, MoreHorizontal, Paperclip, Send, ShieldCheck, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { useApp } from "@/providers/app-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Participant = { id: string; name: string | null; email?: string | null };
type Conversation = { id: string; status: string; updatedAt: string; participants: Participant[]; lastMessage: { body: string; createdAt: string } | null };
type Message = { id: string; senderId: string; senderName: string | null; body: string; createdAt: string; editedAt?: string | null; isMine?: boolean; attachmentName?: string | null; attachmentMimeType?: string | null; attachmentSize?: number | null; attachmentScanStatus?: string };
type Attachment = { name: string; mimeType: string; size: number };

const demoMessages: Message[] = [
  { id: "demo-1", senderId: "other", senderName: "Nadia Pratama", body: "Halo, terima kasih sudah menghubungi saya. Saya terbuka untuk berdiskusi tentang posisi ini.", createdAt: "2026-08-12T09:30:00Z", isMine: false },
  { id: "demo-2", senderId: "me", senderName: "Anda", body: "Halo Nadia, kami ingin berbagi detail peran dan jadwal proses selanjutnya.", createdAt: "2026-08-12T09:35:00Z", isMine: true },
];
const templates = ["Halo, terima kasih sudah menghubungi saya.", "Apakah Anda tersedia untuk berdiskusi minggu ini?", "Saya akan meninjau detailnya dan segera kembali."];

function MessagesContent({ routeConversationId }: { routeConversationId?: string }) {
  const { user: appUser, hydrated, dbMode, bootstrapped, databaseError } = useApp();
  const user = appUser as typeof appUser & { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = routeConversationId ?? searchParams.get("conversationId");
  const contact = searchParams.get("contact");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(requestedConversationId ?? "demo");
  const [messages, setMessages] = useState<Message[]>(() => dbMode ? [] : demoMessages);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(dbMode);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [peerReadAt, setPeerReadAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/messages")}`); }, [hydrated, user, router]);
  useEffect(() => {
    if (!dbMode || !user) return;
    void fetch("/api/conversations?limit=100", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { conversations?: Conversation[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Gagal memuat percakapan.");
      const next = payload.conversations ?? []; setConversations(next);
      const requested = requestedConversationId && next.some((item) => item.id === requestedConversationId) ? requestedConversationId : null;
      const contacted = contact && next.find((item) => item.participants.some((participant) => [participant.id, participant.email, participant.name].includes(contact)))?.id;
      const nextId = requested ?? contacted ?? next[0]?.id ?? ""; setSelectedId(nextId);
      if (nextId && nextId !== requestedConversationId) router.replace(`/messages/${encodeURIComponent(nextId)}`);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat percakapan.")).finally(() => setLoading(false));
  }, [dbMode, user, requestedConversationId, contact, router]);

  async function loadMessages(before?: string | null) {
    if (!dbMode || !user || !selectedId || selectedId === "demo") return;
    setMessagesLoading(true); setError(null);
    try {
      const query = new URLSearchParams({ conversationId: selectedId, limit: "30" }); if (before) query.set("before", before);
      const response = await fetch(`/api/messages?${query}`, { cache: "no-store" }); const payload = await response.json() as { messages?: Message[]; readAt?: string | null; hasMore?: boolean; nextCursor?: string | null; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Gagal memuat pesan.");
      setMessages((current) => before ? [...(payload.messages ?? []), ...current] : payload.messages ?? []); setHasMore(Boolean(payload.hasMore)); setNextCursor(payload.nextCursor ?? null); setPeerReadAt(payload.readAt ?? null);
      if (!before) void fetch(`/api/conversations/${selectedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read" }) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Gagal memuat pesan."); } finally { setMessagesLoading(false); }
  }
  // The effect synchronizes the selected conversation with the server-backed message list.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadMessages(); }, [dbMode, selectedId, user]);
  useEffect(() => {
    if (!dbMode || !selectedId || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    try {
      const client = createClient(); const channel = client.channel(`messages:${selectedId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` }, (payload) => { const incoming = payload.new as Message; if (incoming.senderId !== user?.email) setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]); }).subscribe();
      return () => { void client.removeChannel(channel); };
    } catch { return undefined; }
  }, [dbMode, selectedId, user?.email]);

  if (!hydrated || !user) return <StateMessage text="Menyiapkan pesan..." />;
  if (databaseModeUnavailable(dbMode, bootstrapped)) return <StateMessage text="Memuat pesan..." />;
  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const other = selected?.participants.find((participant) => participant.id !== user.email)?.name ?? selected?.participants.find((participant) => participant.email !== user.email)?.name ?? (dbMode ? "Kontak" : "Nadia Pratama");
  const visibleError = error ?? (dbMode ? databaseError : null);

  async function sendMessage(event: FormEvent) {
    event.preventDefault(); const body = draft.trim(); if (!body || (dbMode && !selectedId)) return;
    if (!dbMode) { setMessages((current) => [...current, { id: `demo-${Date.now()}`, senderId: "me", senderName: "Anda", body, createdAt: new Date().toISOString(), isMine: true }]); setDraft(""); return; }
    const endpoint = editingId ? `/api/messages/${editingId}` : "/api/messages"; const method = editingId ? "PATCH" : "POST"; const payload = editingId ? { body } : { conversationId: selectedId, body, ...(attachment ? { attachment } : {}) };
    const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json() as { message?: Message; error?: string };
    if (!response.ok || (!editingId && !result.message)) { setError(result.error ?? "Pesan gagal disimpan."); return; }
    setMessages((current) => editingId ? current.map((item) => item.id === editingId ? { ...item, ...result.message } : item) : [...current, result.message!]); setDraft(""); setAttachment(null); setEditingId(null);
  }
  async function messageAction(message: Message, action: "edit" | "delete" | "report") {
    if (action === "edit") { setEditingId(message.id); setDraft(message.body); return; }
    const reason = action === "report" ? window.prompt("Jelaskan alasan laporan ini") : null; if (action === "report" && !reason) return;
    const response = await fetch(`/api/messages/${message.id}`, { method: action === "delete" ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: action === "report" ? JSON.stringify({ reason }) : undefined });
    if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error ?? "Aksi belum dapat dilakukan."); return; }
    if (action === "delete") setMessages((current) => current.filter((item) => item.id !== message.id));
  }
  async function toggleBlock() { if (!selectedId) return; const action = selected?.status === "blocked" ? "unblock" : "block"; const response = await fetch(`/api/conversations/${selectedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); if (response.ok) setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, status: action === "block" ? "blocked" : "active" } : item)); }

  return <main className="container mx-auto px-4 py-8 sm:py-12"><div className="mx-auto max-w-6xl space-y-8">
    <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Komunikasi aman</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Pesan</h1><p className="mt-2 max-w-2xl text-muted-foreground">Percakapan hanya tersedia selama consent aktif dan masa penyimpanan belum berakhir.</p></div>
    {visibleError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Pesan belum dapat dimuat. {visibleError}</div>}
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card className="overflow-hidden"><CardHeader className="border-b bg-[#f0f6fd]/70"><CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="size-5 text-[#19a974]" /> Percakapan</CardTitle></CardHeader><CardContent className="space-y-1 p-2">
        {loading ? <p className="p-4 text-sm text-muted-foreground">Memuat percakapan...</p> : databaseMode && conversations.length === 0 ? <EmptyState icon={MessageCircle} title="Belum ada percakapan." className="border-0 bg-transparent p-6 shadow-none" /> : (databaseMode ? conversations : [{ id: "demo", status: "active", updatedAt: "", participants: [{ id: "other", name: "Nadia Pratama" }], lastMessage: { body: "Percakapan demo untuk pratinjau", createdAt: "" } }]).map((conversation) => { const participant = conversation.participants.find((item) => item.email !== user.email && item.id !== user.email); return <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); if (databaseMode) router.replace(`/messages?conversationId=${encodeURIComponent(conversation.id)}`); }} className={cn("w-full rounded-xl p-4 text-left transition-colors hover:bg-[#f0f6fd]", selectedId === conversation.id && "bg-[#e3f5ed]")}><p className="font-semibold">{participant?.name ?? "Kontak"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{conversation.lastMessage?.body ?? "Belum ada pesan"}</p></button>; })}
      </CardContent></Card>
      <Card className="flex min-h-[32rem] flex-col"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-lg"><span className="flex size-9 items-center justify-center rounded-full bg-[#d7f5e8] text-[#08744f]"><ShieldCheck className="size-4" /></span>{other}</CardTitle><p className="text-sm text-muted-foreground">Percakapan hanya tersedia untuk peserta yang berwenang.</p></CardHeader><CardContent className="flex flex-1 flex-col justify-end gap-4 p-4 sm:p-6"><div className="space-y-3">{messagesLoading ? <p role="status" className="text-center text-sm text-muted-foreground">Memuat pesan...</p> : databaseMode && !selected ? <p className="text-center text-sm text-muted-foreground">Pilih percakapan untuk melihat pesan.</p> : messages.length === 0 ? <EmptyState icon={MessageCircle} title="Belum ada pesan dalam percakapan ini." className="border-0 bg-transparent shadow-none" /> : messages.map((message) => { const mine = message.isMine ?? message.senderId === user.email; return <div key={message.id} className={cn("flex", mine && "justify-end")}><div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", mine ? "rounded-br-md bg-[#0f2040] text-white" : "rounded-bl-md bg-[#f0f6fd] text-[#0a1628]")}><p>{message.body}</p><time className="mt-1 block text-[11px] opacity-60">{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time></div></div>; })}</div><form onSubmit={sendMessage} className="flex gap-2 border-t pt-4"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan dalam Bahasa Indonesia..." aria-label="Isi pesan" className="min-h-12 resize-none" disabled={databaseMode && !selectedId} /><Button type="submit" size="icon" aria-label="Kirim pesan" disabled={databaseMode && !selectedId}><Send className="size-4" /></Button></form></CardContent></Card>
    </div>
  </div></main>;
}

function databaseModeUnavailable(dbMode: boolean, bootstrapped: boolean) { return dbMode && !bootstrapped; }
function StateMessage({ text }: { text: string }) { return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">{text}</div></div>; }
export default function MessagesPage({ conversationId }: { conversationId?: string } = {}) { return <Suspense fallback={<StateMessage text="Memuat pesan..." />}><MessagesContent routeConversationId={conversationId} /></Suspense>; }

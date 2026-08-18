"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { Archive, Check, FileText, MessageCircle, MoreHorizontal, Paperclip, Send, ShieldCheck, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
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
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]"><Card className="overflow-hidden"><CardHeader className="border-b bg-secondary/60"><CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="size-5 text-emerald-600" /> Percakapan</CardTitle></CardHeader><CardContent className="space-y-1 p-2">{loading ? <p className="p-4 text-sm text-muted-foreground">Memuat percakapan...</p> : dbMode && conversations.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Belum ada percakapan.</p> : (dbMode ? conversations : [{ id: "demo", status: "active", updatedAt: "", participants: [{ id: "other", name: "Nadia Pratama" }], lastMessage: { body: "Percakapan demo untuk pratinjau", createdAt: "" } }]).map((conversation) => { const participant = conversation.participants.find((item) => item.email !== user.email && item.id !== user.id); return <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); if (dbMode) router.replace(`/messages/${encodeURIComponent(conversation.id)}`); }} className={cn("w-full rounded-xl p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selectedId === conversation.id && "bg-emerald-50")}><p className="font-semibold">{participant?.name ?? "Kontak"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{conversation.lastMessage?.body ?? "Belum ada pesan"}</p>{conversation.status === "blocked" && <span className="mt-2 inline-block text-xs text-destructive">Diblokir</span>}</button>; })}</CardContent></Card>
       <Card className="flex min-h-[32rem] flex-col"><CardHeader className="border-b"><div className="flex items-start justify-between gap-3"><CardTitle className="flex items-center gap-2 text-lg"><span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><ShieldCheck className="size-4" /></span>{other}</CardTitle>{dbMode && selectedId !== "demo" && <Button variant="outline" size="sm" onClick={toggleBlock}><Archive className="size-4" />{selected?.status === "blocked" ? "Buka blokir" : "Blokir"}</Button>}</div><p className="text-sm text-muted-foreground">Hak akses diperiksa di server untuk setiap aksi. {peerReadAt ? "Tanda dibaca aktif." : ""}</p></CardHeader>
        <CardContent className="flex flex-1 flex-col justify-end gap-4 p-4 sm:p-6">{hasMore && <Button variant="ghost" size="sm" onClick={() => void loadMessages(nextCursor)} disabled={messagesLoading}>Muat pesan sebelumnya</Button>}<div className="space-y-3">{messagesLoading && messages.length === 0 ? <p role="status" className="text-center text-sm text-muted-foreground">Memuat pesan...</p> : !selected && dbMode ? <p className="text-center text-sm text-muted-foreground">Pilih percakapan untuk melihat pesan.</p> : messages.length === 0 ? <p className="text-center text-sm text-muted-foreground">Belum ada pesan dalam percakapan ini.</p> : messages.map((message) => { const mine = message.isMine ?? message.senderId === user.id; return <div key={message.id} className={cn("group flex", mine && "justify-end")}><div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", mine ? "rounded-br-md bg-[#0f2040] text-white" : "rounded-bl-md bg-secondary text-foreground")}><div className="flex items-start gap-2"><p className="whitespace-pre-wrap">{message.body}</p>{dbMode && <details className="relative"><summary className="list-none cursor-pointer opacity-60 hover:opacity-100"><MoreHorizontal className="size-4" /></summary><div className="absolute right-0 z-10 mt-1 w-28 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">{mine && <><button className="block w-full rounded p-1 text-left text-xs hover:bg-accent" onClick={() => messageAction(message, "edit")}>Edit</button><button className="block w-full rounded p-1 text-left text-xs hover:bg-accent" onClick={() => messageAction(message, "delete")}>Hapus</button></>}<button className="block w-full rounded p-1 text-left text-xs text-destructive hover:bg-red-50" onClick={() => messageAction(message, "report")}>Laporkan</button></div></details>}</div>{message.attachmentName && <p className="mt-2 flex items-center gap-1 text-xs opacity-80"><FileText className="size-3" />{message.attachmentName} · {message.attachmentScanStatus === "pending" ? "menunggu pemindaian" : "metadata tersimpan"}</p>}<time className="mt-1 block text-[11px] opacity-60">{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}{message.editedAt && " · diedit"}{mine && " · "}<span aria-label={mine ? "terkirim" : undefined}>{mine && <Check className="inline size-3" />}</span></time></div></div>; })}</div>
          {editingId && <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">Mengedit pesan <button onClick={() => { setEditingId(null); setDraft(""); }} aria-label="Batal edit"><X className="size-4" /></button></div>}
          <div className="flex flex-wrap gap-2">{templates.map((template) => <Button key={template} type="button" variant="outline" size="sm" onClick={() => setDraft(template)}>{template}</Button>)}</div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t pt-4"><label className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border hover:bg-accent" aria-label="Tambahkan lampiran"><Paperclip className="size-4" /><input type="file" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setAttachment({ name: file.name, mimeType: file.type, size: file.size }); }} /></label><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan dalam Bahasa Indonesia..." aria-label="Isi pesan" className="min-h-12 resize-none" disabled={dbMode && (!selectedId || selected?.status !== "active")} /><Button type="submit" size="icon" aria-label={editingId ? "Simpan perubahan" : "Kirim pesan"} disabled={dbMode && (!selectedId || selected?.status !== "active")}><Send className="size-4" /></Button></form>{attachment && <p className="text-xs text-muted-foreground">Lampiran: {attachment.name}. File belum diunggah; metadata akan menunggu pemindaian provider.</p>}</CardContent></Card>
    </div></div></main>;
}

function databaseModeUnavailable(dbMode: boolean, bootstrapped: boolean) { return dbMode && !bootstrapped; }
function StateMessage({ text }: { text: string }) { return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">{text}</div></div>; }
export default function MessagesPage({ conversationId }: { conversationId?: string } = {}) { return <Suspense fallback={<StateMessage text="Memuat pesan..." />}><MessagesContent routeConversationId={conversationId} /></Suspense>; }

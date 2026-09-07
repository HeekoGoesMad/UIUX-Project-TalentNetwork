"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { FileText, Flag, LoaderCircle, MessageCircle, MoreHorizontal, Paperclip, Pencil, Send, ShieldCheck, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { useApp } from "@/providers/app-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Participant = { id: string; name: string | null; email?: string | null };
type Conversation = { id: string; status: string; updatedAt: string; participants: Participant[]; lastMessage: { body: string; createdAt: string } | null };
type Message = {
  id: string;
  senderId: string;
  senderName: string | null;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  isMine?: boolean;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  attachmentScanStatus?: string;
};
type Attachment = { name: string; mimeType: string; size: number };

const demoMessages: Message[] = [
  { id: "demo-1", senderId: "other", senderName: "Nadia Pratama", body: "Halo, terima kasih sudah menghubungi saya. Saya terbuka untuk berdiskusi tentang posisi ini.", createdAt: "2026-08-12T09:30:00Z", isMine: false },
  { id: "demo-2", senderId: "me", senderName: "Anda", body: "Halo Nadia, kami ingin berbagi detail peran dan jadwal proses selanjutnya.", createdAt: "2026-08-12T09:35:00Z", isMine: true },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessagesContent({ routeConversationId }: { routeConversationId?: string }) {
  const { user: appUser, profile, hydrated, dbMode, bootstrapped, databaseError } = useApp();
  const databaseMode = dbMode;
  const user = appUser;
  const currentUserId = profile?.userId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = routeConversationId ?? searchParams.get("conversationId");
  const contact = searchParams.get("contact");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(requestedConversationId ?? "demo");
  const [messages, setMessages] = useState<Message[]>(() => dbMode ? [] : demoMessages);
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(dbMode);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/messages")}`);
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!dbMode || !user) return;
    // This effect starts an external request; the loading state is reset when it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetch("/api/conversations?limit=100", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { conversations?: Conversation[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Gagal memuat percakapan.");
      const next = payload.conversations ?? [];
      setConversations(next);
      const requested = requestedConversationId && next.some((item) => item.id === requestedConversationId) ? requestedConversationId : null;
      const contacted = contact && next.find((item) => item.participants.some((participant) => [participant.id, participant.email, participant.name].includes(contact)))?.id;
      const nextId = requested ?? contacted ?? next[0]?.id ?? "";
      setSelectedId(nextId);
      if (nextId && nextId !== requestedConversationId) router.replace(`/messages/${encodeURIComponent(nextId)}`);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat percakapan.")).finally(() => setLoading(false));
  }, [dbMode, user, requestedConversationId, contact, router]);

  async function loadMessages(before?: string | null) {
    if (!dbMode || !user || !selectedId || selectedId === "demo" || messagesLoading) return;
    setMessagesLoading(true);
    setError(null);
    if (!before) {
      setMessages([]);
      setEditingId(null);
      setDraft("");
      setSelectedFile(null);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    try {
      const query = new URLSearchParams({ conversationId: selectedId, limit: "30" });
      if (before) query.set("before", before);
      const response = await fetch(`/api/messages?${query}`, { cache: "no-store" });
      const payload = await response.json() as { messages?: Message[]; hasMore?: boolean; nextCursor?: string | null; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Gagal memuat pesan.");
      setMessages((current) => before ? [...(payload.messages ?? []), ...current] : payload.messages ?? []);
      setHasMore(Boolean(payload.hasMore));
      setNextCursor(payload.nextCursor ?? null);
      if (!before) void fetch(`/api/conversations/${selectedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read" }) });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal memuat pesan.");
    } finally {
      setMessagesLoading(false);
    }
  }

  // The effect synchronizes the selected conversation with the server-backed message list.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadMessages(); }, [dbMode, selectedId, user]);

  useEffect(() => {
    if (!dbMode || !selectedId || !currentUserId || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    try {
      const client = createClient();
      const channel = client.channel(`messages:${selectedId}`).on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selectedId}`,
      }, (payload) => {
        const row = payload.new as { id?: string; sender_id?: string; body?: string; created_at?: string; edited_at?: string | null; attachment_name?: string | null; attachment_mime_type?: string | null; attachment_size?: number | null; attachment_scan_status?: string };
        if (!row.id || !row.sender_id || !row.body || !row.created_at || row.sender_id === currentUserId) return;
        const incoming: Message = {
          id: row.id,
          senderId: row.sender_id,
          senderName: null,
          body: row.body,
          createdAt: row.created_at,
          editedAt: row.edited_at ?? null,
          attachmentName: row.attachment_name ?? null,
          attachmentMimeType: row.attachment_mime_type ?? null,
          attachmentSize: row.attachment_size ?? null,
          attachmentScanStatus: row.attachment_scan_status,
          isMine: false,
        };
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      }).subscribe();
      return () => { void client.removeChannel(channel); };
    } catch {
      return undefined;
    }
  }, [dbMode, selectedId, currentUserId]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Jenis file tidak didukung. Hanya gambar (JPEG, PNG, GIF, WebP) atau PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran lampiran maksimal 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setSelectedFile(file);
    setAttachment({ name: file.name, mimeType: file.type, size: file.size });
  }

  function removeAttachment() {
    setSelectedFile(null);
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!hydrated || !user) return <StateMessage text="Menyiapkan pesan..." />;
  if (databaseModeUnavailable(dbMode, bootstrapped)) return <StateMessage text="Memuat pesan..." />;
  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const other = selected?.participants.find((participant) => participant.id !== currentUserId && participant.email !== user.email)?.name ?? (dbMode ? "Kontak" : "Nadia Pratama");
  const visibleError = error ?? (dbMode ? databaseError : null);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || (dbMode && (!selectedId || !selected || selected.status === "blocked"))) return;

    if (!dbMode) {
      setMessages((current) => [...current, {
        id: `demo-${Date.now()}`,
        senderId: "me",
        senderName: "Anda",
        body,
        createdAt: new Date().toISOString(),
        isMine: true,
        ...(attachment ? { attachmentName: attachment.name, attachmentMimeType: attachment.mimeType, attachmentSize: attachment.size, attachmentScanStatus: "not_applicable" } : {}),
      }]);
      setDraft("");
      removeAttachment();
      return;
    }

    setSending(true);
    setError(null);
    try {
      let response: Response;
      if (selectedFile && !editingId) {
        const formData = new FormData();
        formData.append("conversationId", selectedId);
        formData.append("body", body);
        formData.append("file", selectedFile);
        response = await fetch("/api/messages", { method: "POST", body: formData });
      } else {
        const endpoint = editingId ? `/api/messages/${editingId}` : "/api/messages";
        const method = editingId ? "PATCH" : "POST";
        const payload = editingId ? { body } : { conversationId: selectedId, body };
        response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const result = await response.json() as { message?: Message; error?: string };
      if (!response.ok || (!editingId && !result.message)) throw new Error(result.error ?? "Pesan gagal disimpan.");
      setMessages((current) => editingId ? current.map((item) => item.id === editingId ? { ...item, ...result.message } : item) : [...current, result.message!]);
      setDraft("");
      removeAttachment();
      setEditingId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pesan gagal disimpan.");
    } finally {
      setSending(false);
    }
  }

  async function messageAction(message: Message, action: "edit" | "delete" | "report") {
    if (action === "edit") {
      setEditingId(message.id);
      setDraft(message.body);
      return;
    }
    const reason = action === "report" ? window.prompt("Jelaskan alasan laporan ini") : null;
    if (action === "report" && !reason) return;
    if (action === "delete" && !window.confirm("Hapus pesan ini?")) return;
    setActionLoading(`${message.id}:${action}`);
    setError(null);
    try {
      const response = await fetch(`/api/messages/${message.id}`, { method: action === "delete" ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: action === "report" ? JSON.stringify({ reason }) : undefined });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Aksi belum dapat dilakukan.");
      if (action === "delete") setMessages((current) => current.filter((item) => item.id !== message.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aksi belum dapat dilakukan.");
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleBlock() {
    if (!databaseMode || !selectedId || !selected) return;
    const action = selected.status === "blocked" ? "unblock" : "block";
    setBlockLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${selectedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Percakapan belum dapat diperbarui.");
      setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, status: action === "block" ? "blocked" : "active" } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Percakapan belum dapat diperbarui.");
    } finally {
      setBlockLoading(false);
    }
  }

  return <main className="container mx-auto px-4 py-8 sm:py-12"><div className="mx-auto max-w-6xl space-y-8">
    <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Komunikasi aman</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Pesan</h1><p className="mt-2 max-w-2xl text-muted-foreground">Percakapan hanya tersedia selama consent aktif dan masa penyimpanan belum berakhir.</p></div>
    {visibleError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Gagal memuat atau memperbarui pesan. {visibleError}</div>}
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card className="overflow-hidden"><CardHeader className="border-b bg-[#f0f6fd]/70"><CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="size-5 text-[#19a974]" /> Percakapan</CardTitle></CardHeader><CardContent className="space-y-1 p-2">
        {loading ? <p role="status" className="p-4 text-sm text-muted-foreground">Memuat percakapan...</p> : databaseMode && conversations.length === 0 ? <EmptyState icon={MessageCircle} title="Belum ada percakapan." className="border-0 bg-transparent p-6 shadow-none" /> : (databaseMode ? conversations : [{ id: "demo", status: "active", updatedAt: "", participants: [{ id: "other", name: "Nadia Pratama" }], lastMessage: { body: "Percakapan demo untuk pratinjau", createdAt: "" } }]).map((conversation) => { const participant = conversation.participants.find((item) => item.id !== currentUserId && item.email !== user.email); return <button type="button" key={conversation.id} onClick={() => { setSelectedId(conversation.id); if (databaseMode) router.replace(`/messages?conversationId=${encodeURIComponent(conversation.id)}`); }} className={cn("w-full rounded-xl p-4 text-left transition-colors hover:bg-[#f0f6fd]", selectedId === conversation.id && "bg-[#e3f5ed]")}><p className="font-semibold">{participant?.name ?? "Kontak"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{conversation.lastMessage?.body ?? "Belum ada pesan"}</p></button>; })}
      </CardContent></Card>
      <Card className="flex min-h-[32rem] min-w-0 flex-col"><CardHeader className="border-b"><div className="flex flex-wrap items-start justify-between gap-3"><CardTitle className="flex min-w-0 items-center gap-2 text-lg"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#d7f5e8] text-[#08744f]"><ShieldCheck className="size-4" /></span><span className="truncate">{other}</span></CardTitle>{databaseMode && selected && <Button type="button" variant="outline" size="sm" onClick={() => void toggleBlock()} disabled={blockLoading} aria-label={selected.status === "blocked" ? "Buka blokir percakapan" : "Blokir percakapan"} className="shrink-0">{blockLoading ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}<span>{selected.status === "blocked" ? "Buka blokir" : "Blokir"}</span></Button>}</div><p className="text-sm text-muted-foreground">Percakapan hanya tersedia untuk peserta yang berwenang.</p>{databaseMode && selected?.status === "blocked" && <p role="status" className="text-xs font-medium text-amber-700">Percakapan diblokir. Buka blokir untuk mengirim pesan kembali.</p>}</CardHeader><CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6"><div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{messagesLoading && messages.length === 0 ? <p role="status" className="py-8 text-center text-sm text-muted-foreground"><LoaderCircle className="mx-auto mb-2 size-5 animate-spin" />Memuat pesan...</p> : databaseMode && !selected ? <p className="py-8 text-center text-sm text-muted-foreground">Pilih percakapan untuk melihat pesan.</p> : messages.length === 0 ? <EmptyState icon={MessageCircle} title="Belum ada pesan dalam percakapan ini." className="border-0 bg-transparent shadow-none" /> : <>{hasMore && nextCursor && <div className="flex justify-center pb-1"><Button type="button" variant="outline" size="sm" onClick={() => void loadMessages(nextCursor)} disabled={messagesLoading}>{messagesLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}{messagesLoading ? "Memuat pesan..." : "Muat pesan sebelumnya"}</Button></div>}{messages.map((message) => { const mine = message.isMine ?? message.senderId === currentUserId; const actionPending = actionLoading?.startsWith(`${message.id}:`) ?? false; const actionMenu = databaseMode ? <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Aksi untuk pesan ${mine ? "Anda" : "ini"}`} disabled={Boolean(actionLoading)} className="mt-1 size-8 shrink-0 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">{actionPending ? <LoaderCircle className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}</Button></DropdownMenuTrigger><DropdownMenuContent align={mine ? "end" : "start"}>{mine ? <><DropdownMenuItem onSelect={() => void messageAction(message, "edit")}><Pencil className="size-4" />Edit pesan</DropdownMenuItem><DropdownMenuItem destructive onSelect={() => void messageAction(message, "delete")}><Trash2 className="size-4" />Hapus pesan</DropdownMenuItem></> : <DropdownMenuItem onSelect={() => void messageAction(message, "report")}><Flag className="size-4" />Laporkan pesan</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu> : null; return <div key={message.id} className={cn("group flex items-start gap-2", mine ? "justify-end" : "justify-start")}>{!mine && actionMenu}<div className={cn("max-w-[85%] min-w-0 rounded-2xl px-4 py-3 text-sm leading-6", mine ? "rounded-br-md bg-[#0f2040] text-white" : "rounded-bl-md bg-[#f0f6fd] text-[#0a1628]")}><p className="whitespace-pre-wrap break-words">{message.body}</p>{message.attachmentName && <div className={cn("mt-2 flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs", mine ? "border-white/20 bg-white/10 text-white" : "border-border bg-white text-foreground")}><div className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 opacity-80" /><div className="min-w-0"><p className="truncate font-medium">{message.attachmentName}</p>{message.attachmentSize && <p className="text-[11px] opacity-70">{formatBytes(message.attachmentSize)}</p>}</div></div>{databaseMode ? <Button type="button" variant="ghost" size="sm" className={cn("h-7 px-2 text-xs", mine ? "text-white hover:bg-white/20" : "text-emerald-700 hover:bg-emerald-50")} onClick={async () => { try { const response = await fetch(`/api/messages/${encodeURIComponent(message.id)}/attachment`); const payload = await response.json() as { downloadUrl?: string; error?: string }; if (!response.ok || !payload.downloadUrl) { setError(payload.error ?? "Gagal mengunduh lampiran."); return; } window.open(payload.downloadUrl, "_blank", "noopener,noreferrer"); } catch { setError("Gagal mengunduh lampiran."); } }}>Unduh</Button> : <span className="text-[10px] opacity-60">Pratinjau</span>}</div>}<div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-60"><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time>{message.editedAt && <span>(diedit)</span>}</div></div>{mine && actionMenu}</div>; })}</>}</div>{attachment && <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground"><FileText className="size-3.5 text-emerald-600" /><span className="max-w-[200px] truncate font-medium">{attachment.name}</span><span className="text-muted-foreground">({formatBytes(attachment.size)})</span><button type="button" onClick={removeAttachment} aria-label="Hapus lampiran" className="ml-1 rounded-sm p-0.5 hover:bg-muted"><X className="size-3" /></button></div>}<form onSubmit={sendMessage} className="border-t pt-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" className="hidden" /><Button type="button" variant="outline" size="icon" aria-label="Lampirkan file" disabled={sending || (databaseMode && (!selectedId || !selected || selected.status === "blocked"))} onClick={() => fileInputRef.current?.click()}><Paperclip className="size-4 text-muted-foreground" /></Button><div className="min-w-0 flex-1">{editingId && <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>Mengedit pesan</span><Button type="button" variant="ghost" size="sm" onClick={() => { setEditingId(null); setDraft(""); }}><X className="size-3.5" />Batal</Button></div>}<Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan dalam Bahasa Indonesia..." aria-label="Isi pesan" className="min-h-12 resize-none" disabled={sending || (databaseMode && (!selectedId || !selected || selected.status === "blocked"))} /></div><Button type="submit" size="default" aria-label={editingId ? "Simpan perubahan pesan" : "Kirim pesan"} disabled={sending || !draft.trim() || (databaseMode && (!selectedId || !selected || selected.status === "blocked"))} className="w-full shrink-0 sm:w-auto">{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}<span>{editingId ? "Simpan perubahan" : "Kirim"}</span></Button></div>{databaseMode && selected?.status === "blocked" && <p className="mt-2 text-xs text-muted-foreground">Buka blokir percakapan untuk mengirim pesan baru.</p>}</form></CardContent></Card>
    </div>
  </div></main>;
}

function databaseModeUnavailable(dbMode: boolean, bootstrapped: boolean) { return dbMode && !bootstrapped; }
function StateMessage({ text }: { text: string }) { return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">{text}</div></div>; }
export default function MessagesPage({ conversationId }: { conversationId?: string } = {}) { return <Suspense fallback={<StateMessage text="Memuat pesan..." />}><MessagesContent routeConversationId={conversationId} /></Suspense>; }

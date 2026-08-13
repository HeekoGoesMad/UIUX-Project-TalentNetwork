"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { MessageCircle, Send, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";

type Participant = { id: string; name: string | null; email?: string | null };
type Conversation = { id: string; status: string; updatedAt: string; participants: Participant[]; lastMessage: { body: string; createdAt: string } | null };
type Message = { id: string; senderId: string; senderName: string | null; body: string; createdAt: string; isMine?: boolean };

const demoMessages: Message[] = [
  { id: "demo-1", senderId: "other", senderName: "Nadia Pratama", body: "Halo, terima kasih sudah menghubungi saya. Saya terbuka untuk berdiskusi tentang posisi ini.", createdAt: "2026-08-12T09:30:00Z", isMine: false },
  { id: "demo-2", senderId: "me", senderName: "Anda", body: "Halo Nadia, kami ingin berbagi detail peran dan jadwal proses selanjutnya.", createdAt: "2026-08-12T09:35:00Z", isMine: true },
];

function MessagesContent() {
  const { user, hydrated, dbMode, bootstrapped, databaseError } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const databaseMode = dbMode;
  const requestedConversationId = searchParams.get("conversationId");
  const contact = searchParams.get("contact");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(() => requestedConversationId ?? "demo");
  const [messages, setMessages] = useState<Message[]>(() => databaseMode ? [] : demoMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(databaseMode);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/messages")}`);
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!databaseMode || !user) return;
    void fetch("/api/conversations?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { conversations?: Conversation[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat percakapan.");
        const nextConversations = payload.conversations ?? [];
        setConversations(nextConversations);
        const requested = requestedConversationId && nextConversations.some((item) => item.id === requestedConversationId) ? requestedConversationId : null;
        const contacted = contact && nextConversations.find((item) => item.participants.some((participant) => [participant.id, participant.email, participant.name].includes(contact)))?.id;
        const nextId = requested ?? contacted ?? nextConversations[0]?.id ?? "";
        setSelectedId(nextId);
        if (nextId && nextId !== requestedConversationId) router.replace(`/messages?conversationId=${encodeURIComponent(nextId)}`);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat percakapan."))
      .finally(() => setLoading(false));
  }, [databaseMode, user, requestedConversationId, contact, router]);

  useEffect(() => {
    if (!databaseMode || !user || !selectedId || selectedId === "demo") return;
    void fetch(`/api/messages?conversationId=${encodeURIComponent(selectedId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { messages?: Message[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Gagal memuat pesan.");
        setMessages(payload.messages ?? []);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat pesan."))
      .finally(() => setMessagesLoading(false));
  }, [databaseMode, selectedId, user]);

  if (!hydrated || !user) return <div className="mx-auto max-w-md px-4 py-24 text-center"><div className="mx-auto size-8 animate-pulse rounded-full bg-[#d7f5e8]" /><p className="mt-4 text-sm text-muted-foreground">Menyiapkan pesan...</p></div>;
  if (databaseMode && !bootstrapped) return <StateMessage text="Memuat pesan..." />;

  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const other = selected?.participants.find((participant) => participant.id !== user.email)?.name ?? selected?.participants.find((participant) => participant.email !== user.email)?.name ?? (databaseMode ? "Kontak" : "Nadia Pratama");
  const visibleError = error ?? (databaseMode ? databaseError : null);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (!databaseMode) {
      setMessages((current) => [...current, { id: `demo-${Date.now()}`, senderId: "me", senderName: "Anda", body, createdAt: new Date().toISOString(), isMine: true }]);
      setDraft("");
      return;
    }
    if (!selectedId) return;
    const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selectedId, body }) });
    const payload = await response.json() as { message?: Message; error?: string };
    if (!response.ok || !payload.message) { setError(payload.error ?? "Pesan gagal dikirim."); return; }
    setMessages((current) => [...current, payload.message!]);
    setDraft("");
  }

  return <main className="container mx-auto px-4 py-8 sm:py-12"><div className="mx-auto max-w-6xl space-y-8">
    <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#19a974]">Komunikasi aman</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0a1628]">Pesan</h1><p className="mt-2 max-w-2xl text-muted-foreground">Bangun percakapan yang bermakna setelah kandidat memberikan consent.</p></div>
    {visibleError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Pesan belum dapat dimuat. {visibleError}</div>}
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card className="overflow-hidden"><CardHeader className="border-b bg-[#f0f6fd]/70"><CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="size-5 text-[#19a974]" /> Percakapan</CardTitle></CardHeader><CardContent className="space-y-1 p-2">
        {loading ? <p className="p-4 text-sm text-muted-foreground">Memuat percakapan...</p> : databaseMode && conversations.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Belum ada percakapan.</p> : (databaseMode ? conversations : [{ id: "demo", status: "active", updatedAt: "", participants: [{ id: "other", name: "Nadia Pratama" }], lastMessage: { body: "Percakapan demo untuk pratinjau", createdAt: "" } }]).map((conversation) => { const participant = conversation.participants.find((item) => item.email !== user.email && item.id !== user.email); return <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); if (databaseMode) router.replace(`/messages?conversationId=${encodeURIComponent(conversation.id)}`); }} className={cn("w-full rounded-xl p-4 text-left transition-colors hover:bg-[#f0f6fd]", selectedId === conversation.id && "bg-[#e3f5ed]")}><p className="font-semibold">{participant?.name ?? "Kontak"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{conversation.lastMessage?.body ?? "Belum ada pesan"}</p></button>; })}
      </CardContent></Card>
      <Card className="flex min-h-[32rem] flex-col"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-lg"><span className="flex size-9 items-center justify-center rounded-full bg-[#d7f5e8] text-[#08744f]"><ShieldCheck className="size-4" /></span>{other}</CardTitle><p className="text-sm text-muted-foreground">Percakapan hanya tersedia untuk peserta yang berwenang.</p></CardHeader><CardContent className="flex flex-1 flex-col justify-end gap-4 p-4 sm:p-6"><div className="space-y-3">{messagesLoading ? <p role="status" className="text-center text-sm text-muted-foreground">Memuat pesan...</p> : databaseMode && !selected ? <p className="text-center text-sm text-muted-foreground">Pilih percakapan untuk melihat pesan.</p> : messages.length === 0 ? <p className="text-center text-sm text-muted-foreground">Belum ada pesan dalam percakapan ini.</p> : messages.map((message) => { const mine = message.isMine ?? message.senderId === user.email; return <div key={message.id} className={cn("flex", mine && "justify-end")}><div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", mine ? "rounded-br-md bg-[#0f2040] text-white" : "rounded-bl-md bg-[#f0f6fd] text-[#0a1628]")}><p>{message.body}</p><time className="mt-1 block text-[11px] opacity-60">{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time></div></div>; })}</div><form onSubmit={sendMessage} className="flex gap-2 border-t pt-4"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan dalam Bahasa Indonesia..." aria-label="Isi pesan" className="min-h-12 resize-none" disabled={databaseMode && !selectedId} /><Button type="submit" size="icon" aria-label="Kirim pesan" disabled={databaseMode && !selectedId}><Send className="size-4" /></Button></form></CardContent></Card>
    </div>
  </div></main>;
}

function StateMessage({ text }: { text: string }) { return <div className="container mx-auto px-4 py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">{text}</div></div>; }

export default function MessagesPage() { return <Suspense fallback={<StateMessage text="Memuat pesan..." />}><MessagesContent /></Suspense>; }

"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { FileText, Flag, LoaderCircle, MessageCircle, MoreHorizontal, Paperclip, Pencil, Send, ShieldCheck, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
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
type MessagePage = { messages: Message[]; hasMore: boolean; nextCursor: string | null };
type CachedConversationList = { data?: Conversation[]; fetchedAt: number; lastAttemptAt: number; inFlight?: Promise<Conversation[]> };
type CachedMessagePage = MessagePage & { fetchedAt: number };
type CachedMessages = {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
  fetchedAt: number;
  lastAttemptAt: number;
  pages: Map<string, CachedMessagePage>;
  inFlight: Map<string, Promise<MessagePage>>;
};

const CACHE_STALE_MS = 45_000;
const conversationCache = new Map<string, CachedConversationList>();
const messageCache = new Map<string, CachedMessages>();

function isCacheStale(entry: { fetchedAt: number; lastAttemptAt: number }): boolean {
  const now = Date.now();
  return now - entry.fetchedAt >= CACHE_STALE_MS && now - entry.lastAttemptAt >= CACHE_STALE_MS;
}

function messageCacheKey(userKey: string, conversationId: string): string {
  return `${userKey}:${conversationId}`;
}

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map(existing.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

async function fetchConversations(userKey: string, force = false): Promise<Conversation[]> {
  const existing = conversationCache.get(userKey);
  if (existing?.inFlight) return existing.inFlight;
  if (!force && existing?.data !== undefined) return existing.data;

  const cache: CachedConversationList = existing ?? { fetchedAt: 0, lastAttemptAt: 0 };
  cache.lastAttemptAt = Date.now();
  const request = (async () => {
    const response = await fetch("/api/conversations?limit=100", { cache: "no-store" });
    const payload = await response.json() as { conversations?: Conversation[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Gagal memuat percakapan.");
    return payload.conversations ?? [];
  })();
  cache.inFlight = request;
  conversationCache.set(userKey, cache);

  try {
    const data = await request;
    cache.data = data;
    cache.fetchedAt = Date.now();
    return data;
  } finally {
    if (cache.inFlight === request) cache.inFlight = undefined;
  }
}

function storeMessagePage(userKey: string, conversationId: string, before: string | null | undefined, page: MessagePage): CachedMessages {
  const key = messageCacheKey(userKey, conversationId);
  const cache = messageCache.get(key) ?? {
    messages: [],
    hasMore: false,
    nextCursor: null,
    fetchedAt: 0,
    lastAttemptAt: 0,
    pages: new Map<string, CachedMessagePage>(),
    inFlight: new Map<string, Promise<MessagePage>>(),
  };
  cache.pages.set(before ?? "initial", { ...page, fetchedAt: Date.now() });
  cache.messages = mergeMessages(cache.messages, page.messages);
  cache.hasMore = page.hasMore;
  cache.nextCursor = page.nextCursor;
  cache.fetchedAt = Date.now();
  messageCache.set(key, cache);
  return cache;
}

async function fetchMessagePage(userKey: string, conversationId: string, before?: string | null, force = false): Promise<MessagePage> {
  const key = messageCacheKey(userKey, conversationId);
  const pageKey = before ?? "initial";
  const existing = messageCache.get(key);
  if (existing?.inFlight.get(pageKey)) return existing.inFlight.get(pageKey)!;
  const cachedPage = existing?.pages.get(pageKey);
  if (!force && cachedPage) return cachedPage;

  const cache = existing ?? {
    messages: [],
    hasMore: false,
    nextCursor: null,
    fetchedAt: 0,
    lastAttemptAt: 0,
    pages: new Map<string, CachedMessagePage>(),
    inFlight: new Map<string, Promise<MessagePage>>(),
  };
  cache.lastAttemptAt = Date.now();
  const request = (async () => {
    const query = new URLSearchParams({ conversationId, limit: "30" });
    if (before) query.set("before", before);
    const response = await fetch(`/api/messages?${query}`, { cache: "no-store" });
    const payload = await response.json() as { messages?: Message[]; hasMore?: boolean; nextCursor?: string | null; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Gagal memuat pesan.");
    return { messages: payload.messages ?? [], hasMore: Boolean(payload.hasMore), nextCursor: payload.nextCursor ?? null };
  })();
  cache.inFlight.set(pageKey, request);
  messageCache.set(key, cache);

  try {
    return await request.then((page) => {
      storeMessagePage(userKey, conversationId, before, page);
      return page;
    });
  } finally {
    if (cache.inFlight.get(pageKey) === request) cache.inFlight.delete(pageKey);
  }
}

function updateConversationCache(userKey: string, update: (conversations: Conversation[]) => Conversation[]): void {
  const cache = conversationCache.get(userKey);
  if (cache?.data !== undefined) cache.data = update(cache.data);
}

function updateMessageCache(userKey: string, conversationId: string, update: (messages: Message[]) => Message[]): void {
  const cache = messageCache.get(messageCacheKey(userKey, conversationId));
  if (!cache) return;
  cache.messages = update(cache.messages);
  cache.pages.forEach((page) => { page.messages = update(page.messages); });
}

function navigateToConversation(router: { replace: (href: string, options?: { scroll?: boolean }) => void }, pathname: string | null, currentQueryConversationId: string | null, conversationId: string): void {
  const base = pathname?.startsWith("/candidate/messages") ? "/candidate/messages" : pathname?.startsWith("/recruiter/messages") ? "/recruiter/messages" : "/messages";
  if (base !== "/messages") {
    if ((pathname === base && currentQueryConversationId === conversationId) || pathname === `${base}/${encodeURIComponent(conversationId)}`) return;
    router.replace(`${base}?conversationId=${encodeURIComponent(conversationId)}`, { scroll: false });
    return;
  }
  const canonicalPath = `/messages/${encodeURIComponent(conversationId)}`;
  if (pathname === canonicalPath || (pathname === "/messages" && currentQueryConversationId === conversationId)) return;
  router.replace(canonicalPath, { scroll: false });
}

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
  const userEmail = user?.email ?? "";
  const userRole = user?.role ?? null;
  const appUserKey = currentUserId ?? (userEmail && userRole ? `${userRole}:${userEmail.toLowerCase()}` : null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedConversationId = routeConversationId ?? searchParams.get("conversationId");
  const currentQueryConversationId = searchParams.get("conversationId");
  const contact = searchParams.get("contact");
  const candidateProfileId = searchParams.get("candidateProfileId");
  const consentRequestItemId = searchParams.get("consentRequestItemId");
  const initialConversationData = appUserKey ? conversationCache.get(appUserKey)?.data : undefined;
  const initialSelectedId = requestedConversationId ?? "";
  const initialMessageData = appUserKey && initialSelectedId ? messageCache.get(messageCacheKey(appUserKey, initialSelectedId)) : undefined;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const consentConversationAttempt = useRef<string | null>(null);
  const selectedIdRef = useRef(initialSelectedId);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversationData ?? []);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!initialSelectedId) return [];
    return dbMode ? initialMessageData?.messages ?? [] : demoMessages;
  });
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(dbMode && initialConversationData === undefined);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState<Message | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const prevSelectedIdRef = useRef<string | null>(null);
  const prevLastMessageIdRef = useRef<string | null>(null);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    if (!selectedId || messages.length === 0 || !messagesContainerRef.current) {
      prevSelectedIdRef.current = selectedId;
      prevLastMessageIdRef.current = null;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isDifferentConversation = prevSelectedIdRef.current !== selectedId;
    const isNewMessageAtBottom = prevLastMessageIdRef.current !== lastMessage?.id;

    if (isDifferentConversation || isNewMessageAtBottom) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }

    prevSelectedIdRef.current = selectedId;
    prevLastMessageIdRef.current = lastMessage?.id ?? null;
  }, [messages, selectedId]);

  function handleCloseChat() {
    setSelectedId("");
    setMessages([]);
    setEditingId(null);
    setDraft("");
    removeAttachment();
    const base = pathname?.startsWith("/candidate/messages")
      ? "/candidate/messages"
      : pathname?.startsWith("/recruiter/messages")
      ? "/recruiter/messages"
      : "/messages";
    router.replace(base, { scroll: false });
  }

  useEffect(() => {
    if (hydrated && !(userEmail && userRole)) router.replace(`/login?next=${encodeURIComponent("/messages")}`);
  }, [hydrated, userEmail, userRole, router]);

  useEffect(() => {
    if (!dbMode || !appUserKey) return;
    let cancelled = false;
    const cachedEntry = conversationCache.get(appUserKey);
    const cached = cachedEntry?.data;

    const applySelection = (next: Conversation[], navigate: boolean, deferMissingRequested = false): string | null => {
      const requested = requestedConversationId && next.some((item) => item.id === requestedConversationId) ? requestedConversationId : null;
      if (requestedConversationId && !requested && deferMissingRequested) return null;
      const contacted = contact ? next.find((item) => item.participants.some((participant) => [participant.id, participant.email, participant.name].includes(contact)))?.id ?? "" : "";
      // ponytail: no auto-pick of current/next[0]; empty unless explicit requested/contact match
      const nextId = requested ?? contacted;
      setSelectedId(nextId);
      if (nextId && navigate) navigateToConversation(router, pathname, currentQueryConversationId, nextId);
      else if (!nextId && contact) setError("Belum ada percakapan dengan recruiter ini.");
      return nextId || null;
    };

    const hasContactMatch = Boolean(cached?.some((item) => item.participants.some((participant) => [participant.id, participant.email, participant.name].includes(contact ?? ""))));
    const stale = cachedEntry ? isCacheStale(cachedEntry) : true;
    if (cached !== undefined) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setConversations(cached);
        setLoading(false);
        applySelection(cached, false, stale);
      });
    } else {
      // This is the only blocking inbox load. Cached lists stay rendered during revalidation.
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setLoading(true);
        setError(null);
      });
    }

    const shouldFetch = cached === undefined || stale || (Boolean(contact) && !hasContactMatch);
    if (!shouldFetch) return () => { cancelled = true; };

    void (async () => {
      try {
        let next = await fetchConversations(appUserKey, true);
        if (cancelled) return;
        setConversations(next);
        let nextId = applySelection(next, false);

        if (!nextId && contact && candidateProfileId && consentRequestItemId) {
          const attemptKey = `${appUserKey}:${contact}:${candidateProfileId}:${consentRequestItemId}`;
          if (consentConversationAttempt.current !== attemptKey) {
            consentConversationAttempt.current = attemptKey;
            const createResponse = await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateProfileId, consentRequestItemId }),
            });
            const createPayload = await createResponse.json() as { conversationId?: string; error?: string };
            if (!createResponse.ok || !createPayload.conversationId) throw new Error(createPayload.error ?? "Percakapan belum dapat dibuat.");
            next = await fetchConversations(appUserKey, true);
            if (cancelled) return;
            setConversations(next);
            nextId = createPayload.conversationId;
            setSelectedId(nextId);
            navigateToConversation(router, pathname, currentQueryConversationId, nextId);
          }
        }
        if (!nextId && contact) setError("Belum ada percakapan dengan recruiter ini.");
        else setError(null);
      } catch (reason: unknown) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Gagal memuat percakapan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [dbMode, appUserKey, requestedConversationId, contact, candidateProfileId, consentRequestItemId, pathname, currentQueryConversationId, router]);

  async function loadMessages(before?: string | null, options: { background?: boolean } = {}) {
    const background = options.background === true;
    if (!dbMode || !appUserKey || !selectedId || selectedId === "demo" || (before && messagesLoading)) return;
    const key = messageCacheKey(appUserKey, selectedId);
    const cachedEntry = messageCache.get(key);
    const pageKey = before ?? "initial";
    const cachedPage = cachedEntry?.pages.get(pageKey);

    if (!before && cachedEntry?.pages.size) {
      setMessages(cachedEntry.messages);
      setHasMore(cachedEntry.hasMore);
      setNextCursor(cachedEntry.nextCursor);
    }
    if (!before && !background) {
      setEditingId(null);
      setDraft("");
      setSelectedFile(null);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (cachedPage && !background) return;

    if (!before && !cachedEntry?.pages.size && !background) {
      setMessages([]);
    }
    if (!background) {
      setMessagesLoading(true);
      setError(null);
    }
    try {
      const page = await fetchMessagePage(appUserKey, selectedId, before, true);
      const current = messageCache.get(key);
      setMessages(current?.messages ?? page.messages);
      setHasMore(current?.hasMore ?? page.hasMore);
      setNextCursor(current?.nextCursor ?? page.nextCursor);
      if (!before) void fetch(`/api/conversations/${selectedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read" }) });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal memuat pesan.");
    } finally {
      if (!background) setMessagesLoading(false);
    }
  }

  // Keep the first-load spinner, but never clear a cached conversation while REST revalidates it.
  useEffect(() => {
    if (!dbMode || !appUserKey || !selectedId || selectedId === "demo") return;
    const cachedEntry = messageCache.get(messageCacheKey(appUserKey, selectedId));
    // The request callback owns the loading state so cached messages remain paintable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessages(undefined, { background: Boolean(cachedEntry?.pages.size && isCacheStale(cachedEntry)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMode, appUserKey, selectedId]);

  useEffect(() => {
    if (!dbMode || !appUserKey) return;
    let cancelled = false;
    const revalidate = () => {
      if (document.visibilityState !== "visible") return;

      const conversationsEntry = conversationCache.get(appUserKey);
      if (conversationsEntry?.data !== undefined && isCacheStale(conversationsEntry)) {
        void fetchConversations(appUserKey, true).then((next) => {
          if (!cancelled) setConversations(next);
        }).catch((reason: unknown) => {
          if (!cancelled) setError(reason instanceof Error ? reason.message : "Gagal memuat percakapan.");
        });
      }

      if (!selectedId || selectedId === "demo") return;
      const messagesEntry = messageCache.get(messageCacheKey(appUserKey, selectedId));
      if (!messagesEntry?.pages.size || !isCacheStale(messagesEntry)) return;
      void fetchMessagePage(appUserKey, selectedId, undefined, true).then(() => {
        const current = messageCache.get(messageCacheKey(appUserKey, selectedId));
        if (!cancelled && current) {
          setMessages(current.messages);
          setHasMore(current.hasMore);
          setNextCursor(current.nextCursor);
        }
      }).catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Gagal memuat pesan.");
      });
    };

    document.addEventListener("visibilitychange", revalidate);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [dbMode, appUserKey, selectedId]);

  useEffect(() => {
    if (!dbMode || !selectedId || !currentUserId || !appUserKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
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
        updateMessageCache(appUserKey, selectedId, (current) => mergeMessages(current, [incoming]));
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      }).subscribe();
      return () => { void client.removeChannel(channel); };
    } catch {
      return undefined;
    }
  }, [dbMode, selectedId, currentUserId, appUserKey]);

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
  const hasCachedInboxData = Boolean(
    appUserKey && (
      conversationCache.get(appUserKey)?.data !== undefined ||
      (selectedId && messageCache.get(messageCacheKey(appUserKey, selectedId))?.pages.size)
    ),
  );
  if (databaseModeUnavailable(dbMode, bootstrapped) && !hasCachedInboxData) return <StateMessage text="Memuat pesan..." />;
  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const other = selected?.participants.find((participant) => participant.id !== currentUserId && participant.email !== userEmail)?.name ?? (dbMode ? "Kontak" : "Nadia Pratama");
  const hasActiveThread = databaseMode ? Boolean(selected) : selectedId === "demo";
  const visibleError = error ?? (dbMode ? databaseError : null);

  async function sendMessage(event?: FormEvent) {
    if (event) event.preventDefault();
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
      if (result.message) {
        if (editingId) updateMessageCache(appUserKey ?? "", selectedId, (current) => current.map((item) => item.id === editingId ? result.message! : item));
        else updateMessageCache(appUserKey ?? "", selectedId, (current) => mergeMessages(current, [result.message!]));
        setMessages((current) => editingId ? current.map((item) => item.id === editingId ? result.message! : item) : [...current, result.message!]);
      }
      setDraft("");
      removeAttachment();
      setEditingId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pesan gagal disimpan.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      const body = draft.trim();
      const canSend = !sending && Boolean(body) && !(databaseMode && (!selectedId || !selected || selected.status === "blocked"));
      if (canSend) {
        void sendMessage();
      }
    }
  }

  async function messageAction(message: Message, action: "edit" | "delete" | "report") {
    if (action === "edit") {
      setEditingId(message.id);
      setDraft(message.body);
      return;
    }
    if (action === "delete") {
      setDeleteConfirmMessage(message);
      return;
    }
    const reason = action === "report" ? window.prompt("Jelaskan alasan laporan ini") : null;
    if (action === "report" && !reason) return;
    setActionLoading(`${message.id}:${action}`);
    setError(null);
    try {
      const response = await fetch(`/api/messages/${message.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Aksi belum dapat dilakukan.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aksi belum dapat dilakukan.");
    } finally {
      setActionLoading(null);
    }
  }

  async function executeDeleteMessage() {
    if (!deleteConfirmMessage) return;
    const message = deleteConfirmMessage;
    setDeleteLoading(true);
    setError(null);
    try {
      if (databaseMode) {
        const response = await fetch(`/api/messages/${message.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Gagal menghapus pesan.");
        updateMessageCache(appUserKey ?? "", selectedId, (current) => current.filter((item) => item.id !== message.id));
      }
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setDeleteConfirmMessage(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal menghapus pesan.");
    } finally {
      setDeleteLoading(false);
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
      updateConversationCache(appUserKey ?? "", (current) => current.map((item) => item.id === selectedId ? { ...item, status: action === "block" ? "blocked" : "active" } : item));
      setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, status: action === "block" ? "blocked" : "active" } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Percakapan belum dapat diperbarui.");
    } finally {
      setBlockLoading(false);
    }
  }

  async function retryLoad() {
    if (!dbMode || !appUserKey) return;
    setError(null);
    try {
      const next = await fetchConversations(appUserKey, true);
      setConversations(next);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Gagal memuat percakapan.");
      return;
    }
    if (selectedId && selectedId !== "demo") await loadMessages(undefined, { background: false });
  }

  const isEmbedded = Boolean(pathname?.startsWith("/candidate") || pathname?.startsWith("/recruiter"));

  const pageBody = (
    <div className={cn("space-y-4", !isEmbedded && "mx-auto max-w-6xl")}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pesan</h1>
        <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
          Percakapan hanya tersedia selama consent aktif dan masa penyimpanan belum berakhir.
        </p>
      </div>
      {visibleError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs sm:text-sm text-destructive">
          <span>Gagal memuat atau memperbarui pesan. {visibleError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void retryLoad()}>Coba lagi</Button>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr] h-[calc(100vh-14rem)] min-h-[500px] max-h-[680px] overflow-hidden">
        {/* Left: Conversations list */}
        <Card className={cn(
          "flex flex-col h-full overflow-hidden border bg-card shadow-xs",
          hasActiveThread && "hidden lg:flex"
        )}>
          <CardHeader className="shrink-0 border-b py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="size-4 text-muted-foreground" />
              <span>Percakapan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-1 p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                ))}
              </div>
            ) : databaseMode && conversations.length === 0 ? (
              <EmptyState icon={MessageCircle} title="Belum ada percakapan." className="border-0 bg-transparent p-6 shadow-none" />
            ) : (
              (databaseMode ? conversations : [
                { id: "demo", status: "active", updatedAt: "", participants: [{ id: "other", name: "Nadia Pratama" }], lastMessage: { body: "Percakapan demo untuk pratinjau", createdAt: "" } }
              ]).map((conversation) => {
                const participant = conversation.participants.find((item) => item.id !== currentUserId && item.email !== userEmail);
                return (
                  <button
                    type="button"
                    key={conversation.id}
                    onClick={() => {
                      setSelectedId(conversation.id);
                      if (!databaseMode && conversation.id === "demo") setMessages((current) => (current.length ? current : demoMessages));
                      if (databaseMode) navigateToConversation(router, pathname, currentQueryConversationId, conversation.id);
                    }}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/70 cursor-pointer",
                      selectedId === conversation.id && "bg-muted font-medium"
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{participant?.name ?? "Kontak"}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.lastMessage?.body ?? "Belum ada pesan"}</p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right: Active Chat */}
        <Card className={cn(
          "flex flex-col h-full min-w-0 overflow-hidden border bg-card shadow-xs",
          !hasActiveThread && "hidden lg:flex"
        )}>
          <CardHeader className="shrink-0 border-b py-3 px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                {hasActiveThread ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCloseChat}
                      aria-label="Tutup percakapan"
                      className="size-7 shrink-0 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <X className="size-4" />
                    </Button>
                    <span className="truncate text-foreground font-semibold">{other}</span>
                    <span title="Terverifikasi" className="inline-flex shrink-0 items-center text-emerald-600 dark:text-emerald-500" aria-label="Terverifikasi">
                      <ShieldCheck className="size-4" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <MessageCircle className="size-3.5" />
                    </span>
                    <span className="truncate text-muted-foreground font-normal">Pilih percakapan</span>
                  </>
                )}
              </CardTitle>
              {databaseMode && selected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void toggleBlock()}
                  disabled={blockLoading}
                  aria-label={selected.status === "blocked" ? "Buka blokir percakapan" : "Blokir percakapan"}
                  className="shrink-0 text-xs"
                >
                  {blockLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                  <span>{selected.status === "blocked" ? "Buka blokir" : "Blokir"}</span>
                </Button>
              )}
            </div>
            {databaseMode && selected?.status === "blocked" && (
              <p role="status" className="mt-1 text-xs text-muted-foreground">
                Percakapan diblokir. Buka blokir untuk mengirim pesan kembali.
              </p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0 p-4 sm:p-5 overflow-hidden">
            <div ref={messagesContainerRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              {messagesLoading && messages.length === 0 ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-2.5">
                    <Skeleton className="size-7 rounded-full shrink-0" />
                    <Skeleton className="h-14 w-64 rounded-2xl rounded-tl-sm" />
                  </div>
                  <div className="flex items-start justify-end gap-2.5">
                    <Skeleton className="h-12 w-52 rounded-2xl rounded-tr-sm" />
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Skeleton className="size-7 rounded-full shrink-0" />
                    <Skeleton className="h-16 w-72 rounded-2xl rounded-tl-sm" />
                  </div>
                  <div className="flex items-start justify-end gap-2.5">
                    <Skeleton className="h-10 w-44 rounded-2xl rounded-tr-sm" />
                  </div>
                </div>
              ) : (!selectedId || (databaseMode && !selected)) ? (
                <EmptyState icon={MessageCircle} title="Pilih percakapan untuk melihat pesan." className="border-0 bg-transparent shadow-none" />
              ) : messages.length === 0 ? (
                <EmptyState icon={MessageCircle} title="Belum ada pesan dalam percakapan ini." className="border-0 bg-transparent shadow-none" />
              ) : (
                <>
                  {hasMore && nextCursor && (
                    <div className="flex justify-center pb-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadMessages(nextCursor)}
                        disabled={messagesLoading}
                      >
                        {messagesLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                        {messagesLoading ? "Memuat pesan..." : "Muat pesan sebelumnya"}
                      </Button>
                    </div>
                  )}
                  {messages.map((message) => {
                    const mine = message.isMine ?? message.senderId === currentUserId;
                    const actionPending = actionLoading?.startsWith(`${message.id}:`) ?? false;
                    const actionMenu = databaseMode ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Aksi untuk pesan ${mine ? "Anda" : "ini"}`}
                            disabled={Boolean(actionLoading)}
                            className="mt-1 size-8 shrink-0 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                          >
                            {actionPending ? <LoaderCircle className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={mine ? "end" : "start"}>
                          {mine ? (
                            <>
                              <DropdownMenuItem onSelect={() => void messageAction(message, "edit")}>
                                <Pencil className="size-4" />Edit pesan
                              </DropdownMenuItem>
                              <DropdownMenuItem destructive onSelect={() => void messageAction(message, "delete")}>
                                <Trash2 className="size-4" />Hapus pesan
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onSelect={() => void messageAction(message, "report")}>
                              <Flag className="size-4" />Laporkan pesan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null;

                    return (
                      <div key={message.id} className={cn("group flex items-start gap-2", mine ? "justify-end" : "justify-start")}>
                        {!mine && actionMenu}
                        <div className={cn("max-w-[85%] min-w-0 rounded-2xl px-4 py-3 text-sm leading-6", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground")}>
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          {message.attachmentName && (
                            <div className={cn("mt-2 flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs", mine ? "border-white/20 bg-white/10 text-white" : "border-border bg-white text-foreground")}>
                              <div className="flex min-w-0 items-center gap-2">
                                <FileText className="size-4 shrink-0 opacity-80" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{message.attachmentName}</p>
                                  {message.attachmentSize && <p className="text-xs opacity-70">{formatBytes(message.attachmentSize)}</p>}
                                  {message.attachmentScanStatus && message.attachmentScanStatus !== "not_applicable" && (
                                    <p className="text-xs opacity-70">
                                      {message.attachmentScanStatus === "pending"
                                        ? "Memeriksa lampiran…"
                                        : message.attachmentScanStatus === "blocked"
                                        ? "Lampiran diblokir"
                                        : message.attachmentScanStatus === "clean"
                                        ? "Lampiran aman"
                                        : message.attachmentScanStatus}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {databaseMode ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className={cn("h-7 px-2 text-xs", mine ? "text-white hover:bg-white/20" : "text-emerald-700 hover:bg-emerald-50")}
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/messages/${encodeURIComponent(message.id)}/attachment`);
                                      const payload = await response.json() as { downloadUrl?: string; error?: string };
                                      if (!response.ok || !payload.downloadUrl) {
                                        setError(payload.error ?? "Gagal mengunduh lampiran.");
                                        return;
                                      }
                                      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
                                    } catch {
                                      setError("Gagal mengunduh lampiran.");
                                    }
                                  }}
                                >
                                  Unduh
                                </Button>
                              ) : (
                                <span className="text-xs opacity-60">Pratinjau</span>
                              )}
                            </div>
                          )}
                          <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-60">
                            <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</time>
                            {message.editedAt && <span>(diedit)</span>}
                          </div>
                        </div>
                        {mine && actionMenu}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {attachment && (
              <div className="shrink-0 mt-2 flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-xs text-foreground">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="max-w-[200px] truncate font-medium">{attachment.name}</span>
                <span className="text-muted-foreground">({formatBytes(attachment.size)})</span>
                <button type="button" onClick={removeAttachment} aria-label="Hapus lampiran" className="ml-1 rounded-sm p-0.5 hover:bg-muted cursor-pointer">
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            {hasActiveThread ? (
              <form onSubmit={sendMessage} className="shrink-0 border-t pt-3 mt-2">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Lampirkan file"
                    disabled={sending || (databaseMode && (!selectedId || !selected || selected.status === "blocked"))}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4 text-muted-foreground" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    {editingId && (
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Mengedit pesan</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingId(null); setDraft(""); }}>
                          <X className="size-3.5" />Batal
                        </Button>
                      </div>
                    )}
                    {editingId && selectedFile && (
                      <p className="mb-2 text-xs text-muted-foreground">Lampiran diabaikan saat mengedit pesan.</p>
                    )}
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tulis pesan dalam Bahasa Indonesia..."
                      aria-label="Isi pesan"
                      className="min-h-12 resize-none rounded-md text-xs sm:text-sm"
                      disabled={sending || (databaseMode && (!selectedId || !selected || selected.status === "blocked"))}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="default"
                    aria-label={editingId ? "Simpan perubahan pesan" : "Kirim pesan"}
                    disabled={sending || !draft.trim() || (databaseMode && (!selectedId || !selected || selected.status === "blocked"))}
                    className="w-full shrink-0 rounded-md sm:w-auto"
                  >
                    {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                    <span>{sending && selectedFile && !editingId ? "Mengunggah…" : editingId ? "Simpan perubahan" : "Kirim"}</span>
                  </Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Dialog open={Boolean(deleteConfirmMessage)} onOpenChange={(open) => { if (!open && !deleteLoading) setDeleteConfirmMessage(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Hapus Pesan?</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Pesan ini akan dihapus secara permanen dari percakapan. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmMessage && (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs sm:text-sm">
              <p className="line-clamp-3 text-muted-foreground italic">
                &ldquo;{deleteConfirmMessage.body}&rdquo;
              </p>
              {deleteConfirmMessage.attachmentName && (
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  Lampiran: {deleteConfirmMessage.attachmentName}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleteLoading}
              onClick={() => setDeleteConfirmMessage(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteLoading}
              onClick={() => void executeDeleteMessage()}
            >
              {deleteLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              <span>{deleteLoading ? "Menghapus..." : "Hapus Pesan"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isEmbedded) {
    return <div className="pb-12">{pageBody}</div>;
  }

  return <main className="container mx-auto px-4 py-8">{pageBody}</main>;
}

function databaseModeUnavailable(dbMode: boolean, bootstrapped: boolean) { return dbMode && !bootstrapped; }
function StateMessage({ text }: { text: string }) { return <div className="mx-auto max-w-6xl py-8"><div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground" role="status">{text}</div></div>; }
export default function MessagesPage({ conversationId }: { conversationId?: string } = {}) { return <Suspense fallback={<StateMessage text="Memuat pesan..." />}><MessagesContent routeConversationId={conversationId} /></Suspense>; }

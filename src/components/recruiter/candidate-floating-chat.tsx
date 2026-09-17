"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CornerDownLeft,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CandidateAvatar } from "@/components/talent/avatar";
import { Button } from "@/components/ui/button";
import { UUID_RE, cn } from "@/lib/utils";
import type { Candidate } from "@/types";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  body: string;
  createdAt: string;
  isMine: boolean;
}

interface CandidateFloatingChatProps {
  candidate: Candidate;
  unlocked: boolean;
  dbMode: boolean;
  currentUserEmail?: string;
}

export function CandidateFloatingChat({
  candidate,
  unlocked,
  dbMode,
  currentUserEmail,
}: CandidateFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Initialize or fetch conversation
  useEffect(() => {
    if (!isOpen || !unlocked) return;

    let isMounted = true;
    const isUuidCandidate = UUID_RE.test(candidate.id);

    async function initConversation() {
      setLoading(true);
      try {
        if (dbMode && isUuidCandidate) {
          // Get or create conversation via API
          const convRes = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateProfileId: candidate.id }),
          });
          const convData = (await convRes.json()) as {
            conversationId?: string;
            error?: string;
          };

          if (convRes.ok && convData.conversationId && isMounted) {
            setConversationId(convData.conversationId);
            // Fetch messages
            const msgRes = await fetch(
              `/api/messages?conversationId=${encodeURIComponent(
                convData.conversationId
              )}&limit=50`
            );
            const msgData = (await msgRes.json()) as {
              messages?: Array<{
                id: string;
                senderId: string;
                senderName: string | null;
                body: string;
                createdAt: string;
                isMine?: boolean;
              }>;
            };

            if (msgRes.ok && msgData.messages && isMounted) {
              setMessages(
                msgData.messages.map((m) => ({
                  id: m.id,
                  senderId: m.senderId,
                  senderName: m.senderName,
                  body: m.body,
                  createdAt: m.createdAt,
                  isMine: Boolean(m.isMine),
                }))
              );
            }
          }
        } else {
          // Local/Demo Mode messages
          const storageKey = `direct_chat_${candidate.id}`;
          const saved = localStorage.getItem(storageKey);
          if (saved && isMounted) {
            try {
              setMessages(JSON.parse(saved));
            } catch {
              // fallback
            }
          } else if (isMounted && messages.length === 0) {
            setMessages([
              {
                id: `welcome-${candidate.id}`,
                senderId: candidate.id,
                senderName: candidate.name,
                body: `Halo! Terima kasih telah membuka profil saya untuk posisi ${
                  candidate.targetRole || candidate.role || "yang relevan"
                }. Ada yang ingin didiskusikan terkait peluang kerja ini?`,
                createdAt: new Date().toISOString(),
                isMine: false,
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Gagal memuat percakapan langsung:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void initConversation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, unlocked, candidate.id, candidate.name, candidate.role, candidate.targetRole, dbMode, currentUserEmail]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom(false);
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    const tempId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      senderId: currentUserEmail || "me",
      senderName: "Saya",
      body: text,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    // Optimistic append
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    try {
      if (dbMode && conversationId) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            body: text,
          }),
        });
        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error || "Gagal mengirim pesan.");
        }
      } else {
        // Save demo message to local storage
        const storageKey = `direct_chat_${candidate.id}`;
        const current = [...messages, newMsg];
        localStorage.setItem(storageKey, JSON.stringify(current));
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  };

  // Only appear after recruiter unlocks/scans candidate
  if (!unlocked) return null;

  // Floating trigger button (when closed or minimized)
  if (!isOpen || isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-4 py-3 text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition-all hover:scale-105 hover:shadow-[0_12px_28px_rgba(124,58,237,0.45)] active:scale-95 cursor-pointer"
          aria-label={`Chat langsung dengan ${candidate.name}`}
        >
          <div className="relative">
            <MessageSquare className="size-5" />
            <span className="absolute -top-1 -right-1 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 border border-white" />
            </span>
          </div>
          <span className="text-xs font-semibold tracking-wide sm:inline">
            Chat {candidate.name.split(" ")[0]}
          </span>
        </button>
      </div>
    );
  }

  // Active Mini Chatbox Widget
  return (
    <div
      role="dialog"
      aria-label={`Percakapan langsung dengan ${candidate.name}`}
      className="fixed bottom-6 right-6 z-50 flex h-[490px] max-h-[calc(100vh-5rem)] w-[360px] sm:w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-purple-200/90 bg-white shadow-[0_16px_40px_rgba(124,58,237,0.22)] dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-4 py-3 text-white shadow-xs dark:border-purple-900/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="size-9 rounded-full border-2 border-white/80 overflow-hidden bg-white/10">
              <CandidateAvatar
                initials={candidate.initials}
                avatarUrl={candidate.avatarUrl}
                name={candidate.name}
                locked={false}
                className="size-full text-xs"
              />
            </div>
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 border border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-bold leading-tight">
              {candidate.name}
            </h3>
            <p className="truncate text-[10px] text-purple-100/80 font-medium">
              {candidate.role || "Talent Terbuka"}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Dropdown / Minimize button to shrink to icon */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Kecilkan chatbox menjadi icon"
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
            aria-label="Kecilkan chatbox"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Tutup chatbox"
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
            aria-label="Tutup percakapan"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Candidate Notice / Security banner */}
      <div className="border-b border-purple-50 bg-purple-50/50 px-3.5 py-1.5 text-[11px] text-purple-900/80 flex items-center gap-1.5 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-200">
        <Sparkles className="size-3 text-[#7C3AED] shrink-0" />
        <span className="truncate">
          Terkunci langsung ke <strong>{candidate.name}</strong>
        </span>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-950/30 text-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin text-[#7C3AED]" />
            <p className="text-[11px]">Menyiapkan obrolan langsung...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4 py-8">
            <MessageSquare className="size-8 text-purple-300 mb-2" />
            <p className="font-semibold text-foreground text-xs">Mulai percakapan</p>
            <p className="text-[11px] mt-1">
              Kirim pesan pertama Anda untuk menyapa dan mendiskusikan peluang kerja.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[82%]",
                msg.isMine ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed break-words",
                  msg.isMine
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-xs"
                    : "bg-white border border-slate-200/90 text-foreground dark:bg-slate-800 dark:border-slate-700 rounded-bl-xs"
                )}
              >
                {msg.body}
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5 px-1 font-mono">
                {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Footer */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ketik pesan ke ${candidate.name.split(" ")[0]}...`}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-foreground outline-none transition-colors focus:border-purple-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:border-purple-400"
            disabled={sending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim() || sending}
            className="h-8.5 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl shadow-xs"
          >
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

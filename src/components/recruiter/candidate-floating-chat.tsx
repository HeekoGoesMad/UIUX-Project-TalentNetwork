"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Loader2,
  MessageSquare,
  MessageSquareQuote,
  Send,
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
  onOpenQuestionModal?: () => void;
  onOpenPromptModal?: () => void;
}

export function CandidateFloatingChat({
  candidate,
  unlocked,
  dbMode,
  currentUserEmail,
  onOpenQuestionModal,
  onOpenPromptModal,
}: CandidateFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Initialize or fetch conversation when chat is open
  useEffect(() => {
    if (!isOpen || !unlocked) return;

    let isMounted = true;
    const isUuidCandidate = UUID_RE.test(candidate.id);

    async function initConversation() {
      setLoading(true);
      try {
        if (dbMode && isUuidCandidate) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unlocked, candidate.id, candidate.name, candidate.role, candidate.targetRole, dbMode, currentUserEmail]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      inputRef.current?.focus();
    }
  }, [isOpen, messages.length]);

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

  const firstName = candidate.name.split(" ")[0];

  // Collapsed Unified Floating Dock (Bottom-Right)
  if (!isOpen) {
    return (
      <aside
        aria-label="Aksi Cepat & Chat Rekruter"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(124,58,237,0.16)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_14px_36px_rgba(124,58,237,0.22)] dark:border-purple-900/60 dark:bg-slate-900/95 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        {/* Shortcut: Pertanyaan AI */}
        {onOpenQuestionModal && (
          <button
            type="button"
            onClick={onOpenQuestionModal}
            title="Pertanyaan Wawancara AI"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-purple-50 hover:text-[#7C3AED] dark:text-slate-200 dark:hover:bg-purple-950/60 dark:hover:text-purple-300 cursor-pointer"
          >
            <Brain className="size-3.5 text-[#7C3AED]" />
            <span className="hidden sm:inline">Pertanyaan AI</span>
          </button>
        )}

        {/* Shortcut: Prompt Pesan */}
        {onOpenPromptModal && (
          <button
            type="button"
            onClick={onOpenPromptModal}
            title="Prompt Pesan Outreach"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-purple-50 hover:text-[#7C3AED] dark:text-slate-200 dark:hover:bg-purple-950/60 dark:hover:text-purple-300 cursor-pointer"
          >
            <MessageSquareQuote className="size-3.5 text-[#7C3AED]" />
            <span className="hidden sm:inline">Prompt Pesan</span>
          </button>
        )}

        {/* Shortcut: Operations */}
        <Link
          href="/recruiter/operations"
          title="Buka Halaman Operations"
          className="flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="hidden md:inline">Operations</span>
          <ArrowRight className="size-3.5" />
        </Link>

        {/* Subtle vertical separator */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Primary Action: Chat Candidate (Solid Purple #7C3AED, NO gradient) */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#6D28D9] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          aria-label={`Buka chat dengan ${candidate.name}`}
        >
          <MessageSquare className="size-4" />
          <span>Chat {firstName}</span>
        </button>
      </aside>
    );
  }

  // Active Mini Chatbox Widget
  return (
    <div
      role="dialog"
      aria-label={`Percakapan langsung dengan ${candidate.name}`}
      className="fixed bottom-6 right-6 z-50 flex h-[500px] max-h-[calc(100vh-5rem)] w-[360px] sm:w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-purple-200/90 bg-white shadow-[0_16px_40px_rgba(124,58,237,0.22)] dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 slide-in-from-bottom-6 duration-300 ease-out"
    >
      {/* Header — Solid Purple (#7C3AED, NO gradient) */}
      <div className="flex items-center justify-between bg-[#7C3AED] px-4 py-3 text-white shadow-xs">
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

        {/* Header Action Controls: Mini-Icon Bar for quick AI & Operations without closing chat */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenQuestionModal && (
            <button
              type="button"
              onClick={onOpenQuestionModal}
              title="Pertanyaan Wawancara AI"
              className="rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
              aria-label="Pertanyaan AI"
            >
              <Brain className="size-4" />
            </button>
          )}
          {onOpenPromptModal && (
            <button
              type="button"
              onClick={onOpenPromptModal}
              title="Prompt Pesan Outreach AI"
              className="rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
              aria-label="Prompt Pesan"
            >
              <MessageSquareQuote className="size-4" />
            </button>
          )}
          <Link
            href="/recruiter/operations"
            title="Lanjutkan di Operations"
            className="rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
            aria-label="Operations"
          >
            <ArrowRight className="size-4" />
          </Link>

          <div className="h-4 w-px bg-white/30 mx-0.5" />

          {/* Single Close Button (No duplicate dropdown) */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Tutup chatbox"
            className="rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
            aria-label="Tutup percakapan"
          >
            <X className="size-4" />
          </button>
        </div>
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
                    ? "bg-[#7C3AED] text-white rounded-br-xs"
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
            placeholder={`Ketik pesan ke ${firstName}...`}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-foreground outline-none transition-colors focus:border-purple-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:border-purple-400"
            disabled={sending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim() || sending}
            className="h-8.5 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl shadow-xs cursor-pointer"
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

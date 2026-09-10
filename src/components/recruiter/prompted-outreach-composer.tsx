"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  FileCheck,
  HeartHandshake,
  Loader2,
  Mail,
  Send,
  Sparkles,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Candidate } from "@/types";

export type OutreachCategory =
  | "interview_invitation"
  | "assessment_invitation"
  | "schedule_confirmation"
  | "offer_letter"
  | "rejection";

interface PresetChip {
  id: OutreachCategory;
  label: string;
  icon: typeof Calendar;
  defaultTone: "friendly" | "formal" | "concise";
}

const PRESET_CHIPS: PresetChip[] = [
  {
    id: "interview_invitation",
    label: "Undang Wawancara",
    icon: Calendar,
    defaultTone: "friendly",
  },
  {
    id: "assessment_invitation",
    label: "Undang Asesmen",
    icon: FileCheck,
    defaultTone: "formal",
  },
  {
    id: "schedule_confirmation",
    label: "Konfirmasi Jadwal",
    icon: Mail,
    defaultTone: "concise",
  },
  {
    id: "offer_letter",
    label: "Penyampaian Offer",
    icon: HeartHandshake,
    defaultTone: "friendly",
  },
  {
    id: "rejection",
    label: "Penolakan Sopan",
    icon: UserX,
    defaultTone: "friendly",
  },
];

export function PromptedOutreachComposer({
  open,
  onOpenChange,
  candidate,
  defaultCategory = "interview_invitation",
  conversationId,
  onMessageSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  defaultCategory?: OutreachCategory;
  conversationId?: string;
  onMessageSent?: () => void;
}) {
  const [category, setCategory] = useState<OutreachCategory>(defaultCategory);
  const [tone, setTone] = useState<"friendly" | "formal" | "concise">("friendly");
  const [customInstructions, setCustomInstructions] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const generateDraft = async (targetCategory = category, targetTone = tone) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/recruiter-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: targetCategory,
          candidateName: candidate.name,
          jobTitle: candidate.role,
          organizationName: "Tim Rekrutmen",
          promptInstructions: customInstructions,
          tone: targetTone,
        }),
      });

      const payload = (await response.json()) as {
        subject?: string;
        message?: string;
        highlights?: string[];
        error?: string;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "Gagal menghasilkan draft pesan.");
      }

      setSubject(payload.subject || "");
      setMessage(payload.message || "");
      setHighlights(payload.highlights || []);
      toast.success("Draft pesan AI siap!");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat draft pesan.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        setCategory(defaultCategory);
        void generateDraft(defaultCategory, tone);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultCategory]);

  const handleChipClick = (chip: PresetChip) => {
    setCategory(chip.id);
    setTone(chip.defaultTone);
    void generateDraft(chip.id, chip.defaultTone);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Isi pesan tidak boleh kosong.");
      return;
    }

    setSending(true);
    try {
      // 1. Ensure or create conversation
      let targetConvId = conversationId;
      if (!targetConvId) {
        const convRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateProfileId: candidate.id }),
        });
        const convData = (await convRes.json()) as { conversationId?: string; error?: string };
        if (convRes.ok && convData.conversationId) {
          targetConvId = convData.conversationId;
        }
      }

      // 2. Send in-app message if conversation exists
      if (targetConvId) {
        const fullBody = subject ? `**${subject}**\n\n${message}` : message;
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: targetConvId,
            body: fullBody,
          }),
        });
      }

      // 3. Send notification to candidate (will also attempt external email if Brevo configured)
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateProfileId: candidate.id,
          title: subject || `Pesan Rekruter: ${candidate.role}`,
          body: message.slice(0, 200) + (message.length > 200 ? "..." : ""),
        }),
      }).catch(() => null);

      toast.success("Pesan dan notifikasi berhasil dikirim!", {
        description: "Kandidat menerima pesan di obrolan in-app dan pemberitahuan langsung.",
      });

      if (onMessageSent) onMessageSent();
      onOpenChange(false);
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Pesan Notifikasi Berbasis Prompt (Dover Outreach)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Kirim pesan terpersonalisasi ke <strong className="text-foreground">{candidate.name}</strong> dengan bantuan AI prompting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
          {/* Preset Prompt Chips */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">
              Pilih Kategori Prompt Cepat:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CHIPS.map((chip) => {
                const Icon = chip.icon;
                const active = category === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone & Prompt Instructions Box */}
          <div className="rounded-xl border border-border bg-slate-50/70 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                Instruksi Prompt Tambahan
              </span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground text-[11px]">Nada Bicara:</span>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as "friendly" | "formal" | "concise")}
                  className="h-7 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary"
                >
                  <option value="friendly">Ramah & Menyambut</option>
                  <option value="formal">Formal & Profesional</option>
                  <option value="concise">Ringkas & Langsung ke Poin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void generateDraft();
                  }
                }}
                placeholder="Contoh: sebutkan jadwal interview hari Rabu jam 14.00 WIB via Google Meet..."
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground/70"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs px-3"
                disabled={generating}
                onClick={() => void generateDraft()}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Sparkles className="size-3.5 mr-1 text-[#7C3AED]" />}
                Prompt Ulang
              </Button>
            </div>
          </div>

          {/* Subject & Message Preview Editor */}
          <div className="space-y-3">
            <div>
              <label htmlFor="outreach-subject" className="text-xs font-semibold text-muted-foreground block mb-1">
                Subjek Notifikasi:
              </label>
              <input
                id="outreach-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
                placeholder="Subjek pesan..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="outreach-message" className="text-xs font-semibold text-muted-foreground">
                  Isi Pesan (Dapat diedit langsung):
                </label>
                {highlights.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {highlights.length} poin utama terdeteksi
                  </span>
                )}
              </div>
              <textarea
                id="outreach-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-border bg-background p-3 text-xs leading-relaxed outline-none focus:border-primary resize-y min-h-[140px]"
                placeholder="Tulis pesan atau biarkan AI membuatkan draf..."
              />
            </div>

            {/* Highlights Chips */}
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-purple-50 text-[#7C3AED] border-purple-100 font-normal">
                    <Check className="size-3 mr-1" />
                    {h}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
          <p className="text-[11px] text-muted-foreground">
            Pesan otomatis tersinkronisasi ke ruang obrolan dan email kandidat.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={sending || generating || !message.trim()}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
              onClick={() => void handleSendMessage()}
            >
              {sending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Send className="size-4 mr-1.5" />}
              {sending ? "Mengirim..." : "Kirim Pesan & Notifikasi"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

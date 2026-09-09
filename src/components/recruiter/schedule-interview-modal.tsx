"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Globe,
  Link as LinkIcon,
  Loader2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/providers/app-provider";
import type { Candidate } from "@/types";

export function ScheduleInterviewModal({
  open,
  onOpenChange,
  candidate,
  applicationId,
  criteria,
  onScheduled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  applicationId?: string;
  criteria?: string[];
  onScheduled?: () => void;
}) {
  const { dbMode } = useApp();

  const [title, setTitle] = useState(`Wawancara: ${candidate.role}`);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [timezone, setTimezone] = useState("Asia/Jakarta (WIB)");
  const [meetingUrl, setMeetingUrl] = useState("https://meet.google.com/");
  const [notes, setNotes] = useState(
    criteria && criteria.length > 0 ? `Kriteria Penilaian:\n${criteria.slice(0, 3).map((c, i) => `${i + 1}. ${c}`).join("\n")}` : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      toast.error("Judul dan waktu wawancara wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      if (dbMode) {
        const response = await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            candidateProfileId: candidate.id,
            title: title.trim(),
            scheduledAt: new Date(scheduledAt).toISOString(),
            durationMinutes,
            timezone,
            meetingUrl: meetingUrl.trim() || undefined,
          }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Gagal menjadwalkan wawancara di database.");
        }
      }

      toast.success("Wawancara berhasil dijadwalkan!", {
        description: `Waktu: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(scheduledAt))}. Notifikasi terkirim ke kandidat.`,
      });

      if (onScheduled) onScheduled();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal menjadwalkan wawancara.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <Calendar className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Jadwalkan Wawancara Kandidat
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Atur jadwal wawancara langsung untuk <strong className="text-foreground">{candidate.name}</strong> ({candidate.role})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSchedule} className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Judul Sesi Wawancara:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
              placeholder="Contoh: Technical Interview - Portfolio Review & System Design"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Tanggal & Waktu (Mulai):
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Zona Waktu:
              </label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-xs outline-none focus:border-primary"
                >
                  <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar (WITA)">Asia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura (WIT)">Asia/Jayapura (WIT)</option>
                  <option value="UTC">UTC (Universal)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Estimasi Durasi:
              </label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-xs outline-none focus:border-primary"
                >
                  <option value={30}>30 Menit (Screening Call)</option>
                  <option value={45}>45 Menit (Standar)</option>
                  <option value={60}>60 Menit (Deep Dive / Panel)</option>
                  <option value={90}>90 Menit (Comprehensive)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Tautan Pertemuan (Google Meet / Zoom):
              </label>
              <div className="relative">
                <Video className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-xs outline-none focus:border-primary font-mono"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                Catatan & Kriteria Wawancara:
              </label>
              <span className="text-[10px] text-muted-foreground">Opsional</span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs outline-none focus:border-primary resize-y min-h-[70px]"
              placeholder="Tulis topik atau pertanyaan yang akan dibahas saat sesi interview..."
            />
          </div>

          {/* Quick Info Box */}
          <div className="rounded-xl border border-border bg-purple-50/50 p-3 text-xs text-purple-900 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <LinkIcon className="size-3.5" /> Sinkronisasi Otomatis Dover Flow:
            </p>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Setelah disimpan, status lamaran otomatis beralih ke <strong>Interview</strong> di Supabase. Kandidat akan menerima email dan notifikasi dengan link ruang pertemuan.
            </p>
          </div>

          <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Calendar className="size-4 mr-1.5" />}
              {loading ? "Menjadwalkan..." : "Simpan & Kirim Undangan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

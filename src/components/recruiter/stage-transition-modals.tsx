"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Candidate, Stage } from "@/components/recruiter/recruiter-operations";

/* ── 1. Schedule Interview Transition Modal (Screening -> Interview) ── */
interface ScheduleInterviewTransitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onConfirm: (interviewData: { type: string; date: string; meetingUrl: string }) => void;
  onSkip: () => void;
}

export function ScheduleInterviewTransitionModal({
  open,
  onOpenChange,
  candidate,
  onConfirm,
  onSkip,
}: ScheduleInterviewTransitionModalProps) {
  const [interviewType, setInterviewType] = useState("Technical & System Design");
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 86400000);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [meetingUrl, setMeetingUrl] = useState("https://meet.google.com/new");

  if (!candidate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      type: interviewType,
      date: interviewDate,
      meetingUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="size-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mb-2">
            <Calendar className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            Jadwalkan Wawancara Kandidat
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Pindahkan <span className="font-semibold text-slate-800">{candidate.name}</span> ({candidate.role}) ke tahap Wawancara dan tetapkan agenda awal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tipe Sesi Wawancara</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
            >
              <option value="Technical & System Design">Technical &amp; System Design</option>
              <option value="User & Culture Fit">User &amp; Culture Fit</option>
              <option value="HR Screening Interview">HR Screening Interview</option>
              <option value="Executive Final Interview">Executive Final Interview</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Clock className="size-3.5 text-purple-600" />
              Waktu &amp; Tanggal (WIB)
            </label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Video className="size-3.5 text-purple-600" />
              Tautan Pertemuan Video
            </label>
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
            />
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-[11px] text-purple-900 flex items-start gap-2">
            <Sparkles className="size-4 shrink-0 text-[#7C3AED] mt-0.5" />
            <p>
              Tips: Gunakan <span className="font-bold">Bank Pertanyaan AI</span> di profil kandidat untuk referensi pertanyaan teknis dan perilaku.
            </p>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Lewati Penjadwalan
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              Simpan &amp; Pindahkan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── 2. Cancel Offer Warning Modal (Offer -> Lower Stages) ── */
interface CancelOfferWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  targetStage: Stage | null;
  onConfirm: () => void;
}

export function CancelOfferWarningModal({
  open,
  onOpenChange,
  candidate,
  targetStage,
  onConfirm,
}: CancelOfferWarningModalProps) {
  if (!candidate || !targetStage) return null;

  const stageLabels: Record<Stage, string> = {
    screening: "Screening",
    interview: "Wawancara",
    offer: "Penawaran",
    hired: "Diterima",
    rejected: "Tidak Lolos",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            Batalkan Penawaran Kerja?
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Kandidat <span className="font-semibold text-slate-800">{candidate.name}</span> saat ini berada pada tahap <span className="font-semibold text-amber-700">Penawaran Kerja (Offer)</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 my-2 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
            Konsekuensi Pembatalan Penawaran:
          </p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            Memindahkan kandidat ke tahap <span className="font-semibold">{stageLabels[targetStage]}</span> akan membatalkan surat penawaran kerja yang telah diterbitkan dan mencatat status pembatalan di database.
          </p>
        </div>

        <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Pertahankan Penawaran
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            Ya, Batalkan &amp; Pindahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── 3. Confirm Hire Modal (Offer -> Hired) ── */
interface ConfirmHireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onConfirm: () => void;
}

export function ConfirmHireModal({
  open,
  onOpenChange,
  candidate,
  onConfirm,
}: ConfirmHireModalProps) {
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            Resmikan Penerimaan Kandidat (Hired)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Apakah Anda yakin ingin menyelesaikan proses hiring untuk kandidat ini?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 my-2 text-xs text-emerald-900 space-y-1">
          <p className="font-bold text-emerald-800">{candidate.name}</p>
          <p className="text-[11px] text-emerald-700">Posisi: {candidate.role}</p>
          <p className="text-[11px] text-emerald-700">Kompensasi: {candidate.compensation || "Rp 15.000.000 / bulan"}</p>
          <p className="text-[10px] text-emerald-600 pt-1">
            Status lamaran akan diperbarui menjadi Diterima dan tersinkronisasi ke seluruh sistem.
          </p>
        </div>

        <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Resmikan Diterima (Hired)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

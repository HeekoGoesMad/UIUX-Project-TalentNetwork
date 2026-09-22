"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  GitCommit,
  Lock,
  MapPin,
  MessageSquare,
  Send,
  ShieldAlert,
  Undo2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidateAvatar } from "@/components/talent/avatar";
import { CandidateScreeningSummary } from "@/components/recruiter/candidate-screening-summary";
import {
  CandidateStatusGitGraph,
  getDefaultStatusHistory,
  type StatusHistoryItem,
} from "@/components/recruiter/candidate-status-git-graph";
import { cn } from "@/lib/utils";

export type Stage = "screening" | "interview" | "offer" | "hired" | "rejected";

export type Candidate = {
  id: string;
  name: string;
  role: string;
  location: string;
  stage: Stage;
  owner: string;
  dueDate: string;
  appliedAt: string;
  score: number;
  feedback: string;
  offerStatus: "draft" | "sent" | "accepted" | "declined" | "negotiating";
  compensation: string;
  reason: string;
  applicationId?: string;
  jobId?: string;
  jobTitle?: string;
  avatarUrl?: string;
  statusHistory?: StatusHistoryItem[];
};

export type Interview = {
  id: string;
  candidateId: string;
  date: string;
  timezone: string;
  type: string;
  panel: string[];
  status: "Terjadwal" | "Selesai" | "Dibatalkan" | "Terjadwal (Terkonfirmasi)" | "Permintaan Reschedule" | "Ditolak Kandidat" | string;
  reminder: boolean;
  meetingUrl?: string;
  sentAt?: string | null;
  rescheduleProposedDate?: string;
  rescheduleReason?: string;
  declineReason?: string;
};

interface CandidateDetailDrawerProps {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  interviews: Interview[];
  onStageChange: (candidateId: string, stage: Stage, extraUpdates?: Partial<Candidate>) => void;
  onOpenOfferModal: (candidate: Candidate) => void;
  onAddInterview: (candidateId: string, interview: Omit<Interview, "id">) => Promise<void>;
  onSendInterviewInvitation: (interview: Interview, cand?: Candidate) => Promise<void>;
  onUpdateFeedback: (candidateId: string, feedback: string) => void;
  recruiterName: string;
  availableJobs?: Array<{ id: string; title: string }>;
  onAssignJob?: (candidateId: string, jobId: string, jobTitle: string) => void;
}

const STAGE_OPTIONS: Array<{ id: Stage; label: string; color: string }> = [
  { id: "screening", label: "Screening", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "interview", label: "Interview", color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  { id: "offer", label: "Offer", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "hired", label: "Hired", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "rejected", label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
];

function formatInterviewDateTime(dateStr?: string): string {
  if (!dateStr) return "Waktu belum ditentukan";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Waktu belum ditentukan";
  return `${d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })} WIB`;
}

export function CandidateDetailDrawer({
  candidate,
  open,
  onClose,
  interviews,
  onStageChange,
  onOpenOfferModal,
  onAddInterview,
  onSendInterviewInvitation,
  onUpdateFeedback,
  recruiterName,
  availableJobs = [],
  onAssignJob,
}: CandidateDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "interview" | "offer" | "notes">("overview");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [sendingInterviewId, setSendingInterviewId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  // Administrative Revoke Modal (HR Escape Hatch for Hired candidates)
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeTargetStage, setRevokeTargetStage] = useState<Stage>("offer");
  const [revokeReason, setRevokeReason] = useState("");

  // New interview form state
  const [newInterviewDate, setNewInterviewDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 86400000);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [newInterviewType, setNewInterviewType] = useState("Technical & System Design");
  const [newMeetingUrl, setNewMeetingUrl] = useState("https://meet.google.com/new");
  const [isAddingInterview, setIsAddingInterview] = useState(false);

  if (!open || !candidate) return null;

  const candidateInterviews = interviews.filter(
    (i) =>
      i.candidateId === candidate.id ||
      (candidate.applicationId &&
        (i.candidateId === candidate.applicationId || (i as { applicationId?: string }).applicationId === candidate.applicationId))
  );
  const isHired = candidate.stage === "hired";
  const isOfferOrAbove = candidate.stage === "offer" || candidate.stage === "hired";

  // When candidate is Hired, only overview and notes tabs are accessible
  const effectiveTab = isHired && (activeTab === "interview" || activeTab === "offer") ? "overview" : activeTab;

  const handleSaveFeedback = () => {
    setIsSavingFeedback(true);
    onUpdateFeedback(candidate.id, feedbackText);
    setTimeout(() => {
      setIsSavingFeedback(false);
      toast.success("Catatan evaluasi berhasil disimpan");
    }, 300);
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingInterview(true);
    try {
      await onAddInterview(candidate.id, {
        candidateId: candidate.id,
        date: newInterviewDate,
        timezone: "Asia/Jakarta (WIB)",
        type: newInterviewType,
        panel: [recruiterName],
        status: "Terjadwal",
        reminder: true,
        meetingUrl: newMeetingUrl,
        sentAt: null,
      });
      toast.success("Jadwal interview baru berhasil dibuat");
    } finally {
      setIsAddingInterview(false);
    }
  };

  const handleSendInvite = async (interview: Interview) => {
    setSendingInterviewId(interview.id);
    try {
      await onSendInterviewInvitation(interview, candidate);
    } finally {
      setSendingInterviewId(null);
    }
  };

  const handleConfirmRevoke = () => {
    if (!revokeReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    const cancellationLog = `[Pembatalan HR: ${new Date().toLocaleDateString("id-ID")}] ${revokeReason.trim()}`;
    const updatedFeedback = candidate.feedback
      ? `${candidate.feedback}\n${cancellationLog}`
      : cancellationLog;

    const currentHistory = candidate.statusHistory || getDefaultStatusHistory(candidate, recruiterName);
    const renegeHistoryItem: StatusHistoryItem = {
      id: `hist-renege-${Date.now()}`,
      stage: "renege",
      title: `Pembatalan Penerimaan (Renege) ke Tahap ${revokeTargetStage}`,
      actionType: "recruiter",
      timestamp: new Date().toISOString(),
      actor: recruiterName,
      actorRole: "HR & Talent Lead",
      notes: revokeReason.trim(),
    };
    const updatedHistory = [...currentHistory, renegeHistoryItem];

    onUpdateFeedback(candidate.id, updatedFeedback);
    onStageChange(candidate.id, revokeTargetStage, {
      statusHistory: updatedHistory,
      reason: revokeReason.trim(),
    });
    setRevokeModalOpen(false);
    setRevokeReason("");
    toast.info("Status penerimaan kandidat dibatalkan dan dicatat pada riwayat.");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250 ease-out">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CandidateAvatar
                  initials={candidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                  avatarUrl={candidate.avatarUrl}
                  name={candidate.name}
                  className="size-12 rounded-2xl text-base ring-1 ring-purple-200 shadow-sm"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {candidate.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500">{candidate.role}</p>
                    {(!candidate.jobId || candidate.jobId === "talent-pool") && (
                      <span className="inline-flex text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-[#7C3AED]">
                        Talent Pool
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                aria-label="Tutup laci"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Stage Selector Pill */}
            <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-200/60">
              <span className="text-xs font-medium text-slate-500">Tahap Saat Ini:</span>
              <div className="flex items-center gap-1.5">
                {isHired ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <Lock className="size-3.5 text-emerald-600" />
                    <span>Diterima (Hired) · Final</span>
                  </div>
                ) : (
                  <select
                    value={candidate.stage}
                    onChange={(e) => onStageChange(candidate.id, e.target.value as Stage)}
                    className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 bg-white shadow-2xs focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden cursor-pointer"
                  >
                    {STAGE_OPTIONS.map((opt) => {
                      const isTalentPool =
                        !candidate.jobId ||
                        candidate.jobId === "talent-pool" ||
                        candidate.jobTitle === "Talent Pool";
                      let isDisabled = false;
                      let labelSuffix = "";

                      if (
                        isTalentPool &&
                        (opt.id === "interview" || opt.id === "offer" || opt.id === "hired")
                      ) {
                        isDisabled = true;
                        labelSuffix = " (Perlu Lowongan)";
                      } else if (opt.id === "hired" && candidate.stage !== "offer") {
                        isDisabled = true;
                        labelSuffix = " (Melalui Offer)";
                      } else if (
                        candidate.stage === "rejected" &&
                        (opt.id === "interview" || opt.id === "offer" || opt.id === "hired")
                      ) {
                        isDisabled = true;
                        labelSuffix = " (Aktifkan ke Screening)";
                      }

                      return (
                        <option key={opt.id} value={opt.id} disabled={isDisabled}>
                          {opt.label}
                          {labelSuffix}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>

            {/* Quick Actions (State-Aware) */}
            <div className="mt-3 flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className={cn(
                  "h-8 text-xs font-semibold text-[#7C3AED] border-purple-200 hover:bg-purple-50 hover:text-[#6D28D9] gap-1.5",
                  isOfferOrAbove || candidate.stage === "rejected" ? "w-full" : "flex-1"
                )}
              >
                <Link href={`/messages`}>
                  <MessageSquare className="size-3.5" /> Kirim Pesan
                </Link>
              </Button>

              {/* Buat Penawaran only visible if candidate is not in offer, hired, or rejected */}
              {!isOfferOrAbove && candidate.stage !== "rejected" && (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs gap-1.5"
                  onClick={() => onOpenOfferModal(candidate)}
                >
                  <DollarSign className="size-3.5" /> Buat Penawaran
                </Button>
              )}
            </div>
          </div>

          {/* Tab Navigation (When Hired: Only Overview and Notes) */}
          <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "py-3 text-xs font-semibold border-b-2 transition-colors",
                effectiveTab === "overview"
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Ringkasan
            </button>

            {!isHired && (
              <>
                <button
                  onClick={() => setActiveTab("interview")}
                  className={cn(
                    "py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                    effectiveTab === "interview"
                      ? "border-[#7C3AED] text-[#7C3AED]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  Wawancara
                  {candidateInterviews.length > 0 && (
                    <span className="size-4.5 rounded-full bg-purple-100 text-[#7C3AED] text-[10px] font-bold flex items-center justify-center">
                      {candidateInterviews.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("offer")}
                  className={cn(
                    "py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                    effectiveTab === "offer"
                      ? "border-[#7C3AED] text-[#7C3AED]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  Penawaran
                  {candidate.offerStatus !== "draft" && (
                    <span className="size-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab("notes")}
              className={cn(
                "py-3 text-xs font-semibold border-b-2 transition-colors",
                effectiveTab === "notes"
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Catatan &amp; Riwayat
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* OVERVIEW TAB */}
            {effectiveTab === "overview" && (
              <div className="space-y-5">
                {/* 1. INFORMASI PELAMAR */}
                <Card className="border-slate-200 shadow-2xs">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informasi Pelamar</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Lokasi</p>
                        <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3.5 text-slate-400" />
                          {candidate.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Tahap Saat Ini</p>
                        <p className="font-semibold text-[#7C3AED] capitalize mt-0.5">
                          {candidate.stage}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Tanggal Melamar</p>
                        <p className="font-medium text-slate-800 mt-0.5">{candidate.appliedAt}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Penanggung Jawab</p>
                        <p className="font-medium text-slate-800 mt-0.5">{candidate.owner}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500">Ekspektasi Kompensasi</p>
                        <p className="font-semibold text-emerald-700 mt-0.5">{candidate.compensation || "Rp 15.000.000 / bulan"}</p>
                      </div>

                      {/* Lowongan / Talent Pool Assignment */}
                      <div className="col-span-2 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-slate-500 text-[11px]">Lowongan Pekerjaan</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="size-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800 text-xs">
                              {candidate.jobTitle || (candidate.jobId && candidate.jobId !== "talent-pool" ? "Lowongan Terpilih" : "Talent Pool")}
                            </span>
                          </div>
                        </div>

                        {availableJobs && availableJobs.length > 0 && onAssignJob && (
                          <select
                            value={candidate.jobId || "talent-pool"}
                            onChange={(e) => {
                              const targetVal = e.target.value;
                              if (targetVal === "talent-pool") {
                                onAssignJob(candidate.id, "talent-pool", "Talent Pool");
                              } else {
                                const found = availableJobs.find((j) => j.id === targetVal);
                                if (found) {
                                  onAssignJob(candidate.id, found.id, found.title);
                                }
                              }
                            }}
                            className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden cursor-pointer"
                          >
                            <option value="talent-pool">Talent Pool (Umum)</option>
                            {availableJobs.map((job) => (
                              <option key={job.id} value={job.id}>
                                {job.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. RINGKASAN HASIL AI SCREENING (Merged from /recruiter/screenings) */}
                <CandidateScreeningSummary
                  candidateId={candidate.id}
                  candidateName={candidate.name}
                  role={candidate.role}
                  score={candidate.score}
                  feedback={candidate.feedback}
                />

                {/* 3. AKSI LANJUTAN REKRUTER (Context-Aware) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800">Aksi Lanjutan Rekruter</h4>

                  {candidate.stage === "screening" && (
                    <>
                      <p className="text-xs text-slate-500">
                        {!candidate.jobId || candidate.jobId === "talent-pool"
                          ? "Kandidat berada di Talent Pool. Tugaskan ke salah satu lowongan aktif terlebih dahulu untuk memulai tahapan seleksi."
                          : "Kandidat memenuhi kualifikasi awal. Lanjutkan ke sesi wawancara atau terbitkan surat penawaran."}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        {candidate.jobId && candidate.jobId !== "talent-pool" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 font-medium bg-white text-slate-700"
                              onClick={() => setActiveTab("interview")}
                            >
                              <Calendar className="size-3.5 mr-1 text-purple-600" /> Atur Sesi Wawancara
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 font-medium bg-white text-[#7C3AED] border-purple-200 hover:bg-purple-50"
                              onClick={() => onOpenOfferModal(candidate)}
                            >
                              <DollarSign className="size-3.5 mr-1" /> Terbitkan Penawaran
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {candidate.stage === "interview" && (
                    <>
                      <p className="text-xs text-slate-500">
                        Kandidat sedang dalam proses wawancara. Terbitkan surat penawaran resmi jika dinyatakan lolos.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="text-xs h-8 font-medium bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                          onClick={() => onOpenOfferModal(candidate)}
                        >
                          <DollarSign className="size-3.5 mr-1" /> Terbitkan Surat Penawaran
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 font-medium bg-white text-slate-700"
                          onClick={() => setActiveTab("interview")}
                        >
                          <Clock className="size-3.5 mr-1 text-purple-600" /> Lihat Jadwal Wawancara
                        </Button>
                      </div>
                    </>
                  )}

                  {candidate.stage === "offer" && (
                    <>
                      <p className="text-xs text-slate-500">
                        Surat penawaran telah diterbitkan. Konfirmasi penerimaan kandidat setelah penawaran disepakati.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="text-xs h-8 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => onStageChange(candidate.id, "hired")}
                        >
                          <CheckCircle2 className="size-3.5 mr-1" /> Konfirmasi Penerimaan (Tandai Hired)
                        </Button>
                      </div>
                    </>
                  )}

                  {candidate.stage === "hired" && (
                    <div className="pt-1 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Proses rekrutmen selesai. Kandidat resmi diterima dan siap untuk onboarding.</span>
                    </div>
                  )}

                  {candidate.stage === "rejected" && (
                    <p className="text-xs text-slate-500">
                      Kandidat ditandai tidak lolos untuk posisi ini.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* INTERVIEWS TAB */}
            {effectiveTab === "interview" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Jadwal Sesi Wawancara</h3>
                </div>

                {candidateInterviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
                    <Calendar className="size-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 mt-2">Belum ada sesi wawancara</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isOfferOrAbove ? "Tahap wawancara telah selesai." : "Buat jadwal baru di formulir bawah ini."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidateInterviews.map((iv) => {
                      const isPastDate = Boolean(iv.date && !isNaN(new Date(iv.date).getTime()) && new Date(iv.date).getTime() < now);
                      const effectiveStatus: string =
                        iv.status === "Dibatalkan"
                          ? "Dibatalkan"
                          : iv.status === "Selesai" || (isPastDate && !["Permintaan Reschedule", "Ditolak Kandidat"].includes(iv.status))
                            ? "Selesai"
                            : iv.status === "Terjadwal (Terkonfirmasi)" || iv.status === "confirmed"
                              ? "Terkonfirmasi Hadir"
                              : iv.status === "Permintaan Reschedule" || iv.status === "reschedule_requested"
                                ? "Permintaan Reschedule"
                                : iv.status === "Ditolak Kandidat" || iv.status === "declined"
                                  ? "Ditolak Kandidat"
                                  : "Terjadwal";

                      return (
                        <Card key={iv.id} className="border-slate-200 shadow-2xs">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{iv.type}</p>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <Clock className="size-3.5 text-purple-600" />
                                  {formatInterviewDateTime(iv.date)}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-semibold",
                                  effectiveStatus === "Selesai"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : effectiveStatus === "Terkonfirmasi Hadir"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : effectiveStatus === "Permintaan Reschedule"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : effectiveStatus === "Ditolak Kandidat"
                                    ? "bg-slate-100 text-slate-700 border-slate-300"
                                    : effectiveStatus === "Dibatalkan"
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-purple-50 text-[#7C3AED] border-purple-200"
                                )}
                              >
                                {effectiveStatus}
                              </Badge>
                            </div>

                            {effectiveStatus === "Permintaan Reschedule" && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                                  <Calendar className="size-3.5 text-amber-700 shrink-0" />
                                  Kandidat Mengajukan Reschedule
                                </p>
                                {(() => {
                                  const reschedItem = candidate.statusHistory?.slice().reverse().find(
                                    (h) => h.title.includes("Reschedule") || (h.notes && h.notes.includes("mengusulkan jadwal baru"))
                                  );
                                  const formattedProposed = iv.rescheduleProposedDate ? formatInterviewDateTime(iv.rescheduleProposedDate) : "";
                                  const noteText = formattedProposed
                                    ? `Kandidat mengusulkan jadwal baru: ${formattedProposed}. Alasan: ${iv.rescheduleReason || "Tidak ada alasan spesifik."}`
                                    : reschedItem?.notes;
                                  return noteText ? (
                                    <p className="text-amber-800 text-[11px] leading-relaxed">
                                      {noteText}
                                    </p>
                                  ) : (
                                    <p className="text-amber-800 text-[11px]">
                                      Kandidat mengajukan usulan jadwal baru. Buat jadwal pengganti melalui form di bawah.
                                    </p>
                                  );
                                })()}
                              </div>
                            )}

                            {effectiveStatus === "Ditolak Kandidat" && (
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 space-y-1">
                                <p className="font-semibold text-slate-800">
                                  Kandidat tidak dapat menghadiri sesi wawancara ini.
                                </p>
                                {(() => {
                                  const declineItem = candidate.statusHistory?.slice().reverse().find(
                                    (h) => h.title.includes("Ditolak Kandidat") || (h.notes && h.notes.includes("Kandidat tidak dapat menghadiri"))
                                  );
                                  const noteText = iv.declineReason
                                    ? `Kandidat tidak dapat menghadiri sesi ini (${iv.declineReason}). Lamaran tetap aktif.`
                                    : declineItem?.notes;
                                  return noteText ? (
                                    <p className="text-slate-600 text-[11px] leading-relaxed">
                                      {noteText}
                                    </p>
                                  ) : null;
                                })()}
                              </div>
                            )}

                            {iv.meetingUrl && (
                              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                                <a
                                  href={iv.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-medium text-[#7C3AED] hover:underline flex items-center gap-1 truncate max-w-[240px]"
                                >
                                  <Video className="size-3.5 shrink-0" />
                                  {iv.meetingUrl}
                                </a>
                                {effectiveStatus !== "Selesai" && effectiveStatus !== "Dibatalkan" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] font-semibold text-purple-700 border-purple-200 hover:bg-purple-50 shrink-0 gap-1"
                                    onClick={() => handleSendInvite(iv)}
                                    disabled={sendingInterviewId === iv.id}
                                  >
                                    <Send className="size-3" />
                                    {iv.sentAt ? "Kirim Ulang" : "Kirim Undangan"}
                                  </Button>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400 italic">
                                    Sesi telah selesai
                                  </span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Form Tambah Wawancara Cepat: Hidden if candidate is in Offer or Hired */}
                {!isOfferOrAbove ? (
                  <Card className="border-slate-200 bg-slate-50/70 shadow-2xs">
                    <CardContent className="p-4">
                      <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Calendar className="size-4 text-[#7C3AED]" /> Buat Jadwal Baru
                      </h4>
                      <form onSubmit={handleCreateInterview} className="space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Tipe Wawancara
                          </label>
                          <input
                            type="text"
                            value={newInterviewType}
                            onChange={(e) => setNewInterviewType(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
                            placeholder="mis. Wawancara Teknis / User"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Waktu &amp; Tanggal (WIB)
                          </label>
                          <input
                            type="datetime-local"
                            value={newInterviewDate}
                            onChange={(e) => setNewInterviewDate(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Tautan Video Meeting
                          </label>
                          <input
                            type="url"
                            value={newMeetingUrl}
                            onChange={(e) => setNewMeetingUrl(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
                            placeholder="https://meet.google.com/..."
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isAddingInterview}
                          className="w-full h-8 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                        >
                          {isAddingInterview ? "Menyimpan..." : "Simpan Sesi Wawancara"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    Kandidat telah melampaui tahap wawancara. Penjadwalan baru tidak diperlukan.
                  </div>
                )}
              </div>
            )}

            {/* OFFERS TAB */}
            {effectiveTab === "offer" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Status Penawaran:</span>
                    <Badge
                      className={cn(
                        "capitalize text-[11px]",
                        candidate.offerStatus === "accepted"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : candidate.offerStatus === "negotiating"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : candidate.offerStatus === "declined"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : candidate.offerStatus === "sent"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {candidate.offerStatus === "accepted"
                        ? "Diterima oleh Kandidat"
                        : candidate.offerStatus === "negotiating"
                        ? "Dalam Negosiasi / Diskusi"
                        : candidate.offerStatus === "declined"
                        ? "Ditolak oleh Kandidat"
                        : candidate.offerStatus === "sent"
                        ? "Penawaran Terkirim"
                        : "Draf"}
                    </Badge>
                  </div>

                  {candidate.offerStatus === "negotiating" && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                        <MessageSquare className="size-4 text-[#7C3AED]" />
                        <span>Kandidat Mengajukan Pesan Diskusi / Negosiasi</span>
                      </div>
                      {(() => {
                        const latestNegotiationItem = candidate.statusHistory?.slice().reverse().find(
                          (h) => h.title.includes("Negosiasi") || (h.actionType === "candidate" && h.stage === "offer")
                        );
                        return (
                          <p className="text-xs text-purple-950 bg-white/90 p-2.5 rounded-lg border border-purple-200/70 italic leading-relaxed">
                            {latestNegotiationItem?.notes || "Kandidat ingin mendiskusikan penyesuaian kompensasi / syarat penawaran."}
                          </p>
                        );
                      })()}
                      <p className="text-[11px] text-purple-800">
                        Klik &quot;Revisi Penawaran Kerja&quot; di bawah untuk menerbitkan surat penawaran versi baru.
                      </p>
                    </div>
                  )}

                  {candidate.offerStatus === "declined" && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium">
                      Kandidat menolak penawaran kerja ini. Status lamaran dipisahkan menjadi Ditolak (Offer Declined).
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Kompensasi Ditawarkan:</span>
                    <span className="text-sm font-bold text-slate-900">{candidate.compensation || "Rp 15.000.000 / bulan"}</span>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="w-full text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs"
                      onClick={() => onOpenOfferModal(candidate)}
                    >
                      <DollarSign className="size-3.5 mr-1" />
                      {candidate.offerStatus === "draft"
                        ? "Buat & Terbitkan Penawaran"
                        : candidate.offerStatus === "negotiating"
                        ? "Revisi Penawaran Kerja (Kirim v2)"
                        : "Perbarui Rincian Penawaran"}
                    </Button>
                    {candidate.offerStatus === "sent" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => onStageChange(candidate.id, "hired")}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Konfirmasi Penerimaan (Tandai Hired)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NOTES & HISTORY TAB */}
            {effectiveTab === "notes" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Catatan Internal Rekruter
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={candidate.feedback}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tuliskan catatan evaluasi, kelebihan, atau pertimbangan tim..."
                    className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white"
                      onClick={handleSaveFeedback}
                      disabled={isSavingFeedback}
                    >
                      {isSavingFeedback ? "Menyimpan..." : "Simpan Catatan"}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <GitCommit className="size-3.5 text-[#7C3AED]" />
                      Riwayat Status & Milestone
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Git Timeline View</span>
                  </div>

                  <CandidateStatusGitGraph
                    history={candidate.statusHistory || getDefaultStatusHistory(candidate, recruiterName)}
                    appliedAt={candidate.appliedAt}
                    dueDate={candidate.dueDate}
                    currentStage={candidate.stage}
                  />
                </div>

                {/* Administrative Escape Hatch (Only when Hired) */}
                {isHired && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                          <ShieldAlert className="size-4 text-red-600" />
                          <span>Tindakan Administratif (Khusus HRD)</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-red-100/60 text-red-700 border-red-200">
                          Otoritas Khusus
                        </Badge>
                      </div>
                      <p className="text-xs text-red-800/80 leading-relaxed">
                        Gunakan tindakan ini jika kandidat membatalkan penawaran sebelum hari pertama kerja (renege) atau terjadi pembatalan penugasan resmi.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-red-700 border-red-300 hover:bg-red-100/60 h-8 gap-1.5"
                        onClick={() => setRevokeModalOpen(true)}
                      >
                        <Undo2 className="size-3.5" /> Batalkan Penerimaan (Renege)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revoke Hired Confirmation Modal */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Batalkan Status Penerimaan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Status kandidat akan dikembalikan dari Diterima ke tahap sebelumnya untuk peninjauan ulang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Kembalikan ke Tahap:
              </label>
              <select
                value={revokeTargetStage}
                onChange={(e) => setRevokeTargetStage(e.target.value as Stage)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                <option value="offer">Tahap Penawaran (Offer)</option>
                <option value="screening">Tahap Screening</option>
                <option value="rejected">Tidak Lolos (Rejected)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Alasan Pembatalan (Wajib Dicatat):
              </label>
              <textarea
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="misal: Kandidat membatalkan penawaran sepihak (renege), masalah administrasi..."
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevokeModalOpen(false)}
              className="text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!revokeReason.trim()}
              onClick={handleConfirmRevoke}
              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              Konfirmasi Pembatalan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

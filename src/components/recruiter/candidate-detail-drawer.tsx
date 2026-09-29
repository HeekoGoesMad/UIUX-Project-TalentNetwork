import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  DollarSign,
  GitCommit,
  Lock,
  MapPin,
  MessageSquare,
  Send,
  ShieldAlert,
  Undo2,
  Unlock,
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
import { getDaysInCurrentStage, maskName } from "@/lib/candidate-display";
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
  source?: "candidate" | "recruiter_invitation";
  unlocked?: boolean;
  unlockedAt?: string | null;
  coverNote?: string | null;
  expectedSalary?: number | null;
  availability?: string | null;
  skills?: string[];
  matchScore?: number;
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
  onOpenScheduleModal?: (candidate: Candidate) => void;
  onUnlockCandidate?: (candidate: Candidate) => Promise<void> | void;
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
  onOpenScheduleModal,
  onUnlockCandidate,
}: CandidateDetailDrawerProps) {
  const [feedbackCandidateId, setFeedbackCandidateId] = useState<string | null>(null);
  const [userFeedbackOverride, setUserFeedbackOverride] = useState<string | null>(null);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [sendingInterviewId, setSendingInterviewId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const feedbackText =
    userFeedbackOverride !== null && feedbackCandidateId === candidate?.id
      ? userFeedbackOverride
      : (candidate?.feedback || "");

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
  const [showPastInterviews, setShowPastInterviews] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const candidateInterviews = useMemo(() => {
    if (!candidate) return [];
    return interviews
      .filter(
        (i) =>
          i.candidateId === candidate.id ||
          (candidate.applicationId &&
            (i.candidateId === candidate.applicationId || (i as { applicationId?: string }).applicationId === candidate.applicationId))
      )
      .sort((a, b) => {
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
  }, [interviews, candidate]);

  const latestInterview = candidateInterviews[0];
  const pastInterviews = candidateInterviews.slice(1);

  if (!open || !candidate) return null;

  const isHired = candidate.stage === "hired";
  const isOfferOrAbove = candidate.stage === "offer" || candidate.stage === "hired";
  const isPoolCandidate = !candidate.jobId || candidate.jobId === "talent-pool" || candidate.jobTitle === "Talent Pool";

  const handleSaveFeedback = () => {
    setIsSavingFeedback(true);
    onUpdateFeedback(candidate.id, feedbackText);
    setTimeout(() => {
      setIsSavingFeedback(false);
      toast.success("Catatan evaluasi berhasil disimpan");
    }, 300);
  };

  const handleCopyExecutiveBrief = () => {
    const scoreVal = candidate.matchScore ?? candidate.score;
    const matchScoreText = scoreVal ? `${scoreVal}%` : "Belum dihitung";
    const salaryText = candidate.expectedSalary 
      ? `Rp ${Number(candidate.expectedSalary).toLocaleString("id-ID")} / bulan` 
      : candidate.compensation || "Sesuai kesepakatan";
    const availabilityText = candidate.availability || "Segera (Immediate)";
    const stageLabel = STAGE_OPTIONS.find((s) => s.id === candidate.stage)?.label || candidate.stage;
    
    const briefText = [
      `[RINGKASAN KANDIDAT - PROOFYLINK]`,
      `Nama: ${candidate.unlocked !== false ? candidate.name : maskName(candidate.name)}`,
      `Posisi: ${candidate.jobTitle || candidate.role || "Talent Pool"}`,
      `Ekspektasi Gaji: ${salaryText}`,
      `Ketersediaan: ${availabilityText}`,
      `Skor Kecocokan: ${matchScoreText}`,
      `Tahap Saat Ini: ${stageLabel}`,
      candidate.skills && candidate.skills.length > 0 ? `Keahlian Utama: ${candidate.skills.slice(0, 5).join(", ")}` : null,
      latestInterview ? `Sesi Wawancara: ${latestInterview.type} (${formatInterviewDateTime(latestInterview.date)} - ${latestInterview.status})` : null,
      typeof window !== "undefined" ? `Tautan Profil: ${window.location.origin}/talent/${candidate.id}` : null,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(briefText);
    setCopiedBrief(true);
    toast.success("Ringkasan profil berhasil disalin ke papan klip!");
    setTimeout(() => setCopiedBrief(false), 2000);
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
                    {candidate.unlocked !== false ? candidate.name : maskName(candidate.name)}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500">{candidate.role}</p>
                    {(!candidate.jobId || candidate.jobId === "talent-pool") && (
                      <span className="inline-flex text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-[#7C3AED]">
                        Talent Pool
                      </span>
                    )}
                    {candidate.unlocked === false && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        <Lock className="size-2.5 text-[#7C3AED]" />
                        Inbound Terkunci
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

            {/* Single Authoritative Inbound Triage Action Card */}
            {candidate.unlocked === false && (
              <div className="mt-3.5 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/90 via-purple-50/40 to-white p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-purple-200/80">
                      <Lock className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-purple-950">
                          Lamaran Inbound · Profil Terkunci
                        </h4>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 border border-purple-200 px-1.5 py-0.2 rounded-md">
                          1 Token
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-700/90 leading-relaxed mt-1">
                        Kandidat melamar secara mandiri. Buka profil untuk mengakses kontak langsung (WhatsApp & Email), berkas CV asli, dan evaluasi Role-Fit AI.
                      </p>
                    </div>
                  </div>
                </div>

                {/* The ONLY Canonical Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                  <Button
                    size="sm"
                    className="flex-1 h-9 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs gap-1.5 transition-all"
                    onClick={() => onUnlockCandidate?.(candidate)}
                  >
                    <Unlock className="size-3.5" /> Buka Profil Lengkap (1 Token)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3.5 text-xs font-semibold border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/60 gap-1.5 transition-colors"
                    onClick={() => onStageChange(candidate.id, "rejected", { reason: "Ditolak dari tahap Inbound Triage dan disimpan ke Talent Pool" })}
                  >
                    <X className="size-3.5" /> Tolak &amp; Simpan ke Pool (0 Token)
                  </Button>
                </div>
              </div>
            )}

            {/* Interactive Visual Stage Stepper or Rejection / Locked / Talent Pool Banner */}
            {candidate.unlocked === false ? (
              <div className="mt-3.5 flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/70">
                <span className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                  <Lock className="size-3.5 text-[#7C3AED]" />
                  Status: Inbound Triage (Terkunci)
                </span>
                <span className="text-[11px] text-purple-700 font-medium">Buka profil untuk memproses tahap</span>
              </div>
            ) : isPoolCandidate ? (
              <div className="mt-3.5 p-3 rounded-xl border border-purple-200 bg-purple-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-[#7C3AED]" />
                  <div>
                    <p className="text-xs font-bold text-purple-950">Talent Pool (Belum Ada Lowongan)</p>
                    <p className="text-[11px] text-purple-700">Tugaskan kandidat ke lowongan aktif untuk memulai alur seleksi.</p>
                  </div>
                </div>
              </div>
            ) : candidate.stage === "rejected" ? (
              <div className="mt-3.5 p-3 rounded-xl border border-rose-200 bg-rose-50/70 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-rose-900">Kandidat Tidak Lolos (Arsip Pool)</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">Lamaran diarsipkan dari alur aktif.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStageChange(candidate.id, "screening")}
                  className="h-7 text-[11px] font-semibold bg-white border-rose-300 text-rose-700 hover:bg-rose-100 gap-1 shadow-2xs"
                >
                  <Undo2 className="size-3" /> Aktifkan Lagi
                </Button>
              </div>
            ) : (
              <div className="mt-3.5 pt-3 border-t border-slate-200/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Alur Tahapan Rekrutmen
                  </span>
                  {candidate.stage === "hired" ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Rekrutmen Selesai
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#7C3AED]">
                      Tahap {["screening", "interview", "offer", "hired"].indexOf(candidate.stage) + 1} dari 4
                    </span>
                  )}
                </div>

                <div className="relative flex items-center justify-between px-1">
                  {/* Progress Connector Track */}
                  <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-slate-200 -z-0">
                    <div
                      className="h-full bg-[#7C3AED] transition-all duration-300"
                      style={{
                        width:
                          candidate.stage === "screening"
                            ? "0%"
                            : candidate.stage === "interview"
                            ? "33%"
                            : candidate.stage === "offer"
                            ? "66%"
                            : "100%",
                      }}
                    />
                  </div>

                  {/* 4 Step Nodes */}
                  {[
                    { id: "screening", label: "Review Profil" },
                    { id: "interview", label: "Wawancara" },
                    { id: "offer", label: "Penawaran" },
                    { id: "hired", label: "Diterima" },
                  ].map((step, idx) => {
                    const stageOrder = ["screening", "interview", "offer", "hired"];
                    const currentIdx = stageOrder.indexOf(candidate.stage);
                    const isCompleted = currentIdx > idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        disabled={isHired && step.id !== "hired"}
                        onClick={() => {
                          if (step.id === "hired" && candidate.stage !== "offer") {
                            toast.error("Tahap Diterima hanya dapat diaktifkan setelah penawaran kerja diterbitkan.");
                            return;
                          }
                          if (step.id !== candidate.stage) {
                            onStageChange(candidate.id, step.id as Stage);
                            toast.success(`Kandidat dipindahkan ke tahap ${step.label}.`);
                          }
                        }}
                        className={cn(
                          "relative z-10 flex flex-col items-center group cursor-pointer transition-transform active:scale-95 disabled:cursor-not-allowed",
                          isCurrent ? "scale-105" : ""
                        )}
                      >
                        <div
                          className={cn(
                            "size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs border-2",
                            isCurrent
                              ? "bg-[#7C3AED] text-white border-purple-200 ring-4 ring-purple-100"
                              : isCompleted
                              ? "bg-[#7C3AED] text-white border-purple-300"
                              : "bg-white text-slate-400 border-slate-300 group-hover:border-purple-300"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="size-3.5 stroke-[3]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] mt-1.5 font-semibold transition-colors text-center leading-tight whitespace-nowrap",
                            isCurrent
                              ? "text-[#7C3AED] font-bold"
                              : isCompleted
                              ? "text-slate-700"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions (Only rendered when candidate is UNLOCKED) */}
            {candidate.unlocked !== false && (
              <div className="mt-3.5 flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-8 text-xs font-semibold text-[#7C3AED] border-purple-200 hover:bg-purple-50 hover:text-[#6D28D9] gap-1.5",
                    isPoolCandidate || isOfferOrAbove || candidate.stage === "rejected" ? "flex-1" : "flex-1"
                  )}
                >
                  <Link href={`/messages/${candidate.id}?contact=${encodeURIComponent(candidate.name)}`}>
                    <MessageSquare className="size-3.5" /> Kirim Pesan
                  </Link>
                </Button>

                {/* Salin Executive Brief */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyExecutiveBrief}
                  className="h-8 px-3 text-xs font-semibold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs"
                  title="Salin Ringkasan Profil untuk Hiring Manager"
                >
                  {copiedBrief ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5 text-slate-500" />
                  )}
                  <span>{copiedBrief ? "Tersalin" : "Salin Brief"}</span>
                </Button>

                {/* Buat Penawaran only visible if candidate is in active job and not in offer, hired, or rejected */}
                {!isPoolCandidate && !isOfferOrAbove && candidate.stage !== "rejected" && (
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs gap-1.5"
                    onClick={() => onOpenOfferModal(candidate)}
                  >
                    <DollarSign className="size-3.5" /> Buat Penawaran
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Body Content: Clean Single-Flow Section Driven by Status */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. STATUS-DRIVEN PRIMARY CONTENT */}
            {isPoolCandidate ? (
              /* TALENT POOL MODE: Ringkasan Saja */
              <div className="space-y-5">
                {/* Informasi Pelamar */}
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
                        <p className="text-slate-500">Status Penempatan</p>
                        <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] mt-0.5">
                          Talent Pool
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500">Waktu Masuk Pool</p>
                        <p className="font-medium text-slate-800 mt-0.5">{candidate.appliedAt || "Baru saja"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Penanggung Jawab</p>
                        <p className="font-medium text-slate-800 mt-0.5">{candidate.owner}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ekspektasi Kompensasi</p>
                        <p className="font-semibold text-emerald-700 mt-0.5">
                          {candidate.expectedSalary
                            ? `Rp ${Number(candidate.expectedSalary).toLocaleString("id-ID")} / bln`
                            : candidate.compensation || "Rp 15.000.000 / bulan"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ketersediaan Kerja</p>
                        <p className="font-semibold text-purple-700 mt-0.5 flex items-center gap-1">
                          <CalendarClock className="size-3.5 text-purple-500 shrink-0" />
                          <span>{candidate.availability || "Fleksibel / Sesuai Kesepakatan"}</span>
                        </p>
                      </div>

                      {/* Lowongan / Talent Pool Assignment */}
                      <div className="col-span-2 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-slate-500 text-[11px]">Tugaskan ke Lowongan</p>
                          <p className="text-[10px] text-slate-400">Pilih lowongan untuk memindahkan ke pipeline aktif</p>
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

                {/* Cover Note Section */}
                {candidate.coverNote && (
                  <Card className="border-purple-200/80 bg-purple-50/20">
                    <CardContent className="p-4 space-y-1.5">
                      <h4 className="text-xs font-bold text-purple-950">
                        Surat Lamaran / Cover Note
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-line">
                        &ldquo;{candidate.coverNote}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Ringkasan Hasil AI Screening */}
                <CandidateScreeningSummary
                  candidateId={candidate.id}
                  candidateName={candidate.name}
                  role={candidate.role}
                  score={candidate.score}
                  feedback={candidate.feedback}
                  isUnlocked={candidate.unlocked !== false}
                  onUnlock={() => onUnlockCandidate?.(candidate)}
                  isTalentPool={true}
                />

                {/* Panduan Talent Pool */}
                <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-purple-950">Panduan Talent Pool</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kandidat berada dalam basis talenta umum. Ketika ada posisi baru yang cocok, tugaskan kandidat ke lowongan tersebut untuk memulai alur screening, wawancara, dan penawaran.
                  </p>
                </div>
              </div>
            ) : candidate.stage === "screening" ? (
              /* SCREENING: Ringkasan Saja */
              <div className="space-y-5">
                {/* SLA Triage Indicator */}
                {(() => {
                  const days = getDaysInCurrentStage(candidate);
                  if (days < 3) return null;
                  const isOverdue = days >= 5;

                  return (
                    <div
                      className={cn(
                        "rounded-xl border p-3.5 text-xs flex items-start gap-3",
                        isOverdue
                          ? "bg-rose-50/90 border-rose-200 text-rose-900 shadow-2xs"
                          : "bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs"
                      )}
                    >
                      {isOverdue ? (
                        <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          {isOverdue ? "Peringatan SLA Terlewat" : "Mendekati Batas SLA"}
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                              isOverdue
                                ? "bg-rose-200/80 text-rose-800"
                                : "bg-amber-200/80 text-amber-800"
                            )}
                          >
                            {days} hari di antrean
                          </span>
                        </p>
                        <p className="text-[11px] leading-relaxed opacity-90">
                          {isOverdue
                            ? "Lamaran kandidat ini telah melampaui estimasi standar peninjauan 3–5 hari kerja. Segera lakukan evaluasi profil atau putuskan kelanjutan ke tahap berikutnya."
                            : "Lamaran ini telah berada di antrean screening selama 3 hari. Segera tinjau untuk menjaga SLA respons kepada kandidat."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Informasi Pelamar */}
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
                          Screening
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
                      <div>
                        <p className="text-slate-500">Ekspektasi Kompensasi</p>
                        <p className="font-semibold text-emerald-700 mt-0.5">
                          {candidate.expectedSalary
                            ? `Rp ${Number(candidate.expectedSalary).toLocaleString("id-ID")} / bln`
                            : candidate.compensation || "Rp 15.000.000 / bulan"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ketersediaan Kerja</p>
                        <p className="font-semibold text-purple-700 mt-0.5 flex items-center gap-1">
                          <CalendarClock className="size-3.5 text-purple-500 shrink-0" />
                          <span>{candidate.availability || "Fleksibel / Sesuai Kesepakatan"}</span>
                        </p>
                      </div>

                      {/* Lowongan Pekerjaan */}
                      <div className="col-span-2 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-slate-500 text-[11px]">Lowongan Pekerjaan</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="size-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800 text-xs">
                              {candidate.jobTitle || "Lowongan Terpilih"}
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
                            <option value="talent-pool">Pindahkan ke Talent Pool</option>
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

                {/* Cover Note */}
                {candidate.coverNote && (
                  <Card className="border-purple-200/80 bg-purple-50/20">
                    <CardContent className="p-4 space-y-1.5">
                      <h4 className="text-xs font-bold text-purple-950">
                        Surat Lamaran / Cover Note
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-line">
                        &ldquo;{candidate.coverNote}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Ringkasan Hasil AI Screening */}
                <CandidateScreeningSummary
                  candidateId={candidate.id}
                  candidateName={candidate.name}
                  role={candidate.role}
                  score={candidate.score}
                  feedback={candidate.feedback}
                  isUnlocked={candidate.unlocked !== false}
                  onUnlock={() => onUnlockCandidate?.(candidate)}
                  isTalentPool={false}
                />

                {/* Aksi Lanjutan Rekruter */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800">Aksi Lanjutan Rekruter</h4>
                  {candidate.unlocked === false ? (
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-white border border-slate-200/80 rounded-lg p-2.5">
                      <Lock className="size-3.5 text-purple-600 shrink-0" />
                      <span>
                        Fitur kontak langsung, penjadwalan wawancara, dan penerbitan surat penawaran akan aktif setelah profil dibuka.
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">
                        Kandidat memenuhi kualifikasi awal. Lanjutkan ke sesi wawancara atau terbitkan surat penawaran.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 font-medium bg-white text-slate-700"
                          onClick={() => {
                            if (onOpenScheduleModal) {
                              onOpenScheduleModal(candidate);
                            } else {
                              onStageChange(candidate.id, "interview");
                            }
                          }}
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
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : candidate.stage === "interview" ? (
              /* INTERVIEW: Detail & Form Wawancara */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Jadwal Sesi Wawancara</h3>
                  {latestInterview && (
                    <span className="text-[11px] font-medium text-slate-400">
                      Sesi Terbaru
                    </span>
                  )}
                </div>

                {!latestInterview ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
                    <Calendar className="size-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 mt-2">Belum ada sesi wawancara</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Buat jadwal wawancara baru melalui formulir di bawah.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Render The Latest Single Interview Session */}
                    {(() => {
                      const iv = latestInterview;
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
                        <Card className="border-purple-200/80 bg-white shadow-2xs ring-1 ring-purple-100">
                          <CardContent className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-900">{iv.type}</p>
                                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                    Sesi Utama
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                  <Clock className="size-3.5 text-[#7C3AED]" />
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
                              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-slate-700 space-y-2">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      Kandidat tidak dapat menghadiri sesi wawancara ini
                                    </p>
                                    {(() => {
                                      const declineItem = candidate.statusHistory?.slice().reverse().find(
                                        (h) => h.title.includes("Ditolak Kandidat") || (h.notes && h.notes.includes("Kandidat tidak dapat menghadiri"))
                                      );
                                      const noteText = iv.declineReason
                                        ? `Alasan: "${iv.declineReason}". Lamaran tetap aktif.`
                                        : declineItem?.notes;
                                      return noteText ? (
                                        <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                                          {noteText}
                                        </p>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs font-medium bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                                    onClick={() => {
                                      if (onOpenScheduleModal && candidate) {
                                        onOpenScheduleModal(candidate);
                                      }
                                    }}
                                  >
                                    <CalendarClock className="size-3.5 mr-1" /> Jadwalkan Ulang
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-medium bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    onClick={() => {
                                      onStageChange(candidate.id, "screening", {
                                        reason: "Dikembalikan ke tahap screening setelah penolakan sesi wawancara.",
                                      });
                                      toast.info("Kandidat dipindahkan kembali ke tahap Screening.");
                                    }}
                                  >
                                    <ArrowLeft className="size-3.5 mr-1" /> Kembalikan ke Screening
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className="h-7 text-xs font-medium text-slate-700 hover:bg-amber-100/60"
                                  >
                                    <Link href={`/messages/${candidate.id}?contact=${encodeURIComponent(candidate.name)}`}>
                                      <MessageSquare className="size-3.5 mr-1" /> Kirim Pesan
                                    </Link>
                                  </Button>
                                </div>
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
                    })()}

                    {/* Collapsible Past Interviews Accordion */}
                    {pastInterviews.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowPastInterviews(!showPastInterviews)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-xs font-semibold text-slate-600"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="size-3.5 text-slate-400" />
                            Riwayat Sesi Sebelumnya ({pastInterviews.length})
                          </span>
                          {showPastInterviews ? (
                            <ChevronUp className="size-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="size-4 text-slate-500" />
                          )}
                        </button>

                        {showPastInterviews && (
                          <div className="mt-2 space-y-2 pt-1 animate-in fade-in-50 duration-150">
                            {pastInterviews.map((iv) => {
                              const isPastDate = Boolean(iv.date && !isNaN(new Date(iv.date).getTime()) && new Date(iv.date).getTime() < now);
                              const pastEffectiveStatus =
                                iv.status === "Dibatalkan"
                                  ? "Dibatalkan"
                                  : iv.status === "Selesai" || (isPastDate && !["Permintaan Reschedule", "Ditolak Kandidat"].includes(iv.status))
                                  ? "Selesai"
                                  : iv.status;

                              return (
                                <div
                                  key={iv.id}
                                  className="rounded-lg border border-slate-200/70 bg-white p-3 text-xs space-y-1.5 opacity-80 hover:opacity-100 transition-opacity"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-800 text-[11px]">{iv.type}</p>
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                      {pastEffectiveStatus}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="size-3 text-slate-400" />
                                      {formatInterviewDateTime(iv.date)}
                                    </span>
                                    {iv.meetingUrl && (
                                      <a
                                        href={iv.meetingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
                                      >
                                        <Video className="size-3" /> Link Temu
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Form Buat Jadwal Baru */}
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

                {/* Aksi Lanjutan Wawancara */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800">Aksi Lanjutan Wawancara</h4>
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
                  </div>
                </div>
              </div>
            ) : candidate.stage === "offer" ? (
              /* OFFER: Detail & Status Penawaran */
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
            ) : candidate.stage === "hired" ? (
              /* HIRED: Rincian Penerimaan & Onboarding */
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <span>Kandidat Resmi Diterima (Hired)</span>
                  </div>
                  <p className="text-xs text-emerald-700/90 leading-relaxed">
                    Proses seleksi telah selesai secara sukses. Penawaran kerja telah disepakati dan kandidat siap dipersiapkan untuk hari pertama kerja (onboarding).
                  </p>
                  <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                    <span className="text-emerald-700">Kompensasi Disepakati:</span>
                    <span className="font-bold">{candidate.compensation || "Rp 15.000.000 / bulan"}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* REJECTED */
              <div className="space-y-5">
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2">
                  <p className="text-xs font-bold text-rose-900">Kandidat Tidak Lolos (Arsip)</p>
                  <p className="text-xs text-rose-700">
                    Kandidat ini diarsipkan dari alur aktif lowongan. Anda dapat mengaktifkannya kembali ke tahap screening jika ada pertimbangan baru.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStageChange(candidate.id, "screening")}
                    className="h-8 text-xs font-semibold bg-white border-rose-300 text-rose-700 hover:bg-rose-100 gap-1.5 shadow-2xs mt-1"
                  >
                    <Undo2 className="size-3.5" /> Aktifkan Lagi ke Screening
                  </Button>
                </div>
              </div>
            )}

            {/* 2. CATATAN & RIWAYAT (SELALU DI BAGIAN PALING BAWAH) */}
            <div className="border-t border-slate-200/80 pt-6 mt-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Catatan Internal Rekruter
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => {
                    if (candidate) {
                      setFeedbackCandidateId(candidate.id);
                      setUserFeedbackOverride(e.target.value);
                    }
                  }}
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

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <GitCommit className="size-3.5 text-[#7C3AED]" />
                    Riwayat Status &amp; Milestone
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

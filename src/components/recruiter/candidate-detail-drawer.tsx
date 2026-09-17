"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  Send,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  offerStatus: "draft" | "sent" | "accepted" | "declined";
  compensation: string;
  reason: string;
  applicationId?: string;
  jobId?: string;
  jobTitle?: string;
};

export type Interview = {
  id: string;
  candidateId: string;
  date: string;
  timezone: string;
  type: string;
  panel: string[];
  status: "Terjadwal" | "Selesai" | "Dibatalkan";
  reminder: boolean;
  meetingUrl?: string;
  sentAt?: string | null;
};

interface CandidateDetailDrawerProps {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  interviews: Interview[];
  onStageChange: (candidateId: string, stage: Stage) => void;
  onOpenOfferModal: (candidate: Candidate) => void;
  onAddInterview: (candidateId: string, interview: Omit<Interview, "id">) => Promise<void>;
  onSendInterviewInvitation: (interview: Interview, cand?: Candidate) => Promise<void>;
  onUpdateFeedback: (candidateId: string, feedback: string) => void;
  recruiterName: string;
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
}: CandidateDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "interview" | "offer" | "notes">("overview");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [sendingInterviewId, setSendingInterviewId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

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

  const candidateInterviews = interviews.filter((i) => i.candidateId === candidate.id);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-purple-200">
                  {candidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                    {candidate.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{candidate.role}</p>
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
                <select
                  value={candidate.stage}
                  onChange={(e) => onStageChange(candidate.id, e.target.value as Stage)}
                  className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 bg-white shadow-2xs focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden cursor-pointer"
                >
                  {STAGE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs font-semibold text-[#7C3AED] border-purple-200 hover:bg-purple-50 hover:text-[#6D28D9] gap-1.5"
              >
                <Link href={`/messages`}>
                  <MessageSquare className="size-3.5" /> Kirim Pesan
                </Link>
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs gap-1.5"
                onClick={() => onOpenOfferModal(candidate)}
              >
                <DollarSign className="size-3.5" /> Buat Penawaran
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "py-3 text-xs font-semibold border-b-2 transition-colors",
                activeTab === "overview"
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Ringkasan
            </button>
            <button
              onClick={() => setActiveTab("interview")}
              className={cn(
                "py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                activeTab === "interview"
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
                activeTab === "offer"
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Penawaran
              {candidate.offerStatus !== "draft" && (
                <span className="size-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={cn(
                "py-3 text-xs font-semibold border-b-2 transition-colors",
                activeTab === "notes"
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
            {activeTab === "overview" && (
              <div className="space-y-5">
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
                    </div>
                  </CardContent>
                </Card>

                {candidate.feedback && (
                  <Card className="border-purple-200 bg-purple-50/50 shadow-2xs">
                    <CardContent className="p-4">
                      <h4 className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Catatan Interviewer Sebelumnya</h4>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed italic">
                        &ldquo;{candidate.feedback}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800">Aksi Lanjutan Rekruter</h4>
                  <p className="text-xs text-slate-500">
                    Kandidat ini memenuhi 84% kompetensi inti lowongan. Lanjutkan ke tahap wawancara teknis atau kirimkan surat penawaran resmi.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 font-medium bg-white"
                      onClick={() => setActiveTab("interview")}
                    >
                      <Calendar className="size-3.5 mr-1" /> Atur Sesi Wawancara
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 font-medium bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => onStageChange(candidate.id, "hired")}
                    >
                      <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" /> Langsung Tandai Hired
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* INTERVIEWS TAB */}
            {activeTab === "interview" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Jadwal Sesi Wawancara</h3>
                </div>

                {candidateInterviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
                    <Calendar className="size-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 mt-2">Belum ada sesi wawancara</p>
                    <p className="text-xs text-slate-400 mt-1">Buat jadwal baru di formulir bawah ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidateInterviews.map((iv) => {
                      const isPastDate = Boolean(iv.date && !isNaN(new Date(iv.date).getTime()) && new Date(iv.date).getTime() < now);
                      const effectiveStatus = iv.status === "Dibatalkan" ? "Dibatalkan" : isPastDate || iv.status === "Selesai" ? "Selesai" : "Terjadwal";

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
                                    : effectiveStatus === "Dibatalkan"
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-purple-50 text-[#7C3AED] border-purple-200"
                                )}
                              >
                                {effectiveStatus}
                              </Badge>
                            </div>

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
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  </div>
                )}

                {/* Form Tambah Wawancara Cepat */}
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
                          Tautan Video Meeting (Google Meet / Zoom)
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
              </div>
            )}

            {/* OFFERS TAB */}
            {activeTab === "offer" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Status Penawaran:</span>
                    <Badge
                      className={cn(
                        "capitalize text-[11px]",
                        candidate.offerStatus === "accepted"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : candidate.offerStatus === "sent"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {candidate.offerStatus === "accepted"
                        ? "Diterima oleh Kandidat"
                        : candidate.offerStatus === "sent"
                        ? "Penawaran Terkirim"
                        : "Draf"}
                    </Badge>
                  </div>

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
                      {candidate.offerStatus === "draft" ? "Buat & Terbitkan Penawaran" : "Perbarui Rincian Penawaran"}
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

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
                  <h4 className="font-semibold text-slate-800">Manfaat Surat Penawaran Digital ProofyLink:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500">
                    <li>Kandidat menerima tombol 1-Click Accept Offer langsung di portalnya.</li>
                    <li>Status otomatis beralih ke <strong>Hired</strong> begitu kandidat setuju.</li>
                    <li>Semua klausul tersimpan secara aman di database.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* NOTES & HISTORY TAB */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Catatan Internal Rekruter
                  </label>
                  <textarea
                    rows={4}
                    defaultValue={candidate.feedback}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tuliskan catatan wawancara, kelebihan, atau pertimbangan tim HR..."
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

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Riwayat Status</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Terdaftar pada</span>
                      <span className="font-medium text-slate-800">{candidate.appliedAt}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Batas Waktu (SLA)</span>
                      <span className="font-medium text-slate-800">{candidate.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Tahap saat ini</span>
                      <span className="font-semibold text-purple-700 capitalize">{candidate.stage}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

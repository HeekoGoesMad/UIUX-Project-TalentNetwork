"use client";

import { useMemo } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  GitCommit,
  Layers,
  Sparkles,
  Undo2,
  User,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusHistoryItem = {
  id: string;
  stage: "talent-pool" | "screening" | "interview" | "offer" | "hired" | "rejected" | "renege";
  title: string;
  actionType?: "system" | "recruiter" | "candidate" | "hr";
  timestamp: string; // ISO string or human-readable format
  actor: string;
  actorRole?: string;
  notes?: string;
};

const STAGE_CONFIGS: Record<
  StatusHistoryItem["stage"],
  {
    label: string;
    nodeColor: string;
    ringColor: string;
    textColor: string;
    bgBadge: string;
    icon: typeof GitCommit;
  }
> = {
  "talent-pool": {
    label: "Talent Pool",
    nodeColor: "bg-purple-600 border-purple-200",
    ringColor: "ring-purple-200",
    textColor: "text-purple-700",
    bgBadge: "bg-purple-50 border-purple-200 text-purple-700",
    icon: Layers,
  },
  screening: {
    label: "Screening",
    nodeColor: "bg-blue-600 border-blue-200",
    ringColor: "ring-blue-200",
    textColor: "text-blue-700",
    bgBadge: "bg-blue-50 border-blue-200 text-blue-700",
    icon: Sparkles,
  },
  interview: {
    label: "Interview",
    nodeColor: "bg-fuchsia-600 border-fuchsia-200",
    ringColor: "ring-fuchsia-200",
    textColor: "text-fuchsia-700",
    bgBadge: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700",
    icon: CalendarClock,
  },
  offer: {
    label: "Penawaran",
    nodeColor: "bg-amber-600 border-amber-200",
    ringColor: "ring-amber-200",
    textColor: "text-amber-700",
    bgBadge: "bg-amber-50 border-amber-200 text-amber-700",
    icon: DollarSign,
  },
  hired: {
    label: "Diterima (Hired)",
    nodeColor: "bg-emerald-600 border-emerald-200",
    ringColor: "ring-emerald-200",
    textColor: "text-emerald-700",
    bgBadge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Tidak Lolos",
    nodeColor: "bg-slate-600 border-slate-200",
    ringColor: "ring-slate-200",
    textColor: "text-slate-600",
    bgBadge: "bg-slate-50 border-slate-200 text-slate-600",
    icon: XCircle,
  },
  renege: {
    label: "Dibatalkan (Renege)",
    nodeColor: "bg-rose-600 border-rose-200",
    ringColor: "ring-rose-200",
    textColor: "text-rose-700",
    bgBadge: "bg-rose-50 border-rose-200 text-rose-700",
    icon: Undo2,
  },
};

function formatTimestamp(timestampStr: string): string {
  try {
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) return timestampStr;

    const day = date.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day} ${month} ${year} · ${hours}:${minutes} WIB`;
  } catch {
    return timestampStr;
  }
}

interface CandidateStatusGitGraphProps {
  history: StatusHistoryItem[];
  appliedAt?: string;
  dueDate?: string;
  currentStage: string;
}

export function getDefaultStatusHistory(candidate: {
  id: string;
  name: string;
  role: string;
  stage: string;
  owner?: string;
  appliedAt?: string;
  score?: number;
  compensation?: string;
  reason?: string;
  jobId?: string;
  jobTitle?: string;
  statusHistory?: StatusHistoryItem[];
}, recruiterName = "Adrienne"): StatusHistoryItem[] {
  if (candidate.statusHistory && candidate.statusHistory.length > 0) {
    return candidate.statusHistory;
  }

  const isTalentPool = !candidate.jobId || candidate.jobId === "talent-pool";
  const appliedDate = candidate.appliedAt || "2026-09-09";
  const baseActor = candidate.owner || recruiterName;

  const items: StatusHistoryItem[] = [
    {
      id: `hist-reg-${candidate.id}`,
      stage: isTalentPool ? "talent-pool" : "screening",
      title: isTalentPool
        ? "Pendaftaran Masuk ke Talent Pool"
        : `Pendaftaran Posisi: ${candidate.jobTitle || candidate.role}`,
      actionType: "system",
      timestamp: `${appliedDate}T09:15:00.000Z`,
      actor: "Sistem",
      actorRole: "AI Parser Engine",
      notes: "Profil dan portofolio kandidat terverifikasi dan masuk ke pipeline aktif.",
    },
    {
      id: `hist-scr-${candidate.id}`,
      stage: "screening",
      title: "Screening AI & Validasi Kompetensi",
      actionType: "system",
      timestamp: `${appliedDate}T09:18:00.000Z`,
      actor: "AI Screening Engine",
      actorRole: "Model Evaluasi v2.4",
      notes: "Keselarasan role-fit: Sangat Sesuai. Kualifikasi teknis memenuhi standar peran.",
    },
  ];

  if (candidate.stage === "interview" || candidate.stage === "offer" || candidate.stage === "hired") {
    items.push({
      id: `hist-int-${candidate.id}`,
      stage: "interview",
      title: "Lolos Screening & Masuk Sesi Wawancara",
      actionType: "recruiter",
      timestamp: "2026-09-12T14:30:00.000Z",
      actor: baseActor,
      actorRole: "Lead Recruiter",
      notes: "Hasil screening disetujui. Sesi wawancara teknis dan keselarasan peran dijadwalkan.",
    });
  }

  if (candidate.stage === "offer" || candidate.stage === "hired") {
    items.push({
      id: `hist-off-${candidate.id}`,
      stage: "offer",
      title: "Surat Penawaran Resmi Diterbitkan",
      actionType: "recruiter",
      timestamp: "2026-09-18T16:20:00.000Z",
      actor: baseActor,
      actorRole: "Hiring Lead",
      notes: `Penawaran kompensasi ${candidate.compensation || "Rp 15.000.000 / bulan"} diterbitkan secara digital.`,
    });
  }

  if (candidate.stage === "hired") {
    items.push({
      id: `hist-hir-${candidate.id}`,
      stage: "hired",
      title: "Penawaran Disetujui & Resmi Bergabung (Hired)",
      actionType: "recruiter",
      timestamp: "2026-09-20T11:00:00.000Z",
      actor: baseActor,
      actorRole: "Hiring Lead",
      notes: "Kandidat menyetujui surat penawaran. Proses rekrutmen selesai dan masuk tahap onboarding.",
    });
  }

  if (candidate.stage === "rejected") {
    items.push({
      id: `hist-rej-${candidate.id}`,
      stage: "rejected",
      title: "Ditandai Tidak Lolos Seleksi",
      actionType: "recruiter",
      timestamp: new Date().toISOString(),
      actor: baseActor,
      actorRole: "Recruiter Lead",
      notes: candidate.reason || "Kandidat tidak melanjutkan ke tahap berikutnya untuk posisi ini.",
    });
  }

  return items;
}

export function CandidateStatusGitGraph({
  history,
  appliedAt,
  dueDate,
  currentStage,
}: CandidateStatusGitGraphProps) {
  // Sort history chronologically: start of journey at top, latest / current stage at bottom
  const orderedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [history]);

  return (
    <div className="space-y-3.5">
      {/* SLA & Pipeline Meta Header */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-[11px]">
        <div className="space-y-0.5">
          <span className="text-slate-400 block font-medium">Terdaftar pada</span>
          <span className="font-semibold text-slate-700">{appliedAt || "09 Sep 2026"}</span>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="space-y-0.5">
          <span className="text-slate-400 block font-medium">Target SLA</span>
          <span className="font-semibold text-slate-700">{dueDate || "25 Sep 2026"}</span>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="space-y-0.5 text-right">
          <span className="text-slate-400 block font-medium">Tahap Aktif</span>
          <span className="font-bold text-[#7C3AED] capitalize">{currentStage}</span>
        </div>
      </div>

      {/* Git Graph / MRT Metro Route Line Container */}
      <div className="relative pl-6 pt-1 pb-1">
        {/* The Continuous Metro Track / Vertical Rail Line */}
        <div
          className="absolute left-[13px] top-3 bottom-5 w-0.5 bg-gradient-to-b from-purple-300 via-blue-300 to-emerald-400"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {orderedHistory.map((item, index) => {
            const isLast = index === orderedHistory.length - 1;
            const config = STAGE_CONFIGS[item.stage] || STAGE_CONFIGS.screening;
            const NodeIcon = config.icon;
            const formattedTime = formatTimestamp(item.timestamp);

            return (
              <div key={item.id || index} className="relative group">
                {/* Node Station Dot (Git Commit / Metro Station) */}
                <div
                  className={cn(
                    "absolute -left-6 top-0.5 size-6 rounded-full flex items-center justify-center border-2 bg-white transition-transform duration-200 shadow-xs group-hover:scale-115",
                    config.nodeColor,
                    isLast && "ring-4 ring-offset-1 animate-pulse",
                    isLast ? config.ringColor : ""
                  )}
                >
                  <NodeIcon className="size-3 text-white" />
                </div>

                {/* Content Card Beside Node */}
                <div
                  className={cn(
                    "rounded-xl border p-3 transition-all duration-200",
                    isLast
                      ? "border-purple-200/90 bg-purple-50/20 shadow-xs"
                      : "border-slate-200/70 bg-white hover:border-slate-300"
                  )}
                >
                  {/* Top Bar: Title & Timestamp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "inline-flex text-[9px] font-semibold px-1.5 py-0.2 rounded-md border",
                          config.bgBadge
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-slate-400 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200/60">
                      {formattedTime}
                    </span>
                  </div>

                  {/* Actor / Recruiter Line */}
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    {item.actionType === "system" ? (
                      <Bot className="size-3 text-blue-500 shrink-0" />
                    ) : (
                      <User className="size-3 text-purple-600 shrink-0" />
                    )}
                    <span>
                      oleh{" "}
                      <strong className="text-slate-700 font-semibold">{item.actor}</strong>
                      {item.actorRole ? ` · ${item.actorRole}` : ""}
                    </span>
                  </div>

                  {/* Optional Notes / Reason Box */}
                  {item.notes && (
                    <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 leading-relaxed">
                      {item.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FileText,
  GitCompareArrows,
  History,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";

type Stage = "screening" | "interview" | "offer" | "hired" | "rejected";
type Candidate = {
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
};
type Interview = {
  id: string;
  candidateId: string;
  date: string;
  timezone: string;
  type: string;
  panel: string[];
  status: "Terjadwal" | "Selesai" | "Dibatalkan";
  reminder: boolean;
};

const storageKey = "proofylink-demo-recruiter-operations";
const stages: Array<{ id: Stage; label: string; color: string }> = [
  { id: "screening", label: "Screening", color: "bg-blue-50 text-blue-800" },
  { id: "interview", label: "Interview", color: "bg-fuchsia-50 text-fuchsia-800" },
  { id: "offer", label: "Offer", color: "bg-amber-50 text-amber-800" },
  { id: "hired", label: "Hired", color: "bg-emerald-50 text-emerald-800" },
  { id: "rejected", label: "Rejected", color: "bg-red-50 text-red-800" },
];
const defaultPeople = ["Raka Pratama", "Sari Wijaya", "Dimas Nugroho"];
const initialCandidates: Candidate[] = [
  { id: "candidate-1", name: "Nadia Putri Rahayu", role: "Senior Product Designer", location: "Jakarta Selatan", stage: "interview", owner: "Raka Pratama", dueDate: "2026-08-20", appliedAt: "2026-07-28", score: 4.6, feedback: "", offerStatus: "draft", compensation: "Rp 28–32 juta / bulan", reason: "" },
  { id: "candidate-2", name: "Bima Adinata", role: "Senior Product Designer", location: "Bandung", stage: "screening", owner: "Sari Wijaya", dueDate: "2026-08-18", appliedAt: "2026-08-02", score: 4.1, feedback: "Portfolio kuat, perlu validasi stakeholder management.", offerStatus: "draft", compensation: "Rp 25–29 juta / bulan", reason: "" },
  { id: "candidate-3", name: "Maya Kusuma", role: "Senior Product Designer", location: "Jakarta Barat", stage: "offer", owner: "Raka Pratama", dueDate: "2026-08-19", appliedAt: "2026-07-22", score: 4.8, feedback: "Sangat kuat di systems thinking dan discovery.", offerStatus: "sent", compensation: "Rp 31 juta / bulan + bonus", reason: "" },
  { id: "candidate-4", name: "Rizky Maulana", role: "Senior Product Designer", location: "Surabaya", stage: "interview", owner: "Dimas Nugroho", dueDate: "2026-08-21", appliedAt: "2026-07-30", score: 3.7, feedback: "", offerStatus: "draft", compensation: "Rp 24–28 juta / bulan", reason: "" },
  { id: "candidate-5", name: "Tasya Lestari", role: "Senior Product Designer", location: "Yogyakarta", stage: "hired", owner: "Sari Wijaya", dueDate: "2026-08-04", appliedAt: "2026-07-04", score: 4.9, feedback: "", offerStatus: "accepted", compensation: "Rp 30 juta / bulan", reason: "" },
];
const initialInterviews: Interview[] = [
  { id: "interview-1", candidateId: "candidate-1", date: "2026-08-20T09:00", timezone: "Asia/Jakarta (WIB)", type: "Portfolio review", panel: ["Raka Pratama", "Sari Wijaya"], status: "Terjadwal", reminder: true },
  { id: "interview-2", candidateId: "candidate-4", date: "2026-08-21T14:00", timezone: "Asia/Jakarta (WIB)", type: "Culture & values", panel: ["Dimas Nugroho"], status: "Terjadwal", reminder: false },
];

function readDemo() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { candidates?: Candidate[]; interviews?: Interview[] } | null;
    return { candidates: parsed?.candidates ?? initialCandidates, interviews: parsed?.interviews ?? initialInterviews };
  } catch {
    return { candidates: initialCandidates, interviews: initialInterviews };
  }
}

function dateLabel(value: string) {
  try {
    const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return value;
  }
}

function dateTimeLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function stageLabel(stage: Stage) { return stages.find((item) => item.id === stage)?.label ?? stage; }
function StageBadge({ stage }: { stage: Stage }) { const item = stages.find((candidateStage) => candidateStage.id === stage); return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item?.color}`}>{item?.label}</span>; }
function Metric({ label, value, detail, tone = "text-foreground" }: { label: string; value: string; detail: string; tone?: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }


export function RecruiterOperationsPage() {
  const { dbMode, scans, user } = useApp();
  const [data, setData] = useState(readDemo);
  const [isRealData, setIsRealData] = useState(false);
  const [tab, setTab] = useState<"overview" | "pipeline" | "interviews" | "offers" | "history">("overview");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [eventForm, setEventForm] = useState({ date: "2026-08-25T10:00", timezone: "Asia/Jakarta (WIB)", type: "Panel interview", panel: user?.name || "Tim Rekruter" });
  const [historyStage, setHistoryStage] = useState<Stage | "all">("all");
  const [historySearch, setHistorySearch] = useState("");

  const recruiterName = user?.name || "Tim Rekruter";
  const people = useMemo(() => {
    return Array.from(new Set([recruiterName, ...defaultPeople]));
  }, [recruiterName]);

  // Anti-abuse rule: In DB mode, only candidates that have been scanned by the recruiter are unlocked and eligible to appear
  const isCandidateUnlocked = useCallback(
    (candidateId: string) => {
      if (!dbMode) return true;
      return scans.some((scan) => scan.candidateId === candidateId);
    },
    [dbMode, scans]
  );

  // Only persist to demo storage when NOT in database mode, preserving demo state for presentations
  useEffect(() => {
    if (!dbMode) {
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, dbMode]);

  // Exclude locked candidates completely from hiring operations in database mode
  const activeCandidates = useMemo(() => {
    if (!dbMode) return data.candidates;
    return data.candidates.filter((candidate) => isCandidateUnlocked(candidate.id));
  }, [dbMode, data.candidates, isCandidateUnlocked]);

  const visibleCandidates = useMemo(
    () =>
      activeCandidates.filter(
        (candidate) =>
          (stageFilter === "all" || candidate.stage === stageFilter) &&
          (ownerFilter === "all" || candidate.owner === ownerFilter) &&
          `${candidate.name} ${candidate.role}`.toLowerCase().includes(query.toLowerCase())
      ),
    [activeCandidates, ownerFilter, query, stageFilter]
  );

  const selectedCandidateData = activeCandidates.find((candidate) => candidate.id === selectedCandidate) ?? activeCandidates[0];
  const activeCandidateIds = useMemo(() => new Set(activeCandidates.map((c) => c.id)), [activeCandidates]);
  const scheduledInterviews = useMemo(
    () => data.interviews.filter((interview) => interview.status === "Terjadwal" && (!dbMode || activeCandidateIds.has(interview.candidateId))),
    [activeCandidateIds, data.interviews, dbMode]
  );
  const stageCounts = stages.map((stage) => ({ ...stage, count: activeCandidates.filter((candidate) => candidate.stage === stage.id).length }));

  // Metrics calculations
  const activeCandidatesCount = activeCandidates.filter((c) => c.stage !== "hired" && c.stage !== "rejected").length;
  const hiredCandidates = activeCandidates.filter((c) => c.stage === "hired");
  const averageTimeToHire = useMemo(() => {
    if (hiredCandidates.length === 0) return null;
    return Math.round(
      hiredCandidates.reduce((total, candidate) => {
        const appliedTime = Date.parse(candidate.appliedAt) || Date.parse("2026-08-01");
        const completedTime = Date.parse(candidate.dueDate) || Date.parse("2026-08-20");
        const days = Math.max(1, Math.round(Math.abs(completedTime - appliedTime) / 86400000));
        return total + days;
      }, 0) / hiredCandidates.length
    );
  }, [hiredCandidates]);

  const slaAlertCandidates = activeCandidates.filter(
    (c) => c.stage === "screening" || c.stage === "interview"
  );

  // Dynamic Pipeline Velocity
  const totalInPipeline = activeCandidates.length;
  const reachedInterview = activeCandidates.filter((c) => ["interview", "offer", "hired"].includes(c.stage)).length;
  const reachedOffer = activeCandidates.filter((c) => ["offer", "hired"].includes(c.stage)).length;
  const hiredCount = hiredCandidates.length;

  const convScreenToInterview = totalInPipeline > 0 ? Math.round((reachedInterview / totalInPipeline) * 100) : 0;
  const convInterviewToOffer = reachedInterview > 0 ? Math.round((reachedOffer / reachedInterview) * 100) : 0;
  const convOfferAcceptance = reachedOffer > 0 ? Math.round((hiredCount / reachedOffer) * 100) : 0;

  const updateCandidate = (id: string, update: Partial<Candidate>) =>
    setData((current) => ({
      ...current,
      candidates: current.candidates.map((candidate) => (candidate.id === id ? { ...candidate, ...update } : candidate)),
    }));

  const changeStage = async (id: string, stage: Stage) => {
    updateCandidate(id, { stage, dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) });
    const target = data.candidates.find((c) => c.id === id);
    if (dbMode && target?.applicationId) {
      try {
        const appStatus = stage === "screening" ? "screening" : stage === "interview" ? "interview" : stage === "offer" ? "offer" : stage === "hired" ? "hired" : "rejected";
        await fetch(`/api/applications/${target.applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: appStatus }),
        });
      } catch {
        // Optimistic UI preserved
      }
    }
    toast.success(`Tahap kandidat dipindahkan ke ${stageLabel(stage)}`);
  };

  const bulkChangeStage = (stage: Stage) => {
    if (!selected.length) return;
    setData((current) => ({ ...current, candidates: current.candidates.map((candidate) => (selected.includes(candidate.id) ? { ...candidate, stage } : candidate)) }));
    toast.success(`${selected.length} kandidat dipindahkan ke ${stageLabel(stage)}`);
  };

  const addInterview = async () => {
    if (!selectedCandidate) {
      toast.error("Pilih kandidat terlebih dahulu");
      return;
    }
    const interview: Interview = {
      id: `interview-${Date.now()}`,
      candidateId: selectedCandidate,
      date: eventForm.date,
      timezone: eventForm.timezone,
      type: eventForm.type,
      panel: [eventForm.panel],
      status: "Terjadwal",
      reminder: true,
    };
    setData((current) => ({ ...current, interviews: [interview, ...current.interviews] }));
    if (dbMode) {
      try {
        await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: eventForm.type,
            scheduledAt: new Date(eventForm.date).toISOString(),
            timezone: eventForm.timezone,
            candidateProfileId: selectedCandidate.startsWith("candidate-") ? undefined : selectedCandidate,
            meetingUrl: "https://meet.google.com/new",
          }),
        });
      } catch {
        // Handled
      }
    }
    toast.success("Interview dijadwalkan", { description: "Reminder kandidat aktif." });
  };

  const exportCsv = () => {
    const rows = [
      ["Kandidat", "Posisi", "Tahap", "Owner", "SLA", "Score", "Offer", "Kompensasi"],
      ...visibleCandidates.map((candidate) => [
        candidate.name,
        candidate.role,
        stageLabel(candidate.stage),
        candidate.owner,
        candidate.dueDate,
        String(candidate.score),
        candidate.offerStatus,
        candidate.compensation,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-hiring-proofylink.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan CSV diunduh");
  };

  const history = activeCandidates
    .flatMap((candidate) => [
      {
        candidate,
        stage: candidate.stage,
        at: candidate.dueDate,
        note: candidate.stage === "rejected" ? candidate.reason || "Alasan belum ditambahkan" : `Owner: ${candidate.owner}`,
      },
    ])
    .filter(
      (item) =>
        (historyStage === "all" || item.stage === historyStage) &&
        item.candidate.name.toLowerCase().includes(historySearch.toLowerCase())
    );

  useEffect(() => {
    if (!dbMode) return;
    let active = true;

    // Fetch live applications, candidates, interviews, and offers from Supabase
    Promise.all([
      fetch("/api/applications", { cache: "no-store" }),
      fetch("/api/candidates?limit=50", { cache: "no-store" }),
      fetch("/api/interviews", { cache: "no-store" }),
      fetch("/api/offers", { cache: "no-store" }),
    ])
      .then(async ([appRes, candRes, intRes, offRes]) => {
        if (!active) return;
        const scannedCandidateIds = new Set(scans.map((s) => s.candidateId));
        let mappedCandidates: Candidate[] = [];

        // 1. Map applications (only for scanned candidates to prevent free tier abuse)
        if (appRes.ok) {
          type AppRow = {
            id: string;
            status: string;
            candidateProfileId?: string;
            submittedAt?: string;
            job?: { title?: string };
            candidate?: { name?: string; headline?: string; location?: string };
          };
          const appData = (await appRes.json()) as { applications?: AppRow[] };
          if (appData.applications && appData.applications.length > 0) {
            mappedCandidates = appData.applications
              .filter((app) => {
                const targetId = app.candidateProfileId || app.id;
                return scannedCandidateIds.has(targetId);
              })
              .map((app, index) => {
                let mappedStage: Stage = "screening";
                if (["new", "shortlisted", "consent_requested", "consent_approved", "screening"].includes(app.status)) {
                  mappedStage = "screening";
                } else if (["assessment", "review", "interview"].includes(app.status)) {
                  mappedStage = "interview";
                } else if (app.status === "offer") {
                  mappedStage = "offer";
                } else if (app.status === "hired") {
                  mappedStage = "hired";
                } else if (["rejected", "withdrawn"].includes(app.status)) {
                  mappedStage = "rejected";
                }
                return {
                  id: app.candidateProfileId || app.id,
                  applicationId: app.id,
                  name: app.candidate?.name || `Kandidat #${index + 1}`,
                  role: app.job?.title || app.candidate?.headline || "Pelamar Posisi",
                  location: app.candidate?.location || "Indonesia",
                  stage: mappedStage,
                  owner: recruiterName,
                  dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
                  appliedAt: app.submittedAt ? app.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                  score: 4.5,
                  feedback: "",
                  offerStatus: app.status === "offer" ? "sent" : app.status === "hired" ? "accepted" : "draft",
                  compensation: "Kompetitif",
                  reason: "",
                };
              });
          }
        }

        // 2. Map candidate profiles from talent network
        // CRITICAL ANTI-ABUSE: Only include talent profiles that the recruiter has scanned! Unscanned candidates are NOT shown.
        if (candRes.ok) {
          type CandRow = { id: string; name: string; role: string; location: string };
          const candData = (await candRes.json()) as { candidates?: CandRow[] };
          if (candData.candidates && candData.candidates.length > 0) {
            const scannedTalents = candData.candidates.filter((c) => scannedCandidateIds.has(c.id));
            for (const c of scannedTalents) {
              if (!mappedCandidates.some((m) => m.id === c.id)) {
                mappedCandidates.push({
                  id: c.id,
                  name: c.name,
                  role: c.role,
                  location: c.location,
                  stage: "screening" as Stage,
                  owner: recruiterName,
                  dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
                  appliedAt: new Date().toISOString().slice(0, 10),
                  score: 4.5,
                  feedback: "",
                  offerStatus: "draft" as const,
                  compensation: "-",
                  reason: "",
                });
              }
            }
          }
        }

        // 3. Integrate real offers if available
        if (offRes.ok) {
          type OffRow = {
            id?: string;
            status?: string;
            candidateProfileId?: string;
            applicationId?: string;
            terms?: { salary?: string; currency?: string };
            offer?: { id: string; status: string; terms?: { salary?: string; currency?: string } };
          };
          const offData = (await offRes.json()) as { offers?: OffRow[] };
          if (offData.offers && offData.offers.length > 0) {
            for (const item of offData.offers) {
              const offObj = item.offer || item;
              const candId = item.candidateProfileId;
              const targetIdx = mappedCandidates.findIndex(
                (c) => (candId && c.id === candId) || (item.applicationId && c.applicationId === item.applicationId)
              );
              if (targetIdx !== -1) {
                const offStatus = (offObj.status || "sent") as Candidate["offerStatus"];
                mappedCandidates[targetIdx].stage = offStatus === "accepted" ? "hired" : "offer";
                mappedCandidates[targetIdx].offerStatus = offStatus;
                if (offObj.terms?.salary) {
                  mappedCandidates[targetIdx].compensation = `${offObj.terms.currency || "IDR"} ${offObj.terms.salary}`;
                }
              }
            }
          }
        }

        // 4. Integrate real interviews if available (only for eligible scanned candidates)
        let mappedInterviews: Interview[] = [];
        if (intRes.ok) {
          type IntRow = {
            id?: string;
            scheduledAt?: string;
            timezone?: string;
            title?: string;
            status?: string;
            candidateProfileId?: string;
            interview?: { id: string; scheduledAt: string; timezone?: string; title?: string; status?: string };
          };
          const intData = (await intRes.json()) as { interviews?: IntRow[] };
          if (intData.interviews && intData.interviews.length > 0) {
            mappedInterviews = intData.interviews
              .filter((item) => {
                const candId = item.candidateProfileId || (item.interview as unknown as { candidateProfileId?: string })?.candidateProfileId;
                return candId && scannedCandidateIds.has(candId);
              })
              .map((item) => {
                const intObj = item.interview || item;
                return {
                  id: intObj.id || item.id || `interview-${Date.now()}`,
                  candidateId: item.candidateProfileId || "",
                  date: intObj.scheduledAt || item.scheduledAt || new Date().toISOString(),
                  timezone: intObj.timezone || item.timezone || "Asia/Jakarta (WIB)",
                  type: intObj.title || item.title || "Interview",
                  panel: [recruiterName],
                  status: (intObj.status === "scheduled" || item.status === "scheduled"
                    ? "Terjadwal"
                    : intObj.status === "completed" || item.status === "completed"
                    ? "Selesai"
                    : "Dibatalkan") as Interview["status"],
                  reminder: true,
                };
              });
          }
        }

        setIsRealData(true);
        setData({
          candidates: mappedCandidates,
          interviews: mappedInterviews,
        });
        if (mappedCandidates.length > 0) {
          setSelectedCandidate(mappedCandidates[0].id);
        } else {
          setSelectedCandidate("");
        }
      })
      .catch(() => {
        // Fallback gracefully
      });

    return () => {
      active = false;
    };
  }, [dbMode, recruiterName, scans]);

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <header className="flex flex-col justify-between gap-5 border-b pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Recruiter workspace / Dover Pipeline</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Hiring operations</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Satu ruang kerja untuk menggerakkan kandidat dari pipeline sampai keputusan akhir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={activeCandidates.length === 0}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button
              onClick={() => {
                setTab("interviews");
                document.getElementById("operations-content")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <CalendarDays className="size-4" /> Jadwalkan interview
            </Button>
          </div>
        </header>

        {dbMode ? (
          <div className="mt-5 rounded-lg border border-purple-200 bg-purple-50/70 p-3 text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              {isRealData
                ? `✓ Mode Database Aktif: Menampilkan ${activeCandidates.length} kandidat hasil scanning Anda dari Supabase PostgreSQL.`
                : "✓ Mode Database Aktif: Terhubung ke Supabase."}
            </span>
            <span className="font-semibold text-primary">Live Database</span>
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Mode Demo: data operasi hiring tersimpan di penyimpanan browser lokal Anda untuk presentasi.
          </p>
        )}

        <nav aria-label="Hiring operations sections" className="mt-7 flex gap-1 overflow-x-auto border-b" role="tablist">
          {[
            ["overview", "Overview"],
            ["pipeline", "Pipeline"],
            ["interviews", "Interviews"],
            ["offers", "Offers"],
            ["history", "Stage history"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id as typeof tab)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div id="operations-content" className="mt-7 space-y-6">
          {(tab === "overview" || tab === "pipeline") && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Kandidat aktif"
                  value={String(activeCandidatesCount)}
                  detail={dbMode ? `${activeCandidates.length} kandidat di-scan` : "+3 dibanding minggu lalu"}
                  tone="text-primary"
                />
                <Metric
                  label="Time-to-hire"
                  value={averageTimeToHire !== null ? `${averageTimeToHire} hari` : "-"}
                  detail={averageTimeToHire !== null ? "Rata-rata untuk kandidat hired" : "Belum ada kandidat hired"}
                />
                <Metric
                  label="Interview terjadwal"
                  value={String(scheduledInterviews.length)}
                  detail={scheduledInterviews.length > 0 ? `${scheduledInterviews.length} sesi aktif` : "Belum ada jadwal"}
                  tone="text-fuchsia-700"
                />
                <Metric
                  label="SLA perlu perhatian"
                  value={String(slaAlertCandidates.length)}
                  detail={slaAlertCandidates.length > 0 ? "Perlu review / feedback" : "Semua SLA terpantau"}
                  tone="text-amber-600"
                />
              </section>

              {tab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                  <Card>
                    <CardHeader className="flex-row items-start justify-between">
                      <div>
                        <CardTitle>Pipeline velocity</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Konversi kandidat per tahap di seluruh pipeline rekrutmen aktif.
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {dbMode ? "Live Pipeline" : "+18% vs bulan lalu"}
                      </span>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stageCounts.slice(0, 4).map((stage) => {
                          const percentage = totalInPipeline > 0 ? Math.round((stage.count / totalInPipeline) * 100) : 0;
                          return (
                            <div key={stage.id}>
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{stage.label}</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {stage.count} kandidat ({percentage}%)
                                </span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-300"
                                  style={{ width: `${Math.max(percentage > 0 ? 4 : 0, percentage)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5 text-center">
                        <div>
                          <p className="font-mono text-xl font-bold">{totalInPipeline > 0 ? `${convScreenToInterview}%` : "-"}</p>
                          <p className="text-xs text-muted-foreground">Screen → interview</p>
                        </div>
                        <div>
                          <p className="font-mono text-xl font-bold">{reachedInterview > 0 ? `${convInterviewToOffer}%` : "-"}</p>
                          <p className="text-xs text-muted-foreground">Interview → offer</p>
                        </div>
                        <div>
                          <p className="font-mono text-xl font-bold">{reachedOffer > 0 ? `${convOfferAcceptance}%` : "-"}</p>
                          <p className="text-xs text-muted-foreground">Offer acceptance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="size-4 text-amber-600" /> SLA & action items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {slaAlertCandidates.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                          {activeCandidates.length === 0
                            ? "Belum ada kandidat aktif. Silakan lakukan scanning talent terlebih dahulu."
                            : "Semua kandidat sudah ditindaklanjuti. Tidak ada SLA yang tertunda."}
                        </div>
                      ) : (
                        slaAlertCandidates.slice(0, 3).map((candidate) => (
                          <div key={candidate.id} className="flex items-start gap-3 rounded-lg border p-3">
                            <span className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                                <span>Feedback {candidate.name}</span>
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                SLA {dateLabel(candidate.dueDate)} · {candidate.owner}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Buka ${candidate.name}`}
                              onClick={() => {
                                setSelectedCandidate(candidate.id);
                                setTab(candidate.stage === "interview" ? "interviews" : "pipeline");
                              }}
                            >
                              <ChevronDown className="size-4 -rotate-90" />
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {tab === "pipeline" && (
                <PipelineView
                  candidates={visibleCandidates}
                  selected={selected}
                  setSelected={setSelected}
                  setSelectedCandidate={setSelectedCandidate}
                  query={query}
                  setQuery={setQuery}
                  stageFilter={stageFilter}
                  setStageFilter={setStageFilter}
                  ownerFilter={ownerFilter}
                  setOwnerFilter={setOwnerFilter}
                  bulkChangeStage={bulkChangeStage}
                  changeStage={changeStage}
                  people={people}
                />
              )}
            </>
          )}

          {tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-primary" /> Agenda interview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scheduledInterviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                      <p>Belum ada agenda interview yang terjadwal.</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setTab("interviews")}>
                        Jadwalkan interview
                      </Button>
                    </div>
                  ) : (
                    scheduledInterviews.slice(0, 3).map((interview) => {
                      const cand = activeCandidates.find((item) => item.id === interview.candidateId);
                      return (
                        <InterviewRow
                          key={interview.id}
                          interview={interview}
                          candidate={cand}
                        />
                      );
                    })
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setTab("interviews")}>
                    Kelola semua interview
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" /> Offer yang berjalan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeCandidates.filter((candidate) => candidate.stage === "offer").length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                      <p>Belum ada penawaran kerja (offer) yang sedang berjalan.</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setTab("offers")}>
                        Buka offer workflow
                      </Button>
                    </div>
                  ) : (
                    activeCandidates
                      .filter((candidate) => candidate.stage === "offer")
                      .map((candidate) => (
                        <OfferRow
                          key={candidate.id}
                          candidate={candidate}
                          updateCandidate={updateCandidate}
                        />
                      ))
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setTab("offers")}>
                    Buka offer workflow
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "interviews" && (
            <InterviewsView
              data={{ candidates: activeCandidates, interviews: data.interviews }}
              selectedCandidateData={selectedCandidateData}
              eventForm={eventForm}
              setEventForm={setEventForm}
              addInterview={addInterview}
              setData={setData}
              people={people}
            />
          )}

          {tab === "offers" && (
            <OffersView
              candidates={activeCandidates}
              updateCandidate={updateCandidate}
              selected={selected}
              setSelected={setSelected}
            />
          )}

          {tab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4 text-primary" /> Riwayat tahap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]">
                  <label className="relative block">
                    <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <span className="sr-only">Cari kandidat di histori</span>
                    <input
                      value={historySearch}
                      onChange={(event) => setHistorySearch(event.target.value)}
                      className="field pl-9"
                      placeholder="Cari kandidat..."
                    />
                  </label>
                  <select
                    aria-label="Filter tahap histori"
                    value={historyStage}
                    onChange={(event) => setHistoryStage(event.target.value as Stage | "all")}
                    className="field"
                  >
                    <option value="all">Semua tahap</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
                {history.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {activeCandidates.length === 0
                      ? "Belum ada riwayat aktivitas. Scan kandidat dari menu Cari Talent untuk memulai alur hiring."
                      : "Tidak ada riwayat aktivitas kandidat yang sesuai filter pencarian."}
                  </div>
                ) : (
                  <div className="divide-y">
                    {history.map((item) => (
                      <div
                        key={item.candidate.id}
                        className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-primary">
                            {item.candidate.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StageBadge stage={item.stage} />
                          <span className="font-mono text-xs text-muted-foreground">{dateLabel(item.at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

function PipelineView({
  candidates,
  selected,
  setSelected,
  setSelectedCandidate,
  query,
  setQuery,
  stageFilter,
  setStageFilter,
  ownerFilter,
  setOwnerFilter,
  bulkChangeStage,
  changeStage,
  people,
}: {
  candidates: Candidate[];
  selected: string[];
  setSelected: (value: string[]) => void;
  setSelectedCandidate: (value: string) => void;
  query: string;
  setQuery: (value: string) => void;
  stageFilter: Stage | "all";
  setStageFilter: (value: Stage | "all") => void;
  ownerFilter: string;
  setOwnerFilter: (value: string) => void;
  bulkChangeStage: (stage: Stage) => void;
  changeStage: (id: string, stage: Stage) => void;
  people: string[];
}) {
  const [compare, setCompare] = useState(false);
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <span className="sr-only">Cari kandidat</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="field pl-9"
              placeholder="Cari nama atau posisi..."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter stage"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value as Stage | "all")}
              className="field w-auto"
            >
              <option value="all">Semua stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter owner"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="field w-auto"
            >
              <option value="all">Semua owner</option>
              {people.map((person) => (
                <option key={person}>{person}</option>
              ))}
            </select>
            <Button variant={compare ? "default" : "outline"} onClick={() => setCompare(!compare)} disabled={selected.length < 2}>
              <GitCompareArrows className="size-4" /> Bandingkan ({selected.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {candidates.length === 0 && (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold">Pipeline Rekrutmen Kosong</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Kandidat yang belum di-scan tidak ditampilkan di sini untuk menjaga alur pipeline. Silakan temukan kandidat potensial di menu <strong>Cari Talent</strong> dan lakukan scanning profil untuk memasukkannya ke alur hiring.
            </p>
            <div className="mt-5">
              <Button asChild>
                <Link href="/search">
                  <Search className="size-4" /> Cari Talent Sekarang
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selected.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{selected.length} kandidat dipilih</p>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Bulk stage change"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) bulkChangeStage(event.target.value as Stage);
              }}
              className="field w-auto bg-background"
            >
              <option value="">Pindahkan ke...</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={() => setSelected([])}>
              Batal pilih
            </Button>
          </div>
        </div>
      )}

      {compare && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Perbandingan kandidat</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-5">Kriteria</th>
                  {selected.slice(0, 3).map((id) => {
                    const c = candidates.find((candidate) => candidate.id === id);
                    return (
                      <th key={id} className="pb-3 pr-5">
                        {c?.name ?? id}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Scorecard", ...selected.slice(0, 3).map((id) => String(candidates.find((candidate) => candidate.id === id)?.score ?? "-") + " / 5")],
                  ["Tahap", ...selected.slice(0, 3).map((id) => stageLabel(candidates.find((candidate) => candidate.id === id)?.stage ?? "screening"))],
                  ["Owner", ...selected.slice(0, 3).map((id) => candidates.find((candidate) => candidate.id === id)?.owner ?? "-")],
                ].map((row) => (
                  <tr key={row[0]} className="border-b last:border-0">
                    <th className="py-3 pr-5 font-medium text-muted-foreground">{row[0]}</th>
                    {row.slice(1).map((cell, index) => (
                      <td key={`${cell}-${index}`} className="py-3 pr-5 font-semibold">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.slice(0, 4).map((stage) => {
          const stageCandidates = candidates.filter((candidate) => candidate.stage === stage.id);
          return (
            <div key={stage.id} className="rounded-2xl border bg-muted/20 p-3">
              <div className="flex items-center justify-between px-1 pb-3">
                <h2 className="font-semibold">{stage.label}</h2>
                <span className="font-mono text-xs text-muted-foreground">{stageCandidates.length}</span>
              </div>
              <div className="space-y-3">
                {stageCandidates.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Belum ada kandidat di tahap ini
                  </div>
                ) : (
                  stageCandidates.map((candidate) => (
                    <Card key={candidate.id} className="shadow-xs">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(candidate.id)}
                            onChange={() => toggle(candidate.id)}
                            aria-label={`Pilih ${candidate.name}`}
                            className="mt-1 size-4 accent-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(candidate.id)}
                            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <p className="truncate text-sm font-semibold">{candidate.name}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{candidate.role}</p>
                          </button>
                          <button
                            type="button"
                            aria-label={`Menu ${candidate.name}`}
                            className="text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{candidate.owner}</span>
                          <span className="font-mono text-xs text-amber-700">SLA {dateLabel(candidate.dueDate)}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <select
                            aria-label={`Pindahkan ${candidate.name}`}
                            value={candidate.stage}
                            onChange={(event) => changeStage(candidate.id, event.target.value as Stage)}
                            className="field h-8 min-w-0 flex-1 px-2 text-xs"
                          >
                            <option value={candidate.stage}>{stageLabel(candidate.stage)}</option>
                            {stages
                              .filter((option) => option.id !== candidate.stage)
                              .map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">★ {candidate.score}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InterviewRow({
  interview,
  candidate,
  action,
}: {
  interview: Interview;
  candidate?: Candidate;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-primary">
        <Video className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{candidate?.name ?? "Kandidat"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {interview.type} · {dateTimeLabel(interview.date)} · {interview.timezone}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Panel: {interview.panel.join(", ")}</p>
      </div>
      {action ?? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">{interview.status}</span>}
    </div>
  );
}

function OfferRow({
  candidate,
  updateCandidate,
}: {
  candidate: Candidate;
  updateCandidate: (id: string, update: Partial<Candidate>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{candidate.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {candidate.compensation} · Owner {candidate.owner}
        </p>
      </div>
      <select
        aria-label={`Status offer ${candidate.name}`}
        value={candidate.offerStatus}
        onChange={(event) => {
          updateCandidate(candidate.id, { offerStatus: event.target.value as Candidate["offerStatus"] });
          toast.success("Status offer diperbarui");
        }}
        className="field w-auto py-2 text-xs"
      >
        <option value="draft">Draft</option>
        <option value="sent">Terkirim</option>
        <option value="accepted">Diterima</option>
        <option value="declined">Ditolak</option>
      </select>
    </div>
  );
}

function InterviewsView({
  data,
  selectedCandidateData,
  eventForm,
  setEventForm,
  addInterview,
  setData,
  people,
}: {
  data: { candidates: Candidate[]; interviews: Interview[] };
  selectedCandidateData?: Candidate;
  eventForm: { date: string; timezone: string; type: string; panel: string };
  setEventForm: (value: { date: string; timezone: string; type: string; panel: string }) => void;
  addInterview: () => void;
  setData: React.Dispatch<React.SetStateAction<{ candidates: Candidate[]; interviews: Interview[] }>>;
  people: string[];
}) {
  const [feedback, setFeedback] = useState(selectedCandidateData?.feedback ?? "");
  const selectedInterviews = data.interviews.filter((interview) => interview.candidateId === selectedCandidateData?.id);
  const updateInterview = (id: string, update: Partial<Interview>) =>
    setData((current) => ({
      ...current,
      interviews: current.interviews.map((item) => (item.id === id ? { ...item, ...update } : item)),
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>Jadwalkan interview</CardTitle>
          <p className="text-sm text-muted-foreground">Atur timezone kandidat, panel, dan reminder dalam satu event.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-sm font-semibold">
            Kandidat
            <select
              aria-label="Kandidat interview"
              value={selectedCandidateData?.id ?? ""}
              onChange={(e) => {
                const target = data.candidates.find((c) => c.id === e.target.value);
                if (target) {
                  setFeedback(target.feedback || "");
                }
              }}
              className="field mt-2"
              disabled={data.candidates.length === 0}
            >
              {data.candidates.length === 0 ? (
                <option value="">Belum ada kandidat (scan talent di Cari Talent dahulu)</option>
              ) : (
                data.candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({stageLabel(c.stage)})
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Tanggal & waktu
            <input
              type="datetime-local"
              value={eventForm.date}
              onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })}
              className="field mt-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Timezone
            <select
              value={eventForm.timezone}
              onChange={(event) => setEventForm({ ...eventForm, timezone: event.target.value })}
              className="field mt-2"
            >
              <option>Asia/Jakarta (WIB)</option>
              <option>Asia/Makassar (WITA)</option>
              <option>Asia/Jayapura (WIT)</option>
              <option>America/Los_Angeles (PT)</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Jenis interview
            <input
              value={eventForm.type}
              onChange={(event) => setEventForm({ ...eventForm, type: event.target.value })}
              className="field mt-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Panel interviewer
            <select
              value={eventForm.panel}
              onChange={(event) => setEventForm({ ...eventForm, panel: event.target.value })}
              className="field mt-2"
            >
              {people.map((person) => (
                <option key={person}>{person}</option>
              ))}
            </select>
          </label>
          <Button className="w-full" onClick={addInterview} disabled={data.candidates.length === 0}>
            <CalendarDays className="size-4" /> Simpan jadwal
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast.info("Integrasi Google Calendar / Outlook siap dihubungkan pada update berikutnya.")}
          >
            <CalendarDays className="size-4" /> Hubungkan calendar
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Event & panel</CardTitle>
            <span className="text-sm text-muted-foreground">{data.interviews.length} event</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.interviews.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                Belum ada interview yang dijadwalkan. Gunakan formulir di sebelah kiri untuk menambah jadwal.
              </div>
            ) : (
              data.interviews.map((interview) => {
                const cand = data.candidates.find((candidate) => candidate.id === interview.candidateId);
                return (
                  <InterviewRow
                    key={interview.id}
                    interview={interview}
                    candidate={cand}
                    action={
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Kirim ulang reminder"
                          onClick={() => {
                            updateInterview(interview.id, { reminder: true });
                            toast.success("Reminder dikirim");
                          }}
                        >
                          <Bell className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Reschedule interview"
                          onClick={() => updateInterview(interview.id, { date: new Date().toISOString().slice(0, 16) })}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Batalkan interview"
                          onClick={() => {
                            updateInterview(interview.id, { status: "Dibatalkan" });
                            toast.success("Interview dibatalkan");
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    }
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scorecard & feedback</CardTitle>
            <p className="text-sm text-muted-foreground">
              Feedback terstruktur untuk {selectedCandidateData?.name ?? "Kandidat"}.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="mt-1 text-xl font-bold">
                  {selectedCandidateData?.score ?? "-"}
                  <span className="text-xs font-normal text-muted-foreground"> / 5</span>
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Interview</p>
                <p className="mt-1 font-semibold">{selectedInterviews.some((item) => item.status === "Selesai") ? "Selesai" : "Menunggu"}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Status feedback</p>
                <p className="mt-1 font-semibold">{feedback ? "Lengkap" : "Dibutuhkan"}</p>
              </div>
            </div>
            <textarea
              className="field mt-4 min-h-24 py-3"
              placeholder="Tulis feedback berbasis kriteria..."
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
            <Button
              className="mt-3"
              disabled={!selectedCandidateData}
              onClick={() => {
                if (selectedCandidateData) {
                  setData((current) => ({
                    ...current,
                    candidates: current.candidates.map((candidate) =>
                      candidate.id === selectedCandidateData.id ? { ...candidate, feedback } : candidate
                    ),
                  }));
                  toast.success("Scorecard tersimpan");
                }
              }}
            >
              <Check className="size-4" /> Simpan scorecard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OffersView({
  candidates,
  updateCandidate,
  selected,
  setSelected,
}: {
  candidates: Candidate[];
  updateCandidate: (id: string, update: Partial<Candidate>) => void;
  selected: string[];
  setSelected: (value: string[]) => void;
}) {
  const offerCandidates = candidates.filter((candidate) => candidate.stage === "offer" || candidate.stage === "hired");
  const [reason, setReason] = useState("");

  const activeOffersCount = candidates.filter((candidate) => candidate.offerStatus === "sent").length;
  const decidedOffers = candidates.filter((candidate) => candidate.offerStatus === "accepted" || candidate.offerStatus === "declined");
  const acceptedOffers = candidates.filter((candidate) => candidate.offerStatus === "accepted");
  const acceptanceRate = decidedOffers.length > 0 ? `${Math.round((acceptedOffers.length / decidedOffers.length) * 100)}%` : "-";
  const hiredOutcomeCount = candidates.filter((candidate) => candidate.stage === "hired").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Offer aktif"
          value={String(activeOffersCount)}
          detail="Menunggu respons kandidat"
          tone="text-amber-600"
        />
        <Metric
          label="Acceptance rate"
          value={acceptanceRate}
          detail={decidedOffers.length > 0 ? `${acceptedOffers.length} dari ${decidedOffers.length} keputusan` : "Belum ada respons"}
          tone="text-emerald-700"
        />
        <Metric
          label="Hiring outcome"
          value={`${hiredOutcomeCount} hired`}
          detail={hiredOutcomeCount > 0 ? "Kandidat berhasil diterima" : "Belum ada yang hired"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer workflow & keputusan</CardTitle>
          <p className="text-sm text-muted-foreground">Kelola kompensasi, status kandidat, dan alasan keputusan.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {offerCandidates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada kandidat pada tahap penawaran kerja (offer). Pindahkan kandidat dari interview ke offer untuk memulai workflow ini.
            </div>
          ) : (
            offerCandidates.map((candidate) => (
              <div key={candidate.id} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[1.2fr_1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{candidate.name}</p>
                    <StageBadge stage={candidate.stage} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.role} · {candidate.owner}
                  </p>
                </div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Kompensasi
                  <input
                    aria-label={`Kompensasi ${candidate.name}`}
                    value={candidate.compensation}
                    onChange={(event) => updateCandidate(candidate.id, { compensation: event.target.value })}
                    className="field mt-1 py-2 text-sm font-normal"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Offer status ${candidate.name}`}
                    value={candidate.offerStatus}
                    onChange={(event) =>
                      updateCandidate(candidate.id, { offerStatus: event.target.value as Candidate["offerStatus"] })
                    }
                    className="field w-auto py-2 text-xs"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Terkirim</option>
                    <option value="accepted">Diterima</option>
                    <option value="declined">Ditolak</option>
                  </select>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label={`Kirim offer ${candidate.name}`}
                    onClick={() => {
                      updateCandidate(candidate.id, { offerStatus: "sent" });
                      toast.success("Offer dikirim");
                    }}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <div className="border-t pt-4">
            <label className="block text-sm font-semibold">
              Alasan rejection / withdrawal
              <span className="ml-2 text-xs font-normal text-muted-foreground">(untuk histori)</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="field mt-2 min-h-20 py-2"
                placeholder="Contoh: kandidat memilih opportunity lain."
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={!selected.length || !reason.trim()}
                onClick={() => {
                  selected.forEach((id) => updateCandidate(id, { stage: "rejected", reason: reason.trim() }));
                  setReason("");
                  setSelected([]);
                  toast.success("Kandidat ditandai rejected");
                }}
              >
                Tandai rejected
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!selected.length || !reason.trim()}
                onClick={() => {
                  selected.forEach((id) => updateCandidate(id, { stage: "rejected", reason: `Withdrawal: ${reason.trim()}` }));
                  setReason("");
                  setSelected([]);
                  toast.success("Withdrawal dicatat");
                }}
              >
                Catat withdrawal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

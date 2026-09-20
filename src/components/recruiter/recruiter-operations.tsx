"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Download,
  GripVertical,
  Kanban,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Table as TableIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { useApp } from "@/providers/app-provider";
import { HrReportModal } from "@/components/recruiter/hr-report-modal";
import { CreateOfferModal } from "@/components/recruiter/create-offer-modal";
import { CandidateDetailDrawer } from "@/components/recruiter/candidate-detail-drawer";
import { CandidateAvatar } from "@/components/talent/avatar";
import {
  ScheduleInterviewTransitionModal,
  CancelOfferWarningModal,
  ConfirmHireModal,
  DemoteInterviewWarningModal,
} from "@/components/recruiter/stage-transition-modals";
import type { Candidate as GlobalCandidate } from "@/types";
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
  avatarUrl?: string;
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

const storageKey = "proofylink-demo-recruiter-operations";

const STAGES: Array<{ id: Stage; label: string; bg: string; border: string; text: string; dot: string }> = [
  { id: "screening", label: "Screening", bg: "bg-blue-50/70", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  { id: "interview", label: "Interview", bg: "bg-fuchsia-50/70", border: "border-fuchsia-200", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  { id: "offer", label: "Penawaran (Offer)", bg: "bg-amber-50/70", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  { id: "hired", label: "Diterima (Hired)", bg: "bg-emerald-50/70", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { id: "rejected", label: "Tidak Lolos", bg: "bg-slate-50/70", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
];

const defaultJobs = [
  { id: "job-1", title: "Senior Product Designer" },
  { id: "job-2", title: "Frontend Architect" },
  { id: "job-3", title: "Product Manager" },
  { id: "job-4", title: "Backend Engineer (Go/Node)" },
];

export const SUPABASE_AVATARS: Record<string, string> = {
  "candidate-adrienne": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/f8d0d466-269f-47d9-b865-c4ba2f0157f9/178ed63f-6ffb-4ef0-9d8d-9b558a0f0681-Screenshot%20(16).png.webp",
  "Adrienne Kayana Wistara Lie": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/f8d0d466-269f-47d9-b865-c4ba2f0157f9/178ed63f-6ffb-4ef0-9d8d-9b558a0f0681-Screenshot%20(16).png.webp",
  "cd6ec533-5d1c-4f87-842c-888de3e825ec": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/f8d0d466-269f-47d9-b865-c4ba2f0157f9/178ed63f-6ffb-4ef0-9d8d-9b558a0f0681-Screenshot%20(16).png.webp",
  "Alga Ramandika Praba": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/c168acf4-0e8c-4a9f-bcea-36afe5bc9e80/5d11592b-e5ee-485e-8644-df3147cbbae0-FOTO_LinkedIn_MaterialBlack.jpg.webp",
  "b082c226-1a6e-42a6-80e0-150ce5f01745": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/c168acf4-0e8c-4a9f-bcea-36afe5bc9e80/5d11592b-e5ee-485e-8644-df3147cbbae0-FOTO_LinkedIn_MaterialBlack.jpg.webp",
  "Ariel Oka": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/58069525-3b98-4de5-82e2-5aea635cda3f/eaeb085e-daf7-4e8c-8c7b-fd2f7d2d5293-byredo%20mojave.jpg.webp",
  "1b1c3dcd-4251-44cb-a594-2fc57ee00533": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/58069525-3b98-4de5-82e2-5aea635cda3f/eaeb085e-daf7-4e8c-8c7b-fd2f7d2d5293-byredo%20mojave.jpg.webp",
  "Hasyim Kipuw": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/7703ba04-6939-49f7-bdc4-ea28bb81327f/76d940fe-a608-4500-881d-585f9da91779-Lv%20imagination.jpg.webp",
  "383de31e-01c2-4d02-b3e4-b563af72ab32": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/7703ba04-6939-49f7-bdc4-ea28bb81327f/76d940fe-a608-4500-881d-585f9da91779-Lv%20imagination.jpg.webp",
  "Muhammad Adi Firmansyahah": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/423c7744-0fbd-4b30-91ca-cd05d5c3223e/208e3174-b077-445a-b9cd-76d9e59c3108-1000150213.jpg.webp",
  "64781ee2-f82f-40c0-9178-4a76860b6f56": "https://vtcytlrlfsmzkybqsjsx.supabase.co/storage/v1/object/public/profile-media/avatars/423c7744-0fbd-4b30-91ca-cd05d5c3223e/208e3174-b077-445a-b9cd-76d9e59c3108-1000150213.jpg.webp",
};

const initialCandidates: Candidate[] = [
  {
    id: "cd6ec533-5d1c-4f87-842c-888de3e825ec",
    name: "Adrienne Kayana Wistara Lie",
    role: "Product Management Intern",
    location: "Denpasar Barat, Bali",
    stage: "hired",
    owner: "Adrienne",
    dueDate: "2026-09-25",
    appliedAt: "2026-09-09",
    score: 4.8,
    feedback: "Kandidat ini memenuhi 84% kompetensi inti lowongan.",
    offerStatus: "accepted",
    compensation: "Rp 15.000.000 / bulan",
    reason: "",
    avatarUrl: SUPABASE_AVATARS["Adrienne Kayana Wistara Lie"],
    jobId: "talent-pool",
    jobTitle: "Talent Pool",
  },
  {
    id: "b082c226-1a6e-42a6-80e0-150ce5f01745",
    name: "Alga Ramandika Praba",
    role: "Software Engineer",
    location: "Gianyar, Bali",
    stage: "interview",
    owner: "Raka Pratama",
    dueDate: "2026-08-20",
    appliedAt: "2026-07-28",
    score: 4.6,
    feedback: "Portfolio kuat di backend engineering & database architecture.",
    offerStatus: "draft",
    compensation: "Rp 25.000.000 / bulan",
    reason: "",
    avatarUrl: SUPABASE_AVATARS["Alga Ramandika Praba"],
    jobId: "job-2",
    jobTitle: "Frontend Architect",
  },
  {
    id: "1b1c3dcd-4251-44cb-a594-2fc57ee00533",
    name: "Ariel Oka",
    role: "Software Engineer",
    location: "Bali, Denpasar",
    stage: "screening",
    owner: "Sari Wijaya",
    dueDate: "2026-08-18",
    appliedAt: "2026-08-02",
    score: 4.1,
    feedback: "Perlu validasi stakeholder management.",
    offerStatus: "draft",
    compensation: "Rp 22.000.000 / bulan",
    reason: "",
    avatarUrl: SUPABASE_AVATARS["Ariel Oka"],
    jobId: "talent-pool",
    jobTitle: "Talent Pool",
  },
  {
    id: "383de31e-01c2-4d02-b3e4-b563af72ab32",
    name: "Hasyim Kipuw",
    role: "Senior Software Engineer",
    location: "Bali, Denpasar",
    stage: "offer",
    owner: "Raka Pratama",
    dueDate: "2026-08-19",
    appliedAt: "2026-07-22",
    score: 4.8,
    feedback: "Sangat kuat di systems architecture dan high concurrency.",
    offerStatus: "sent",
    compensation: "Rp 31.000.000 / bulan",
    reason: "",
    avatarUrl: SUPABASE_AVATARS["Hasyim Kipuw"],
    jobId: "job-4",
    jobTitle: "Backend Engineer (Go/Node)",
  },
  {
    id: "64781ee2-f82f-40c0-9178-4a76860b6f56",
    name: "Muhammad Adi Firmansyahah",
    role: "Human Capital Specialist",
    location: "Bali",
    stage: "interview",
    owner: "Dimas Nugroho",
    dueDate: "2026-08-21",
    appliedAt: "2026-07-30",
    score: 4.5,
    feedback: "Pengalaman solid di talent acquisition & HR operations.",
    offerStatus: "draft",
    compensation: "Rp 18.000.000 / bulan",
    reason: "",
    avatarUrl: SUPABASE_AVATARS["Muhammad Adi Firmansyahah"],
    jobId: "job-1",
    jobTitle: "Senior Product Designer",
  },
];

const initialInterviews: Interview[] = [
  { id: "interview-1", candidateId: "b082c226-1a6e-42a6-80e0-150ce5f01745", date: "2026-08-20T09:00", timezone: "Asia/Jakarta (WIB)", type: "Technical Architecture Review", panel: ["Raka Pratama"], status: "Selesai", reminder: true, meetingUrl: "https://meet.google.com/abc-defg-hij" },
  { id: "interview-2", candidateId: "64781ee2-f82f-40c0-9178-4a76860b6f56", date: "2026-08-21T14:00", timezone: "Asia/Jakarta (WIB)", type: "HR & Culture Leadership", panel: ["Dimas Nugroho"], status: "Selesai", reminder: false, meetingUrl: "https://meet.google.com/klm-nopq-rst" },
];

const DB_CACHE_KEY = "proofylink-ops-db-cache-v1";

function readInitialState(isDb: boolean) {
  if (isDb) {
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem(DB_CACHE_KEY) : null;
      if (cached) {
        const parsed = JSON.parse(cached) as { candidates?: Candidate[]; interviews?: Interview[] };
        if (Array.isArray(parsed?.candidates)) {
          const resolved = parsed.candidates.map((c) => ({
            ...c,
            avatarUrl: SUPABASE_AVATARS[c.id] || (c.name ? SUPABASE_AVATARS[c.name] : undefined) || c.avatarUrl,
          }));
          return { candidates: resolved, interviews: parsed.interviews ?? [] };
        }
      }
    } catch {}
    return { candidates: [], interviews: [] };
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { candidates?: Candidate[]; interviews?: Interview[] } | null;
    const rawInterviews = parsed?.interviews ?? initialInterviews;
    const loadedInterviews = rawInterviews.map((iv) => {
      const isPast = !isNaN(new Date(iv.date).getTime()) && new Date(iv.date).getTime() < Date.now();
      return {
        ...iv,
        status: iv.status === "Dibatalkan" ? ("Dibatalkan" as const) : isPast ? ("Selesai" as const) : iv.status,
      };
    });
    const loadedCandidates = (parsed?.candidates ?? initialCandidates).map((c) => ({
      ...c,
      avatarUrl: SUPABASE_AVATARS[c.id] || (c.name ? SUPABASE_AVATARS[c.name] : undefined) || c.avatarUrl,
    }));
    return { candidates: loadedCandidates, interviews: loadedInterviews };
  } catch {
    return { candidates: initialCandidates, interviews: initialInterviews };
  }
}

export function RecruiterOperationsPage() {
  const { dbMode, scans, user } = useApp();
  const [data, setData] = useState(() => readInitialState(dbMode));
  const [isDbSyncing, setIsDbSyncing] = useState(() => dbMode && data.candidates.length === 0);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [availableJobs, setAvailableJobs] = useState<Array<{ id: string; title: string }>>(defaultJobs);

  // Modals & Drawer states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [offerModalCandidate, setOfferModalCandidate] = useState<Candidate | null>(null);

  // Stage Transition Modals
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<Candidate | null>(null);
  const [cancelOfferCandidate, setCancelOfferCandidate] = useState<Candidate | null>(null);
  const [cancelOfferTargetStage, setCancelOfferTargetStage] = useState<Stage | null>(null);
  const [demoteInterviewCandidate, setDemoteInterviewCandidate] = useState<Candidate | null>(null);
  const [demoteInterviewTargetStage, setDemoteInterviewTargetStage] = useState<Stage | null>(null);
  const [hireConfirmCandidate, setHireConfirmCandidate] = useState<Candidate | null>(null);

  // Drag and Drop state
  const [draggingCandidateId, setDraggingCandidateId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<Stage | null>(null);

  const recruiterName = user?.name || "Tim Rekruter";

  // Load available job openings
  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { jobs?: Array<{ id: string; title: string }> } | null) => {
        if (payload?.jobs && payload.jobs.length > 0) {
          setAvailableJobs(payload.jobs.map((j) => ({ id: j.id, title: j.title })));
        }
      })
      .catch(() => {});
  }, []);

  // Enrich candidate avatars from live Supabase /api/candidates query
  useEffect(() => {
    let active = true;
    fetch("/api/candidates?limit=50", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const payload = (await res.json()) as { candidates?: Array<{ id: string; name?: string; avatarUrl?: string }> };
        if (!active || !payload.candidates) return;
        const liveMap = new Map(payload.candidates.map((c) => [c.id, c.avatarUrl]));
        const nameMap = new Map(payload.candidates.map((c) => [c.name, c.avatarUrl]));
        setData((prev) => ({
          ...prev,
          candidates: prev.candidates.map((cand) => {
            const liveAvatar = liveMap.get(cand.id) || nameMap.get(cand.name) || SUPABASE_AVATARS[cand.id] || SUPABASE_AVATARS[cand.name];
            return liveAvatar && liveAvatar !== cand.avatarUrl ? { ...cand, avatarUrl: liveAvatar } : cand;
          }),
        }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Save to demo storage when not in dbMode, or cache DB records in dbMode
  useEffect(() => {
    if (!dbMode) {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } else if (typeof window !== "undefined" && !isDbSyncing) {
      try {
        localStorage.setItem(DB_CACHE_KEY, JSON.stringify(data));
      } catch {}
    }
  }, [data, dbMode, isDbSyncing]);

  // Anti-abuse: check unlocked candidates in DB mode
  const isCandidateUnlocked = useCallback(
    (candidateId: string) => {
      if (!dbMode) return true;
      return scans.some((scan) => scan.candidateId === candidateId);
    },
    [dbMode, scans]
  );

  const activeCandidates = useMemo(() => {
    if (!dbMode) return data.candidates;
    return data.candidates.filter((candidate) => isCandidateUnlocked(candidate.id));
  }, [dbMode, data.candidates, isCandidateUnlocked]);

  // Sync with live DB records
  useEffect(() => {
    if (!dbMode) return;
    let active = true;

    Promise.all([
      fetch("/api/applications", { cache: "no-store" }),
      fetch("/api/candidates?limit=50", { cache: "no-store" }),
      fetch("/api/interviews", { cache: "no-store" }),
      fetch("/api/offers", { cache: "no-store" }),
    ])
      .then(async ([appRes, candRes, intRes]) => {
        if (!active) return;
        const scannedCandidateIds = new Set(scans.map((s) => s.candidateId));
        let mappedCandidates: Candidate[] = [];

        // Parse candidate profiles from Supabase (/api/candidates)
        type RemoteCand = { id: string; name?: string; role?: string; location?: string; avatarUrl?: string; summary?: string };
        let remoteCandList: RemoteCand[] = [];
        if (candRes && candRes.ok) {
          try {
            const candPayload = (await candRes.json()) as { candidates?: RemoteCand[] };
            remoteCandList = candPayload.candidates ?? [];
          } catch {}
        }
        const candidateMap = new Map(remoteCandList.map((c) => [c.id, c]));

        if (appRes.ok) {
          type AppRow = {
            id: string;
            status: string;
            candidateProfileId?: string;
            jobId?: string;
            submittedAt?: string;
            job?: { id?: string; title?: string };
            candidate?: { name?: string; headline?: string; location?: string; avatarUrl?: string };
          };
          const appData = (await appRes.json()) as { applications?: AppRow[] };
          if (appData.applications && appData.applications.length > 0) {
            mappedCandidates = appData.applications
              .filter((app) => scannedCandidateIds.has(app.candidateProfileId || app.id))
              .map((app, index) => {
                let mappedStage: Stage = "screening";
                if (["new", "shortlisted", "consent_requested", "consent_approved", "screening", "review"].includes(app.status)) {
                  mappedStage = "screening";
                } else if (["assessment", "interview"].includes(app.status)) {
                  mappedStage = "interview";
                } else if (app.status === "offer") {
                  mappedStage = "offer";
                } else if (app.status === "hired") {
                  mappedStage = "hired";
                } else if (app.status === "rejected") {
                  mappedStage = "rejected";
                }

                const candProfile = candidateMap.get(app.candidateProfileId || app.id);
                const resolvedAvatar =
                  app.candidate?.avatarUrl ||
                  candProfile?.avatarUrl ||
                  (candProfile?.name ? SUPABASE_AVATARS[candProfile.name] : undefined) ||
                  (app.candidate?.name ? SUPABASE_AVATARS[app.candidate.name] : undefined) ||
                  SUPABASE_AVATARS[app.candidateProfileId || ""];

                return {
                  id: app.candidateProfileId || app.id,
                  applicationId: app.id,
                  name: app.candidate?.name || candProfile?.name || `Kandidat #${index + 1}`,
                  role: app.job?.title || app.candidate?.headline || candProfile?.role || "Software Engineer",
                  location: app.candidate?.location || candProfile?.location || "Indonesia",
                  stage: mappedStage,
                  owner: recruiterName,
                  dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
                  appliedAt: app.submittedAt ? app.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                  score: 4.5,
                  feedback: "",
                  offerStatus: mappedStage === "offer" ? "sent" : mappedStage === "hired" ? "accepted" : "draft",
                  compensation: "Rp 15.000.000 / bulan",
                  reason: "",
                  jobId: app.jobId,
                  jobTitle: app.job?.title,
                  avatarUrl: resolvedAvatar,
                };
              });
          }
        }

        // Talent Pool: Include scanned candidates from Supabase who don't have an active application yet
        const existingAppCandIds = new Set(mappedCandidates.map((c) => c.id));
        for (const cand of remoteCandList) {
          if (scannedCandidateIds.has(cand.id) && !existingAppCandIds.has(cand.id)) {
            mappedCandidates.push({
              id: cand.id,
              name: cand.name || "Talent Network Candidate",
              role: cand.role || "Talent Candidate",
              location: cand.location || "Indonesia",
              stage: "screening",
              owner: recruiterName,
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              appliedAt: new Date().toISOString().slice(0, 10),
              score: 4.2,
              feedback: "",
              offerStatus: "draft",
              compensation: "Rp 15.000.000 / bulan",
              reason: "",
              jobId: "talent-pool",
              jobTitle: "Talent Pool",
              avatarUrl: cand.avatarUrl || (cand.name ? SUPABASE_AVATARS[cand.name] : undefined) || SUPABASE_AVATARS[cand.id],
            });
          }
        }

        // Merge and load interviews
        let mappedInterviews: Interview[] = dbMode ? [] : initialInterviews;
        if (intRes.ok) {
          type NestedInt = {
            id?: string;
            title?: string;
            scheduledAt?: string;
            timezone?: string;
            meetingUrl?: string;
            status?: string;
          };
          type IntRow = NestedInt & {
            interview?: NestedInt;
            candidateProfileId?: string;
          };
          const intData = (await intRes.json()) as { interviews?: IntRow[] };
          if (intData.interviews && intData.interviews.length > 0) {
            mappedInterviews = intData.interviews.map((iv) => {
              const core = iv.interview || iv;
              const scheduledDate = core.scheduledAt || iv.scheduledAt || new Date().toISOString();
              const isPast = !isNaN(new Date(scheduledDate).getTime()) && new Date(scheduledDate).getTime() < Date.now();
              const rawStatus = core.status || iv.status;
              const status =
                rawStatus === "completed" || isPast
                  ? "Selesai"
                  : rawStatus === "cancelled"
                  ? "Dibatalkan"
                  : "Terjadwal";

              return {
                id: core.id || iv.id || `iv-${Date.now()}`,
                candidateId: iv.candidateProfileId || "",
                date: scheduledDate,
                timezone: core.timezone || iv.timezone || "Asia/Jakarta (WIB)",
                type: core.title || iv.title || "Wawancara",
                panel: [recruiterName],
                status: status as "Terjadwal" | "Selesai" | "Dibatalkan",
                reminder: true,
                meetingUrl: core.meetingUrl || iv.meetingUrl,
              };
            });
          }
        }

        const nextData = {
          candidates: mappedCandidates.length > 0 || dbMode ? mappedCandidates : initialCandidates,
          interviews: mappedInterviews,
        };

        setData(nextData);
        setIsDbSyncing(false);
        if (dbMode && typeof window !== "undefined") {
          try {
            localStorage.setItem(DB_CACHE_KEY, JSON.stringify(nextData));
          } catch {}
        }
      })
      .catch(() => {
        if (active) setIsDbSyncing(false);
      });

    return () => {
      active = false;
    };
  }, [dbMode, scans, recruiterName]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return activeCandidates.filter((candidate) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchJob =
        jobFilter === "all"
          ? true
          : jobFilter === "talent-pool"
          ? !candidate.jobId || candidate.jobId === "talent-pool" || candidate.jobTitle === "Talent Pool"
          : candidate.jobId === jobFilter || candidate.role === jobFilter;
      return matchSearch && matchJob;
    });
  }, [activeCandidates, searchQuery, jobFilter]);

  const handleAssignJob = (candidateId: string, jobId: string, jobTitle: string) => {
    setData((current) => ({
      ...current,
      candidates: current.candidates.map((c) =>
        c.id === candidateId ? { ...c, jobId, jobTitle } : c
      ),
    }));
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, jobId, jobTitle });
    }
    toast.success(
      jobId === "talent-pool"
        ? "Kandidat dipindahkan ke Talent Pool"
        : `Kandidat ditugaskan ke lowongan: ${jobTitle}`
    );
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = activeCandidates.length;
    const screening = activeCandidates.filter((c) => c.stage === "screening").length;
    const interview = activeCandidates.filter((c) => c.stage === "interview").length;
    const offer = activeCandidates.filter((c) => c.stage === "offer").length;
    const hired = activeCandidates.filter((c) => c.stage === "hired").length;
    return { total, screening, interview, offer, hired };
  }, [activeCandidates]);

  // Execute stage change with optimistic UI and DB sync
  const executeStageChange = async (id: string, newStage: Stage, extraUpdates?: Partial<Candidate>) => {
    const target = data.candidates.find((c) => c.id === id);
    if (!target) return;

    setData((current) => ({
      ...current,
      candidates: current.candidates.map((c) =>
        c.id === id ? { ...c, stage: newStage, ...extraUpdates } : c
      ),
    }));

    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate({ ...selectedCandidate, stage: newStage, ...extraUpdates });
    }

    if (dbMode && target.applicationId) {
      try {
        const appStatus =
          newStage === "screening"
            ? "screening"
            : newStage === "interview"
            ? "interview"
            : newStage === "offer"
            ? "offer"
            : newStage === "hired"
            ? "hired"
            : "rejected";

        await fetch(`/api/applications/${target.applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: appStatus }),
        });
      } catch {
        // Optimistic update
      }
    }

    const stageObj = STAGES.find((s) => s.id === newStage);
    toast.success(`Kandidat dipindahkan ke tahap ${stageObj?.label || newStage}`);
  };

  // Smart transition handler (validates transitions and opens appropriate modals)
  const initiateStageChange = (id: string, newStage: Stage) => {
    const target = data.candidates.find((c) => c.id === id);
    if (!target || target.stage === newStage) return;

    // Trigger 1: Offer -> Lower stage (demotion / cancel offer warning)
    if (target.stage === "offer" && ["screening", "interview", "rejected"].includes(newStage)) {
      setDrawerOpen(false);
      setCancelOfferCandidate(target);
      setCancelOfferTargetStage(newStage);
      return;
    }

    // Trigger 1.5: Interview -> Lower stage (demotion to screening or rejected)
    if (target.stage === "interview" && ["screening", "rejected"].includes(newStage)) {
      setDrawerOpen(false);
      setDemoteInterviewCandidate(target);
      setDemoteInterviewTargetStage(newStage);
      return;
    }

    // Trigger 2: Move to Interview from Screening (prepare interview modal)
    if (newStage === "interview" && target.stage === "screening") {
      setDrawerOpen(false);
      setScheduleModalCandidate(target);
      return;
    }

    // Trigger 3: Move to Offer (modal opens first; stage only changes upon confirmed submission)
    if (newStage === "offer") {
      setDrawerOpen(false);
      setOfferModalCandidate(target);
      return;
    }

    // Trigger 4: Move to Hired (confirmation modal)
    if (newStage === "hired") {
      setDrawerOpen(false);
      setHireConfirmCandidate(target);
      return;
    }

    // Default: execute stage change directly
    void executeStageChange(id, newStage);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData("text/plain", candidateId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingCandidateId(candidateId);
  };

  const handleDragEnd = () => {
    setDraggingCandidateId(null);
    setActiveDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: Stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDropZone !== stageId) {
      setActiveDropZone(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: Stage) => {
    if (activeDropZone === stageId) {
      setActiveDropZone(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: Stage) => {
    e.preventDefault();
    setActiveDropZone(null);
    const candidateId = e.dataTransfer.getData("text/plain") || draggingCandidateId;
    if (!candidateId) return;

    const candidate = data.candidates.find((c) => c.id === candidateId);
    if (candidate && candidate.stage !== targetStage) {
      initiateStageChange(candidateId, targetStage);
    }
    setDraggingCandidateId(null);
  };

  // Drawer interview & feedback actions
  const handleAddInterview = async (candidateId: string, interviewData: Omit<Interview, "id">) => {
    const newInterview: Interview = {
      ...interviewData,
      id: `interview-${Date.now()}`,
    };

    setData((current) => ({
      ...current,
      interviews: [newInterview, ...current.interviews],
    }));

    if (dbMode) {
      try {
        const cand = data.candidates.find((c) => c.id === candidateId);
        const isUuid = (val?: string) =>
          Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
        const targetAppId = cand?.applicationId && isUuid(cand.applicationId) ? cand.applicationId : undefined;
        const targetCandidateProfileId = !targetAppId && isUuid(candidateId) ? candidateId : undefined;

        if (targetAppId || targetCandidateProfileId) {
          const res = await fetch("/api/interviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId: targetAppId,
              candidateProfileId: targetCandidateProfileId,
              title: interviewData.type,
              scheduledAt: new Date(interviewData.date).toISOString(),
              timezone: interviewData.timezone,
              meetingUrl: interviewData.meetingUrl,
            }),
          });
          const payload = (await res.json()) as { interview?: { id: string } };
          if (payload.interview?.id) {
            setData((current) => ({
              ...current,
              interviews: current.interviews.map((item) =>
                item.id === newInterview.id ? { ...item, id: payload.interview!.id } : item
              ),
            }));
          }
        }
      } catch {
        // Handled
      }
    }
  };

  const handleSendInterviewInvitation = async (interview: Interview, cand?: Candidate) => {
    try {
      if (dbMode && !interview.id.startsWith("interview-")) {
        const response = await fetch(`/api/interviews/${interview.id}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Gagal mengirim undangan.");
      }
      setData((current) => ({
        ...current,
        interviews: current.interviews.map((item) =>
          item.id === interview.id ? { ...item, sentAt: new Date().toISOString() } : item
        ),
      }));
      toast.success(`Undangan berhasil dikirim ke ${cand?.name ?? "kandidat"}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim undangan.");
    }
  };

  const handleUpdateFeedback = (candidateId: string, feedback: string) => {
    setData((current) => ({
      ...current,
      candidates: current.candidates.map((c) => (c.id === candidateId ? { ...c, feedback } : c)),
    }));
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, feedback });
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Kandidat", "Posisi", "Tahap", "Penanggung Jawab", "Batas Waktu", "Status Offer", "Kompensasi"],
      ...filteredCandidates.map((c) => [
        c.name,
        c.role,
        c.stage,
        c.owner,
        c.dueDate,
        c.offerStatus,
        c.compensation,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline-rekruter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan CSV berhasil diunduh");
  };

  // Prepare candidate for CreateOfferModal
  const offerCandidateModalProps: GlobalCandidate | null = useMemo(() => {
    if (!offerModalCandidate) return null;
    return {
      id: offerModalCandidate.id,
      name: offerModalCandidate.name,
      initials: offerModalCandidate.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      role: offerModalCandidate.role,
      location: offerModalCandidate.location,
      experience: 3,
      availability: "Segera",
      skills: [],
      tools: [],
      education: "-",
      salary: offerModalCandidate.compensation || "Rp 15.000.000",
      summary: offerModalCandidate.feedback || "",
      endorsements: [],
      certifications: [],
      portfolio: [],
      email: "",
      phone: "",
      linkedin: "",
      history: [],
      careerStatus: "open-to-work",
      talentCategory: "public",
      industry: "technology-software",
    };
  }, [offerModalCandidate]);

  return (
    <ProtectedRoute role="recruiter">
      <div className="min-h-screen bg-[#F9FAFB] pb-16">
        {/* Top Header */}
        <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-2xs">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pipeline Rekrutmen</h1>
              </div>

              {/* View Switcher & Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* View Switcher */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      viewMode === "kanban"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <Kanban className="size-3.5" /> Papan
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      viewMode === "table"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <TableIcon className="size-3.5" /> Tabel
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCsv}
                  className="h-8.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl gap-1.5"
                >
                  <Download className="size-3.5" /> Export
                </Button>

                <Button
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="h-8.5 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl shadow-2xs gap-1.5"
                >
                  <BarChart3 className="size-3.5" /> Laporan HR
                </Button>
              </div>
            </div>

            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default">
                <span className="text-[11px] font-medium text-slate-500">Total Pelamar</span>
                <span className="text-sm font-bold text-slate-900">{metrics.total}</span>
              </div>
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-3 py-2 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default">
                <span className="text-[11px] font-medium text-blue-700">Screening</span>
                <span className="text-sm font-bold text-blue-900">{metrics.screening}</span>
              </div>
              <div className="bg-fuchsia-50/70 border border-fuchsia-200/80 rounded-xl px-3 py-2 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default">
                <span className="text-[11px] font-medium text-fuchsia-700">Wawancara</span>
                <span className="text-sm font-bold text-fuchsia-900">{metrics.interview}</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default">
                <span className="text-[11px] font-medium text-amber-700">Penawaran (Offer)</span>
                <span className="text-sm font-bold text-amber-900">{metrics.offer}</span>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2 flex items-center justify-between col-span-2 sm:col-span-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default">
                <span className="text-[11px] font-medium text-emerald-700">Diterima (Hired)</span>
                <span className="text-sm font-bold text-emerald-900">{metrics.hired}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kandidat atau posisi..."
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto">
              {/* Job Opening Filter */}
              {availableJobs.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden"
                  >
                    <option value="all">Semua Lowongan</option>
                    <option value="talent-pool">Talent Pool (Belum ada lowongan)</option>
                    {availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(searchQuery || jobFilter !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setJobFilter("all");
                  }}
                  className="h-8 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 sm:px-6">
          {viewMode === "kanban" ? (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
              {STAGES.map((stage) => {
                const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.id);
                const isOver = activeDropZone === stage.id;

                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={(e) => handleDragLeave(e, stage.id)}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className={cn(
                      "flex flex-col rounded-2xl border transition-all duration-200 min-h-[560px] bg-slate-50/60 p-3",
                      stage.border,
                      isOver ? "bg-purple-50/40 border-dashed border-[#7C3AED]/70 ring-2 ring-purple-200/60 scale-[1.005] shadow-xs" : "hover:border-slate-300/80"
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-full transition-transform group-hover:scale-110", stage.dot)} />
                        <h2 className="text-xs font-bold text-slate-900">{stage.label}</h2>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs transition-transform hover:scale-105">
                        {stageCandidates.length}
                      </span>
                    </div>

                    {/* Candidate Cards List */}
                    <div className="flex-1 space-y-2.5 pt-3 overflow-y-auto max-h-[700px]">
                      {isDbSyncing && data.candidates.length === 0 ? (
                        <div className="space-y-2.5">
                          {[1, 2].map((k) => (
                            <div
                              key={k}
                              className="rounded-2xl border border-slate-200/60 bg-white/70 p-3.5 animate-pulse space-y-2.5 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-slate-200" />
                                <div className="space-y-1 flex-1">
                                  <div className="h-3 w-28 bg-slate-200 rounded" />
                                  <div className="h-2.5 w-20 bg-slate-100 rounded" />
                                </div>
                              </div>
                              <div className="h-4 w-24 bg-slate-100 rounded-full" />
                            </div>
                          ))}
                        </div>
                      ) : stageCandidates.length === 0 ? (
                        <div className="h-32 rounded-xl border border-dashed border-slate-200/80 flex flex-col items-center justify-center p-4 text-center transition-colors">
                          <p className="text-[11px] text-slate-400 font-medium">Tarik kandidat ke sini</p>
                        </div>
                      ) : (
                        stageCandidates.map((candidate, idx) => {
                          const candidateInterviews = data.interviews.filter((i) => i.candidateId === candidate.id);
                          const isDragging = draggingCandidateId === candidate.id;
                          const isHired = candidate.stage === "hired";

                          return (
                            <div
                              key={candidate.id}
                              draggable={!isHired}
                              onDragStart={(e) => handleDragStart(e, candidate.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setDrawerOpen(true);
                              }}
                              style={{ animationDelay: `${idx * 50}ms` }}
                              className={cn(
                                "group relative rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:shadow-xs hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200 ease-out animate-in fade-in-50 slide-in-from-bottom-2",
                                isHired ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
                                isDragging ? "opacity-30 scale-[0.98] border-[#7C3AED]/70 shadow-lg ring-1 ring-purple-300" : ""
                              )}
                            >
                              {/* Top Bar: Avatar, Name & Actions */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <CandidateAvatar
                                    initials={candidate.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                    avatarUrl={candidate.avatarUrl}
                                    name={candidate.name}
                                    className="size-8 rounded-xl ring-1 ring-purple-100 group-hover:ring-purple-300 transition-all shrink-0"
                                  />
                                  <div>
                                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors line-clamp-1">
                                      {candidate.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{candidate.role}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Candidate Status Pills */}
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {isHired ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    <Lock className="size-2.5 text-emerald-600" />
                                    Terkunci · Final
                                  </span>
                                ) : (
                                  <>
                                    {(!candidate.jobId || candidate.jobId === "talent-pool") && (
                                      <span className="inline-flex items-center text-[10px] font-semibold text-[#7C3AED] bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md">
                                        Talent Pool
                                      </span>
                                    )}

                                    {candidate.stage === "screening" && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                        <Sparkles className="size-2.5 text-blue-600" />
                                        Review Profil
                                      </span>
                                    )}

                                    {candidate.stage === "interview" && candidateInterviews.length > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200 px-2 py-0.5 rounded-md">
                                        <Clock className="size-2.5" />
                                        Wawancara: {new Date(candidateInterviews[0].date).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </span>
                                    )}

                                    {candidate.stage === "interview" && candidateInterviews.length === 0 && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                        <Calendar className="size-2.5" />
                                        Belum Terjadwal
                                      </span>
                                    )}

                                    {candidate.offerStatus !== "draft" && (
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                                          candidate.offerStatus === "accepted"
                                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                            : "text-blue-700 bg-blue-50 border-blue-200"
                                        )}
                                      >
                                        <DollarSign className="size-2.5" />
                                        {candidate.offerStatus === "accepted" ? "Offer Disetujui" : "Offer Terkirim"}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Card Footer: Clean Location & Actions */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="text-[10px] flex items-center gap-1 truncate max-w-[130px] text-slate-500">
                                  <MapPin className="size-3 text-slate-400 shrink-0" />
                                  {candidate.location}
                                </span>

                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <Link
                                    href="/messages"
                                    className="p-1 rounded-md text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors"
                                    title="Kirim pesan"
                                  >
                                    <MessageSquare className="size-3.5" />
                                  </Link>

                                  <div
                                    className="p-1 text-slate-300 group-hover:text-purple-400 transition-colors cursor-grab"
                                    title="Tarik kartu untuk memindahkan tahap"
                                  >
                                    <GripVertical className="size-3.5" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CLEAN TABLE VIEW */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden animate-in fade-in-50 duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Kandidat</th>
                      <th className="px-4 py-3.5">Posisi &amp; Lokasi</th>
                      <th className="px-4 py-3.5">Tahap Seleksi</th>
                      <th className="px-4 py-3.5">Status Offer</th>
                      <th className="px-4 py-3.5">Penanggung Jawab</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Tidak ada kandidat yang cocok dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((candidate) => (
                        <tr
                          key={candidate.id}
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setDrawerOpen(true);
                          }}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <CandidateAvatar
                                initials={candidate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                                avatarUrl={candidate.avatarUrl}
                                name={candidate.name}
                                className="size-8 rounded-xl ring-1 ring-purple-100 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{candidate.name}</p>
                                {(!candidate.jobId || candidate.jobId === "talent-pool") && (
                                  <span className="inline-flex text-[9px] font-semibold text-[#7C3AED] bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 mt-0.5">
                                    Talent Pool
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-800">{candidate.role}</p>
                            <p className="text-[11px] text-slate-400">{candidate.location}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                STAGES.find((s) => s.id === candidate.stage)?.border,
                                STAGES.find((s) => s.id === candidate.stage)?.bg,
                                STAGES.find((s) => s.id === candidate.stage)?.text
                              )}
                            >
                              {STAGES.find((s) => s.id === candidate.stage)?.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                candidate.offerStatus === "accepted"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : candidate.offerStatus === "sent"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {candidate.offerStatus === "accepted"
                                ? "Accepted"
                                : candidate.offerStatus === "sent"
                                ? "Sent"
                                : "Draft"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{candidate.owner}</td>
                          <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs font-semibold text-[#7C3AED] border-purple-200 hover:bg-purple-50"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setDrawerOpen(true);
                              }}
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Candidate Detail Contextual Drawer */}
        <CandidateDetailDrawer
          candidate={selectedCandidate}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          interviews={data.interviews}
          onStageChange={initiateStageChange}
          onOpenOfferModal={(c) => {
            setDrawerOpen(false);
            setOfferModalCandidate(c);
          }}
          onAddInterview={handleAddInterview}
          onSendInterviewInvitation={handleSendInterviewInvitation}
          onUpdateFeedback={handleUpdateFeedback}
          recruiterName={recruiterName}
          availableJobs={availableJobs}
          onAssignJob={handleAssignJob}
        />

        {/* Schedule Interview Transition Modal (Screening -> Interview) */}
        <ScheduleInterviewTransitionModal
          open={Boolean(scheduleModalCandidate)}
          onOpenChange={(open) => {
            if (!open) setScheduleModalCandidate(null);
          }}
          candidate={scheduleModalCandidate}
          onConfirm={async (interviewData) => {
            if (scheduleModalCandidate) {
              await handleAddInterview(scheduleModalCandidate.id, {
                candidateId: scheduleModalCandidate.id,
                date: interviewData.date,
                timezone: "Asia/Jakarta (WIB)",
                type: interviewData.type,
                panel: [recruiterName],
                status: "Terjadwal",
                reminder: true,
                meetingUrl: interviewData.meetingUrl,
                sentAt: null,
              });
              await executeStageChange(scheduleModalCandidate.id, "interview");
              setScheduleModalCandidate(null);
            }
          }}
          onSkip={() => {
            if (scheduleModalCandidate) {
              void executeStageChange(scheduleModalCandidate.id, "interview");
              setScheduleModalCandidate(null);
            }
          }}
        />

        {/* Cancel Offer Warning Modal (Offer -> Lower Stages) */}
        <CancelOfferWarningModal
          open={Boolean(cancelOfferCandidate && cancelOfferTargetStage)}
          onOpenChange={(open) => {
            if (!open) {
              setCancelOfferCandidate(null);
              setCancelOfferTargetStage(null);
            }
          }}
          candidate={cancelOfferCandidate}
          targetStage={cancelOfferTargetStage}
          onConfirm={async () => {
            if (cancelOfferCandidate && cancelOfferTargetStage) {
              await executeStageChange(cancelOfferCandidate.id, cancelOfferTargetStage, {
                offerStatus: "draft",
              });
              toast.warning(
                `Penawaran kerja dibatalkan. ${cancelOfferCandidate.name} dipindahkan ke tahap ${STAGES.find((s) => s.id === cancelOfferTargetStage)?.label || cancelOfferTargetStage}.`
              );
              setCancelOfferCandidate(null);
              setCancelOfferTargetStage(null);
            }
          }}
        />

        {/* Demote Interview Warning Modal (Interview -> Screening / Rejected) */}
        <DemoteInterviewWarningModal
          open={Boolean(demoteInterviewCandidate && demoteInterviewTargetStage)}
          onOpenChange={(open) => {
            if (!open) {
              setDemoteInterviewCandidate(null);
              setDemoteInterviewTargetStage(null);
            }
          }}
          candidate={demoteInterviewCandidate}
          targetStage={demoteInterviewTargetStage}
          onConfirm={async () => {
            if (demoteInterviewCandidate && demoteInterviewTargetStage) {
              await executeStageChange(demoteInterviewCandidate.id, demoteInterviewTargetStage);
              toast.info(
                `Kandidat ${demoteInterviewCandidate.name} dikembalikan ke tahap ${STAGES.find((s) => s.id === demoteInterviewTargetStage)?.label || demoteInterviewTargetStage}.`
              );
              setDemoteInterviewCandidate(null);
              setDemoteInterviewTargetStage(null);
            }
          }}
        />

        {/* Confirm Hire Modal (Offer -> Hired) */}
        <ConfirmHireModal
          open={Boolean(hireConfirmCandidate)}
          onOpenChange={(open) => {
            if (!open) setHireConfirmCandidate(null);
          }}
          candidate={hireConfirmCandidate}
          onConfirm={async () => {
            if (hireConfirmCandidate) {
              await executeStageChange(hireConfirmCandidate.id, "hired", {
                offerStatus: "accepted",
              });
              toast.success(`Selamat! ${hireConfirmCandidate.name} resmi diterima (Hired)!`, {
                description: "Status pelamar dan penerimaan telah disinkronkan ke database.",
              });
              setHireConfirmCandidate(null);
            }
          }}
        />

        {/* Create Offer Modal */}
        {offerCandidateModalProps && (
          <CreateOfferModal
            open={Boolean(offerModalCandidate)}
            onOpenChange={(open) => {
              if (!open) {
                if (offerModalCandidate && offerModalCandidate.stage !== "offer") {
                  toast.info("Pembuatan penawaran dibatalkan, status kandidat tetap.");
                }
                setOfferModalCandidate(null);
              }
            }}
            candidate={offerCandidateModalProps}
            applicationId={offerModalCandidate?.applicationId}
            onOfferSent={async () => {
              if (offerModalCandidate) {
                await executeStageChange(offerModalCandidate.id, "offer", {
                  offerStatus: "sent",
                });
                toast.success(`Surat penawaran berhasil diterbitkan ke ${offerModalCandidate.name}!`);
                setOfferModalCandidate(null);
              }
            }}
          />
        )}

        {/* HR Report Modal */}
        <HrReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          candidates={data.candidates}
          interviews={data.interviews}
          availableJobs={availableJobs}
        />
      </div>
    </ProtectedRoute>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { candidates as defaultCandidates } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { CandidateAvatar } from "@/components/talent/avatar";
import {
  getStoredJobAssignments,
  SUPABASE_AVATARS,
} from "@/components/recruiter/recruiter-operations";
import { cn, UUID_RE } from "@/lib/utils";

interface ShortlistCandidateItem {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: string;
  experience: number;
  skills: string[];
  avatarUrl?: string | null;
  jobId: string;
  jobTitle: string;
  notes: string;
  itemId?: string;
  verified?: boolean;
}

export default function Shortlist() {
  const {
    hydrated,
    shortlisted,
    scans,
    notes,
    saveNote,
    toggleShortlist,
    user,
    dbMode,
    bootstrapped,
    databaseError,
    shortlists,
  } = useApp();

  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "pool" | "jobs">("all");
  const [remoteCandidates, setRemoteCandidates] = useState<
    Array<{
      id: string;
      name?: string;
      headline?: string;
      role?: string;
      location?: string;
      avatarUrl?: string;
      skills?: string[];
    }>
  >([]);
  const [savedNoteMap, setSavedNoteMap] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const [applications, setApplications] = useState<
    Array<{
      id: string;
      candidateProfileId?: string;
      jobId?: string;
      job?: { id?: string; title?: string };
      status?: string;
    }>
  >([]);

  // Fetch Supabase candidate profiles & applications to enrich remote shortlist items
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/candidates?limit=50", { cache: "no-store" }),
      fetch("/api/applications", { cache: "no-store" }),
    ])
      .then(async ([candRes, appRes]) => {
        if (!active) return;
        if (candRes.ok) {
          const payload = (await candRes.json()) as {
            candidates?: Array<{
              id: string;
              name?: string;
              headline?: string;
              role?: string;
              location?: string;
              avatarUrl?: string;
              skills?: string[];
            }>;
          };
          if (payload.candidates) {
            setRemoteCandidates(payload.candidates);
          }
        }
        if (appRes.ok) {
          const payload = (await appRes.json()) as {
            applications?: Array<{
              id: string;
              candidateProfileId?: string;
              jobId?: string;
              job?: { id?: string; title?: string };
              status?: string;
            }>;
          };
          if (payload.applications) {
            setApplications(payload.applications);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!hydrated || !user || user.role !== "recruiter") {
    return (
      <ProtectedRoute role="recruiter">
        <div />
      </ProtectedRoute>
    );
  }

  if (dbMode && !bootstrapped) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div
          className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-sm text-slate-500 shadow-2xs"
          role="status"
        >
          Memuat shortlist...
        </div>
      </div>
    );
  }

  if (dbMode && databaseError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700"
          role="alert"
        >
          Shortlist belum dapat dimuat. {databaseError}
        </div>
      </div>
    );
  }

  // Synchronize shortlisted candidates from Supabase DB items, local state, and scans
  const remoteItems = shortlists
    .flatMap((shortlist) => shortlist.items)
    .filter((item) => item.status === "active");

  const remoteMap = new Map(remoteItems.map((item) => [item.candidateProfileId, item]));
  const remoteCandMap = new Map(remoteCandidates.map((c) => [c.id, c]));
  const mockCandMap = new Map(defaultCandidates.map((c) => [c.id, c]));
  const storedAssignments = getStoredJobAssignments();

  // Strict business model enforcement:
  // Hanya talenta yang sudah di-scanning/dibuka profilnya yang dapat tampil di workspace
  // Selaras dengan aturan operasional recruiter/operations
  const scannedCandidateIds = new Set(scans.map((scan) => scan.candidateId));

  const candidateSource = [
    ...shortlisted,
    ...remoteItems.map((item) => item.candidateProfileId),
    ...scans.map((scan) => scan.candidateId),
  ];

  const targetIds = Array.from(new Set(candidateSource)).filter((id) => {
    // 1. Must be scanned/unlocked
    if (!scannedCandidateIds.has(id)) return false;
    // 2. In dbMode, candidate must be a valid candidate profile (UUID)
    if (dbMode && !UUID_RE.test(id)) return false;
    return true;
  });

  const list: ShortlistCandidateItem[] = targetIds
    .map((id) => {
      const remoteItem = remoteMap.get(id);
      const remoteCand = remoteCandMap.get(id);
      const mockCand = mockCandMap.get(id);

      const name =
        remoteCand?.name ||
        remoteItem?.candidate?.name ||
        mockCand?.name ||
        `Kandidat (${id.slice(0, 8)})`;

      // Synchronize with applications and stored job assignment
      const app = applications.find(
        (a) => a.candidateProfileId === id || a.id === id
      );
      const override = storedAssignments[id];
      const finalJobId = override ? override.jobId : (app?.jobId || "talent-pool");
      const finalJobTitle = override
        ? override.jobTitle
        : (app?.job?.title && app.job.title !== "Talent Pool" ? app.job.title : "Talent Pool");

      const role =
        (finalJobTitle !== "Talent Pool" ? finalJobTitle : undefined) ||
        remoteCand?.role ||
        remoteCand?.headline ||
        remoteItem?.candidate?.role ||
        mockCand?.role ||
        "Professional Talent";

      const location =
        remoteCand?.location ||
        remoteItem?.candidate?.location ||
        mockCand?.location ||
        "Indonesia";

      const experience = mockCand?.experience ?? 3;
      const skills = mockCand?.skills || remoteCand?.skills || ["Komunikasi", "Problem Solving"];

      const resolvedAvatar =
        remoteCand?.avatarUrl ||
        (remoteCand?.name ? SUPABASE_AVATARS[remoteCand.name] : undefined) ||
        (name ? SUPABASE_AVATARS[name] : undefined) ||
        SUPABASE_AVATARS[id] ||
        mockCand?.avatarUrl;

      // Notes resolution
      const currentNote = savedNoteMap[id] ?? notes[id] ?? remoteItem?.notes ?? "";

      const initials = name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "TL";

      const verified = Boolean(
        mockCand?.talentCategory === "djoin-verified" ||
        mockCand?.campusVerification ||
        remoteCand
      );

      return {
        id,
        name,
        initials,
        role,
        location,
        experience,
        skills,
        avatarUrl: resolvedAvatar,
        jobId: finalJobId,
        jobTitle: finalJobTitle,
        notes: currentNote,
        itemId: remoteItem?.id,
        verified,
      };
    })
    .filter((item) => item.name);

  // Filter list by scope and search query
  const filteredList = list.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesScope =
      scopeFilter === "all" ||
      (scopeFilter === "pool" && (item.jobId === "talent-pool" || item.jobTitle === "Talent Pool")) ||
      (scopeFilter === "jobs" && item.jobId !== "talent-pool" && item.jobTitle !== "Talent Pool");

    return matchesSearch && matchesScope;
  });

  const poolCount = list.filter(
    (item) => item.jobId === "talent-pool" || item.jobTitle === "Talent Pool"
  ).length;
  const jobsCount = list.length - poolCount;

  const toggleSelected = (id: string) => {
    setSelected((curr) =>
      curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]
    );
  };

  const selectAll = () => {
    if (selected.length === filteredList.length) {
      setSelected([]);
    } else {
      setSelected(filteredList.map((c) => c.id));
    }
  };

  const handleSaveNote = async (id: string, noteText: string, itemId?: string) => {
    setSavingNoteId(id);
    setSavedNoteMap((prev) => ({ ...prev, [id]: noteText }));
    saveNote(id, noteText);

    if (dbMode && itemId) {
      try {
        await fetch("/api/shortlists", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, notes: noteText }),
        });
      } catch {}
    }

    setTimeout(() => {
      setSavingNoteId(null);
    }, 600);
  };

  const handleRemoveSingle = (candidateId: string, name: string) => {
    toggleShortlist(candidateId);
    setSelected((curr) => curr.filter((id) => id !== candidateId));
    toast.success(`${name} dihapus dari shortlist`);
  };

  const handleBatchRemove = () => {
    if (selected.length === 0) return;
    const count = selected.length;
    selected.forEach((id) => toggleShortlist(id));
    setSelected([]);
    toast.success(`${count} kandidat dihapus dari shortlist`);
  };

  const exportCsv = (candidatesToExport = filteredList) => {
    if (candidatesToExport.length === 0) {
      toast.info("Tidak ada kandidat untuk diekspor");
      return;
    }
    const headers = [
      "Nama Kandidat",
      "Peran / Keahlian",
      "Lokasi",
      "Pengalaman (Tahun)",
      "Status Penugasan",
      "Keterampilan Utama",
      "Catatan Rekruter",
    ];

    const rows = candidatesToExport.map((c) => [
      c.name,
      c.role,
      c.location,
      String(c.experience),
      c.jobTitle,
      c.skills.join(" | "),
      c.notes,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `proofylink-shortlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${candidatesToExport.length} kandidat berhasil diekspor`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-[#7C3AED]" />
              <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED] font-semibold">
                Workspace Recruiter
              </p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Shortlist Kandidat
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Menampilkan talenta yang telah discan dan disimpan di workspace. Kelola catatan evaluasi dan pantau status di pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {list.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCsv(filteredList)}
                className="h-9 gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Download className="size-3.5" /> Ekspor CSV
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="h-9 gap-1.5 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer shadow-2xs"
            >
              <Link href="/recruiter/operations">
                <LayoutDashboard className="size-3.5" /> Pipeline Operasi
              </Link>
            </Button>
          </div>
        </div>

        {/* Minimalist Stat Cards */}
        {list.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Shortlist</span>
                <Bookmark className="size-4 text-[#7C3AED]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{list.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Kandidat tersimpan di workspace</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Talent Pool</span>
                <Users className="size-4 text-purple-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-purple-700">{poolCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Belum ditugaskan ke lowongan spesifik</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Ditugaskan ke Lowongan</span>
                <Briefcase className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{jobsCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Aktif dalam seleksi lowongan pekerjaan</p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        {list.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kandidat berdasarkan nama, role, atau skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-xl focus:border-[#7C3AED]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setScopeFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  scopeFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Semua ({list.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("pool")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  scopeFilter === "pool"
                    ? "bg-white text-purple-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Talent Pool ({poolCount})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("jobs")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  scopeFilter === "jobs"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Lowongan Aktif ({jobsCount})
              </button>
            </div>
          </div>
        )}

        {/* Candidate List Section */}
        {filteredList.length > 0 ? (
          <div className="mt-6 space-y-3">
            {/* Header row with Select All */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.length === filteredList.length && filteredList.length > 0}
                  onChange={selectAll}
                  className="size-3.5 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                />
                <span>Pilih Semua ({filteredList.length} talenta)</span>
              </label>

              {searchQuery && (
                <span className="text-[11px] text-slate-400">
                  Ditemukan {filteredList.length} dari {list.length} kandidat
                </span>
              )}
            </div>

            {/* Candidate Cards */}
            {filteredList.map((candidate) => {
              const isSelected = selected.includes(candidate.id);
              const isPool = candidate.jobId === "talent-pool" || candidate.jobTitle === "Talent Pool";

              return (
                <div
                  key={candidate.id}
                  className={cn(
                    "group relative rounded-2xl border bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200",
                    isSelected
                      ? "border-purple-300 bg-purple-50/20 ring-1 ring-[#7C3AED]/30"
                      : "border-slate-200/80 hover:border-purple-200 hover:shadow-xs"
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Checkbox + Avatar + Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(candidate.id)}
                          aria-label={`Pilih ${candidate.name}`}
                          className="size-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                        />
                      </div>

                      <CandidateAvatar
                        initials={candidate.initials}
                        avatarUrl={candidate.avatarUrl}
                        name={candidate.name}
                        className="size-11 sm:size-12 shrink-0 ring-1 ring-slate-200"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/talent/${candidate.id}`}
                            className="font-semibold text-sm sm:text-base text-slate-900 hover:text-[#7C3AED] transition-colors truncate"
                          >
                            {candidate.name}
                          </Link>

                          {candidate.verified && (
                            <Badge
                              variant="outline"
                              className="border-purple-200 bg-purple-50 text-[10px] font-semibold text-[#7C3AED] py-0 px-1.5 h-4.5 gap-1"
                            >
                              <Sparkles className="size-2.5 text-[#7C3AED]" /> Terverifikasi
                            </Badge>
                          )}

                          {/* Single Status Badge (Talent Pool vs Job Title) */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold py-0 px-2 h-4.5",
                              isPool
                                ? "border-purple-200 bg-purple-50/70 text-[#7C3AED]"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            )}
                          >
                            {candidate.jobTitle}
                          </Badge>
                        </div>

                        <p className="mt-0.5 text-xs text-slate-500 font-medium truncate">
                          {candidate.role} · {candidate.location} · {candidate.experience} thn peng.
                        </p>

                        {/* Top Skills Tags */}
                        {candidate.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{candidate.skills.length - 3} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Minimalist Note Input */}
                    <div className="w-full lg:w-72 xl:w-80">
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                        <Input
                          type="text"
                          defaultValue={candidate.notes}
                          onBlur={(e) => handleSaveNote(candidate.id, e.target.value, candidate.itemId)}
                          placeholder="Tambahkan catatan evaluasi..."
                          className="h-8.5 pl-8 text-xs bg-slate-50/70 border-slate-200/80 rounded-xl focus:bg-white focus:border-[#7C3AED]"
                        />
                        {savingNoteId === candidate.id && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle2 className="size-3" /> Tersimpan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold text-[#7C3AED] border-purple-200 hover:bg-purple-50 hover:text-[#6D28D9] gap-1 cursor-pointer"
                      >
                        <Link href={`/talent/${candidate.id}`}>
                          Review Profil
                        </Link>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-semibold text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50 gap-1 cursor-pointer"
                        title="Kirim pesan langsung ke kandidat"
                      >
                        <Link
                          href={`/messages/${candidate.id}?contact=${encodeURIComponent(candidate.name)}`}
                        >
                          <MessageSquare className="size-3.5" />
                          <span className="hidden sm:inline">Pesan</span>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs font-semibold text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50 gap-1 cursor-pointer"
                        title="Buka di pipeline rekrutmen"
                      >
                        <Link href="/recruiter/operations">
                          <LayoutDashboard className="size-3.5" />
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSingle(candidate.id, candidate.name)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"
                        title="Hapus dari shortlist"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : list.length > 0 ? (
          <div className="mt-12 text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Search className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Tidak ada kandidat yang cocok
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Coba sesuaikan kata kunci pencarian atau filter status Anda.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setScopeFilter("all");
              }}
              className="mt-4 text-xs font-semibold cursor-pointer"
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Belum ada talenta yang discan di shortlist."
            description="Lakukan scanning profil talenta terlebih dahulu di Pencarian Talenta untuk membuka dan mengelola kandidat di shortlist Anda."
            action={
              <Button asChild size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                <Link href="/search">Cari Talenta</Link>
              </Button>
            }
            className="mt-8 border-dashed rounded-2xl bg-white p-12"
          />
        )}

        {/* Floating Batch Action Bar */}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-3 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-3">
              <span className="text-xs font-bold text-slate-900">
                {selected.length} kandidat dipilih
              </span>

              <div className="h-4 w-px bg-slate-200" />

              <Button
                size="sm"
                variant="destructive"
                onClick={handleBatchRemove}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-3.5" /> Hapus Terpilih
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportCsv(filteredList.filter((c) => selected.includes(c.id)))
                }
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" /> Ekspor Terpilih
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected([])}
                className="h-8 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

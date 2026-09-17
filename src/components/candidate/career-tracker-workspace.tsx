"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useApp } from "@/providers/app-provider";
import {
  CareerActivityCategory,
  CareerActivityItem,
  CareerActivityStatus,
  CareerTrackerData,
} from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Lock,
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  CircleDot,
  Sparkles,
  ExternalLink,
  Copy,
  Briefcase,
  GraduationCap,
  Users2,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

const emptySubscribe = () => () => {};

// ─── Kategori Setup ──────────────────────────────────────────────
const CATEGORIES: Record<
  CareerActivityCategory,
  { label: string; icon: typeof Briefcase; color: string; bg: string; border: string }
> = {
  project: {
    label: "Proyek Nyata",
    icon: Briefcase,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  certification: {
    label: "Sertifikasi & Kursus",
    icon: GraduationCap,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  leadership: {
    label: "Kolaborasi & Leadership",
    icon: Users2,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  skill_research: {
    label: "Riset & Hard Skill",
    icon: BookOpen,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
};

// ─── Status Setup ────────────────────────────────────────────────
const STATUSES: Record<
  CareerActivityStatus,
  { label: string; icon: typeof CheckCircle2; badgeClass: string }
> = {
  planned: {
    label: "Rencana",
    icon: CircleDot,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  in_progress: {
    label: "Sedang Berjalan",
    icon: Clock,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Selesai",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

// ─── Preset Templates ───────────────────────────────────────────
const STARTER_PRESETS: {
  id: string;
  name: string;
  level: string;
  desc: string;
  icon: string;
  activities: Omit<CareerActivityItem, "id" | "createdAt">[];
}[] = [
  {
    id: "fresh_grad",
    name: "Mahasiswa / Fresh Graduate",
    level: "Junior / Entry-Level",
    desc: "Fokus membuktikan kompetensi dasar, portofolio capstone nyata, dan kesiapan interview.",
    icon: "🎓",
    activities: [
      {
        title: "Bangun Proyek Capstone / Mini-App Nyata",
        description: "Rancang aplikasi atau studi kasus pemecahan masalah dengan stack industri modern.",
        category: "project",
        duration: "3 Minggu",
        status: "completed",
        achievementNotes: "Selesai: Aplikasi live di-deploy dengan repositori publik dan 5 fitur utama.",
        proofUrl: "https://github.com",
        completedAt: "2026-09-10T10:00:00.000Z",
      },
      {
        title: "Selesaikan 1 Sertifikasi Fondasi Industri",
        description: "Ikuti program sertifikasi resmi (Coursera, Dicoding, Google Career, atau kampus).",
        category: "certification",
        duration: "1 Bulan",
        status: "in_progress",
        achievementNotes: "Sudah menuntaskan 6 dari 8 modul materi pembelajaran.",
      },
      {
        title: "Dokumentasikan 2 Studi Kasus Portofolio Mendalam",
        description: "Tuliskan latar belakang masalah, proses pemecahan, dan hasil akhir dalam format visual.",
        category: "project",
        duration: "2 Minggu",
        status: "planned",
      },
      {
        title: "Latihan Simulasi Wawancara Kerja (Metode STAR)",
        description: "Susun 5 cerita pengalaman berbasis Situation, Task, Action, dan Result.",
        category: "skill_research",
        duration: "1 Minggu",
        status: "planned",
      },
    ],
  },
  {
    id: "early_career",
    name: "Early Career (Junior → Mid)",
    level: "Mid-Level Professional",
    desc: "Fokus memimpin fitur secara mandiri, memperdalam arsitektur kerja, dan metrik dampak.",
    icon: "🚀",
    activities: [
      {
        title: "Pimpin Pengembangan 1 Fitur Kunci End-to-End",
        description: "Mulai dari perencanaan teknis, eksekusi, pengujian, hingga rilis ke pengguna nyata.",
        category: "leadership",
        duration: "1 Bulan",
        status: "completed",
        achievementNotes: "Fitur berhasil dirilis tepat waktu dengan tingkat kepuasan pengguna 92%.",
        completedAt: "2026-09-08T15:30:00.000Z",
      },
      {
        title: "Perdalam Arsitektur Lanjutan & Best Practice",
        description: "Kuasai pattern desain lanjutan, optimasi performa, atau automated testing.",
        category: "skill_research",
        duration: "3 Minggu",
        status: "in_progress",
        achievementNotes: "Sedang mengimplementasikan automated unit test coverage di modul inti.",
      },
      {
        title: "Standarisasi Dokumentasi Teknis & Panduan Kerja",
        description: "Susun panduan kerja tim (design guideline atau technical documentation).",
        category: "leadership",
        duration: "2 Minggu",
        status: "planned",
      },
      {
        title: "Optimasi Metrik Dampak Nyata (Kecepatan / Konversi)",
        description: "Ukur perbaikan efisiensi atau konversi sebelum dan sesudah optimasi.",
        category: "project",
        duration: "1 Bulan",
        status: "planned",
      },
    ],
  },
  {
    id: "senior_lead",
    name: "Mid-Level → Senior / Lead",
    level: "Senior / Lead Level",
    desc: "Fokus mentoring tim, inisiatif efisiensi skala besar, dan pengaruh strategis.",
    icon: "💼",
    activities: [
      {
        title: "Mentoring 1-2 Anggota Tim & Sesi Knowledge Sharing",
        description: "Bimbing rekan junior dalam menyelesaikan hambatan kerja dan adakan workshop internal.",
        category: "leadership",
        duration: "2 Bulan",
        status: "completed",
        achievementNotes: "Mengadakan 4 sesi bimbingan teknis dan menyusun modul onboarding anggota baru.",
        completedAt: "2026-09-05T09:00:00.000Z",
      },
      {
        title: "Inisiatif Efisiensi Biaya atau Refactoring Skala Besar",
        description: "Rancang refactor arsitektur atau automasi yang menghemat waktu kerja tim.",
        category: "project",
        duration: "3 Bulan",
        status: "in_progress",
        achievementNotes: "Mengurangi waktu build sistem sebesar 40% dan menekan latensi data.",
      },
      {
        title: "Sertifikasi Tingkat Lanjutan / Manajemen Profesional",
        description: "Ambil sertifikasi bergengsi (misal: AWS Solutions Architect, PMP, atau Scrum Master).",
        category: "certification",
        duration: "2 Bulan",
        status: "planned",
      },
      {
        title: "Publikasi Artikel Wawasan Industri / Open Source",
        description: "Tulis artikel mendalam tentang solusi teknis atau kontribusi ke proyek terbuka.",
        category: "skill_research",
        duration: "1 Bulan",
        status: "planned",
      },
    ],
  },
];

function buildDefaultData(targetRole: string): CareerTrackerData {
  return {
    targetRole,
    targetTimeline: "6 Bulan (Q4 2026)",
    currentLevel: "Junior / Fresh Graduate",
    targetLevel: "Mid-Level Professional",
    notes: "Rencana pengembangan diri mandiri untuk memperkuat bukti kerja dan portofolio.",
    activities: [
      {
        id: "act-1",
        title: `Bangun 1 Proyek Studi Kasus Nyata untuk ${targetRole}`,
        description: "Rancang solusi end-to-end dari riset kebutuhan hingga hasil terukur yang siap diuji.",
        category: "project",
        duration: "3 Minggu",
        status: "completed",
        achievementNotes: "Berhasil meluncurkan prototipe interaktif dengan dokumentasi lengkap.",
        proofUrl: "https://proofylink.com",
        createdAt: "2026-09-01T08:00:00.000Z",
        completedAt: "2026-09-12T10:00:00.000Z",
      },
      {
        id: "act-2",
        title: "Pelajari Tool Lanjutan & Standar Industri Terbaru",
        description: "Kuasai metodologi dan perangkat kerja modern yang banyak dicari oleh rekruter.",
        category: "skill_research",
        duration: "1 Bulan",
        status: "in_progress",
        achievementNotes: "Selesai mempelajari 4 dari 6 modul praktik langsung.",
        createdAt: "2026-09-07T08:00:00.000Z",
      },
      {
        id: "act-3",
        title: "Dapatkan Sertifikasi Terverifikasi / Sertifikat Pelatihan",
        description: "Ikuti ujian sertifikasi kompetensi resmi untuk melengkapi kredensial profil.",
        category: "certification",
        duration: "1 Bulan",
        status: "planned",
        createdAt: "2026-09-14T08:00:00.000Z",
      },
    ],
  };
}

export function CareerTrackerWorkspace() {
  const { cvProfile, user } = useApp();
  const userId = cvProfile?.id || user?.email || "demo-candidate";
  const storageKey = `proofylink_career_tracker_v1_${userId}`;
  const initialRole = cvProfile?.targetRole || "Product Designer";

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // ─── State with Lazy Initializer ──────────────────────────────
  const [data, setData] = useState<CareerTrackerData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`proofylink_career_tracker_v1_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.activities)) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return buildDefaultData(initialRole);
  });

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<"all" | CareerActivityStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CareerActivityCategory>("all");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // Form inputs
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState<CareerActivityCategory>("project");
  const [formDuration, setFormDuration] = useState("2 Minggu");
  const [formStatus, setFormStatus] = useState<CareerActivityStatus>("planned");
  const [formAchievement, setFormAchievement] = useState("");
  const [formProofUrl, setFormProofUrl] = useState("");

  // Header inputs
  const [headerTargetRole, setHeaderTargetRole] = useState(data.targetRole);
  const [headerCurrentLevel, setHeaderCurrentLevel] = useState(data.currentLevel);
  const [headerTargetLevel, setHeaderTargetLevel] = useState(data.targetLevel);
  const [headerTimeline, setHeaderTimeline] = useState(data.targetTimeline);

  const saveToStorage = (updated: CareerTrackerData) => {
    setData(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // ─── Metrics Calculation ───────────────────────────────────────
  const totalCount = data.activities.length;
  const completedCount = data.activities.filter((a) => a.status === "completed").length;
  const inProgressCount = data.activities.filter((a) => a.status === "in_progress").length;
  const plannedCount = data.activities.filter((a) => a.status === "planned").length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ─── Filtered Activities ───────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return data.activities.filter((act) => {
      if (statusFilter !== "all" && act.status !== statusFilter) return false;
      if (categoryFilter !== "all" && act.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = (act.description || "").toLowerCase().includes(q);
        const matchAch = (act.achievementNotes || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAch) return false;
      }
      return true;
    });
  }, [data.activities, statusFilter, categoryFilter, searchQuery]);

  // ─── Actions: Add / Edit Activity ─────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDesc("");
    setFormCategory("project");
    setFormDuration("2 Minggu");
    setFormStatus("planned");
    setFormAchievement("");
    setFormProofUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (act: CareerActivityItem) => {
    setEditingId(act.id);
    setFormTitle(act.title);
    setFormDesc(act.description || "");
    setFormCategory(act.category);
    setFormDuration(act.duration);
    setFormStatus(act.status);
    setFormAchievement(act.achievementNotes || "");
    setFormProofUrl(act.proofUrl || "");
    setIsModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Judul aktivitas wajib diisi.");
      return;
    }

    const nowIso = new Date().toISOString();

    if (editingId) {
      // Edit existing
      const updatedList = data.activities.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            title: formTitle.trim(),
            description: formDesc.trim() || undefined,
            category: formCategory,
            duration: formDuration.trim() || "2 Minggu",
            status: formStatus,
            achievementNotes: formAchievement.trim() || undefined,
            proofUrl: formProofUrl.trim() || undefined,
            completedAt:
              formStatus === "completed" && item.status !== "completed"
                ? nowIso
                : formStatus !== "completed"
                ? undefined
                : item.completedAt,
          };
        }
        return item;
      });
      saveToStorage({ ...data, activities: updatedList });
      toast.success("Aktivitas berhasil diperbarui!");
    } else {
      // Add new
      const newItem: CareerActivityItem = {
        id: `act-${Date.now()}`,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        category: formCategory,
        duration: formDuration.trim() || "2 Minggu",
        status: formStatus,
        achievementNotes: formAchievement.trim() || undefined,
        proofUrl: formProofUrl.trim() || undefined,
        createdAt: nowIso,
        completedAt: formStatus === "completed" ? nowIso : undefined,
      };
      saveToStorage({ ...data, activities: [newItem, ...data.activities] });
      toast.success("Aktivitas baru berhasil ditambahkan!");
    }

    setIsModalOpen(false);
  };

  const handleDeleteActivity = (id: string) => {
    const updated = data.activities.filter((a) => a.id !== id);
    saveToStorage({ ...data, activities: updated });
    toast.success("Aktivitas dihapus dari tracker.");
  };

  const handleToggleStatus = (id: string, current: CareerActivityStatus) => {
    const nextStatus: CareerActivityStatus =
      current === "planned"
        ? "in_progress"
        : current === "in_progress"
        ? "completed"
        : "planned";

    const nowIso = new Date().toISOString();
    const updated = data.activities.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: nextStatus,
          completedAt: nextStatus === "completed" ? nowIso : undefined,
        };
      }
      return a;
    });
    saveToStorage({ ...data, activities: updated });
    toast.success(`Status diubah menjadi "${STATUSES[nextStatus].label}"`);
  };

  // ─── Actions: Header Save ──────────────────────────────────────
  const handleSaveHeader = () => {
    const updated: CareerTrackerData = {
      ...data,
      targetRole: headerTargetRole.trim() || data.targetRole,
      currentLevel: headerCurrentLevel.trim() || data.currentLevel,
      targetLevel: headerTargetLevel.trim() || data.targetLevel,
      targetTimeline: headerTimeline.trim() || data.targetTimeline,
    };
    saveToStorage(updated);
    setIsEditingHeader(false);
    toast.success("Target karier berhasil diperbarui!");
  };

  // ─── Actions: Load Preset ─────────────────────────────────────
  const handleApplyPreset = (presetId: string) => {
    const found = STARTER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    const nowIso = new Date().toISOString();
    const newActivities: CareerActivityItem[] = found.activities.map((a, i) => ({
      ...a,
      id: `act-${Date.now()}-${i}`,
      createdAt: nowIso,
    }));

    const updated: CareerTrackerData = {
      ...data,
      targetLevel: found.level,
      activities: newActivities,
    };
    saveToStorage(updated);
    setHeaderTargetLevel(found.level);
    toast.success(`Template "${found.name}" berhasil dimuat!`);
  };

  // ─── Actions: Reset to Default ─────────────────────────────────
  const handleResetToDefault = () => {
    if (confirm("Reset tracker ke data awal? Semua aktivitas yang kamu ubah akan digantikan template awal.")) {
      const fresh = buildDefaultData(initialRole);
      saveToStorage(fresh);
      setHeaderTargetRole(fresh.targetRole);
      setHeaderCurrentLevel(fresh.currentLevel);
      setHeaderTargetLevel(fresh.targetLevel);
      setHeaderTimeline(fresh.targetTimeline);
      toast.success("Tracker dikembalikan ke setelan awal.");
    }
  };

  // ─── Actions: Copy to Portfolio / CV ──────────────────────────
  const handleCopySummary = (act: CareerActivityItem) => {
    const catLabel = CATEGORIES[act.category].label;
    const notes = act.achievementNotes ? `\n• Pencapaian: ${act.achievementNotes}` : "";
    const proof = act.proofUrl ? `\n• Bukti/Link: ${act.proofUrl}` : "";
    const textToCopy = `[${catLabel}] ${act.title} (${act.duration})${notes}${proof}`;

    navigator.clipboard.writeText(textToCopy);
    toast.success("Ringkasan aktivitas disalin!", {
      description: "Siap ditempel ke ringkasan CV atau portofolio proyek kamu.",
    });
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── Breadcrumb & Private Notice ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/candidate" className="hover:underline">
              Workspace Kandidat
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Career Growth Tracker</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Career Growth &amp; Development Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ruang kerja mandiri untuk merencanakan target karier, memantau aktivitas belajar, dan mendokumentasikan bukti pencapaian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium shadow-2xs"
          >
            <Lock className="size-3.5 text-emerald-600" />
            100% Catatan Pribadi (Private)
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
            title="Kembalikan ke data demo awal"
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* ─── Target Header & Level Stepper ─── */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Target className="size-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  Target Peran Impian
                </span>
              </div>

              {!isEditingHeader ? (
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {data.targetRole}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingHeader(true)}
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs h-7 px-2.5"
                    >
                      <Edit2 className="size-3 mr-1.5" /> Ubah Target
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                    <span className="bg-white/10 px-2.5 py-1 rounded-md">
                      Level Saat Ini: <strong className="text-white">{data.currentLevel}</strong>
                    </span>
                    <span>&rarr;</span>
                    <span className="bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2.5 py-1 rounded-md">
                      Target Capaian: <strong className="text-white">{data.targetLevel}</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-300">
                      Timeline: <strong className="text-white">{data.targetTimeline}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Posisi / Peran Target:
                      </label>
                      <Input
                        value={headerTargetRole}
                        onChange={(e) => setHeaderTargetRole(e.target.value)}
                        placeholder="Contoh: Senior Frontend Engineer"
                        className="bg-white/10 border-white/20 text-white text-xs placeholder:text-slate-400 h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Target Timeline:
                      </label>
                      <Input
                        value={headerTimeline}
                        onChange={(e) => setHeaderTimeline(e.target.value)}
                        placeholder="Contoh: 6 Bulan (Q4 2026)"
                        className="bg-white/10 border-white/20 text-white text-xs placeholder:text-slate-400 h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Level Saat Ini:
                      </label>
                      <Input
                        value={headerCurrentLevel}
                        onChange={(e) => setHeaderCurrentLevel(e.target.value)}
                        placeholder="Contoh: Junior / Fresh Graduate"
                        className="bg-white/10 border-white/20 text-white text-xs placeholder:text-slate-400 h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Level Target:
                      </label>
                      <Input
                        value={headerTargetLevel}
                        onChange={(e) => setHeaderTargetLevel(e.target.value)}
                        placeholder="Contoh: Mid-Level Professional"
                        className="bg-white/10 border-white/20 text-white text-xs placeholder:text-slate-400 h-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveHeader}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7"
                    >
                      <Check className="size-3 mr-1" /> Simpan Target
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingHeader(false)}
                      className="text-slate-300 hover:text-white text-xs h-7"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Circle / Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-w-[240px] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Progres Aktivitas:</span>
                <span className="font-bold text-emerald-400 text-sm">{progressPercent}% Tuntas</span>
              </div>

              {/* Progress bar track */}
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>
                  <strong className="text-white">{completedCount}</strong> Selesai
                </span>
                <span>
                  <strong className="text-white">{inProgressCount}</strong> Berjalan
                </span>
                <span>
                  <strong className="text-white">{plannedCount}</strong> Rencana
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Starter Templates Quick Bar ─── */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Sparkles className="size-4 text-purple-600" />
              <span>Gunakan Template Cepat Sesuai Fase Karier:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-2xs"
                  title={preset.desc}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Controls: Search, Filter & Add Activity ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs w-fit">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === "completed"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 className="size-3.5" /> Selesai ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("in_progress")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === "in_progress"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="size-3.5" /> Berjalan ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("planned")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === "planned"
                  ? "bg-slate-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CircleDot className="size-3.5" /> Rencana ({plannedCount})
            </button>
          </div>

          {/* Category Quick Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as "all" | CareerActivityCategory)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 h-9"
          >
            <option value="all">Semua Kategori</option>
            <option value="project">🛠️ Proyek Nyata</option>
            <option value="certification">🎓 Sertifikasi &amp; Kursus</option>
            <option value="leadership">🤝 Kolaborasi &amp; Leadership</option>
            <option value="skill_research">📚 Riset &amp; Hard Skill</option>
          </select>
        </div>

        {/* Search & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas..."
              className="pl-8 text-xs h-9 bg-white border-slate-200"
            />
          </div>
          <Button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shrink-0 gap-1.5 font-semibold"
          >
            <Plus className="size-4" /> Tambah Aktivitas
          </Button>
        </div>
      </div>

      {/* ─── Table / Card View ─── */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Filter className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Tidak ada aktivitas yang sesuai</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Coba ubah kata kunci pencarian atau ganti filter status/kategori di atas."
                : "Belum ada aktivitas di tracker ini. Buat rencana aktivitas pertamamu atau muat template cepat."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openAddModal}
              className="text-xs gap-1.5 mt-2"
            >
              <Plus className="size-3.5" /> Tambah Aktivitas Pertama
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-6/12">Aktivitas &amp; Target Pembelajaran</th>
                  <th className="py-3 px-4 w-2/12">Kategori</th>
                  <th className="py-3 px-4 w-1/12">Durasi</th>
                  <th className="py-3 px-4 w-1/12">Status</th>
                  <th className="py-3 px-4 w-2/12 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((act) => {
                  const cat = CATEGORIES[act.category];
                  const CatIcon = cat.icon;
                  const stat = STATUSES[act.status];

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Title & Notes */}
                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(act.id, act.status)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Klik untuk ubah status"
                          >
                            {act.status === "completed" ? (
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : act.status === "in_progress" ? (
                              <Clock className="size-4 text-amber-500" />
                            ) : (
                              <CircleDot className="size-4 text-slate-300" />
                            )}
                          </button>
                          <div>
                            <span
                              className={`font-semibold text-sm ${
                                act.status === "completed"
                                  ? "text-slate-900 line-through text-slate-500"
                                  : "text-slate-900"
                              }`}
                            >
                              {act.title}
                            </span>
                            {act.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Achievement Box */}
                        {act.achievementNotes && (
                          <div className="ml-6 rounded-lg bg-emerald-50/70 border border-emerald-200/70 p-2.5 text-xs text-emerald-900 space-y-1">
                            <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                              <Check className="size-3 text-emerald-600" /> Hasil &amp; Pencapaian Nyata:
                            </span>
                            <p className="text-emerald-950 leading-relaxed pl-4">
                              {act.achievementNotes}
                            </p>
                            {act.proofUrl && (
                              <a
                                href={act.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline pl-4 text-[11px] mt-0.5"
                              >
                                <ExternalLink className="size-3" /> Buka Bukti Karya / Link
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${cat.bg} ${cat.border} ${cat.color}`}
                        >
                          <CatIcon className="size-3" />
                          {cat.label}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 align-top font-medium text-slate-600">
                        {act.duration}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3.5 px-4 align-top">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(act.id, act.status)}
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${stat.badgeClass}`}
                          title="Klik untuk mengganti status"
                        >
                          <stat.icon className="size-3" />
                          {stat.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right space-x-1">
                        {act.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySummary(act)}
                            className="h-7 px-2 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                            title="Salin ringkasan ini ke CV / Portofolio"
                          >
                            <Copy className="size-3 mr-1" /> Salin ke CV
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(act)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                          title="Edit aktivitas"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                          title="Hapus aktivitas"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── Bottom Tips: How to write effective achievements ─── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-purple-100 bg-purple-50/40 p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="size-4 text-purple-600" />
            Tips Menulis Pencapaian Berdampak (Impactful)
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Hindari hanya menulis <em>&quot;Selesai belajar Figma&quot;</em>. Lebih baik tuliskan hasil konkret:{" "}
            <strong>
              &quot;Menyelesaikan desain 10 layar dengan sistem auto-layout, lolos uji usability ke 5 pengguna, dan link prototipe terlampir.&quot;
            </strong>
          </p>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/40 p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
            <ArrowRight className="size-4 text-indigo-600" />
            Integrasi dengan Portofolio &amp; CV
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Setiap kali sebuah aktivitas selesai dan menghasilkan karya, gunakan tombol{" "}
            <strong>&quot;Salin ke CV&quot;</strong> untuk memperkaya profil portofolio Anda di ProofyLink agar langsung menarik perhatian rekruter.
          </p>
        </Card>
      </div>

      {/* ─── Modal / Dialog: Tambah / Edit Aktivitas ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? "Edit Aktivitas Pengembangan Diri" : "Tambah Aktivitas Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-xs">
              {/* Judul */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Aktivitas / Rencana Belajar: <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Bangun Dashboard Analitik dengan Next.js & Tailwind"
                  className="text-xs"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Rencana Pengerjaan (Opsional):
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Rincian topik yang ingin dipelajari atau masalah yang ingin dipecahkan..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Kategori & Durasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CareerActivityCategory)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="project">🛠️ Proyek Nyata</option>
                    <option value="certification">🎓 Sertifikasi &amp; Kursus</option>
                    <option value="leadership">🤝 Kolaborasi &amp; Leadership</option>
                    <option value="skill_research">📚 Riset &amp; Hard Skill</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Durasi:</label>
                  <Input
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="Misal: 2 Minggu / 1 Bulan"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Progres:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["planned", "in_progress", "completed"] as CareerActivityStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                        formStatus === st
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {STATUSES[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hasil & Pencapaian */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold text-slate-700">
                  Hasil / Pencapaian Nyata (Isi saat berprogres / selesai):
                </label>
                <textarea
                  value={formAchievement}
                  onChange={(e) => setFormAchievement(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Selesai di-deploy di Vercel, skor SEO 95, sudah diuji ke 3 pengguna..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* URL Bukti */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link Bukti Karya / Portofolio (Opsional URL):
                </label>
                <Input
                  value={formProofUrl}
                  onChange={(e) => setFormProofUrl(e.target.value)}
                  placeholder="https://github.com/... atau https://figma.com/..."
                  className="text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  {editingId ? "Simpan Perubahan" : "Tambahkan Aktivitas"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

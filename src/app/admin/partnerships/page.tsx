"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChecking, AdminDenied, AdminPopup } from "@/components/admin/admin-denied";
import { useAdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface PartnershipItem {
  id: string;
  userId: string | null;
  name: string;
  institutionType: string | null;
  officeAddress: string | null;
  website: string | null;
  description: string | null;
  province: string | null;
  city: string | null;
  picPosition: string | null;
  picPhone: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  skDocumentUrl: string | null;
  skNumber: string | null;
  location: string | null;
  verificationStatus: "pending" | "approved" | "need_revision" | "rejected";
  verificationNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerEmail: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    userId: string | null;
    email: string | null;
    name: string | null;
    phone: string | null;
    title: string | null;
  };
}

const STATUS_CONFIG: Record<
  PartnershipItem["verificationStatus"],
  { label: string; badgeClass: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending Verification",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  need_revision: {
    label: "Need Revision",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    icon: ShieldAlert,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: XCircle,
  },
};

const INSTITUTION_TYPE_OPTIONS = [
  "Universitas Negeri (PTN)",
  "Universitas Swasta (PTS)",
  "Institut / Politeknik Vokasi",
  "Sekolah Tinggi / Akademi",
  "Lembaga Pelatihan Kerja (LPK) / Bootcamp",
  "Lainnya",
];

const QUICK_NOTES_TEMPLATES = [
  {
    label: "SK Sah & Resmi",
    text: "Dokumen Surat Keputusan (SK) dan mandat kemitraan kampus telah diverifikasi sah serta sesuai dengan data registrasi Kemendikbudristek/kementerian terkait. Akun mitra kampus disetujui.",
  },
  {
    label: "Berkas SK Buram / Terpotong",
    text: "Pindaian berkas SK tidak terbaca dengan jelas atau nomor lembar halaman terpotong. Mohon unggah ulang salinan resmi berkas SK dalam format PDF beresolusi tinggi.",
  },
  {
    label: "SK Kemitraan Kedaluwarsa",
    text: "Masa berlaku surat penunjukan/MoU kemitraan telah kedaluwarsa. Mohon lampirkan addendum atau SK perpanjangan kerja sama resmi yang masih aktif berlaku.",
  },
  {
    label: "Identitas PIC Perlu Dilengkapi",
    text: "Mohon lengkapi surat tugas resmi / SK pengangkatan penanggung jawab career center dari dekanat/rektorat dan perbarui nomor kontak WhatsApp resmi.",
  },
  {
    label: "Nomor SK Tidak Sesuai",
    text: "Nomor registrasi SK yang dicantumkan berbeda dengan nomor naskah berkas fisik lampiran. Mohon periksa kembali kesesuaian nomor SK.",
  },
];

function AdminPartnershipsContent() {
  const searchParams = useSearchParams();
  const initialReviewId = searchParams.get("reviewId");
  const initialStatus = searchParams.get("status") || "all";

  const [partnerships, setPartnerships] = useState<PartnershipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Review Modal State
  const [selectedPartnership, setSelectedPartnership] = useState<PartnershipItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"legal" | "verification" | "ecosystem">("legal");
  const [updating, setUpdating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State in Modal (Only verification decision is editable by admin)
  const [formStatus, setFormStatus] = useState<PartnershipItem["verificationStatus"]>("pending");
  const [formNotes, setFormNotes] = useState("");

  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPartnership, setDeletingPartnership] = useState<PartnershipItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);

  const populateForm = useCallback((p: PartnershipItem) => {
    setSelectedPartnership(p);
    setFormStatus(p.verificationStatus);
    setFormNotes(p.verificationNotes || "");
  }, []);

  const openReviewModal = useCallback(
    (p: PartnershipItem) => {
      populateForm(p);
      setActiveTab("legal");
      setModalOpen(true);

      // Live sync fresh copy from server to ensure 100% latest live data
      void fetch(new URL(`/api/admin/partnerships?t=${Date.now()}`, window.location.origin), {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.partnerships) {
            const fresh = (data.partnerships as PartnershipItem[]).find((item) => item.id === p.id);
            if (fresh) {
              populateForm(fresh);
            }
          }
        })
        .catch(() => null);
    },
    [populateForm]
  );

  const fetchPartnerships = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const res = await fetch(new URL(`/api/admin/partnerships?t=${Date.now()}`, window.location.origin), {
          cache: "no-store",
          headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = (await res.json()) as { partnerships: PartnershipItem[] };
          const incoming = data.partnerships || [];
          setPartnerships(incoming);
          setLastRefreshedAt(new Date());

          // Refresh selectedPartnership if modal is currently open
          setSelectedPartnership((curr) => {
            if (!curr) return null;
            const updated = incoming.find((item) => item.id === curr.id);
            return updated || curr;
          });

          if (initialReviewId && incoming.length > 0) {
            const target = incoming.find((p: PartnershipItem) => p.id === initialReviewId);
            if (target) openReviewModal(target);
          }
        } else if (res.status === 401) {
          failGate(401);
        } else if (res.status === 403) {
          failGate(403);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (!silent) {
            console.error("Partnerships API error:", res.status, errData);
            toast.error(`Gagal memuat data partnership (${res.status}): ${errData.error ?? "Unknown error"}`);
          }
        }
      } catch (err) {
        if (!silent) {
          console.error("fetchPartnerships exception:", err);
          toast.error("Gagal memuat daftar partnership.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [initialReviewId, openReviewModal, failGate]
  );

  // 1. Initial fetch on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPartnerships(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPartnerships]);

  // 2. Real-time updates via Supabase Realtime channel
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("admin-partnerships-realtime-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "partnerships" },
          () => {
            void fetchPartnerships(true);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            void fetchPartnerships(true);
          }
        )
        .subscribe((status) => {
          setIsRealtimeActive(status === "SUBSCRIBED");
        });
    } catch (e) {
      console.warn("Supabase realtime subscription unavailable for partnerships:", e);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          void supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [fetchPartnerships]);

  // 3. Tab-to-tab BroadcastChannel sync for instant updates in same browser
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("proofylink_partner_updates");
    bc.onmessage = (event) => {
      if (
        event.data?.type === "PARTNER_UPDATED" ||
        event.data?.type === "PARTNERSHIP_SAVED" ||
        event.data?.type === "PARTNER_ONBOARDING_SUBMITTED"
      ) {
        void fetchPartnerships(true);
      }
    };
    return () => {
      bc.close();
    };
  }, [fetchPartnerships]);

  // 4. Background polling and window visibility revalidation
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchPartnerships(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchPartnerships(true);
      }
    }, 12000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [fetchPartnerships]);

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} disalin ke clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyQuickNote = (noteText: string) => {
    setFormNotes((prev) => (prev ? `${prev.trim()}\n${noteText}` : noteText));
  };

  const handleSaveReview = async () => {
    if (!selectedPartnership) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/partnerships/${selectedPartnership.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: formStatus,
          verificationNotes: formNotes || null,
        }),
      });

      if (res.ok) {
        toast.success(`Keputusan verifikasi untuk ${selectedPartnership.name} berhasil disimpan!`);
        setModalOpen(false);

        // Broadcast across tabs
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel("proofylink_partner_updates");
            bc.postMessage({ type: "PARTNER_UPDATED", partnershipId: selectedPartnership.id });
            bc.close();
          } catch {}
        }

        void fetchPartnerships(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Gagal memperbarui status verifikasi.");
      }
    } catch (err) {
      console.error("handleSaveReview exception:", err);
      toast.error("Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePartnership = (p: PartnershipItem) => {
    setDeletingPartnership(p);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePartnership = async () => {
    if (!deletingPartnership) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/partnerships/${deletingPartnership.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Partnership ${deletingPartnership.name} berhasil dihapus.`);
        setDeleteConfirmOpen(false);
        if (modalOpen && selectedPartnership?.id === deletingPartnership.id) {
          setModalOpen(false);
        }

        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel("proofylink_partner_updates");
            bc.postMessage({ type: "PARTNER_UPDATED", partnershipId: deletingPartnership.id });
            bc.close();
          } catch {}
        }

        void fetchPartnerships(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Gagal menghapus partnership.");
      }
    } catch (err) {
      console.error("confirmDeletePartnership exception:", err);
      toast.error("Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleting(false);
      setDeletingPartnership(null);
    }
  };

  const handleOpenSkDocument = async () => {
    if (!selectedPartnership) return;
    if (!selectedPartnership.skDocumentUrl) {
      toast.info("Mitra kampus belum melampirkan berkas fisik SK.");
      return;
    }

    if (
      selectedPartnership.skDocumentUrl.startsWith("http://") ||
      selectedPartnership.skDocumentUrl.startsWith("https://") ||
      selectedPartnership.skDocumentUrl.startsWith("/documents/")
    ) {
      window.open(selectedPartnership.skDocumentUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setOpeningDoc(true);
    try {
      const res = await fetch(`/api/admin/partnerships/${selectedPartnership.id}/legal-docs`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil URL dokumen SK.");
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else if (data.isMock) {
        toast.info(data.message || "Dokumen diunggah dalam mode mock development.");
      } else {
        toast.error(data.message || "Dokumen belum diunggah.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuka berkas SK.";
      toast.error(msg);
    } finally {
      setOpeningDoc(false);
    }
  };

  const filtered = useMemo(() => {
    let result = partnerships;

    if (statusFilter !== "all") {
      result = result.filter((p) => p.verificationStatus === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.skNumber?.toLowerCase().includes(q) ||
          p.institutionType?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.province?.toLowerCase().includes(q) ||
          p.owner.email?.toLowerCase().includes(q) ||
          p.owner.name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [partnerships, statusFilter, search]);

  if (gatePhase === "checking") {
    return (
      <AdminPopup>
        <AdminChecking />
      </AdminPopup>
    );
  }

  if (gatePhase === "denied") {
    return (
      <AdminPopup>
        <AdminDenied code={gateCode ?? 403} />
      </AdminPopup>
    );
  }

  return (
    <AdminShell title="Manajemen & Verifikasi Partnership">
      <div className="space-y-6">
        {/* Top Header Card with Quick Summary */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Direktori Kemitraan Kampus &amp; Instansi
                {isRealtimeActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemeriksaan dan review keabsahan berkas Surat Keputusan (SK) kemitraan serta integrasi alumni &amp; talent kampus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-[#7C3AED] border border-purple-200/80">
                <GraduationCap className="size-3.5" />
                {partnerships.length} Lembaga Terdaftar
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200/80">
                <Clock className="size-3.5" />
                {partnerships.filter((p) => p.verificationStatus === "pending").length} Menunggu Review
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/80">
                <CheckCircle2 className="size-3.5" />
                {partnerships.filter((p) => p.verificationStatus === "approved").length} Disetujui
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama lembaga/instansi, SK, lokasi, atau email..."
              className="pl-10 h-10 text-xs sm:text-sm rounded-xl bg-white border-slate-200 shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "Semua Status" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "need_revision", label: "Need Revision" },
              { key: "rejected", label: "Rejected" },
            ].map((st) => {
              const active = statusFilter === st.key;
              return (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5",
                    active
                      ? "bg-purple-50/80 text-[#7C3AED] border border-purple-300 font-bold shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium"
                  )}
                >
                  {st.label}
                </button>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fetchPartnerships(false)}
              disabled={loading || refreshing}
              className="rounded-xl size-9 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5"
              title={`Segarkan data (terakhir: ${lastRefreshedAt.toLocaleTimeString("id-ID")})`}
            >
              <RefreshCw className={cn("size-3.5 text-slate-600", (loading || refreshing) && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Table Content Card */}
        <Card className="rounded-2xl border-slate-200/90 shadow-xs overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Nama Lembaga / Kampus</th>
                    <th className="py-3.5 px-4 font-bold">Jenis &amp; Domisili</th>
                    <th className="py-3.5 px-4 font-bold">Surat Keputusan (SK)</th>
                    <th className="py-3.5 px-4 font-bold">Status Verifikasi</th>
                    <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        Memuat data master partnership...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <GraduationCap className="size-8 mx-auto mb-2 text-slate-300" />
                        Tidak ada data partnership yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const cfg = STATUS_CONFIG[p.verificationStatus] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Nama Lembaga / Instansi */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="size-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100 mt-0.5">
                                <GraduationCap className="size-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {p.owner.email || "Email akun belum terhubung"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Jenis & Domisili */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="font-medium text-slate-800">{p.institutionType || "Perguruan Tinggi"}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="size-3 text-slate-400 shrink-0" />
                              <span>{p.location || [p.city, p.province].filter(Boolean).join(", ") || "-"}</span>
                            </div>
                          </td>

                          {/* Surat SK */}
                          <td className="py-3.5 px-4">
                            {p.skDocumentUrl || p.skNumber ? (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-slate-100/70 border border-slate-200 px-2.5 py-1 rounded-lg w-fit">
                                <FileText className="size-3 text-[#7C3AED] shrink-0" />
                                <span className="truncate max-w-[170px]">{p.skNumber || "SK Kemitraan"}</span>
                                {p.skDocumentUrl && (
                                  <a
                                    href={p.skDocumentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#7C3AED] hover:text-[#6D28D9] ml-1"
                                    title="Buka Dokumen PDF SK"
                                  >
                                    <ExternalLink className="size-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>

                          {/* Status Verifikasi */}
                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                                cfg.badgeClass
                              )}
                            >
                              <Icon className="size-3 shrink-0" />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(p)}
                                className="border-purple-200 text-[#7C3AED] hover:bg-purple-50 hover:border-purple-300 text-xs font-semibold h-8 px-3 rounded-xl gap-1.5 shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5"
                              >
                                <Eye className="size-3.5" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePartnership(p)}
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 text-xs h-8 px-2.5 rounded-xl gap-1 shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5"
                                title={`Hapus kemitraan ${p.name}`}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Detail & Review Data Mitra Kampus */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Review Data Mitra Kampus:</span>
                    <span className="text-[#7C3AED]">{selectedPartnership?.name}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    ID Kemitraan: <span className="font-mono text-slate-700 font-semibold">{selectedPartnership?.id}</span> · Terdaftar sejak{" "}
                    {selectedPartnership?.createdAt
                      ? new Date(selectedPartnership.createdAt).toLocaleDateString("id-ID")
                      : "-"}
                  </DialogDescription>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex gap-1.5 pt-3">
                <Button
                  size="sm"
                  variant={activeTab === "legal" ? "default" : "outline"}
                  onClick={() => setActiveTab("legal")}
                  className={cn(
                    "text-xs h-8 rounded-xl font-bold transition-all cursor-pointer",
                    activeTab === "legal"
                      ? "bg-purple-50 text-[#7C3AED] border border-purple-300 shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Profil Lembaga &amp; SK Legalitas
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "verification" ? "default" : "outline"}
                  onClick={() => setActiveTab("verification")}
                  className={cn(
                    "text-xs h-8 rounded-xl font-bold transition-all cursor-pointer",
                    activeTab === "verification"
                      ? "bg-purple-50 text-[#7C3AED] border border-purple-300 shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Keputusan Verifikasi
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "ecosystem" ? "default" : "outline"}
                  onClick={() => setActiveTab("ecosystem")}
                  className={cn(
                    "text-xs h-8 rounded-xl font-bold transition-all cursor-pointer",
                    activeTab === "ecosystem"
                      ? "bg-purple-50 text-[#7C3AED] border border-purple-300 shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Ekosistem Talent &amp; Mahasiswa
                </Button>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {activeTab === "legal" && (
                <div className="space-y-4 text-xs">
                  {/* Notice Banner: Read-only Mode */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
                    <Lock className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-950 flex items-center gap-1.5">
                        Mode Review Verifikasi (Hanya Baca)
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/60 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                          Terkunci dari Edit Admin
                        </span>
                      </p>
                      <p className="text-[11.5px] text-amber-800 leading-relaxed">
                        Data identitas PIC, profil kampus/lembaga, dan berkas Surat Keputusan (SK) di bawah ini bersifat hanya-baca (read-only). Hanya pemilik akun penanggung jawab mitra kampus yang berwenang mengubah profil dan dokumen kemitraan mereka.
                      </p>
                    </div>
                  </div>

                  {/* Bagian 1: Identitas PIC / Penanggung Jawab Kemitraan */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-[#7C3AED]">
                          <User className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Identitas PIC / Penanggung Jawab Kemitraan Kampus</p>
                          <p className="text-[11px] text-muted-foreground">
                            Informasi perwakilan resmi dari Career Center, Hubungan Industri, atau Kemahasiswaan.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold border border-slate-200">
                        <Lock className="size-2.5" /> Read-only
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap PIC</label>
                        <div className="relative">
                          <Input
                            value={selectedPartnership?.owner.name || selectedPartnership?.picPosition || "-"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 font-medium pr-8"
                          />
                          {selectedPartnership?.owner.name && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnership.owner.name || "", "Nama PIC")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Nama PIC"
                            >
                              {copiedField === "Nama PIC" ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Jabatan / Role PIC</label>
                        <div className="relative">
                          <Input
                            value={selectedPartnership?.picPosition || selectedPartnership?.owner.title || "Koordinator Career Center / Kemitraan"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 font-medium pr-8"
                          />
                          {(selectedPartnership?.picPosition || selectedPartnership?.owner.title) && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnership?.picPosition || selectedPartnership?.owner.title || "", "Jabatan PIC")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Jabatan PIC"
                            >
                              {copiedField === "Jabatan PIC" ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Akun Login PIC</label>
                        <div className="relative">
                          <Input
                            value={selectedPartnership?.owner.email || "-"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 font-medium pr-8"
                          />
                          {selectedPartnership?.owner.email && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnership.owner.email || "", "Email Akun PIC")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Email Akun PIC"
                            >
                              {copiedField === "Email Akun PIC" ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Email login terikat dengan autentikasi akun lembaga mitra.
                        </span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon / WhatsApp PIC</label>
                        <div className="relative">
                          <Input
                            value={selectedPartnership?.picPhone || selectedPartnership?.owner.phone || "-"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 font-medium pr-8"
                          />
                          {(selectedPartnership?.picPhone || selectedPartnership?.owner.phone) && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnership?.picPhone || selectedPartnership?.owner.phone || "", "Telepon PIC")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Telepon PIC"
                            >
                              {copiedField === "Telepon PIC" ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Profil Entitas Lembaga / Kampus */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Profil Entitas Lembaga / Kampus</p>
                          <p className="text-[11px] text-muted-foreground">
                            Data identitas perguruan tinggi atau institusi vokasi penyedia talenta.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold border border-slate-200">
                        <Lock className="size-2.5" /> Read-only
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Nama Resmi Lembaga / Kampus
                        </label>
                        <div className="relative">
                          <Input
                            value={selectedPartnership?.name || "-"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 font-bold pr-8"
                          />
                          {selectedPartnership?.name && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnership.name, "Nama Kampus")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Nama Kampus"
                            >
                              {copiedField === "Nama Kampus" ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Kategori / Jenis Lembaga</label>
                        <select
                          value={selectedPartnership?.institutionType || "Universitas Negeri (PTN)"}
                          disabled
                          className="w-full h-8.5 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed px-2.5 font-medium"
                        >
                          {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Website Resmi Lembaga</label>
                        <div className="relative flex items-center gap-1.5">
                          <Input
                            value={selectedPartnership?.website || "-"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 pr-8"
                          />
                          {selectedPartnership?.website && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedPartnership.website || "", "Website Lembaga")}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Salin Website"
                              >
                                {copiedField === "Website Lembaga" ? (
                                  <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                              <a
                                href={selectedPartnership.website.startsWith("http") ? selectedPartnership.website : `https://${selectedPartnership.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#7C3AED] hover:text-[#6D28D9] ml-1"
                                title="Kunjungi Website Kampus"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Provinsi &amp; Kota Lokasi Kampus</label>
                        <div className="relative">
                          <Input
                            value={
                              selectedPartnership?.location ||
                              [selectedPartnership?.city, selectedPartnership?.province].filter(Boolean).join(", ") ||
                              "-"
                            }
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Alamat Kampus / Kantor Lengkap</label>
                        <div className="relative">
                          <Input
                            value={selectedPartnership?.officeAddress || "-"}
                            disabled
                            className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 pr-8"
                          />
                          {selectedPartnership?.officeAddress && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedPartnership.officeAddress || "", "Alamat Kampus")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin Alamat Kampus"
                            >
                              {copiedField === "Alamat Kampus" ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Deskripsi &amp; Profil Singkat Lembaga</label>
                        <textarea
                          value={selectedPartnership?.description || "Lembaga pendidikan tinggi penyedia talent berkualitas dan pusat pengembangan karier mahasiswa."}
                          disabled
                          readOnly
                          rows={3}
                          className="w-full text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed p-2.5 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Dokumen Legalitas Surat Keputusan (SK) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-[#7C3AED]">
                          <FileCheck className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Dokumen Legalitas &amp; Surat Keputusan (SK) Kemitraan</p>
                          <p className="text-[11px] text-muted-foreground">
                            Pemeriksaan naskah SK pendirian, kerja sama, atau mandat career center resmi.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold border border-slate-200">
                        <Lock className="size-2.5" /> Read-only
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-stretch">
                      {/* Nomor SK Card */}
                      <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center justify-between gap-2 min-h-7 mb-2">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                              <FileText className="size-4 text-[#7C3AED] shrink-0" />
                              <span className="truncate">Nomor Registrasi SK</span>
                            </span>
                            <Badge variant="outline" className="text-[10px] font-semibold text-purple-700 bg-purple-50 border-purple-200">
                              Legalitas
                            </Badge>
                          </div>

                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                            Nomor Surat Keputusan / MoU
                          </label>
                          <div className="relative">
                            <Input
                              value={selectedPartnership?.skNumber || "-"}
                              disabled
                              className="h-8.5 text-xs bg-slate-50 text-slate-800 cursor-not-allowed border-slate-200 font-mono pr-8"
                            />
                            {selectedPartnership?.skNumber && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedPartnership.skNumber || "", "Nomor SK")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Salin Nomor SK"
                              >
                                {copiedField === "Nomor SK" ? (
                                  <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 text-[11px] text-muted-foreground border-t border-slate-200 mt-3">
                          Pastikan nomor naskah SK sesuai dengan basis data Kemendikbudristek atau rektorat.
                        </div>
                      </div>

                      {/* File Berkas SK Card */}
                      <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between gap-2 min-h-7">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                            <FileCheck className="size-4 text-[#7C3AED] shrink-0" />
                            <span className="truncate">Berkas Fisik SK Kemitraan</span>
                          </span>
                          {selectedPartnership?.skDocumentUrl ? (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 inline-flex items-center">
                              <CheckCircle2 className="size-3 mr-1 text-emerald-600 shrink-0" /> PDF Terlampir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-100 border-slate-200">
                              Belum Diunggah
                            </Badge>
                          )}
                        </div>

                        <div className="my-2.5 flex-1 flex flex-col justify-center">
                          <p className="text-[11px] text-slate-600 font-medium">
                            {selectedPartnership?.skDocumentUrl ? (
                              <span className="font-mono text-slate-700 break-all">
                                {selectedPartnership.skDocumentUrl.split("/").pop()}
                              </span>
                            ) : (
                              "Mitra belum mengunggah salinan pindaian SK resmi."
                            )}
                          </p>
                        </div>

                        <div className="mt-auto pt-1">
                          {selectedPartnership?.skDocumentUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={openingDoc}
                              onClick={handleOpenSkDocument}
                              className="w-full h-8.5 text-xs gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold cursor-pointer shadow-xs rounded-xl flex items-center justify-center disabled:opacity-60"
                            >
                              {openingDoc ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Membuka Berkas...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="size-3.5" />
                                  Buka &amp; Periksa Berkas SK Resmi (PDF)
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 h-8.5 flex items-center justify-center text-center text-[11px] text-slate-400 italic px-2">
                              Mitra belum melampirkan berkas SK (PDF)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "verification" && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                    <div>
                      <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                        Keputusan Verifikasi Kemitraan Kampus
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Persetujuan verifikasi akan mengaktifkan lencana kemitraan resmi pada direktori talent dan membuka akses dashboard manajemen mahasiswa bagi kampus ini.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="partnership-status-select" className="font-semibold text-slate-700 block mb-1">
                        Ubah Status Verifikasi:
                      </label>
                      <select
                        id="partnership-status-select"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as PartnershipItem["verificationStatus"])}
                        className="w-full h-9 text-xs rounded-xl border border-slate-300 bg-white px-2.5 font-bold text-slate-900 shadow-2xs focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="pending">Pending Verification (Menunggu Peninjauan)</option>
                        <option value="approved">Approved (Setujui Kemitraan &amp; Aktifkan Akses Kampus)</option>
                        <option value="need_revision">Need Revision (Minta Perbaikan Dokumen / SK)</option>
                        <option value="rejected">Rejected (Tolak Pendaftaran Kemitraan)</option>
                      </select>
                    </div>

                    {/* Quick Notes Template Chips */}
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-[#7C3AED]" />
                        Template Catatan Cepat (Klik untuk Sisipkan):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_NOTES_TEMPLATES.map((tmpl) => (
                          <button
                            type="button"
                            key={tmpl.label}
                            onClick={() => handleApplyQuickNote(tmpl.text)}
                            className="rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 hover:border-purple-300 text-[11px] text-[#7C3AED] font-semibold px-2.5 py-1 transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5"
                          >
                            + {tmpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="partnership-notes-textarea" className="font-semibold text-slate-700 block mb-1">
                        Catatan &amp; Rincian Hasil Verifikasi (Ditampilkan kepada Mitra):
                      </label>
                      <textarea
                        id="partnership-notes-textarea"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Tuliskan catatan hasil pemeriksaan berkas SK atau instruksi perbaikan yang perlu diperbarui oleh perwakilan kampus..."
                        className="w-full h-28 p-2.5 text-xs rounded-xl border border-slate-300 bg-white resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring leading-relaxed"
                      />
                    </div>

                    {selectedPartnership?.reviewedAt && (
                      <div className="pt-2 text-[11px] text-muted-foreground border-t border-slate-200 flex items-center justify-between">
                        <span>
                          Terakhir ditinjau:{" "}
                          <strong className="text-slate-700">
                            {new Date(selectedPartnership.reviewedAt).toLocaleString("id-ID")}
                          </strong>
                        </span>
                        {selectedPartnership.reviewerEmail && (
                          <span className="font-mono text-[10px] text-slate-500">
                            oleh {selectedPartnership.reviewerEmail}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "ecosystem" && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Data Penyaluran &amp; Ekosistem Kemitraan Kampus
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Ringkasan integrasi penyaluran mahasiswa dan keterlibatan industri pada platform Talent Network.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Status Kemitraan
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <Badge
                            className={cn(
                              "capitalize text-[10.5px] font-bold",
                              selectedPartnership?.verificationStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {selectedPartnership?.verificationStatus === "approved" ? "Kemitraan Aktif" : "Menunggu Review"}
                          </Badge>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Alumni / Talent Terhubung
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-base font-extrabold text-[#7C3AED] tabular-nums">
                            128 Mahasiswa
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Talent Terverifikasi
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-base font-extrabold text-emerald-600 tabular-nums">
                            94 Terverifikasi
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Pemberi Kerja Terhubung
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-base font-extrabold text-slate-900 tabular-nums">
                            14 Perusahaan
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-200/70 bg-purple-50/40 p-4 space-y-2">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <GraduationCap className="size-4 text-[#7C3AED]" />
                      Portal Mitra Terhubung
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Ketika status kemitraan disetujui, PIC lembaga dapat melakukan bulk-verifikasi ijazah dan transkrip mahasiswa secara langsung, serta memantau analitik penyerapan kerja lulusan ke perusahaan rekruter.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-3 flex flex-row items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedPartnership) handleDeletePartnership(selectedPartnership);
                }}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs rounded-xl gap-1.5 font-medium"
              >
                <Trash2 className="size-3.5" />
                Hapus Partnership
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs rounded-xl border-slate-200"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveReview}
                  disabled={updating}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs rounded-xl font-semibold px-4 cursor-pointer shadow-xs"
                >
                  {updating ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Simpan Keputusan Verifikasi
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Partnership
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Apakah Anda yakin ingin menghapus data kemitraan{" "}
                <strong className="text-slate-900">{deletingPartnership?.name}</strong>?
                Tindakan ini permanen dan data yang telah dihapus tidak dapat dipulihkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={confirmDeletePartnership}
                disabled={deleting}
                className="text-xs rounded-xl gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Menghapus…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    Hapus Sekarang
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}

export default function AdminPartnershipsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Partnership">
          <div className="py-24 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-[#7C3AED]" />
            <p className="mt-3 text-xs text-muted-foreground">Memuat portal kemitraan...</p>
          </div>
        </AdminShell>
      }
    >
      <AdminPartnershipsContent />
    </Suspense>
  );
}

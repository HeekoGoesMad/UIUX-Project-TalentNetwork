"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Loader2,
  Radio,
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

export interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  nib: string | null;
  npwp: string | null;
  nibDocumentUrl: string | null;
  npwpDocumentUrl: string | null;
  industry: string | null;
  companyScale: string | null;
  province: string | null;
  city: string | null;
  officeAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  website: string | null;
  linkedinUrl: string | null;
  description: string | null;
  verificationStatus: "pending" | "approved" | "need_revision" | "rejected" | "suspended";
  verificationNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerEmail: string | null;
  subscriptionTier: "trial" | "starter" | "professional" | "enterprise";
  subscriptionStatus: "active" | "expired" | "suspended";
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  tokenBalance: number;
  owner: {
    userId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    title: string | null;
  };
  usage: {
    tokenBalance: number;
    talentUnlockCount: number;
    financialScreeningCount: number;
    lastActivity: string;
  };
}

const STATUS_CONFIG: Record<
  CompanyItem["verificationStatus"],
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
  suspended: {
    label: "Suspended",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    icon: ShieldAlert,
  },
};

const INDUSTRY_OPTIONS = [
  { value: "Technology", label: "Teknologi & Perangkat Lunak (SaaS / IT)" },
  { value: "Financial Services", label: "Fintech & Layanan Keuangan" },
  { value: "Retail", label: "E-Commerce & Retail Modern" },
  { value: "Manufacturing", label: "FMCG & Manufaktur" },
  { value: "Healthcare", label: "Kesehatan, Farmasi & Medtech" },
  { value: "Logistics", label: "Logistik, Transportasi & Supply Chain" },
  { value: "Professional Services", label: "Konsultan & Layanan Bisnis Profesional" },
  { value: "Education", label: "Pendidikan & Edutech" },
  { value: "Hospitality", label: "Hospitality & Pariwisata" },
  { value: "Other", label: "Lainnya" },
];

const SCALE_OPTIONS = [
  { id: "1-10 Karyawan", label: "1 — 10 Karyawan (Startup / Usaha Rintisan)" },
  { id: "11-50 Karyawan", label: "11 — 50 Karyawan (Pertumbuhan Awal)" },
  { id: "51-200 Karyawan", label: "51 — 200 Karyawan (Menengah / Mid-Sized)" },
  { id: "201-500 Karyawan", label: "201 — 500 Karyawan (Perusahaan Besar)" },
  { id: "500+ Karyawan", label: "500+ Karyawan (Korporasi / Enterprise)" },
];

const TIER_OPTIONS = ["trial", "starter", "professional", "enterprise"];

const QUICK_NOTES_TEMPLATES = [
  {
    label: "Legalitas Valid & Sah",
    text: "Dokumen NIB dan NPWP telah diperiksa dan dinyatakan sah serta sesuai dengan profil entitas usaha. Akun rekruter disetujui.",
  },
  {
    label: "NIB Buram / Tidak Jelas",
    text: "Berkas NIB tidak terbaca dengan jelas atau terpotong. Mohon unggah ulang dokumen resmi OSS dalam format PDF yang jelas dan beresolusi tinggi.",
  },
  {
    label: "NPWP Tidak Cocok",
    text: "Nomor atau nama wajib pajak pada dokumen NPWP tidak cocok dengan data legalitas perusahaan. Mohon periksa dan unggah kembali berkas yang sesuai.",
  },
  {
    label: "Data Kontak Kurang Lengkap",
    text: "Mohon lengkapi alamat kantor operasional, nomor telepon kantor, dan informasi kontak penanggung jawab (PIC) yang valid.",
  },
];

import { Suspense } from "react";

function AdminCompaniesContent() {
  const searchParams = useSearchParams();
  const initialReviewId = searchParams.get("reviewId");
  const initialStatus = searchParams.get("status") || "all";

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Review Modal State
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"legal" | "verification" | "subscription">("legal");
  const [updating, setUpdating] = useState(false);
  const [openingDoc, setOpeningDoc] = useState<"nib" | "npwp" | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Edit form state in modal - matches recruiter profile form 1:1
  const [formStatus, setFormStatus] = useState<CompanyItem["verificationStatus"]>("pending");
  const [formNotes, setFormNotes] = useState("");
  const [formNib, setFormNib] = useState("");
  const [formNpwp, setFormNpwp] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formScale, setFormScale] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCompanyEmail, setFormCompanyEmail] = useState("");
  const [formCompanyPhone, setFormCompanyPhone] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formLinkedin, setFormLinkedin] = useState("");
  const [formTier, setFormTier] = useState<CompanyItem["subscriptionTier"]>("trial");
  const [formSubStatus, setFormSubStatus] = useState<CompanyItem["subscriptionStatus"]>("active");

  // Recruiter Profile 1:1 fields
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOfficeAddress, setFormOfficeAddress] = useState("");
  const [formPicName, setFormPicName] = useState("");
  const [formPicTitle, setFormPicTitle] = useState("");
  const [formPicEmail, setFormPicEmail] = useState("");
  const [formPicPhone, setFormPicPhone] = useState("");

  const populateForm = useCallback((c: CompanyItem) => {
    setSelectedCompany(c);
    setFormCompanyName(c.name || "");
    setFormPicName(c.owner?.name || "");
    setFormPicTitle(c.owner?.title || "");
    setFormPicEmail(c.owner?.email || c.companyEmail || "");
    setFormPicPhone(c.owner?.phone || "");
    setFormCompanyEmail(c.companyEmail || "");
    setFormCompanyPhone(c.companyPhone || "");
    setFormStatus(c.verificationStatus);
    setFormNotes(c.verificationNotes || "");
    setFormNib(c.nib || "");
    setFormNpwp(c.npwp || "");
    setFormIndustry(c.industry || "Other");
    setFormScale(c.companyScale || "1-10 Karyawan");
    setFormProvince(c.province || "");
    setFormCity(c.city || "");
    setFormDescription(c.description || "");
    setFormOfficeAddress(c.officeAddress || "");
    setFormWebsite(c.website || "");
    setFormLinkedin(c.linkedinUrl || "");
    setFormTier(c.subscriptionTier || "trial");
    setFormSubStatus(c.subscriptionStatus || "active");
  }, []);

  const openReviewModal = useCallback(
    (c: CompanyItem) => {
      populateForm(c);
      setActiveTab("legal");
      setModalOpen(true);

      // Live sync fresh copy from server to ensure 100% latest live data
      void fetch(new URL(`/api/admin/companies?t=${Date.now()}`, window.location.origin), {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.companies) {
            const fresh = (data.companies as CompanyItem[]).find((item) => item.id === c.id);
            if (fresh) {
              populateForm(fresh);
            }
          }
        })
        .catch(() => null);
    },
    [populateForm]
  );

  const fetchCompanies = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const res = await fetch(new URL(`/api/admin/companies?t=${Date.now()}`, window.location.origin), {
          cache: "no-store",
          headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          const incoming = (data.companies || []) as CompanyItem[];
          setCompanies(incoming);
          setLastRefreshedAt(new Date());

          // Refresh selectedCompany if modal is open
          setSelectedCompany((curr) => {
            if (!curr) return null;
            const updated = incoming.find((item) => item.id === curr.id);
            return updated || curr;
          });

          if (initialReviewId && incoming.length > 0) {
            const target = incoming.find((c: CompanyItem) => c.id === initialReviewId);
            if (target) {
              openReviewModal(target);
            }
          }
        } else if (res.status === 401) {
          failGate(401);
        } else if (res.status === 403) {
          failGate(403);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (!silent) {
            console.error("Companies API error:", res.status, errData);
            toast.error(`Gagal memuat data perusahaan (${res.status}): ${errData.error ?? "Unknown error"}`);
          }
        }
      } catch (err) {
        if (!silent) {
          console.error("fetchCompanies exception:", err);
          toast.error("Gagal memuat daftar perusahaan.");
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
      void fetchCompanies(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCompanies]);

  // 2. Real-time updates via Supabase Realtime channel
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("admin-companies-realtime-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "organizations" },
          () => {
            void fetchCompanies(true);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            void fetchCompanies(true);
          }
        )
        .subscribe((status) => {
          setIsRealtimeActive(status === "SUBSCRIBED");
        });
    } catch (e) {
      console.warn("Supabase realtime subscription unavailable:", e);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          void supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [fetchCompanies]);

  // 3. Tab-to-tab BroadcastChannel sync for instant updates in same browser
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("proofylink_company_updates");
    bc.onmessage = (event) => {
      if (
        event.data?.type === "COMPANY_UPDATED" ||
        event.data?.type === "RECRUITER_UPDATED" ||
        event.data?.type === "PROFILE_SAVED"
      ) {
        void fetchCompanies(true);
      }
    };
    return () => {
      bc.close();
    };
  }, [fetchCompanies]);

  // 4. Background polling and window visibility revalidation
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchCompanies(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchCompanies(true);
      }
    }, 12000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [fetchCompanies]);

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

  const handleSaveCompany = async () => {
    if (!selectedCompany) return;

    setUpdating(true);
    try {
      const res = await fetch(new URL(`/api/admin/companies/${selectedCompany.id}`, window.location.origin), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formCompanyName || selectedCompany.name,
          picName: formPicName || null,
          picTitle: formPicTitle || null,
          picPhone: formPicPhone || null,
          verificationStatus: formStatus,
          verificationNotes: formNotes || null,
          nib: formNib || null,
          npwp: formNpwp || null,
          industry: formIndustry || null,
          companyScale: formScale || null,
          province: formProvince || null,
          city: formCity || null,
          description: formDescription || null,
          officeAddress: formOfficeAddress || null,
          companyEmail: formCompanyEmail || null,
          companyPhone: formCompanyPhone || null,
          website: formWebsite || null,
          linkedinUrl: formLinkedin || null,
          subscriptionTier: formTier,
          subscriptionStatus: formSubStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal memperbarui data.");
      }

      const resData = await res.json();
      const updated = resData.company;

      toast.success(`Data perusahaan ${formCompanyName || selectedCompany.name} berhasil diperbarui & disinkronkan!`);
      setModalOpen(false);

      if (updated) {
        setCompanies((prev) =>
          prev.map((item) => (item.id === selectedCompany.id ? { ...item, ...updated } : item))
        );
      }

      // Broadcast update across tabs
      if (typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel("proofylink_company_updates");
          bc.postMessage({ type: "COMPANY_UPDATED", companyId: selectedCompany.id });
          bc.close();
        } catch {}
      }

      void fetchCompanies(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCompany = async (company: CompanyItem) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus perusahaan "${company.name}" beserta seluruh relasi data terkait secara permanen? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus perusahaan.");
      }
      toast.success(data.message || `Perusahaan ${company.name} berhasil dihapus.`);
      if (modalOpen && selectedCompany?.id === company.id) {
        setModalOpen(false);
      }

      if (typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel("proofylink_company_updates");
          bc.postMessage({ type: "COMPANY_UPDATED", companyId: company.id });
          bc.close();
        } catch {}
      }

      void fetchCompanies(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus perusahaan.";
      toast.error(msg);
    }
  };

  const handleOpenDocument = async (type: "nib" | "npwp") => {
    if (!selectedCompany) return;
    setOpeningDoc(type);
    try {
      const res = await fetch(`/api/admin/companies/${selectedCompany.id}/legal-docs?type=${type}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil URL dokumen.");
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else if (data.isMock) {
        toast.info(data.message || "Dokumen diunggah dalam mode mock development.");
      } else {
        toast.error(data.message || "Dokumen belum diunggah.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuka dokumen.";
      toast.error(msg);
    } finally {
      setOpeningDoc(null);
    }
  };

  // Filtered companies
  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.verificationStatus === statusFilter;
      const s = search.toLowerCase();
      const matchesSearch =
        !s ||
        c.name.toLowerCase().includes(s) ||
        (c.nib && c.nib.toLowerCase().includes(s)) ||
        (c.npwp && c.npwp.toLowerCase().includes(s)) ||
        (c.companyEmail && c.companyEmail.toLowerCase().includes(s)) ||
        (c.companyPhone && c.companyPhone.toLowerCase().includes(s)) ||
        (c.city && c.city.toLowerCase().includes(s)) ||
        (c.province && c.province.toLowerCase().includes(s)) ||
        (c.owner?.name && c.owner.name.toLowerCase().includes(s)) ||
        (c.owner?.email && c.owner.email.toLowerCase().includes(s));
      return matchesStatus && matchesSearch;
    });
  }, [companies, statusFilter, search]);

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
    <AdminShell title="Manajemen & Verifikasi Perusahaan">
      <div className="space-y-6">
        {/* Top Header Card with Quick Summary & Real-time Indicator */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Direktori &amp; Review Rekruter
                </h2>
                {isRealtimeActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Real-time
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-600 border border-slate-200">
                    <Radio className="size-3 text-slate-400" />
                    Auto-sync (12s)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi legalitas NIB/NPWP, informasi profil entitas rekruter, dan sinkronisasi akun secara real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-[#7C3AED] border border-purple-200/80">
                <Building2 className="size-3.5" />
                {companies.length} Terdaftar
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200/80">
                <Clock className="size-3.5" />
                {companies.filter((c) => c.verificationStatus === "pending").length} Menunggu Review
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchCompanies(false)}
                disabled={refreshing}
                className="h-8 rounded-xl border-slate-200 text-xs px-2.5 bg-white hover:bg-slate-50 gap-1 text-slate-600"
                title={`Terakhir diperbarui: ${lastRefreshedAt.toLocaleTimeString("id-ID")}`}
              >
                <RefreshCw className={cn("size-3.5", refreshing ? "animate-spin text-[#7C3AED]" : "")} />
                <span className="hidden sm:inline font-medium">Segarkan</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Top Controls: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari perusahaan, NIB, NPWP, nama PIC, email, atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-xs rounded-xl h-10 shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "Semua Status" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "need_revision", label: "Need Revision" },
              { id: "rejected", label: "Rejected" },
            ].map((st) => (
              <Button
                key={st.id}
                size="sm"
                variant={statusFilter === st.id ? "default" : "outline"}
                onClick={() => setStatusFilter(st.id)}
                className={cn(
                  "text-xs rounded-xl h-8.5 font-bold transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5",
                  statusFilter === st.id
                    ? "bg-purple-50/80 text-[#7C3AED] border border-purple-300 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium"
                )}
              >
                {st.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Master Data Table */}
        <Card className="border border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4">Nama Perusahaan &amp; Sektor</th>
                    <th className="py-3.5 px-4">PIC / Penanggung Jawab</th>
                    <th className="py-3.5 px-4">Legalitas (NIB &amp; NPWP)</th>
                    <th className="py-3.5 px-4">Lokasi &amp; Skala</th>
                    <th className="py-3.5 px-4">Status Verifikasi</th>
                    <th className="py-3.5 px-4">Paket &amp; Token</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-muted-foreground">
                        <Loader2 className="size-7 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        <span className="font-medium text-xs">Memuat data rekruter &amp; perusahaan...</span>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-muted-foreground">
                        <Building2 className="size-9 mx-auto mb-2 text-slate-300" />
                        <span className="font-medium text-xs">Tidak ada data rekruter yang sesuai kriteria pencarian.</span>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const cfg = STATUS_CONFIG[c.verificationStatus] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;

                      return (
                        <tr key={c.id} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {c.logoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={c.logoUrl}
                                  alt={c.name}
                                  className="size-9 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] font-bold text-xs border border-purple-200/80">
                                  {c.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]" title={c.name}>
                                  {c.name}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                                  {c.industry || "Sektor belum dipilih"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            <p className="font-semibold text-slate-800">{c.owner?.name || "Nama PIC Belum Diisi"}</p>
                            {c.owner?.title && (
                              <p className="text-purple-700 font-medium text-[10.5px]">{c.owner.title}</p>
                            )}
                            <p className="text-slate-500 text-[10.5px] truncate max-w-[170px] mt-0.5">
                              {c.owner?.phone || c.owner?.email || "-"}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-600 text-[10.5px]">NIB:</span>
                                <span className="font-mono text-slate-800 text-[11px]">{c.nib || "-"}</span>
                                {c.nibDocumentUrl && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="size-2.5 text-emerald-600" /> PDF
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-600 text-[10.5px]">NPWP:</span>
                                <span className="font-mono text-slate-800 text-[11px]">{c.npwp || "-"}</span>
                                {c.npwpDocumentUrl && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="size-2.5 text-emerald-600" /> PDF
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="font-medium text-slate-800">{c.companyScale || "-"}</div>
                            <div className="text-[11px] text-slate-500">
                              {[c.city, c.province].filter(Boolean).join(", ") || "-"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border",
                                cfg.badgeClass
                              )}
                            >
                              <Icon className="size-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200 capitalize text-[10px] font-bold mb-1">
                              {c.subscriptionTier}
                            </Badge>
                            <p className="font-bold text-slate-900 font-mono text-[11px]">
                              {c.tokenBalance} Token
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(c)}
                                className="border-purple-200 text-[#7C3AED] hover:bg-purple-50 hover:border-purple-300 text-xs font-semibold h-8 px-3 rounded-xl gap-1.5 shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5"
                              >
                                <Eye className="size-3.5" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCompany(c)}
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 text-xs h-8 px-2.5 rounded-xl gap-1 shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5"
                                title={`Hapus perusahaan ${c.name}`}
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

        {/* Modal Detail & Review Data Rekruter */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Review Data Rekruter:</span>
                    <span className="text-[#7C3AED]">{selectedCompany?.name}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    ID Organisasi: <span className="font-mono text-slate-700 font-semibold">{selectedCompany?.id}</span> · Terdaftar sejak{" "}
                    {selectedCompany?.createdAt
                      ? new Date(selectedCompany.createdAt).toLocaleDateString("id-ID")
                      : "-"}
                  </DialogDescription>
                </div>
              </div>

              {/* Tabs */}
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
                  Profil Rekruter &amp; Legalitas
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
                  variant={activeTab === "subscription" ? "default" : "outline"}
                  onClick={() => setActiveTab("subscription")}
                  className={cn(
                    "text-xs h-8 rounded-xl font-bold transition-all cursor-pointer",
                    activeTab === "subscription"
                      ? "bg-purple-50 text-[#7C3AED] border border-purple-300 shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Langganan &amp; Token
                </Button>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {activeTab === "legal" && (
                <div className="space-y-4 text-xs">
                  {/* Bagian 1: Identitas PIC / Penanggung Jawab */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-[#7C3AED]">
                        <User className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Identitas PIC / Penanggung Jawab Rekrutmen</p>
                        <p className="text-[11px] text-muted-foreground">
                          Informasi perwakilan resmi dari tim HR atau Talent Acquisition yang mengelola akun.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap PIC</label>
                        <Input
                          value={formPicName}
                          onChange={(e) => setFormPicName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Jabatan / Role PIC</label>
                        <Input
                          value={formPicTitle}
                          onChange={(e) => setFormPicTitle(e.target.value)}
                          placeholder="Contoh: Talent Acquisition Lead / HR Manager"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Akun PIC</label>
                        <Input
                          value={formPicEmail}
                          disabled
                          className="h-8.5 text-xs bg-slate-50 text-muted-foreground cursor-not-allowed"
                        />
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Email login terikat dengan autentikasi akun dan bersifat read-only.
                        </span>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon / WhatsApp PIC</label>
                        <Input
                          value={formPicPhone}
                          onChange={(e) => setFormPicPhone(e.target.value)}
                          placeholder="Contoh: 0812-3456-7890"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Profil Entitas Perusahaan */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Building2 className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Profil Entitas Perusahaan</p>
                          <p className="text-[11px] text-muted-foreground">
                            Data profil organisasi yang ditampilkan kepada kandidat pada platform Talent Network.
                          </p>
                        </div>
                      </div>
                      {selectedCompany?.logoUrl && (
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedCompany.logoUrl}
                            alt="Logo Perusahaan"
                            className="size-8 rounded-lg object-cover border border-slate-200"
                          />
                          <span className="text-[10px] text-slate-500 font-medium">Logo Aktif</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Nama Resmi Perusahaan (PT/CV) *
                        </label>
                        <Input
                          value={formCompanyName}
                          onChange={(e) => setFormCompanyName(e.target.value)}
                          placeholder="Nama badan hukum perusahaan"
                          className="h-8.5 text-xs bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Sektor Industri *</label>
                        <select
                          value={formIndustry}
                          onChange={(e) => setFormIndustry(e.target.value)}
                          className="w-full h-8.5 text-xs rounded-md border border-slate-300 bg-white px-2.5 font-medium"
                        >
                          {INDUSTRY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Skala / Ukuran Perusahaan *</label>
                        <select
                          value={formScale}
                          onChange={(e) => setFormScale(e.target.value)}
                          className="w-full h-8.5 text-xs rounded-md border border-slate-300 bg-white px-2.5 font-medium"
                        >
                          {SCALE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Resmi Perusahaan</label>
                        <Input
                          value={formCompanyEmail}
                          onChange={(e) => setFormCompanyEmail(e.target.value)}
                          placeholder="Contoh: hr@perusahaan.com"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Telepon Kantor Resmi</label>
                        <Input
                          value={formCompanyPhone}
                          onChange={(e) => setFormCompanyPhone(e.target.value)}
                          placeholder="Contoh: (021) 12345678"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Website Resmi</label>
                        <Input
                          value={formWebsite}
                          onChange={(e) => setFormWebsite(e.target.value)}
                          placeholder="https://perusahaan.com"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Profil LinkedIn Perusahaan</label>
                        <Input
                          value={formLinkedin}
                          onChange={(e) => setFormLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/company/..."
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Provinsi Kantor</label>
                        <Input
                          value={formProvince}
                          onChange={(e) => setFormProvince(e.target.value)}
                          placeholder="Contoh: DKI Jakarta, Jawa Barat"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Kota Kantor</label>
                        <Input
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="Contoh: Jakarta Selatan, Surabaya"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Alamat Kantor Lengkap</label>
                        <Input
                          value={formOfficeAddress}
                          onChange={(e) => setFormOfficeAddress(e.target.value)}
                          placeholder="Gedung, lantai, nomor, dan nama jalan"
                          className="h-8.5 text-xs bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Deskripsi Perusahaan</label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          rows={3}
                          placeholder="Ceritakan tentang model bisnis, produk, atau nilai perusahaan..."
                          className="w-full text-xs rounded-md border border-slate-300 bg-white p-2.5 outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Dokumen Legalitas & Perpajakan Resmi (NIB & NPWP) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <FileCheck className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Dokumen Legalitas &amp; Perpajakan Resmi</p>
                        <p className="text-[11px] text-muted-foreground">
                          Periksa nomor identitas berusaha (NIB) dan NPWP Badan Usaha beserta berkas PDF lampiran.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-stretch">
                      {/* NIB Card */}
                      <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between gap-2 min-h-7">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                            <FileText className="size-4 text-[#7C3AED] shrink-0" />
                            <span className="truncate">Dokumen NIB OSS</span>
                          </span>
                          {selectedCompany?.nibDocumentUrl ? (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0 whitespace-nowrap inline-flex items-center">
                              <CheckCircle2 className="size-3 mr-1 text-emerald-600 shrink-0" /> PDF Terlampir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-100 border-slate-200 shrink-0 whitespace-nowrap">
                              Belum Diunggah
                            </Badge>
                          )}
                        </div>

                        <div className="my-2.5 flex-1 flex flex-col justify-center">
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5 h-4 leading-4 truncate">
                            Nomor Induk Berusaha (NIB 13 Digit)
                          </label>
                          <div className="relative">
                            <Input
                              value={formNib}
                              onChange={(e) => setFormNib(e.target.value)}
                              placeholder="Contoh: 1234567890123"
                              className="h-8.5 text-xs bg-white font-mono pr-8"
                            />
                            {formNib && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(formNib, "Nomor NIB")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Salin NIB"
                              >
                                {copiedField === "Nomor NIB" ? (
                                  <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto pt-1">
                          {selectedCompany?.nibDocumentUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={openingDoc === "nib"}
                              onClick={() => handleOpenDocument("nib")}
                              className="w-full h-8.5 text-xs gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold cursor-pointer shadow-xs rounded-xl flex items-center justify-center"
                            >
                              {openingDoc === "nib" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              Buka &amp; Periksa Berkas NIB (PDF)
                            </Button>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 h-8.5 flex items-center justify-center text-center text-[11px] text-slate-400 italic px-2">
                              Perusahaan belum melampirkan berkas NIB (PDF)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* NPWP Card */}
                      <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between gap-2 min-h-7">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                            <FileText className="size-4 text-[#7C3AED] shrink-0" />
                            <span className="truncate">Dokumen NPWP Badan</span>
                          </span>
                          {selectedCompany?.npwpDocumentUrl ? (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0 whitespace-nowrap inline-flex items-center">
                              <CheckCircle2 className="size-3 mr-1 text-emerald-600 shrink-0" /> PDF Terlampir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-100 border-slate-200 shrink-0 whitespace-nowrap">
                              Belum Diunggah
                            </Badge>
                          )}
                        </div>

                        <div className="my-2.5 flex-1 flex flex-col justify-center">
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5 h-4 leading-4 truncate">
                            Nomor NPWP Badan Usaha (15-16 Digit)
                          </label>
                          <div className="relative">
                            <Input
                              value={formNpwp}
                              onChange={(e) => setFormNpwp(e.target.value)}
                              placeholder="Contoh: 01.234.567.8-901.000"
                              className="h-8.5 text-xs bg-white font-mono pr-8"
                            />
                            {formNpwp && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(formNpwp, "Nomor NPWP")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Salin NPWP"
                              >
                                {copiedField === "Nomor NPWP" ? (
                                  <Check className="size-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto pt-1">
                          {selectedCompany?.npwpDocumentUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={openingDoc === "npwp"}
                              onClick={() => handleOpenDocument("npwp")}
                              className="w-full h-8.5 text-xs gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold cursor-pointer shadow-xs rounded-xl flex items-center justify-center"
                            >
                              {openingDoc === "npwp" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              Buka &amp; Periksa Berkas NPWP (PDF)
                            </Button>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 h-8.5 flex items-center justify-center text-center text-[11px] text-slate-400 italic px-2">
                              Perusahaan belum melampirkan berkas NPWP (PDF)
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
                        Keputusan Verifikasi Akun Rekruter
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Persetujuan verifikasi akan secara otomatis mengaktifkan hak akses rekruter untuk mengunggah lowongan kerja dan membuka profil kandidat.
                      </p>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Ubah Status Verifikasi:
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as CompanyItem["verificationStatus"])}
                        className="w-full h-9 text-xs rounded-md border border-slate-300 bg-white px-2.5 font-bold text-slate-900 shadow-2xs"
                      >
                        <option value="pending">Pending Verification (Menunggu Peninjauan)</option>
                        <option value="approved">Approved (Setujui Perusahaan &amp; Aktifkan Rekruter)</option>
                        <option value="need_revision">Need Revision (Minta Perbaikan Dokumen)</option>
                        <option value="rejected">Rejected (Tolak Pendaftaran)</option>
                        <option value="suspended">Suspended (Bekukan Akun Sementara)</option>
                      </select>
                    </div>

                    {/* Quick Notes Template Chips */}
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-[#7C3AED]" />
                        Template Catatan Cepat (Quick Notes):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_NOTES_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.label}
                            type="button"
                            onClick={() => handleApplyQuickNote(tmpl.text)}
                            className="rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 px-2.5 py-1 text-[11px] font-medium text-[#7C3AED] transition-colors cursor-pointer text-left shadow-2xs"
                          >
                            + {tmpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Catatan Hasil Verifikasi &amp; Alasan:
                      </label>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Tuliskan catatan hasil pemeriksaan berkas atau detail yang perlu direvisi oleh rekruter..."
                        className="w-full h-28 p-2.5 text-xs rounded-md border border-slate-300 bg-white resize-none outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    {selectedCompany?.reviewedAt && (
                      <div className="pt-2 text-[11px] text-muted-foreground border-t border-slate-200">
                        Terakhir ditinjau pada:{" "}
                        <span className="font-semibold text-slate-700">
                          {new Date(selectedCompany.reviewedAt).toLocaleString("id-ID")}
                        </span>
                        {selectedCompany.reviewerEmail && (
                          <span> oleh {selectedCompany.reviewerEmail}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "subscription" && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Paket &amp; Langganan
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Tipe Paket</label>
                        <select
                          value={formTier}
                          onChange={(e) => setFormTier(e.target.value as CompanyItem["subscriptionTier"])}
                          className="w-full h-8.5 text-xs rounded-md border border-slate-300 bg-white px-2 capitalize font-medium"
                        >
                          {TIER_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Status Langganan</label>
                        <select
                          value={formSubStatus}
                          onChange={(e) => setFormSubStatus(e.target.value as CompanyItem["subscriptionStatus"])}
                          className="w-full h-8.5 text-xs rounded-md border border-slate-300 bg-white px-2 capitalize font-medium"
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Data Penggunaan (Hanya Baca / Ringkasan Otomatis)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Sisa Saldo Token
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-base font-extrabold text-[#7C3AED] tabular-nums">
                            {selectedCompany?.usage.tokenBalance ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Talent Unlock
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-base font-extrabold text-slate-900 tabular-nums">
                            {selectedCompany?.usage.talentUnlockCount ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Screening Finansial
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-base font-extrabold text-slate-900 tabular-nums">
                            {selectedCompany?.usage.financialScreeningCount ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center flex flex-col justify-between shadow-2xs">
                        <div className="h-9 flex items-center justify-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-3.5">
                            Aktivitas Terakhir
                          </p>
                        </div>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className="text-xs sm:text-[13px] font-bold text-slate-800 tabular-nums truncate">
                            {selectedCompany?.usage.lastActivity
                              ? new Date(selectedCompany.usage.lastActivity).toLocaleDateString("id-ID")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-3 flex flex-row items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedCompany && handleDeleteCompany(selectedCompany)}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs rounded-xl gap-1.5 font-medium"
              >
                <Trash2 className="size-3.5" />
                Hapus Perusahaan
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCompany}
                  disabled={updating}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs rounded-xl font-semibold px-4 cursor-pointer shadow-xs"
                >
                  {updating ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Simpan Perubahan &amp; Sinkronisasi
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}

export default function AdminCompaniesPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Manajemen & Verifikasi Perusahaan">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#7C3AED]" />
          </div>
        </AdminShell>
      }
    >
      <AdminCompaniesContent />
    </Suspense>
  );
}

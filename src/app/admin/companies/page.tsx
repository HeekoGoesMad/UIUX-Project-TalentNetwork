"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
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
import { cn } from "@/lib/utils";

export interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  nib: string | null;
  npwp: string | null;
  industry: string | null;
  companyScale: string | null;
  province: string | null;
  city: string | null;
  officeAddress: string | null;
  companyEmail: string | null;
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
  "Technology",
  "Financial Services",
  "Hospitality",
  "Retail",
  "Manufacturing",
  "Education",
  "Healthcare",
  "Logistics",
  "Professional Services",
  "Other",
];

const SCALE_OPTIONS = [
  "1-10 Karyawan",
  "11-50 Karyawan",
  "51-200 Karyawan",
  "201-500 Karyawan",
  "500+ Karyawan",
];

const TIER_OPTIONS = ["trial", "starter", "professional", "enterprise"];

import { Suspense } from "react";

function AdminCompaniesContent() {
  const searchParams = useSearchParams();
  const initialReviewId = searchParams.get("reviewId");
  const initialStatus = searchParams.get("status") || "all";

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Review Modal State
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"legal" | "verification" | "subscription">("legal");
  const [updating, setUpdating] = useState(false);

  // Edit form state in modal
  const [formStatus, setFormStatus] = useState<CompanyItem["verificationStatus"]>("pending");
  const [formNotes, setFormNotes] = useState("");
  const [formNib, setFormNib] = useState("");
  const [formNpwp, setFormNpwp] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formScale, setFormScale] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formLinkedin, setFormLinkedin] = useState("");
  const [formTier, setFormTier] = useState<CompanyItem["subscriptionTier"]>("trial");
  const [formSubStatus, setFormSubStatus] = useState<CompanyItem["subscriptionStatus"]>("active");

  const openReviewModal = useCallback((c: CompanyItem) => {
    setSelectedCompany(c);
    setFormStatus(c.verificationStatus);
    setFormNotes(c.verificationNotes || "");
    setFormNib(c.nib || "");
    setFormNpwp(c.npwp || "");
    setFormIndustry(c.industry || "Technology");
    setFormScale(c.companyScale || "1-10 Karyawan");
    setFormProvince(c.province || "");
    setFormCity(c.city || "");
    setFormEmail(c.companyEmail || c.owner.email || "");
    setFormWebsite(c.website || "");
    setFormLinkedin(c.linkedinUrl || "");
    setFormTier(c.subscriptionTier || "trial");
    setFormSubStatus(c.subscriptionStatus || "active");
    setActiveTab("legal");
    setModalOpen(true);
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/companies", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);

        if (initialReviewId && data.companies) {
          const target = data.companies.find((c: CompanyItem) => c.id === initialReviewId);
          if (target) {
            openReviewModal(target);
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Companies API error:", res.status, errData);
        toast.error(`Gagal memuat data perusahaan (${res.status}): ${errData.error ?? "Unknown error"}`);
      }
    } catch (err) {
      console.error("fetchCompanies exception:", err);
      toast.error("Gagal memuat daftar perusahaan.");
    } finally {
      setLoading(false);
    }
  }, [initialReviewId, openReviewModal]);


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCompanies();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCompanies]);

  const handleSaveCompany = async () => {
    if (!selectedCompany) return;

    // Validasi NIB (13 digit jika diisi)
    if (formNib && formNib.replace(/\D/g, "").length !== 13) {
      toast.warning("Nomor Induk Berusaha (NIB) harus 13 digit.");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/companies/${selectedCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: formStatus,
          verificationNotes: formNotes,
          nib: formNib || null,
          npwp: formNpwp || null,
          industry: formIndustry || null,
          companyScale: formScale || null,
          province: formProvince || null,
          city: formCity || null,
          companyEmail: formEmail || null,
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

      toast.success("Data dan status verifikasi perusahaan berhasil diperbarui!");
      setModalOpen(false);
      fetchCompanies();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      toast.error(msg);
    } finally {
      setUpdating(false);
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
        (c.city && c.city.toLowerCase().includes(s));
      return matchesStatus && matchesSearch;
    });
  }, [companies, statusFilter, search]);

  return (
    <AdminShell title="Manajemen & Verifikasi Perusahaan">
      <div className="space-y-6">
        {/* Top Controls: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama perusahaan, NIB, NPWP, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-xs rounded-xl h-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Semua Status" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "need_revision", label: "Need Revision" },
              { id: "rejected", label: "Rejected" },
              { id: "suspended", label: "Suspended" },
            ].map((st) => (
              <Button
                key={st.id}
                variant={statusFilter === st.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st.id)}
                className={cn(
                  "text-xs rounded-xl h-8 font-semibold",
                  statusFilter === st.id
                    ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {st.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCompanies}
              className="h-8 rounded-xl border-slate-200 px-2.5"
            >
              <RefreshCw className={cn("size-3.5", loading ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>

        {/* Master Data Table */}
        <Card className="border border-slate-200/90 bg-white shadow-2xs overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4">Nama Perusahaan &amp; Sektor</th>
                    <th className="py-3.5 px-4">Legalitas (NIB / NPWP)</th>
                    <th className="py-3.5 px-4">Skala &amp; Lokasi</th>
                    <th className="py-3.5 px-4">Status Verifikasi</th>
                    <th className="py-3.5 px-4">Paket Langganan</th>
                    <th className="py-3.5 px-4">Saldo Token</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        Memuat data master perusahaan...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Building2 className="size-8 mx-auto mb-2 text-slate-300" />
                        Tidak ada data perusahaan yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const cfg = STATUS_CONFIG[c.verificationStatus] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {c.industry || "Sektor belum dipilih"}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            <div>NIB: {c.nib || "-"}</div>
                            <div>NPWP: {c.npwp || "-"}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{c.companyScale || "-"}</div>
                            <div className="text-[11px] text-slate-500">{c.city || c.province || "-"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                                cfg.badgeClass
                              )}
                            >
                              <Icon className="size-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200 capitalize text-[10px] font-semibold">
                              {c.subscriptionTier}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {c.tokenBalance} Token
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => openReviewModal(c)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 rounded-xl gap-1.5 shadow-xs"
                            >
                              <Eye className="size-3.5" />
                              Review
                            </Button>
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

        {/* Modal Detail & Review Perusahaan */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
            <DialogHeader className="border-b pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Review Perusahaan: {selectedCompany?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    ID: <span className="font-mono">{selectedCompany?.id}</span> · Terdaftar sejak{" "}
                    {selectedCompany?.createdAt
                      ? new Date(selectedCompany.createdAt).toLocaleDateString("id-ID")
                      : "-"}
                  </DialogDescription>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant={activeTab === "legal" ? "default" : "outline"}
                  onClick={() => setActiveTab("legal")}
                  className={cn("text-xs h-7 rounded-lg", activeTab === "legal" ? "bg-[#7C3AED] text-white" : "")}
                >
                  Legalitas &amp; Bisnis
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "verification" ? "default" : "outline"}
                  onClick={() => setActiveTab("verification")}
                  className={cn("text-xs h-7 rounded-lg", activeTab === "verification" ? "bg-[#7C3AED] text-white" : "")}
                >
                  Status Verifikasi Admin
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "subscription" ? "default" : "outline"}
                  onClick={() => setActiveTab("subscription")}
                  className={cn("text-xs h-7 rounded-lg", activeTab === "subscription" ? "bg-[#7C3AED] text-white" : "")}
                >
                  Langganan &amp; Penggunaan
                </Button>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {activeTab === "legal" && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Informasi Legalitas
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Nomor Induk Berusaha (NIB) <span className="text-red-500">* (13 digit)</span>
                        </label>
                        <Input
                          value={formNib}
                          onChange={(e) => setFormNib(e.target.value)}
                          placeholder="13 digit angka NIB..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          NPWP Perusahaan <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={formNpwp}
                          onChange={(e) => setFormNpwp(e.target.value)}
                          placeholder="Format NPWP perusahaan..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Informasi Bisnis &amp; Profil
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Sektor Industri *</label>
                        <select
                          value={formIndustry}
                          onChange={(e) => setFormIndustry(e.target.value)}
                          className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2"
                        >
                          {INDUSTRY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Skala Perusahaan *</label>
                        <select
                          value={formScale}
                          onChange={(e) => setFormScale(e.target.value)}
                          className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2"
                        >
                          {SCALE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Provinsi *</label>
                        <Input
                          value={formProvince}
                          onChange={(e) => setFormProvince(e.target.value)}
                          placeholder="Contoh: DKI Jakarta"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Kota / Kabupaten *</label>
                        <Input
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="Contoh: Jakarta Selatan"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Resmi Perusahaan *</label>
                        <Input
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="official@company.com"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Website Resmi (Opsional)</label>
                        <Input
                          value={formWebsite}
                          onChange={(e) => setFormWebsite(e.target.value)}
                          placeholder="https://company.com"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">LinkedIn Perusahaan (Opsional)</label>
                        <Input
                          value={formLinkedin}
                          onChange={(e) => setFormLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/company/..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "verification" && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Keputusan Verifikasi Compliance
                    </p>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Ubah Status Verifikasi:
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as CompanyItem["verificationStatus"])}
                        className="w-full h-9 text-xs rounded-md border border-slate-300 bg-white px-2 font-bold text-slate-900"
                      >
                        <option value="pending">Pending Verification (Menunggu Peninjauan)</option>
                        <option value="approved">Approved (Setujui Perusahaan &amp; Aktifkan Rekruter)</option>
                        <option value="need_revision">Need Revision (Minta Perbaikan Dokumen)</option>
                        <option value="rejected">Rejected (Tolak Pendaftaran)</option>
                        <option value="suspended">Suspended (Bekukan Akun Sementara)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Catatan Verifikasi Admin (Alasan persetujuan / instruksi revisi / penolakan):
                      </label>
                      <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Tuliskan catatan hasil verifikasi atau detail berkas yang perlu diperbaiki oleh perusahaan..."
                        className="w-full h-24 p-2 text-xs rounded-md border border-slate-300 bg-white resize-none"
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
                          className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 capitalize"
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
                          className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2 capitalize"
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
                      <div className="rounded-lg bg-white border p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Sisa Saldo Token</p>
                        <p className="text-base font-extrabold text-[#7C3AED] mt-0.5">
                          {selectedCompany?.usage.tokenBalance ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Talent Unlock</p>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {selectedCompany?.usage.talentUnlockCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Screening Finansial</p>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {selectedCompany?.usage.financialScreeningCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Aktivitas Terakhir</p>
                        <p className="text-[11px] font-semibold text-slate-700 mt-1 truncate">
                          {selectedCompany?.usage.lastActivity
                            ? new Date(selectedCompany.usage.lastActivity).toLocaleDateString("id-ID")
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-3 flex flex-row items-center justify-end gap-2">
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
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs rounded-xl font-semibold px-4"
              >
                {updating ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Simpan Perubahan &amp; Sinkronisasi
              </Button>
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

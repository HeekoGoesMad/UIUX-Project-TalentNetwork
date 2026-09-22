"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
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

import { Suspense } from "react";

function AdminCompaniesContent() {
  const searchParams = useSearchParams();
  const initialReviewId = searchParams.get("reviewId");
  const initialStatus = searchParams.get("status") || "all";

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Review Modal State
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"legal" | "verification" | "subscription">("legal");
  const [updating, setUpdating] = useState(false);
  const [openingDoc, setOpeningDoc] = useState<"nib" | "npwp" | null>(null);

  // Edit form state in modal - matches recruiter profile form 1:1
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
    setFormPicTitle("");
    setFormPicEmail(c.owner?.email || c.companyEmail || "");
    setFormPicPhone(c.owner?.phone || "");
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
    setFormEmail(c.companyEmail || c.owner?.email || "");
    setFormWebsite(c.website || "");
    setFormLinkedin(c.linkedinUrl || "");
    setFormTier(c.subscriptionTier || "trial");
    setFormSubStatus(c.subscriptionStatus || "active");
  }, []);

  const openReviewModal = useCallback((c: CompanyItem) => {
    populateForm(c);
    setActiveTab("legal");
    setModalOpen(true);

    // Live sync: fetch fresh copy from server to ensure 100% latest live data
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
  }, [populateForm]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(new URL(`/api/admin/companies?t=${Date.now()}`, window.location.origin), {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);

        if (initialReviewId && data.companies) {
          const target = data.companies.find((c: CompanyItem) => c.id === initialReviewId);
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
        console.error("Companies API error:", res.status, errData);
        toast.error(`Gagal memuat data perusahaan (${res.status}): ${errData.error ?? "Unknown error"}`);
      }
    } catch (err) {
      console.error("fetchCompanies exception:", err);
      toast.error("Gagal memuat daftar perusahaan.");
    } finally {
      setLoading(false);
    }
  }, [initialReviewId, openReviewModal, failGate]);


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCompanies();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCompanies]);

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

      const resData = await res.json();
      const updated = resData.company;

      toast.success(`Data perusahaan ${formCompanyName || selectedCompany.name} berhasil diperbarui & disinkronkan!`);
      setModalOpen(false);

      if (updated) {
        setCompanies((prev) =>
          prev.map((item) => (item.id === selectedCompany.id ? { ...item, ...updated } : item))
        );
      }
      void fetchCompanies();
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
      fetchCompanies();
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
        (c.city && c.city.toLowerCase().includes(s));
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
        {/* Top Header Card with Quick Summary */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Direktori Perusahaan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi legalitas, izin berusaha, dan status akun rekruter terdaftar.
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
            </div>
          </div>
        </div>

        {/* Top Controls: Search & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama perusahaan, NIB, NPWP, atau email..."
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
              { id: "suspended", label: "Suspended" },
            ].map((st) => (
              <Button
                key={st.id}
                variant={statusFilter === st.id ? "default" : "outline"}
                size="sm"
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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCompanies}
              className="h-8.5 rounded-xl border-slate-200 px-2.5 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all hover:-translate-y-0.5"
              title="Segarkan data"
            >
              <RefreshCw className={cn("size-3.5", loading ? "animate-spin" : "")} />
            </Button>
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
                      <td colSpan={7} className="py-14 text-center text-muted-foreground">
                        <Loader2 className="size-7 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        <span className="font-medium text-xs">Memuat data master perusahaan...</span>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-muted-foreground">
                        <Building2 className="size-9 mx-auto mb-2 text-slate-300" />
                        <span className="font-medium text-xs">Tidak ada data perusahaan yang sesuai kriteria pencarian.</span>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const cfg = STATUS_CONFIG[c.verificationStatus] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;

                      return (
                        <tr key={c.id} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {c.industry || "Sektor belum dipilih"}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-600">NIB:</span>
                                {c.nibDocumentUrl ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="size-2.5 text-emerald-600" /> PDF Ada
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">-</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-600">NPWP:</span>
                                {c.npwpDocumentUrl ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="size-2.5 text-emerald-600" /> PDF Ada
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">-</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="font-medium text-slate-800">{c.companyScale || "-"}</div>
                            <div className="text-[11px] text-slate-500">{c.city || c.province || "-"}</div>
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
                            <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200 capitalize text-[10px] font-bold">
                              {c.subscriptionTier}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                            {c.tokenBalance} Token
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

        {/* Modal Detail & Review Perusahaan */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Review Perusahaan: {selectedCompany?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    ID: <span className="font-mono text-slate-700 font-semibold">{selectedCompany?.id}</span> · Terdaftar sejak{" "}
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
                  Informasi &amp; Legalitas
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
                  Status Verifikasi
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
                        <p className="font-bold text-slate-900 text-xs">Identitas PIC / Penanggung Jawab</p>
                        <p className="text-[11px] text-muted-foreground">
                          Informasi perwakilan resmi dari tim Talent Acquisition atau HR.
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
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Jabatan / Role PIC</label>
                        <Input
                          value={formPicTitle}
                          onChange={(e) => setFormPicTitle(e.target.value)}
                          placeholder="Contoh: Talent Acquisition Lead"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Email Akun PIC</label>
                        <Input
                          value={formPicEmail}
                          disabled
                          className="h-8 text-xs bg-slate-50 text-muted-foreground cursor-not-allowed"
                        />
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Email login terikat dengan akun dan tidak dapat diubah langsung.
                        </span>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                        <Input
                          value={formPicPhone}
                          onChange={(e) => setFormPicPhone(e.target.value)}
                          placeholder="0812-xxxx-xxxx"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Profil Entitas Bisnis & Operasional */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Profil Perusahaan</p>
                        <p className="text-[11px] text-muted-foreground">
                          Informasi perusahaan yang ditampilkan kepada kandidat saat permintaan kontak.
                        </p>
                      </div>
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
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Sektor Industri *</label>
                        <select
                          value={formIndustry}
                          onChange={(e) => setFormIndustry(e.target.value)}
                          className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2"
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
                          className="w-full h-8 text-xs rounded-md border border-slate-300 bg-white px-2"
                        >
                          {SCALE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Kota Kantor</label>
                        <Input
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="Contoh: Surabaya, Jawa Timur"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Deskripsi Perusahaan</label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          rows={3}
                          placeholder="Ceritakan tentang model bisnis, produk, atau nilai perusahaan..."
                          className="w-full text-xs rounded-md border border-slate-300 bg-white p-2.5 outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Website Resmi</label>
                        <Input
                          value={formWebsite}
                          onChange={(e) => setFormWebsite(e.target.value)}
                          placeholder="https://perusahaan.com"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Profil LinkedIn Perusahaan</label>
                        <Input
                          value={formLinkedin}
                          onChange={(e) => setFormLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/company/..."
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1">Alamat Kantor Lengkap</label>
                        <Input
                          value={formOfficeAddress}
                          onChange={(e) => setFormOfficeAddress(e.target.value)}
                          placeholder="Gedung, lantai, nomor, dan nama jalan"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Dokumen Legalitas & Perpajakan (PDF) */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <FileCheck className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">Dokumen Legalitas &amp; Perpajakan Resmi (PDF)</p>
                        <p className="text-[11px] text-muted-foreground">
                          Verifikasi keabsahan berkas resmi NIB dan NPWP yang diunggah oleh perusahaan.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* NIB Card */}
                      <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                            <FileText className="size-3.5 text-primary" />
                            Dokumen NIB OSS (PDF)
                          </span>
                          {selectedCompany?.nibDocumentUrl ? (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                              <CheckCircle2 className="size-3 mr-1 text-emerald-600" /> PDF Terlampir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-100 border-slate-200">
                              Belum Diunggah
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Nomor Induk Berusaha resmi yang diterbitkan OSS untuk legalitas operasional bisnis.
                        </p>
                        <div className="pt-1">
                          {selectedCompany?.nibDocumentUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={openingDoc === "nib"}
                              onClick={() => handleOpenDocument("nib")}
                              className="w-full h-8 text-xs gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium cursor-pointer shadow-xs"
                            >
                              {openingDoc === "nib" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              Buka &amp; Periksa Berkas NIB (PDF)
                            </Button>
                          ) : (
                            <div className="rounded-md border border-dashed border-slate-300 bg-white/60 p-2 text-center text-[11px] text-slate-400 italic">
                              Perusahaan belum melampirkan berkas NIB
                            </div>
                          )}
                        </div>
                      </div>

                      {/* NPWP Card */}
                      <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                            <FileText className="size-3.5 text-primary" />
                            Dokumen NPWP Badan (PDF)
                          </span>
                          {selectedCompany?.npwpDocumentUrl ? (
                            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                              <CheckCircle2 className="size-3 mr-1 text-emerald-600" /> PDF Terlampir
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-100 border-slate-200">
                              Belum Diunggah
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Salinan dokumen NPWP Badan Usaha atau SKT resmi Ditjen Pajak untuk kepatuhan fiskal.
                        </p>
                        <div className="pt-1">
                          {selectedCompany?.npwpDocumentUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={openingDoc === "npwp"}
                              onClick={() => handleOpenDocument("npwp")}
                              className="w-full h-8 text-xs gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium cursor-pointer shadow-xs"
                            >
                              {openingDoc === "npwp" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              Buka &amp; Periksa Berkas NPWP (PDF)
                            </Button>
                          ) : (
                            <div className="rounded-md border border-dashed border-slate-300 bg-white/60 p-2 text-center text-[11px] text-slate-400 italic">
                              Perusahaan belum melampirkan berkas NPWP
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Keputusan Verifikasi
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
                        Catatan Verifikasi:
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
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs rounded-xl font-semibold px-4"
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

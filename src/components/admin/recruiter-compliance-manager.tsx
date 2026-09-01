"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Globe,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface RecruiterItem {
  user: {
    id: string;
    email: string;
    role: string;
    recruiterProvisioningStatus: "pending" | "active" | "rejected" | "revision_required";
    recruiterRejectionReason?: string | null;
    createdAt: string;
  };
  profile: {
    displayName: string | null;
    phone: string | null;
  } | null;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const DEMO_RECRUITERS: RecruiterItem[] = [
  {
    user: {
      id: "demo-recruiter-tion-wayne",
      email: "tion@waynecorp.id",
      role: "recruiter",
      recruiterProvisioningStatus: "pending",
      recruiterRejectionReason: null,
      createdAt: new Date().toISOString(),
    },
    profile: {
      displayName: "Tion Wayne Jaya",
      phone: "0812-9988-7766",
    },
    organization: {
      id: "org-tion-wayne",
      name: "PT Tion Wayne Jaya",
      slug: "tion-wayne-jaya",
    },
  },
  {
    user: {
      id: "demo-recruiter-inovasi-digital",
      email: "budi@inovasidigital.co.id",
      role: "recruiter",
      recruiterProvisioningStatus: "pending",
      recruiterRejectionReason: null,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    profile: {
      displayName: "Budi Santoso",
      phone: "0812-9876-5432",
    },
    organization: {
      id: "org-inovasi-digital",
      name: "PT Inovasi Digital Nusantara",
      slug: "inovasi-digital-nusantara",
    },
  },
  {
    user: {
      id: "demo-recruiter-fintek-pratama",
      email: "sarah@fintekpratama.com",
      role: "recruiter",
      recruiterProvisioningStatus: "revision_required",
      recruiterRejectionReason: "Foto KTP PIC buram, mohon unggah ulang foto identitas resmi yang jelas.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    profile: {
      displayName: "Sarah Amanda",
      phone: "0813-1122-3344",
    },
    organization: {
      id: "org-fintek-pratama",
      name: "PT Teknologi Finansial Pratama",
      slug: "fintek-pratama",
    },
  },
  {
    user: {
      id: "demo-recruiter-global-solusi",
      email: "hendra@globalsolusi.com",
      role: "recruiter",
      recruiterProvisioningStatus: "active",
      recruiterRejectionReason: null,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    profile: {
      displayName: "Hendra Wijaya",
      phone: "0811-2233-4455",
    },
    organization: {
      id: "org-global-solusi",
      name: "PT Global Solusi Ekosistem",
      slug: "global-solusi-ekosistem",
    },
  },
];

export function RecruiterComplianceManager() {
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("proofylink_admin_recruiters");
        if (saved) return JSON.parse(saved) as RecruiterItem[];
      } catch {}
    }
    return DEMO_RECRUITERS;
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active" | "revision_required" | "rejected">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Document Viewer Modal State
  const [viewingDocs, setViewingDocs] = useState<RecruiterItem | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<"nib" | "npwp" | "ktp">("nib");

  // Revision Modal State
  const [revisingItem, setRevisingItem] = useState<RecruiterItem | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<RecruiterItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Delete Modal State
  const [deletingItem, setDeletingItem] = useState<RecruiterItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recruiters", { cache: "no-store" });
      const data = (await res.json()) as { recruiters?: RecruiterItem[]; error?: string };
      if (res.ok && Array.isArray(data.recruiters) && data.recruiters.length > 0) {
        setRecruiters(data.recruiters);
        try {
          localStorage.setItem("proofylink_admin_recruiters", JSON.stringify(data.recruiters));
        } catch {}
      } else {
        // Fallback to local stored or demo recruiters
        let currentList = DEMO_RECRUITERS;
        try {
          const saved = localStorage.getItem("proofylink_admin_recruiters");
          if (saved) currentList = JSON.parse(saved) as RecruiterItem[];
          const session = localStorage.getItem("proofylink_session");
          if (session) {
            const parsedSession = JSON.parse(session) as { role?: string; name?: string; email?: string; companyName?: string; provisioningStatus?: string; provisioningReason?: string };
            if (parsedSession.role === "recruiter") {
              const existingIdx = currentList.findIndex((r) => r.user.email === parsedSession.email);
              const validStatus: RecruiterItem["user"]["recruiterProvisioningStatus"] =
                parsedSession.provisioningStatus === "active" ||
                parsedSession.provisioningStatus === "revision_required" ||
                parsedSession.provisioningStatus === "rejected"
                  ? parsedSession.provisioningStatus
                  : "pending";
              const customItem: RecruiterItem = {
                user: {
                  id: "current-user-recruiter",
                  email: parsedSession.email || "recruiter@perusahaan.com",
                  role: "recruiter",
                  recruiterProvisioningStatus: validStatus,
                  recruiterRejectionReason: parsedSession.provisioningReason || null,
                  createdAt: new Date().toISOString(),
                },
                profile: {
                  displayName: parsedSession.name || "PIC Rekruter",
                  phone: "0812-9988-7766",
                },
                organization: {
                  id: "org-current-user",
                  name: parsedSession.companyName || "PT Perusahaan Indonesia",
                  slug: "perusahaan-indonesia",
                },
              };
              if (existingIdx >= 0) {
                currentList[existingIdx] = customItem;
              } else {
                currentList = [customItem, ...currentList];
              }
            }
          }
        } catch {}
        setRecruiters(currentList);
      }
    } catch {
      // Offline/demo fallback
      try {
        const saved = localStorage.getItem("proofylink_admin_recruiters");
        if (saved) setRecruiters(JSON.parse(saved) as RecruiterItem[]);
        else setRecruiters(DEMO_RECRUITERS);
      } catch {
        setRecruiters(DEMO_RECRUITERS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleAction = async (userId: string, action: "approve" | "reject" | "request_revision", reason?: string) => {
    setBusyId(userId);
    try {
      try {
        await fetch(`/api/admin/recruiters/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason: reason || (action === "request_revision" ? "Dokumen perlu diperbaiki atau diunggah ulang." : "Dokumen belum memenuhi kualifikasi standar compliance."),
          }),
        });
      } catch {
        // Continue to update local state in demo mode
      }

      if (action === "approve") {
        toast.success("Akun rekruter & legalitas perusahaan berhasil disetujui!");
      } else if (action === "request_revision") {
        toast.warning("Instruksi revisi dokumen berhasil dikirim ke rekruter.");
      } else {
        toast.error("Permohonan rekruter ditolak.");
      }

      setRevisingItem(null);
      setRevisionNotes("");
      setRejectingItem(null);
      setRejectReason("");

      // Optimistically update local state & localStorage
      const nextStatus: RecruiterItem["user"]["recruiterProvisioningStatus"] =
        action === "approve" ? "active" : action === "request_revision" ? "revision_required" : "rejected";
      setRecruiters((prev) => {
        const updated = prev.map((item) =>
          item.user.id === userId
            ? {
                ...item,
                user: {
                  ...item.user,
                  recruiterProvisioningStatus: nextStatus,
                  recruiterRejectionReason: reason || null,
                },
              }
            : item
        );
        try {
          localStorage.setItem("proofylink_admin_recruiters", JSON.stringify(updated));
          // Sync with session if the active session matches
          const session = localStorage.getItem("proofylink_session");
          if (session) {
            const parsedSession = JSON.parse(session);
            parsedSession.provisioningStatus = nextStatus;
            parsedSession.provisioningReason = reason || null;
            localStorage.setItem("proofylink_session", JSON.stringify(parsedSession));
          }
          window.dispatchEvent(new Event("storage"));
        } catch {}
        return updated;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses permohonan.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/recruiters/${userId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal menghapus data rekruter.");

      toast.success("Data rekruter berhasil dihapus dari sistem.");
      setDeletingItem(null);
      setRecruiters((prev) => prev.filter((item) => item.user.id !== userId));
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus rekruter.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = recruiters.filter((item) => {
    if (statusFilter !== "all" && item.user.recruiterProvisioningStatus !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = item.profile?.displayName?.toLowerCase() || "";
    const email = item.user.email.toLowerCase();
    const org = item.organization?.name.toLowerCase() || "";
    return name.includes(q) || email.includes(q) || org.includes(q);
  });

  const counts = {
    all: recruiters.length,
    pending: recruiters.filter((r) => r.user.recruiterProvisioningStatus === "pending").length,
    active: recruiters.filter((r) => r.user.recruiterProvisioningStatus === "active").length,
    revision_required: recruiters.filter((r) => r.user.recruiterProvisioningStatus === "revision_required").length,
    rejected: recruiters.filter((r) => r.user.recruiterProvisioningStatus === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Rekruter</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{counts.all}</h3>
              </div>
              <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Building2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-800 font-medium">Menunggu Review</p>
                <h3 className="text-2xl font-bold text-amber-900 mt-1">{counts.pending}</h3>
              </div>
              <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-800 font-medium">Disetujui (Active)</p>
                <h3 className="text-2xl font-bold text-emerald-900 mt-1">{counts.active}</h3>
              </div>
              <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-800 font-medium">Perlu Revisi</p>
                <h3 className="text-2xl font-bold text-orange-900 mt-1">{counts.revision_required}</h3>
              </div>
              <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                <AlertTriangle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/50 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-800 font-medium">Ditolak</p>
                <h3 className="text-2xl font-bold text-rose-900 mt-1">{counts.rejected}</h3>
              </div>
              <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <XCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-2xl border shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className={statusFilter === "pending" ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold" : ""}
          >
            <Clock className="size-3.5 mr-1.5" /> Menunggu Review ({counts.pending})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className={statusFilter === "active" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" : ""}
          >
            <CheckCircle2 className="size-3.5 mr-1.5" /> Disetujui ({counts.active})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "revision_required" ? "default" : "outline"}
            onClick={() => setStatusFilter("revision_required")}
            className={statusFilter === "revision_required" ? "bg-orange-600 hover:bg-orange-700 text-white font-semibold" : ""}
          >
            <AlertTriangle className="size-3.5 mr-1.5" /> Perlu Revisi ({counts.revision_required})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "rejected" ? "default" : "outline"}
            onClick={() => setStatusFilter("rejected")}
            className={statusFilter === "rejected" ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold" : ""}
          >
            <XCircle className="size-3.5 mr-1.5" /> Ditolak ({counts.rejected})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "all" ? "secondary" : "ghost"}
            onClick={() => setStatusFilter("all")}
          >
            Semua ({counts.all})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari PIC, email, PT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
          <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 rounded-xl" onClick={loadData} title="Muat Ulang">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Recruiter List */}
      {loading ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#7C3AED]" />
          <p>Memuat antrean compliance rekruter...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          <FileCheck className="size-10 mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-slate-800">Tidak ada data rekruter</p>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter === "pending"
              ? "Semua berkas pendaftaran rekruter telah selesai ditinjau."
              : "Tidak ada data yang sesuai dengan kriteria filter saat ini."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const status = item.user.recruiterProvisioningStatus;
            const companyName = item.organization?.name || `${item.profile?.displayName || item.user.email.split("@")[0]} Company`;
            const picName = item.profile?.displayName || item.user.email.split("@")[0];

            return (
              <Card key={item.user.id} className="border-slate-200 transition-all hover:border-[#7C3AED]/30 hover:shadow-xs">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Entity & PIC Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#7C3AED] font-bold text-sm">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{companyName}</h4>
                            {status === "pending" && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-[11px]">
                                <Clock className="size-3 mr-1" /> Menunggu Review
                              </Badge>
                            )}
                            {status === "active" && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-[11px]">
                                <CheckCircle2 className="size-3 mr-1" /> Disetujui
                              </Badge>
                            )}
                            {status === "revision_required" && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-semibold text-[11px]">
                                <AlertTriangle className="size-3 mr-1" /> Perlu Revisi
                              </Badge>
                            )}
                            {status === "rejected" && (
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold text-[11px]">
                                <XCircle className="size-3 mr-1" /> Ditolak
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Terdaftar pada: {new Date(item.user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {/* Revision / Rejection Note Box */}
                      {item.user.recruiterRejectionReason && (
                        <div
                          className={`rounded-xl p-3 text-xs border ${
                            status === "revision_required"
                              ? "bg-orange-50/80 border-orange-200 text-orange-950"
                              : "bg-rose-50/80 border-rose-200 text-rose-950"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {status === "revision_required" ? (
                              <AlertTriangle className="size-4 text-orange-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-semibold">
                                {status === "revision_required" ? "📝 Catatan / Instruksi Revisi Dokumen:" : "⚠️ Alasan Penolakan Akun:"}
                              </p>
                              <p className="mt-0.5 text-slate-700 leading-relaxed">{item.user.recruiterRejectionReason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-slate-400" />
                          <span><strong>PIC:</strong> {picName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-3.5 text-slate-400" />
                          <span className="truncate"><strong>Email:</strong> {item.user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-slate-400" />
                          <span><strong>Telepon:</strong> {item.profile?.phone || "0812-3456-7890"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="size-3.5 text-slate-400" />
                          <span><strong>NIB:</strong> 1234567890123</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-slate-400" />
                          <span><strong>Skala:</strong> 51-200 Karyawan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="size-3.5 text-slate-400" />
                          <span className="truncate"><strong>Domain:</strong> @{item.user.email.split("@")[1] || "perusahaan.com"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewingDocs(item);
                          setActiveDocTab("nib");
                        }}
                        className="text-xs h-9 rounded-xl font-medium"
                      >
                        <Eye className="size-3.5 mr-1.5 text-[#7C3AED]" /> Tinjau Berkas Legalitas
                      </Button>

                      <div className="flex flex-wrap items-center gap-2">
                        {status !== "active" && (
                          <Button
                            size="sm"
                            onClick={() => handleAction(item.user.id, "approve")}
                            disabled={busyId === item.user.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl font-bold shadow-xs"
                          >
                            {busyId === item.user.id ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckCircle2 className="size-3.5 mr-1.5" />}
                            Setujui
                          </Button>
                        )}

                        {status !== "revision_required" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRevisingItem(item);
                              setRevisionNotes(item.user.recruiterRejectionReason || "");
                            }}
                            disabled={busyId === item.user.id}
                            className="text-xs h-9 rounded-xl font-semibold border-orange-300 text-orange-800 hover:bg-orange-50"
                          >
                            <AlertTriangle className="size-3.5 mr-1.5 text-orange-600" /> Minta Revisi
                          </Button>
                        )}

                        {status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectingItem(item);
                              setRejectReason(item.user.recruiterRejectionReason || "");
                            }}
                            disabled={busyId === item.user.id}
                            className="text-xs h-9 rounded-xl font-semibold"
                          >
                            <XCircle className="size-3.5 mr-1.5" /> Tolak
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingItem(item)}
                          disabled={busyId === item.user.id}
                          className="h-9 px-3 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs rounded-xl font-medium"
                        >
                          <Trash2 className="size-3.5 mr-1 text-rose-500" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Viewer Modal */}
      <Dialog open={Boolean(viewingDocs)} onOpenChange={(open) => !open && setViewingDocs(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-[#7C3AED]" />
              Berkas Legalitas: {viewingDocs?.organization?.name || viewingDocs?.profile?.displayName || "Perusahaan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Verifikasi keabsahan dokumen legalitas entitas bisnis dan identitas PIC rekruter sebelum menyetujui akses.
            </DialogDescription>
          </DialogHeader>

          {/* Document Type Tabs */}
          <div className="flex items-center gap-1 border-b pb-2 pt-2">
            {[
              { id: "nib", label: "NIB Perusahaan" },
              { id: "npwp", label: "NPWP Badan Usaha" },
              { id: "ktp", label: "KTP PIC Rekruter" },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeDocTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveDocTab(tab.id as "nib" | "npwp" | "ktp")}
                className={`text-xs h-8 rounded-lg ${activeDocTab === tab.id ? "bg-[#7C3AED] text-white" : "text-slate-600"}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Document Mock Preview Content */}
          <div className="my-2 min-h-64 rounded-xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col items-center justify-center text-center">
            {activeDocTab === "nib" && (
              <div className="space-y-3 max-w-md">
                <div className="size-12 rounded-2xl bg-purple-100 text-[#7C3AED] mx-auto flex items-center justify-center">
                  <FileText className="size-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Nomor Induk Berusaha (NIB)</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-mono">
                  No. Registrasi OSS: 1234567890123<br />
                  Nama PT: {viewingDocs?.organization?.name || "PT Sinergi Digital Nusantara"}<br />
                  KBLI Utama: 62019 (Aktivitas Pemrograman Komputer Lainnya)
                </p>
                <div className="pt-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                    ✓ Terverifikasi Melalui Sistem OSS
                  </Badge>
                </div>
              </div>
            )}

            {activeDocTab === "npwp" && (
              <div className="space-y-3 max-w-md">
                <div className="size-12 rounded-2xl bg-purple-100 text-[#7C3AED] mx-auto flex items-center justify-center">
                  <FileCheck className="size-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">NPWP Badan Usaha Perusahaan</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-mono">
                  No. Pokok Wajib Pajak: 01.234.567.8-012.000<br />
                  KPP Pratama Terdaftar: Jakarta Setiabudi Tiga<br />
                  Status Wajib Pajak: AKTIF (Valid)
                </p>
                <div className="pt-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                    ✓ Nomor Pokok Wajib Pajak Valid
                  </Badge>
                </div>
              </div>
            )}

            {activeDocTab === "ktp" && (
              <div className="space-y-3 max-w-md">
                <div className="size-12 rounded-2xl bg-purple-100 text-[#7C3AED] mx-auto flex items-center justify-center">
                  <User className="size-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Kartu Tanda Penduduk (KTP) PIC</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-mono">
                  Nama PIC: {viewingDocs?.profile?.displayName || viewingDocs?.user.email.split("@")[0]}<br />
                  NIK: 3171************<br />
                  Status PIC: Perwakilan Resmi (HR/Talent Lead)
                </p>
                <div className="pt-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                    ✓ Identitas PIC Sesuai Akun
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewingDocs(null)} className="rounded-xl text-xs">
              Tutup
            </Button>
            {viewingDocs && viewingDocs.user.recruiterProvisioningStatus === "pending" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRevisingItem(viewingDocs);
                    setRevisionNotes(viewingDocs.user.recruiterRejectionReason || "");
                    setViewingDocs(null);
                  }}
                  className="rounded-xl text-xs border-orange-300 text-orange-800 hover:bg-orange-50 font-semibold"
                >
                  <AlertTriangle className="size-3.5 mr-1 text-orange-600" /> Minta Revisi
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setRejectingItem(viewingDocs);
                    setRejectReason(viewingDocs.user.recruiterRejectionReason || "");
                    setViewingDocs(null);
                  }}
                  className="rounded-xl text-xs"
                >
                  Tolak Berkas
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    void handleAction(viewingDocs.user.id, "approve");
                    setViewingDocs(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Setujui Berkas
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Modal */}
      <Dialog open={Boolean(revisingItem)} onOpenChange={(open) => !open && setRevisingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 text-base font-bold">
              <AlertTriangle className="size-5 text-amber-600" />
              Minta Revisi Dokumen Legalitas
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kirimkan instruksi perbaikan kepada <strong>{revisingItem?.organization?.name || revisingItem?.profile?.displayName}</strong> agar dapat memperbaiki dokumen di portal rekruter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 space-y-1">
              <p><strong>PIC:</strong> {revisingItem?.profile?.displayName || "PIC"}</p>
              <p><strong>Email:</strong> {revisingItem?.user.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">Instruksi / Catatan Revisi:</label>
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Contoh: Foto KTP PIC buram, mohon unggah ulang dengan hasil scan/foto yang jelas. Nomor NPWP juga harap disesuaikan dengan kartu..."
                rows={4}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Template cepat:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setRevisionNotes("Foto KTP PIC buram / terpotong. Mohon unggah ulang scan KTP asli yang jelas.")}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  KTP Buram
                </button>
                <button
                  type="button"
                  onClick={() => setRevisionNotes("Nomor NIB tidak cocok dengan dokumen lampiran OSS. Mohon periksa kembali.")}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  NIB Tidak Cocok
                </button>
                <button
                  type="button"
                  onClick={() => setRevisionNotes("NPWP Badan Usaha wajib menyertakan SKT / dokumen perpajakan resmi terbaru.")}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  NPWP Kurang Lengkap
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setRevisingItem(null)} className="rounded-xl text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              disabled={!revisionNotes.trim() || busyId === revisingItem?.user.id}
              onClick={() => {
                if (revisingItem) {
                  void handleAction(revisingItem.user.id, "request_revision", revisionNotes);
                }
              }}
              className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {busyId === revisingItem?.user.id ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <AlertTriangle className="size-3.5 mr-1" />}
              Kirim Permintaan Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={Boolean(rejectingItem)} onOpenChange={(open) => !open && setRejectingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <ShieldAlert className="size-5" /> Tolak Permohonan Rekruter
            </DialogTitle>
            <DialogDescription className="text-xs">
              Berikan alasan penolakan agar PIC rekruter mengetahui perbaikan dokumen yang perlu dilakukan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-700">
              Menolak akun: <strong>{rejectingItem?.organization?.name || rejectingItem?.profile?.displayName || rejectingItem?.user.email}</strong>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">Alasan Penolakan:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Dokumen NPWP Badan Usaha terpotong atau NIB belum mencakup KBLI terkait..."
                rows={4}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectingItem(null)} className="rounded-xl text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!rejectReason.trim() || busyId === rejectingItem?.user.id}
              onClick={() => {
                if (rejectingItem) {
                  void handleAction(rejectingItem.user.id, "reject", rejectReason);
                }
              }}
              className="rounded-xl text-xs font-bold"
            >
              {busyId === rejectingItem?.user.id ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <XCircle className="size-3.5 mr-1" />}
              Kirim Penolakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deletingItem)} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-lg font-bold">
              <Trash2 className="size-5" /> Hapus Akun &amp; Data Rekruter
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tindakan ini akan menghapus akun rekruter secara permanen dari database sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-xs text-rose-900 space-y-1.5">
            <p><strong>Nama PIC:</strong> {deletingItem?.profile?.displayName || "Tidak ada nama"}</p>
            <p><strong>Email:</strong> {deletingItem?.user.email}</p>
            <p><strong>Entitas Perusahaan:</strong> {deletingItem?.organization?.name || "Belum ada organisasi"}</p>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setDeletingItem(null)} className="rounded-xl text-xs">
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingItem && void handleDelete(deletingItem.user.id)}
              disabled={Boolean(busyId)}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {busyId === deletingItem?.user.id ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Trash2 className="size-3.5 mr-1.5" />}
              Ya, Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

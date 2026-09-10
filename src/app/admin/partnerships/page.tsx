"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChecking, AdminDenied, AdminPopup } from "@/components/admin/admin-denied";
import { useAdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface PartnershipItem {
  id: string;
  userId: string | null;
  name: string;
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

function AdminPartnershipsContent() {
  const searchParams = useSearchParams();
  const initialReviewId = searchParams.get("reviewId");
  const initialStatus = searchParams.get("status") || "all";

  const [partnerships, setPartnerships] = useState<PartnershipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  // Review Modal State
  const [selectedPartnership, setSelectedPartnership] = useState<PartnershipItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form State in Modal
  const [formStatus, setFormStatus] = useState<PartnershipItem["verificationStatus"]>("pending");
  const [formNotes, setFormNotes] = useState("");

  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPartnership, setDeletingPartnership] = useState<PartnershipItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openReviewModal = useCallback((p: PartnershipItem) => {
    setSelectedPartnership(p);
    setFormStatus(p.verificationStatus);
    setFormNotes(p.verificationNotes || "");
    setModalOpen(true);
  }, []);

  const fetchPartnerships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partnerships", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { partnerships: PartnershipItem[] };
        setPartnerships(data.partnerships || []);

        if (initialReviewId) {
          const target = (data.partnerships || []).find((p) => p.id === initialReviewId);
          if (target) openReviewModal(target);
        }
      } else if (res.status === 401) {
        failGate(401);
      } else if (res.status === 403) {
        failGate(403);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(`Gagal memuat data partnership (${res.status}): ${errData.error ?? "Unknown error"}`);
      }
    } catch (err) {
      console.error("fetchPartnerships exception:", err);
      toast.error("Gagal memuat daftar partnership.");
    } finally {
      setLoading(false);
    }
  }, [initialReviewId, openReviewModal, failGate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPartnerships();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPartnerships]);

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
        toast.success(`Status ${selectedPartnership.name} berhasil diperbarui.`);
        setModalOpen(false);
        void fetchPartnerships();
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
        void fetchPartnerships();
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
          p.owner.email?.toLowerCase().includes(q)
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
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                    active
                      ? "bg-[#7C3AED] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
              onClick={fetchPartnerships}
              disabled={loading}
              className="rounded-xl size-9 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
              title="Segarkan data"
            >
              <RefreshCw className={cn("size-3.5 text-slate-600", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Table Content Card */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Nama Lembaga / Instansi</th>
                    <th className="py-3.5 px-4 font-bold">Surat SK</th>
                    <th className="py-3.5 px-4 font-bold">Lokasi</th>
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
                                    title="Lihat Berkas SK"
                                  >
                                    <ExternalLink className="size-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>

                          {/* Lokasi */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium">{p.location || "Belum ditentukan"}</span>
                            </div>
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
                                onClick={() => openReviewModal(p)}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 rounded-xl gap-1.5 shadow-2xs"
                              >
                                <Eye className="size-3.5" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePartnership(p)}
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 text-xs h-8 px-2.5 rounded-xl gap-1 shadow-2xs"
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

        {/* Modal Review Partnership */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl flex flex-col p-6 overflow-hidden rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-3.5">
              <DialogTitle className="text-lg font-bold text-slate-900">
                Review Partnership: {selectedPartnership?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                ID: <span className="font-mono">{selectedPartnership?.id}</span> · Terdaftar sejak{" "}
                {selectedPartnership?.createdAt
                  ? new Date(selectedPartnership.createdAt).toLocaleDateString("id-ID")
                  : "-"}
              </DialogDescription>

              <div className="pt-2">
                <span className="inline-block bg-purple-50 text-[#7C3AED] border border-purple-200 px-3 py-1 rounded-lg text-xs font-bold">
                  Status Verifikasi Admin
                </span>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Keputusan Verifikasi Compliance
                </p>

                <div>
                  <label htmlFor="select-status" className="font-semibold text-slate-700 block mb-1.5">
                    Ubah Status Verifikasi:
                  </label>
                  <select
                    id="select-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PartnershipItem["verificationStatus"])}
                    className="w-full h-10 text-xs rounded-xl border border-slate-300 bg-white px-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pending">Pending Verification (Menunggu Peninjauan)</option>
                    <option value="approved">Approved (Setujui Lembaga &amp; Aktifkan Kemitraan)</option>
                    <option value="need_revision">Need Revision (Minta Perbaikan Dokumen / SK)</option>
                    <option value="rejected">Rejected (Tolak Pendaftaran Kemitraan)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="verification-notes" className="font-semibold text-slate-700 block mb-1.5">
                    Catatan Verifikasi Admin (Alasan persetujuan / instruksi revisi / penolakan):
                  </label>
                  <textarea
                    id="verification-notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Tuliskan catatan hasil verifikasi atau detail berkas yang perlu diperbaiki oleh lembaga..."
                    className="w-full h-28 p-3 text-xs rounded-xl border border-slate-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
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

            <DialogFooter className="flex flex-row items-center justify-between border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedPartnership) handleDeletePartnership(selectedPartnership);
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold gap-1.5 rounded-xl px-2.5"
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
                  disabled={updating}
                  className="text-xs h-9 rounded-xl border-slate-200"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveReview}
                  disabled={updating}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs h-9 px-4 rounded-xl font-semibold shadow-xs"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                      Menyimpan…
                    </>
                  ) : (
                    "Simpan Perubahan & Sinkronisasi"
                  )}
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

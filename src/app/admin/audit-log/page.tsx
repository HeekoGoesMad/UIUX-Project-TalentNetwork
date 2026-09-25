"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChecking, AdminDenied, AdminPopup } from "@/components/admin/admin-denied";
import { useAdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AuditLogItem {
  log: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  };
  actorEmail: string | null;
  organizationName: string | null;
}

const ACTION_CATEGORIES = [
  { id: "all", label: "Semua Aktivitas" },
  { id: "company", label: "Perusahaan" },
  { id: "verification", label: "Verifikasi" },
  { id: "tokens", label: "Token" },
  { id: "unlock", label: "Talent Unlock" },
  { id: "screening", label: "Financial Screening" },
];

const PAGE_SIZE = 50;

function formatAuditAction(action: string): {
  badgeLabel: string;
  badgeClass: string;
  title: string;
} {
  const a = action.toLowerCase();

  // Admin company actions
  if (a === "admin.company.approved" || a === "company.verification.approved") {
    return {
      badgeLabel: "Disetujui",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      title: "Verifikasi Perusahaan Disetujui",
    };
  }
  if (a === "admin.company.rejected" || a === "company.verification.rejected") {
    return {
      badgeLabel: "Ditolak",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      title: "Verifikasi Perusahaan Ditolak",
    };
  }
  if (a === "admin.company.deleted") {
    return {
      badgeLabel: "Dihapus",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      title: "Entitas Perusahaan Dihapus",
    };
  }
  if (a === "admin.company.need_revision") {
    return {
      badgeLabel: "Revisi",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      title: "Permintaan Revisi Dokumen Legalitas",
    };
  }
  if (a === "admin.company.pending" || a === "company.verification.submitted") {
    return {
      badgeLabel: "Pending",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      title: "Pengajuan Verifikasi Baru",
    };
  }

  // Interview actions
  if (a.startsWith("interview.")) {
    if (a.includes("reschedule_requested")) {
      return {
        badgeLabel: "Interview",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        title: "Permintaan Jadwal Ulang dari Kandidat",
      };
    }
    if (a.includes("confirmed")) {
      return {
        badgeLabel: "Interview",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        title: "Jadwal Interview Dikonfirmasi Kandidat",
      };
    }
    if (a.includes("declined")) {
      return {
        badgeLabel: "Interview",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        title: "Undangan Interview Ditolak Kandidat",
      };
    }
    if (a.includes("invitation_sent")) {
      return {
        badgeLabel: "Interview",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
        title: "Undangan Wawancara Dikirim ke Kandidat",
      };
    }
    if (a.includes("scheduled")) {
      return {
        badgeLabel: "Interview",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
        title: "Jadwal Wawancara Ditetapkan",
      };
    }
    return {
      badgeLabel: "Interview",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      title: a.replace("interview.", "").replace(/_/g, " "),
    };
  }

  // Screening actions
  if (a.includes("screening")) {
    return {
      badgeLabel: "Screening",
      badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
      title: a.includes("completed")
        ? "Pemeriksaan Profil Selesai"
        : a.includes("started")
        ? "Pemeriksaan Profil Dimulai"
        : "Aktivitas Financial Screening",
    };
  }

  // Token actions
  if (a.includes("token")) {
    return {
      badgeLabel: "Token",
      badgeClass: "bg-purple-50 text-[#7C3AED] border-purple-200",
      title: a.includes("grant") ? "Alokasi Kuota Token" : "Transaksi / Penggunaan Token",
    };
  }

  // Talent unlock
  if (a.includes("unlock")) {
    return {
      badgeLabel: "Talent Unlock",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      title: "Profil Talenta Dibuka",
    };
  }

  // Application
  if (a.includes("application")) {
    return {
      badgeLabel: "Lamaran",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      title: a.includes("created") ? "Pengajuan Lamaran Baru" : "Status Lamaran Diperbarui",
    };
  }

  // Fallback
  const cleanTitle = action
    .replace(/^[a-z]+\./, "")
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    badgeLabel: action.split(".")[0]?.toUpperCase() || "AKTIVITAS",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    title: cleanTitle || action,
  };
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/audit-log", window.location.origin);
      url.searchParams.set("page", String(currentPage));
      url.searchParams.set("limit", String(PAGE_SIZE));
      if (categoryFilter && categoryFilter !== "all") {
        url.searchParams.set("action", categoryFilter);
      }
      if (debouncedSearch) {
        url.searchParams.set("search", debouncedSearch);
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.pagination) {
          setTotalItems(data.pagination.total ?? 0);
          setTotalPages(data.pagination.totalPages ?? 1);
        } else {
          setTotalItems((data.logs || []).length);
          setTotalPages(Math.max(1, Math.ceil((data.logs || []).length / PAGE_SIZE)));
        }
      } else if (res.status === 401) {
        failGate(401);
      } else if (res.status === 403) {
        failGate(403);
      }
    } catch {
      toast.error("Gagal memuat riwayat audit log.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, categoryFilter, debouncedSearch, failGate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

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
    <AdminShell title="Riwayat Jejak Aktivitas (Audit Logs)">
      <div className="space-y-6">
        {/* Top Header Card with Quick Summary */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Riwayat Aktivitas Platform
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catatan transparan aktivitas verifikasi, kuota token, dan operasional akun.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-[#7C3AED] border border-purple-200/80">
                <ScrollText className="size-3.5" />
                {totalItems} Catatan Log
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200/80">
                50 Catatan / Halaman
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/80">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                Tersinkronisasi Otomatis
              </span>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari aksi, email pelaku, atau nama perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-xs rounded-xl h-10 shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ACTION_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCategoryFilter(cat.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "text-xs rounded-xl h-8.5 font-bold transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5",
                  categoryFilter === cat.id
                    ? "bg-purple-50/80 text-[#7C3AED] border border-purple-300 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium"
                )}
              >
                {cat.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="h-8.5 rounded-xl border-slate-200 px-2.5 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition-all hover:-translate-y-0.5"
              title="Segarkan log"
            >
              <RefreshCw className={cn("size-3.5", loading ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        <Card className="border border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-3.5 w-[130px] shrink-0 whitespace-nowrap">Waktu</th>
                    <th className="py-3 px-3.5 w-[150px] whitespace-nowrap">Perusahaan</th>
                    <th className="py-3 px-3.5 w-[170px] whitespace-nowrap">Pelaku</th>
                    <th className="py-3 px-3.5 min-w-[260px] whitespace-nowrap">Aktivitas</th>
                    <th className="py-3 px-3.5 w-[140px] pr-5 whitespace-nowrap">Detail Entitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        Memuat riwayat audit log...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <ScrollText className="size-8 mx-auto mb-2 text-slate-300" />
                        Belum ada jejak audit log yang sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    logs.map((item) => {
                      const meta = formatAuditAction(item.log.action);

                      return (
                        <tr key={item.log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap align-middle">
                            {new Date(item.log.createdAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap align-middle">
                            <span className="truncate block max-w-[140px]" title={item.organizationName || undefined}>
                              {item.organizationName || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap align-middle">
                            <span className="font-semibold text-xs text-slate-800 truncate block max-w-[160px]" title={item.actorEmail || "Sistem"}>
                              {item.actorEmail || "Sistem"}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span
                                  className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0",
                                    meta.badgeClass
                                  )}
                                >
                                  {meta.badgeLabel}
                                </span>
                                <span className="text-xs font-semibold text-slate-900 truncate" title={meta.title}>
                                  {meta.title}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 truncate block" title={item.log.action}>
                                {item.log.action}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 pr-5 align-middle">
                            <div className="flex flex-col gap-0.5 items-start">
                              <span className="inline-flex items-center bg-slate-100 border border-slate-200/80 rounded px-1.5 py-0.5 text-slate-700 font-semibold text-[10px] whitespace-nowrap">
                                {item.log.entityType}
                              </span>
                              {item.log.entityId && (
                                <span
                                  className="font-mono text-[10px] text-slate-400 whitespace-nowrap block"
                                  title={item.log.entityId}
                                >
                                  {item.log.entityId.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/60">
                <div className="text-xs text-slate-600">
                  Menampilkan{" "}
                  <span className="font-bold text-slate-900">
                    {(safePage - 1) * PAGE_SIZE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-slate-900">
                    {Math.min(safePage * PAGE_SIZE, totalItems)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-bold text-slate-900">{totalItems}</span>{" "}
                  catatan log
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-white border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      Sebelumnya
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers(safePage, totalPages).map((p, idx) =>
                        p === "ellipsis" ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-1.5 text-xs text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p as number)}
                            className={cn(
                              "h-8 min-w-8 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer border",
                              safePage === p
                                ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-white border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      Berikutnya
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

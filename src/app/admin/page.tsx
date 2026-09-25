"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  Coins,
  FileCheck,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChecking, AdminDenied, AdminPopup } from "@/components/admin/admin-denied";
import { useAdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardData {
  metrics: {
    totalCompanies: number;
    verifiedCompanies: number;
    pendingVerification: number;
    rejectedCompanies: number;
    totalTalentUnlock: number;
    totalFinancialScreening: number;
    totalActiveTokens: number;
    monthlyGrowth: number;
  };
  pendingList: Array<{
    id: string;
    name: string;
    industry: string | null;
    city: string | null;
    createdAt: string;
    verificationStatus: string;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    metadata: Record<string, unknown>;
    actorEmail: string | null;
    organizationName: string | null;
  }>;
}

const AUDIT_ACTION_MAP: Record<
  string,
  { label: string; tag: string; color: "violet" | "emerald" | "amber" | "slate" | "blue" }
> = {
  "screening.run.started": {
    label: "Pemeriksaan Profil Dimulai",
    tag: "Screening",
    color: "violet",
  },
  "screening.run.completed": {
    label: "Pemeriksaan Profil Selesai",
    tag: "Screening",
    color: "violet",
  },
  "application.created": {
    label: "Lamaran Kandidat Masuk",
    tag: "Rekrutmen",
    color: "blue",
  },
  "admin.company.deleted": {
    label: "Entitas Perusahaan Dihapus",
    tag: "Sistem",
    color: "slate",
  },
  "company.verification.submitted": {
    label: "Pengajuan Berkas Verifikasi",
    tag: "Verifikasi",
    color: "amber",
  },
  "company.verification.approved": {
    label: "Legalitas Perusahaan Disetujui",
    tag: "Verifikasi",
    color: "emerald",
  },
  "company.verification.rejected": {
    label: "Legalitas Perusahaan Ditolak",
    tag: "Verifikasi",
    color: "slate",
  },
  "token.grant": {
    label: "Alokasi Kuota Token",
    tag: "Finansial",
    color: "violet",
  },
  "token.deduct": {
    label: "Pengurangan Saldo Token",
    tag: "Finansial",
    color: "violet",
  },
  "user.login": {
    label: "Sesi Masuk Berhasil",
    tag: "Otentikasi",
    color: "slate",
  },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays}h lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(new URL(`/api/admin/dashboard?t=${Date.now()}`, window.location.origin), {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        const now = new Date();
        setLastRefreshed(
          now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        );
      } else if (res.status === 401) {
        failGate(401);
      } else if (res.status === 403) {
        failGate(403);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [failGate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchDashboard]);

  const metrics = data?.metrics || {
    totalCompanies: 0,
    verifiedCompanies: 0,
    pendingVerification: 0,
    rejectedCompanies: 0,
    totalTalentUnlock: 0,
    totalFinancialScreening: 0,
    totalActiveTokens: 0,
    monthlyGrowth: 0,
  };

  const totalFeatureUsage = metrics.totalTalentUnlock + metrics.totalFinancialScreening;

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
    <AdminShell
      title="Ikhtisar Operasional"
      subtitle="Konsol verifikasi legalitas perusahaan, audit aktivitas, dan sirkulasi kuota"
      actions={
        <div className="flex items-center gap-2.5">
          {lastRefreshed && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
              Diperbarui {lastRefreshed} WIB
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={loading}
            className="gap-2 text-xs font-semibold h-8 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            <span>Perbarui Data</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ─── 1. Urgent Triage Alert Banner (Rendered when verification queue has items) ─── */}
        {metrics.pendingVerification > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3.5 text-amber-950 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-300/80 font-bold">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Tindakan Diperlukan: {metrics.pendingVerification} Berkas Perusahaan Menunggu Tinjauan Legal
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Pendaftaran terhambat sampai dokumen legalitas (NIB/NPWP) divalidasi oleh tim admin.
                </p>
              </div>
            </div>
            <Link href="/admin/companies?status=pending">
              <Button
                size="sm"
                className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs h-8 px-3.5 rounded-lg shadow-xs shrink-0 cursor-pointer"
              >
                <span>Tinjau Berkas</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* ─── 2. Segmented Operational KPI Ledger Strip (Unified single bar, no fluffy cards) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {/* Segment 1: Total Perusahaan */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Entitas
              </span>
              <Building2 className="size-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {metrics.totalCompanies}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="text-emerald-700 font-semibold">{metrics.verifiedCompanies} Aktif</span>
              <span>·</span>
              <span className="text-amber-700 font-semibold">{metrics.pendingVerification} Pending</span>
              <span>·</span>
              <span className="text-slate-400">{metrics.rejectedCompanies} Ditolak</span>
            </div>
          </div>

          {/* Segment 2: Menunggu Review (Highlighted if backlog exists) */}
          <div
            className={cn(
              "p-4 sm:p-5 transition-colors",
              metrics.pendingVerification > 0 ? "bg-amber-50/40" : "bg-white"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Antrean Legalitas
              </span>
              <Clock
                className={cn(
                  "size-4",
                  metrics.pendingVerification > 0 ? "text-amber-600" : "text-slate-400"
                )}
              />
            </div>
            <p
              className={cn(
                "mt-2 text-2xl sm:text-3xl font-bold font-mono tracking-tight",
                metrics.pendingVerification > 0 ? "text-amber-800" : "text-slate-900"
              )}
            >
              {metrics.pendingVerification}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500 truncate">
              {metrics.pendingVerification > 0
                ? "Dokumen NIB/NPWP siap ditinjau"
                : "Seluruh berkas terverifikasi"}
            </p>
          </div>

          {/* Segment 3: Sirkulasi Kuota Token */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sirkulasi Token
              </span>
              <Coins className="size-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {metrics.totalActiveTokens.toLocaleString("id-ID")}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500 truncate">
              Total saldo aktif di rekruter
            </p>
          </div>

          {/* Segment 4: Konsumsi Fitur Platform */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Konsumsi Fitur
              </span>
              <FileCheck className="size-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {totalFeatureUsage}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span>{metrics.totalTalentUnlock} Unlock</span>
              <span>·</span>
              <span>{metrics.totalFinancialScreening} Skrining</span>
            </div>
          </div>
        </div>

        {/* ─── 3. Operational Workstation (Stacked Vertically) ─── */}
        <div className="space-y-6">
          {/* Antrean Verifikasi Perusahaan */}
          <Card className="border border-slate-200 bg-white shadow-2xs rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Antrean Verifikasi Perusahaan
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-slate-300 text-slate-600 bg-white">
                  {data?.pendingList?.length ?? 0} Tertunda
                </Badge>
              </div>
              <Link href="/admin/companies?status=pending">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:bg-purple-50 rounded-lg h-7 px-2">
                  <span>Lihat Direktori</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {data?.pendingList && data.pendingList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.pendingList.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Sektor: <span className="text-slate-700 font-medium">{c.industry || "Tidak tercantum"}</span>
                          {c.city ? ` · ${c.city}` : ""}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            Diajukan {formatRelativeTime(c.createdAt)}
                          </span>
                          <span>·</span>
                          <span className="rounded bg-slate-100 border border-slate-200 px-1 py-0.2 text-[9px] text-slate-600">
                            NIB & NPWP
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <Link href={`/admin/companies?reviewId=${c.id}`}>
                          <Button
                            size="sm"
                            className="text-xs font-semibold h-8 px-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors cursor-pointer shadow-xs"
                          >
                            <span>Periksa Berkas</span>
                            <ChevronRight className="size-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <div className="size-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Antrean Verifikasi Bersih</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Seluruh pengajuan legalitas dan pendaftaran perusahaan telah selesai ditinjau.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jejak Audit Real-time */}
          <Card className="border border-slate-200 bg-white shadow-2xs rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">
                Jejak Audit Real-time
              </CardTitle>
              <Link href="/admin/audit-log">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:bg-purple-50 rounded-lg h-7 px-2">
                  <span>Semua Log</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {data?.recentActivities && data.recentActivities.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.recentActivities.slice(0, 5).map((log) => {
                    const meta = AUDIT_ACTION_MAP[log.action] || {
                      label: log.action,
                      tag: "Sistem",
                      color: "slate" as const,
                    };

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div
                          className={cn(
                            "size-2 rounded-full mt-1.5 shrink-0",
                            meta.color === "emerald" && "bg-emerald-500",
                            meta.color === "amber" && "bg-amber-500",
                            meta.color === "violet" && "bg-[#7C3AED]",
                            meta.color === "blue" && "bg-blue-500",
                            meta.color === "slate" && "bg-slate-400"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {meta.label}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {formatRelativeTime(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {log.organizationName ? `${log.organizationName} · ` : ""}
                            Oleh: {log.actorEmail || "Sistem"}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada aktivitas baru tercatat di platform.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── 4. High-Precision System Telemetry Status Bar ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">Database Supabase & Drizzle Tersinkronisasi</span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400 font-mono">Latensi Operasional Normal</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Pertumbuhan Bulanan: {metrics.monthlyGrowth > 0 ? `+${metrics.monthlyGrowth}%` : `${metrics.monthlyGrowth}%`}
          </span>
        </div>
      </div>
    </AdminShell>
  );
}

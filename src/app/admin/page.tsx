"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  ArrowRight,
  Activity,
  RefreshCw,
  ChevronRight,
  Sparkles,
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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
    <AdminShell title="Ikhtisar Platform">
      <div className="space-y-6">
        {/* ─── 1. Welcome Card (Minimalist, Clean White with Subtle Outline) ─── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7C3AED]">
                <Sparkles className="size-3.5" />
                <span>Panel Administrator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Selamat Datang di Talent Network
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                Pantau status verifikasi perusahaan, sirkulasi kuota token, dan ringkasan aktivitas platform terkini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
              {metrics.pendingVerification > 0 && (
                <Link href="/admin/companies?status=pending">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200/90 bg-purple-50/60 px-3.5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-purple-100/70 hover:-translate-y-0.5 transition-all shadow-2xs cursor-pointer">
                    <Clock className="size-3.5" />
                    <span>{metrics.pendingVerification} Perlu Ditinjau</span>
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboard}
                disabled={loading}
                className="gap-2 text-xs font-semibold h-9 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                Perbarui Data
              </Button>
            </div>
          </div>
        </div>

        {/* ─── 2. Core 4 Minimalist Metric Cards with Hover Lift & Purple Outlines ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Total Perusahaan */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Perusahaan
              </p>
              <div className="size-8 rounded-lg bg-slate-100 group-hover:bg-purple-50 group-hover:text-[#7C3AED] flex items-center justify-center text-slate-600 transition-colors">
                <Building2 className="size-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {metrics.totalCompanies}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
              <span className="text-emerald-700 font-semibold">{metrics.verifiedCompanies} Disetujui</span>
              <span>·</span>
              <span className="text-amber-700 font-semibold">{metrics.pendingVerification} Pending</span>
            </div>
          </div>

          {/* 2. Menunggu Verifikasi */}
          <div
            className={cn(
              "group rounded-2xl border bg-white p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
              metrics.pendingVerification > 0
                ? "border-amber-200/90 hover:border-amber-300"
                : "border-slate-200/80 hover:border-purple-200"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Menunggu Review
              </p>
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center transition-colors",
                  metrics.pendingVerification > 0
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-600 group-hover:bg-purple-50 group-hover:text-[#7C3AED]"
                )}
              >
                <Clock className="size-4" />
              </div>
            </div>
            <p
              className={cn(
                "text-3xl font-extrabold mt-2 tracking-tight",
                metrics.pendingVerification > 0 ? "text-amber-800" : "text-slate-900"
              )}
            >
              {metrics.pendingVerification}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              {metrics.pendingVerification > 0 ? "Dokumen NIB/NPWP siap ditinjau" : "Semua berkas telah diperiksa"}
            </p>
          </div>

          {/* 3. Saldo Token Aktif */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Saldo Token Beredar
              </p>
              <div className="size-8 rounded-lg bg-slate-100 group-hover:bg-purple-50 group-hover:text-[#7C3AED] flex items-center justify-center text-slate-600 transition-colors">
                <Coins className="size-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#7C3AED] mt-2 tracking-tight font-mono">
              {metrics.totalActiveTokens.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Total kuota di seluruh akun rekruter
            </p>
          </div>

          {/* 4. Konsumsi Fitur */}
          <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Penggunaan Fitur
              </p>
              <div className="size-8 rounded-lg bg-slate-100 group-hover:bg-purple-50 group-hover:text-[#7C3AED] flex items-center justify-center text-slate-600 transition-colors">
                <FileCheck className="size-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {totalFeatureUsage}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
              <span>{metrics.totalTalentUnlock} Unlock</span>
              <span>·</span>
              <span>{metrics.totalFinancialScreening} Screening</span>
            </div>
          </div>
        </div>

        {/* ─── 3. Action Center: Antrean Verifikasi & Aktivitas Terkini (Two Clean Minimalist Columns) ─── */}
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* Antrean Verifikasi Perusahaan */}
          <Card className="border border-slate-200/90 bg-white shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Antrean Verifikasi Perusahaan
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pendaftaran perusahaan baru yang membutuhkan peninjauan dokumen.
                </p>
              </div>
              <Link href="/admin/companies?status=pending">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:bg-purple-50 rounded-xl">
                  Lihat Semua
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {data?.pendingList && data.pendingList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.pendingList.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.industry || "Sektor belum diisi"} {c.city ? `· ${c.city}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          Pending
                        </Badge>
                        <Link href={`/admin/companies?reviewId=${c.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold h-8 px-3 rounded-xl border-purple-200 text-[#7C3AED] hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer"
                          >
                            Review
                            <ChevronRight className="size-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-1.5">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-800 text-sm">Semua antrean tuntas</p>
                  <p className="text-slate-400">Tidak ada peninjauan perusahaan yang tertunda saat ini.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aktivitas Terbaru Platform */}
          <Card className="border border-slate-200/90 bg-white shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Aktivitas Terbaru
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan transaksi, verifikasi, dan pemindaian di platform.
                </p>
              </div>
              <Link href="/admin/audit-log">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:bg-purple-50 rounded-xl">
                  Semua Log
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {data?.recentActivities && data.recentActivities.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.recentActivities.map((log) => (
                    <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="size-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-500">
                        <Activity className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {log.action}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {log.organizationName ? `${log.organizationName} · ` : ""}
                          Oleh: {log.actorEmail || "Sistem"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Belum ada aktivitas baru tercatat di platform.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── 4. Simple, Clean System Status Note ─── */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            <span>Sistem tersinkronisasi dengan database</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Pertumbuhan bulanan: {metrics.monthlyGrowth > 0 ? `+${metrics.monthlyGrowth}%` : `${metrics.monthlyGrowth}%`}
          </span>
        </div>
      </div>
    </AdminShell>
  );
}

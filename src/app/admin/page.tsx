"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  TrendingUp,
  Users,
  XCircle,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <AdminShell title="Ringkasan Performa Platform">
      <div className="space-y-8">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Metrik Utama</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Data analitik real-time agregasi dari database perusahaan, token, dan aktivitas platform.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={loading}
            className="gap-2 text-xs font-semibold h-9 rounded-xl border-slate-200"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Perbarui Data
          </Button>
        </div>

        {/* 8 Kartu Metrik Sesuai Dokumen Mentor */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Total Companies */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Companies
              </CardTitle>
              <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Building2 className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.totalCompanies}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Seluruh perusahaan terdaftar</p>
            </CardContent>
          </Card>

          {/* 2. Verified Companies */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Verified Companies
              </CardTitle>
              <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-700">{metrics.verifiedCompanies}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Lolos verifikasi &amp; aktif</p>
            </CardContent>
          </Card>

          {/* 3. Pending Verification */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Pending Review
              </CardTitle>
              <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-700">{metrics.pendingVerification}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Menunggu peninjauan admin</p>
            </CardContent>
          </Card>

          {/* 4. Rejected Companies */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Rejected
              </CardTitle>
              <div className="size-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-rose-700">{metrics.rejectedCompanies}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Pendaftaran ditolak</p>
            </CardContent>
          </Card>

          {/* 5. Total Talent Unlock */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Talent Unlock
              </CardTitle>
              <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.totalTalentUnlock}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Profil kandidat dibuka</p>
            </CardContent>
          </Card>

          {/* 6. Total Financial Screening */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Financial Screening
              </CardTitle>
              <div className="size-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                <FileCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">{metrics.totalFinancialScreening}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Pemeriksaan finansial selesai</p>
            </CardContent>
          </Card>

          {/* 7. Total Active Tokens */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">
                Active Tokens
              </CardTitle>
              <div className="size-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#7C3AED]">
                <Coins className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-[#7C3AED]">{metrics.totalActiveTokens}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Total saldo token di platform</p>
            </CardContent>
          </Card>

          {/* 8. Monthly Growth */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Monthly Growth
              </CardTitle>
              <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">
                {metrics.monthlyGrowth > 0 ? `+${metrics.monthlyGrowth}%` : `${metrics.monthlyGrowth}%`}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Dibanding bulan sebelumnya</p>
            </CardContent>
          </Card>
        </div>

        {/* Antrean Verifikasi Cepat & Aktivitas Terbaru */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Antrean Perusahaan Menunggu Review */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3.5">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Antrean Verifikasi Perusahaan
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Perusahaan baru yang membutuhkan peninjauan dokumen legalitas.
                </p>
              </div>
              <Link href="/admin/companies?status=pending">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9]">
                  Lihat Semua
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data?.pendingList && data.pendingList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.pendingList.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition-colors">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.industry || "Sektor belum diisi"} {c.city ? `· ${c.city}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          Pending
                        </Badge>
                        <Link href={`/admin/companies?reviewId=${c.id}`}>
                          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 px-3 rounded-lg">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
                  Semua pendaftaran perusahaan telah selesai ditinjau.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aktivitas Terbaru Platform */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3.5">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Aktivitas Terbaru Platform
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Jejak transaksi, verifikasi, dan penggunaan fitur terkini.
                </p>
              </div>
              <Link href="/admin/audit-log">
                <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9]">
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
                      <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
                        <Activity className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900">
                          {log.action}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {log.organizationName ? `Perusahaan: ${log.organizationName} · ` : ""}
                          Pelaku: {log.actorEmail || "Sistem"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
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
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Belum ada aktivitas baru tercatat di platform.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

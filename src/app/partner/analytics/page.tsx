"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Download,
  GraduationCap,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const QUARTERLY_DATA = [
  { q: "Q1 2024", registered: 312, verified: 88, hired: 54, rate: "61%" },
  { q: "Q2 2024", registered: 401, verified: 124, hired: 89, rate: "72%" },
  { q: "Q3 2024", registered: 487, verified: 156, hired: 112, rate: "72%" },
  { q: "Q4 2024", registered: 647, verified: 212, hired: 157, rate: "74%" },
];

const PLACEMENT_BY_PROGRAM = [
  { program: "Teknik Informatika", placed: 89, total: 112, rate: 79 },
  { program: "Manajemen Bisnis", placed: 67, total: 94, rate: 71 },
  { program: "Desain Komunikasi Visual", placed: 45, total: 58, rate: 78 },
  { program: "Sistem Informasi", placed: 52, total: 71, rate: 73 },
  { program: "Akuntansi", placed: 38, total: 56, rate: 68 },
  { program: "Psikologi", placed: 29, total: 44, rate: 66 },
];

const BUSINESS_IMPACT = [
  { term: "Short Term", color: "border-sky-200 bg-sky-50/60", dot: "bg-sky-500", items: ["Menambah supply fresh graduate ke talent pool", "Menambah jumlah talent aktif di platform"] },
  { term: "Mid Term", color: "border-slate-200 bg-slate-50/60", dot: "bg-[#7C3AED]", items: ["Menjadi platform employability kampus", "Menarik recruiter fokus fresh graduate"] },
  { term: "Long Term", color: "border-emerald-200 bg-emerald-50/60", dot: "bg-emerald-500", items: ["Menjadi jaringan talent nasional berbasis kampus", "Talent Intelligence & Employability Ecosystem"] },
];

export default function PartnerAnalyticsPage() {
  const maxRegistered = Math.max(...QUARTERLY_DATA.map((d) => d.registered));

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8">
        <Link href="/partner" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke Dashboard
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <BarChart3 className="size-4" /> Placement Analytics
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1A1A2E]">Laporan Penempatan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analisis placement, program studi, dan dampak kemitraan — periode 2024.
            </p>
          </div>
          <Button variant="outline">
            <Download className="size-4" /> Unduh Laporan PDF
          </Button>
        </div>

        {/* KPI Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Mahasiswa 2024", value: "1.847", icon: Users, color: "text-slate-900", bg: "bg-slate-100" },
            { label: "Terverifikasi Campus", value: "412", icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "Berhasil Ditempatkan", value: "412", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Rata-rata Tingkat Penempatan", value: "73%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={`mt-2 font-mono text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <div className={`flex size-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                    <kpi.icon className={`size-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quarterly Trend */}
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-slate-700" /> Tren Kuartalan 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              {QUARTERLY_DATA.map((d) => (
                <div key={d.q} className="rounded-xl border p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{d.q}</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Terdaftar</span>
                        <span className="font-mono font-semibold text-slate-900">{d.registered}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-slate-800" style={{ width: `${(d.registered / maxRegistered) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Verified</span>
                        <span className="font-mono font-semibold text-sky-600">{d.verified}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${(d.verified / maxRegistered) * 100}%` }} />
                      </div>
                    </div>
                    <div className="pt-1 border-t">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Placement Rate</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5">{d.rate}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Program + Business Impact */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {/* By Program */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="size-4 text-amber-500" /> Penempatan per Program Studi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PLACEMENT_BY_PROGRAM.map((p) => (
                <div key={p.program}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium truncate">{p.program}</span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{p.placed}/{p.total}</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-[#7C3AED]"
                      style={{ width: `${p.rate}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-[10px] font-mono text-muted-foreground">{p.rate}%</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Business Impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-[#7C3AED]" /> Business Impact ProofyLink
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {BUSINESS_IMPACT.map((impact) => (
                <div key={impact.term} className={`rounded-xl border ${impact.color} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`size-2.5 rounded-full ${impact.dot}`} />
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{impact.term}</p>
                  </div>
                  <ul className="space-y-1">
                    {impact.items.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="mt-1 shrink-0 size-1 rounded-full bg-slate-400 block" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 mt-4">
                <p className="text-xs font-bold text-[#7C3AED] mb-1">Visi Akhir</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ProofyLink menjadi <strong>Talent Intelligence & Employability Ecosystem</strong> — menghubungkan perguruan tinggi, mahasiswa, alumni, recruiter, dan perusahaan dalam satu platform terintegrasi.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Target Partner */}
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-[#7C3AED]" /> Target Partner Tahap Awal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">🌴 Bali</p>
                <div className="space-y-1.5">
                  {["Universitas Udayana", "Universitas Warmadewa", "Undiknas", "ITB STIKOM Bali", "Universitas Pendidikan Nasional"].map((u) => (
                    <div key={u} className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                      <div className="size-1.5 rounded-full bg-[#7C3AED]" />
                      {u}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">🇮🇩 Nasional</p>
                <div className="space-y-1.5">
                  {["BINUS University", "Telkom University", "Universitas Airlangga", "Universitas Brawijaya", "Universitas Gadjah Mada"].map((u) => (
                    <div key={u} className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      {u}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

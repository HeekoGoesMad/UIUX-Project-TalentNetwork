"use client";

import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Users,
  Building2,
  TrendingUp,
  ShieldCheck,
  BadgeCheck,
  Briefcase,
  BarChart3,
  ChevronRight,
  Star,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Mock partner data ──────────────────────────────────────────────────────────
const PARTNER_STATS = [
  { label: "Total Mahasiswa Terdaftar", value: "1.847", icon: Users, color: "text-slate-700", bg: "bg-slate-100", trend: "+124 bulan ini" },
  { label: "Campus Verified Talent", value: "412", icon: BadgeCheck, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+38 bulan ini" },
  { label: "Employer Aktif Mengakses", value: "67", icon: Building2, color: "text-sky-600", bg: "bg-sky-50", trend: "+12 bulan ini" },
  { label: "Tingkat Penempatan", value: "73%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", trend: "+5% dari kuartal lalu" },
];

const RECENT_TALENT = [
  { name: "Anya Fitriani", program: "Teknik Informatika", year: "2024", status: "Terverifikasi", unlocked: 3 },
  { name: "Budi Hartono", program: "Manajemen Bisnis", year: "2024", status: "Terverifikasi", unlocked: 1 },
  { name: "Citra Maharani", program: "Desain Komunikasi Visual", year: "2023", status: "Terverifikasi", unlocked: 5 },
  { name: "Dian Purnomo", program: "Sistem Informasi", year: "2024", status: "Menunggu", unlocked: 0 },
  { name: "Eko Prasetyo", program: "Akuntansi", year: "2023", status: "Terverifikasi", unlocked: 2 },
];

const RECENT_EMPLOYERS = [
  { name: "Gojek", industry: "Tech / Superapp", accessed: "2 jam lalu", talent: 12 },
  { name: "Tokopedia", industry: "E-Commerce", accessed: "5 jam lalu", talent: 8 },
  { name: "Traveloka", industry: "Travel Tech", accessed: "1 hari lalu", talent: 4 },
  { name: "Kredivo", industry: "Fintech", accessed: "2 hari lalu", talent: 6 },
];

const PLACEMENT_BREAKDOWN = [
  { label: "Full-time", pct: 48, color: "bg-slate-800" },
  { label: "Internship", pct: 31, color: "bg-sky-500" },
  { label: "Freelance", pct: 13, color: "bg-amber-500" },
  { label: "Wirausaha", pct: 8, color: "bg-emerald-500" },
];

const TOP_INDUSTRIES = [
  { label: "Technology / Software", count: 134 },
  { label: "Marketing / Digital", count: 89 },
  { label: "Product / Design", count: 67 },
  { label: "Data / Analytics", count: 54 },
  { label: "Human Capital / HR", count: 41 },
];

export default function PartnerDashboardPage() {
  const { user, activePartnerInstitution, partnerVerifications, cvProfile } = useApp();
  const institutionName = activePartnerInstitution || user?.name || "Universitas Indonesia";

  // Compute live stats for this institution
  const talentPool = candidates.filter((c) => {
    const verif = partnerVerifications?.[c.id] ?? c.campusVerification;
    const inst = verif?.institution ?? c.education;
    return inst && inst.toLowerCase().includes(institutionName.toLowerCase());
  });

  const verifiedTalent = talentPool.filter((c) => {
    const verif = partnerVerifications?.[c.id] ?? c.campusVerification;
    return verif?.status === "verified";
  });

  const pendingTalent = talentPool.filter((c) => {
    const verif = partnerVerifications?.[c.id] ?? c.campusVerification;
    return verif?.status === "pending";
  });

  const dynamicStats = [
    { label: "Mahasiswa Terdata", value: `${talentPool.length + (cvProfile ? 1 : 0)}`, icon: Users, color: "text-slate-700", bg: "bg-slate-100", trend: "+12 bulan ini" },
    { label: "Campus Verified Talent", value: `${verifiedTalent.length}`, icon: BadgeCheck, color: "text-emerald-600", bg: "bg-emerald-50", trend: `${verifiedTalent.length} profil aktif` },
    { label: "Pending Verifikasi", value: `${pendingTalent.length}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", trend: `${pendingTalent.length} menunggu review` },
    { label: "Tingkat Penempatan", value: "78%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", trend: "+5% dari semester lalu" },
  ];

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <GraduationCap className="size-4" /> Kemitraan Career Center
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#1A1A2E]">
              Selamat datang, {institutionName}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Dashboard career center kampus Anda — verifikasi mahasiswa, pantau employer, dan lacak penempatan.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/partner/talent">
                <Users className="size-4" /> Kelola Talent ({talentPool.length})
              </Link>
            </Button>
            <Button asChild>
              <Link href="/partner/analytics">
                <BarChart3 className="size-4" /> Analytics
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Verified Partner Badge ─────────────────────────────── */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5">
          <ShieldCheck className="size-5 shrink-0 text-[#7C3AED]" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-slate-900">Partner Terverifikasi ProofyLink · {institutionName}</span>
            <span className="ml-2 text-muted-foreground">· Akses resmi verifikasi alumni & mahasiswa</span>
          </div>
          <Badge className="bg-[#7C3AED] text-white">Aktif</Badge>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dynamicStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`mt-2 font-mono text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`flex size-10 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`size-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main Content Grid ──────────────────────────────────── */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* Campus Verified Talent */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BadgeCheck className="size-4 text-emerald-600" /> Talent Kampus Terverifikasi
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner/talent" className="text-xs text-muted-foreground">
                  Lihat semua ({talentPool.length}) <ChevronRight className="size-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {talentPool.slice(0, 5).map((candidate) => {
                const verif = partnerVerifications?.[candidate.id] ?? candidate.campusVerification;
                const isVerified = verif?.status === "verified";
                return (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-[#7C3AED]">
                        {candidate.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.role} · {candidate.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={isVerified
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                          : "bg-amber-50 text-amber-700 border border-amber-200 font-medium"}
                      >
                        {isVerified ? <CheckCircle2 className="mr-1 size-2.5" /> : <Clock className="mr-1 size-2.5" />}
                        {isVerified ? "Terverifikasi" : "Pending Review"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Employer Access */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-4 text-sky-600" /> Akses Employer
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner/employers" className="text-xs text-muted-foreground">
                  Lihat semua <ChevronRight className="size-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {RECENT_EMPLOYERS.map((emp) => (
                <div
                  key={emp.name}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700">
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900">{emp.talent} talent</p>
                    <p className="text-xs text-muted-foreground">{emp.accessed}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Placement Analytics ────────────────────────────────── */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          {/* Breakdown by type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4 text-slate-500" /> Analisis Penempatan Kerja
                <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">Periode: 2024</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-bold text-slate-900">73%</span>
                <span className="text-sm text-muted-foreground">tingkat penempatan keseluruhan</span>
              </div>
              <div className="space-y-3">
                {PLACEMENT_BREAKDOWN.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs font-medium">
                      <span>{item.label}</span>
                      <span className="font-mono text-muted-foreground">{item.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Industries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="size-4 text-amber-500" /> Industri Terpopuler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOP_INDUSTRIES.map((ind, i) => (
                  <div key={ind.label} className="flex items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate font-medium">{ind.label}</span>
                        <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{ind.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-slate-700 transition-all duration-500"
                          style={{ width: `${(ind.count / TOP_INDUSTRIES[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700">Visi Akhir ProofyLink</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Menjadi Talent Intelligence & Employability Ecosystem yang menghubungkan perguruan tinggi, mahasiswa, alumni, recruiter, dan perusahaan.
                </p>
                <Button size="sm" variant="outline" className="mt-3 text-xs" asChild>
                  <Link href="/partner/analytics">
                    Lihat laporan lengkap <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <section className="mt-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aksi Cepat Career Center</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { href: "/partner/talent", icon: BadgeCheck, label: "Verifikasi Talent Baru", desc: "4 menunggu verifikasi", color: "text-emerald-600", bg: "bg-emerald-50" },
                  { href: "/partner/employers", icon: Building2, label: "Employer Baru", desc: "2 employer mendaftar", color: "text-sky-600", bg: "bg-sky-50" },
                  { href: "/partner/analytics", icon: BarChart3, label: "Unduh Laporan", desc: "Placement Q2 2024", color: "text-slate-700", bg: "bg-slate-100" },
                  { href: "/search", icon: Users, label: "Jelajahi Talent Pool", desc: "Semua talent aktif", color: "text-amber-600", bg: "bg-amber-50" },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${action.bg}`}>
                      <action.icon className={`size-5 ${action.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{action.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Search,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useApp } from "@/providers/app-provider";

interface EmployerItem {
  id: string;
  name: string;
  industry: string;
  category: "tech" | "fintech" | "edutech" | "healthtech";
  location: string;
  talentViewed: number;
  talentHired: number;
  lastActive: string;
  tier: "Enterprise" | "Growth" | "Startup";
  recentSearch: string;
}

const EMPLOYERS: EmployerItem[] = [
  {
    id: "1",
    name: "Gojek (GoTo Group)",
    industry: "Superapp & On-Demand Service",
    category: "tech",
    location: "Jakarta & Bali",
    talentViewed: 18,
    talentHired: 4,
    lastActive: "15 menit lalu",
    tier: "Enterprise",
    recentSearch: "Frontend Engineer (React), UI Designer",
  },
  {
    id: "2",
    name: "Tokopedia",
    industry: "E-Commerce Ecosystem",
    category: "tech",
    location: "Jakarta",
    talentViewed: 12,
    talentHired: 3,
    lastActive: "2 jam lalu",
    tier: "Enterprise",
    recentSearch: "Mobile Developer (Flutter), QA",
  },
  {
    id: "3",
    name: "Traveloka",
    industry: "Lifestyle Superapp & OTA",
    category: "tech",
    location: "Tangerang & Remote",
    talentViewed: 8,
    talentHired: 2,
    lastActive: "5 jam lalu",
    tier: "Enterprise",
    recentSearch: "Backend Engineer (Go), Product Specialist",
  },
  {
    id: "4",
    name: "Kredivo Group",
    industry: "Financial Technology & Buy Now Pay Later",
    category: "fintech",
    location: "Jakarta",
    talentViewed: 9,
    talentHired: 2,
    lastActive: "1 hari lalu",
    tier: "Growth",
    recentSearch: "Data Analyst, Risk Operations",
  },
  {
    id: "5",
    name: "Ruangguru",
    industry: "Education Technology & Learning",
    category: "edutech",
    location: "Jakarta & Yogyakarta",
    talentViewed: 14,
    talentHired: 5,
    lastActive: "1 hari lalu",
    tier: "Growth",
    recentSearch: "Curriculum Dev, Software Engineer",
  },
  {
    id: "6",
    name: "Halodoc",
    industry: "Healthcare Teleconsultation",
    category: "healthtech",
    location: "Jakarta & Remote",
    talentViewed: 7,
    talentHired: 1,
    lastActive: "2 hari lalu",
    tier: "Growth",
    recentSearch: "Security Engineer, Tech Support",
  },
  {
    id: "7",
    name: "Bali Intermedia Digital",
    industry: "Digital Creative & Web Agency",
    category: "tech",
    location: "Denpasar, Bali",
    talentViewed: 22,
    talentHired: 6,
    lastActive: "30 menit lalu",
    tier: "Startup",
    recentSearch: "Web Developer (Next.js), Graphic Designer",
  },
];

export default function PartnerEmployersPage() {
  const { user, activePartnerInstitution } = useApp();
  const partnerInstitution = user?.companyName || activePartnerInstitution || "ITB STIKOM Bali";

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const totalViews = useMemo(() => EMPLOYERS.reduce((a, e) => a + e.talentViewed, 0), []);
  const totalHired = useMemo(() => EMPLOYERS.reduce((a, e) => a + e.talentHired, 0), []);

  const filteredEmployers = useMemo(() => {
    return EMPLOYERS.filter((emp) => {
      const matchQ =
        emp.name.toLowerCase().includes(query.toLowerCase()) ||
        emp.industry.toLowerCase().includes(query.toLowerCase()) ||
        emp.location.toLowerCase().includes(query.toLowerCase()) ||
        emp.recentSearch.toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === "all" || emp.category === categoryFilter;
      return matchQ && matchCat;
    });
  }, [query, categoryFilter]);

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/partner"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Kembali ke Dashboard
        </Link>

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
              <Building2 className="size-4" /> Akses &amp; Kemitraan Industri
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1A2E]">
              Employer yang Mengakses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pantau perusahaan dan recruiter yang aktif menelusuri &amp; merekrut talenta resmi dari{" "}
              <strong className="text-foreground">{partnerInstitution}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 shadow-2xs">
            <Building2 className="size-4 text-[#7C3AED]" />
            <span className="text-xs text-muted-foreground">Mitra:</span>
            <span className="text-xs font-bold text-foreground">{partnerInstitution}</span>
          </div>
        </div>

        {/* Connected Stat Cells - Identical to Recruiter Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 shadow-xs">
          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Building2 className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Total Perusahaan Aktif</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {EMPLOYERS.length} <span className="font-sans text-xs font-normal text-muted-foreground">Employer</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Mencari kandidat kampus {partnerInstitution}</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
                <Eye className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Total Profil Dilihat</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-[#7C3AED]">
              {totalViews} <span className="font-sans text-xs font-normal text-muted-foreground">Kunjungan</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Aktivitas review portofolio &amp; CV</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Penyerapan Kerja (Hired)</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-600">
              {totalHired} <span className="font-sans text-xs font-normal text-muted-foreground">Lulusan</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Tercatat masuk tahap offer &amp; accepted</p>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 shadow-2xs">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Badge &ldquo;Campus Verified&rdquo; Meningkatkan Tingkat Wawancara hingga 3.4×
            </p>
            <p className="text-xs text-slate-600">
              Recruiter di ekosistem ProofyLink memprioritaskan profil mahasiswa dan alumni dengan sertifikasi institusi karena menjamin keaslian riwayat pendidikan dan IPK.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex text-xs bg-white">
            <Link href="/partner/talent">
              Tinjau Antrean Mahasiswa
            </Link>
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder="Cari nama employer, industri, atau posisi..."
              className="pl-10 rounded-xl h-10 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Semua Kategori" },
              { id: "tech", label: "Technology" },
              { id: "fintech", label: "Fintech" },
              { id: "edutech", label: "Edutech" },
              { id: "healthtech", label: "Healthtech" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  categoryFilter === f.id
                    ? "bg-[#1A1A2E] text-white shadow-xs"
                    : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employer List Card */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Briefcase className="size-4 text-[#7C3AED]" /> Daftar Employer ({filteredEmployers.length})
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Real-time activity feed ProofyLink Network
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-3">
            {filteredEmployers.length === 0 ? (
              <div className="rounded-2xl bg-muted/30 p-8 text-center border border-dashed border-border/80">
                <Building2 className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Tidak ada employer ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
              </div>
            ) : (
              filteredEmployers.map((emp) => (
                <div
                  key={emp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/70 p-4 transition-all hover:bg-muted/20 hover:border-border"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-bold text-[#7C3AED] border border-purple-100">
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{emp.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            emp.tier === "Enterprise"
                              ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                              : emp.tier === "Growth"
                              ? "bg-sky-50 text-sky-700 border-sky-200 text-[10px]"
                              : "bg-slate-50 text-slate-700 border-slate-200 text-[10px]"
                          }
                        >
                          {emp.tier}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3" />
                          {emp.industry}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {emp.location}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">Kebutuhan Talenta:</span>{" "}
                        {emp.recentSearch}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                    <div className="text-center sm:text-right">
                      <p className="font-mono text-base font-bold text-[#7C3AED]">{emp.talentViewed}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Dilihat</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="font-mono text-base font-bold text-emerald-600">{emp.talentHired}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Diterima</p>
                    </div>
                    <div className="text-right pl-2 border-l border-border/60">
                      <p className="text-[11px] font-medium text-foreground">{emp.lastActive}</p>
                      <p className="text-[10px] text-muted-foreground">Aktivitas Terakhir</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="rounded-2xl border border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:p-8 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
              <Sparkles className="size-7" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-base">
                Tingkatkan Penyerapan Lulusan {partnerInstitution}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                Undang lebih banyak mahasiswa angkatan terbaru dan alumni aktif untuk melengkapi portofolio mereka. Profil yang terverifikasi kampus otomatis dipromosikan ke jajaran mitra industri teratas.
              </p>
            </div>
            <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              <Link href="/partner/talent">
                Kelola Antrean Talent <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Users,
  Building2,
  ShieldCheck,
  BadgeCheck,
  Briefcase,
  BarChart3,
  ChevronRight,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  UserCheck,
  Mail,
  Compass,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/providers/app-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PartnerTalentItem {
  id: string;
  name: string;
  initials: string;
  institution: string;
  program: string;
  year: string;
  skills: string[];
  status: "verified" | "pending" | "rejected" | "none";
  views: number;
  email?: string;
  isLiveCandidate?: boolean;
}

const RECENT_EMPLOYERS = [
  { name: "Gojek", industry: "Tech / Superapp", accessed: "2 jam lalu", talent: 12 },
  { name: "Tokopedia", industry: "E-Commerce", accessed: "5 jam lalu", talent: 8 },
  { name: "Traveloka", industry: "Travel Tech", accessed: "1 hari lalu", talent: 4 },
  { name: "Kredivo", industry: "Fintech", accessed: "2 hari lalu", talent: 6 },
];

export default function PartnerDashboardPage() {
  const {
    user,
    activePartnerInstitution,
    verifyCandidateByPartner,
    verifyAllCandidatesForInstitution,
    cvProfile,
  } = useApp();

  const institutionName = user?.companyName || activePartnerInstitution || "ITB STIKOM Bali";

  const [apiTalents, setApiTalents] = useState<PartnerTalentItem[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Fetch real talent data for this partner's institution
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = `/api/partner/talent?institution=${encodeURIComponent(
          institutionName
        )}&status=all`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok && !ignore) {
          const data = await res.json();
          setApiTalents(data.talents || []);
        }
      } catch (err) {
        console.error("Gagal memuat data partner:", err);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [institutionName, refreshIndex]);

  // Combine fetched API talents with live active profile if matching this institution
  const talentPool = useMemo(() => {
    const list: PartnerTalentItem[] = [...apiTalents];

    const cvVerif = cvProfile?.campusVerification;
    if (cvVerif && !list.some((t) => t.id === cvProfile?.id)) {
      const matchInst =
        cvVerif.institution.toLowerCase().includes(institutionName.toLowerCase()) ||
        institutionName.toLowerCase().includes(cvVerif.institution.toLowerCase());

      if (matchInst) {
        const cvEdu = cvProfile?.education?.[0];
        list.unshift({
          id: cvProfile?.id || "my-candidate",
          name: `${cvProfile?.fullName || "Kandidat Anda"} (Profil Aktif)`,
          initials: (cvProfile?.fullName || "KA")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          institution: cvVerif.institution,
          program: cvEdu?.program || cvVerif.program || "Program Studi Mahasiswa",
          year: cvEdu?.dates || cvVerif.year || "2024",
          skills: cvProfile?.skills?.length ? cvProfile.skills : ["Product Design", "Figma"],
          status: cvVerif.status,
          views: 1,
          isLiveCandidate: true,
        });
      }
    }

    return list;
  }, [apiTalents, cvProfile, institutionName]);

  const pendingTalents = useMemo(
    () => talentPool.filter((t) => t.status === "pending"),
    [talentPool]
  );
  const verifiedTalents = useMemo(
    () => talentPool.filter((t) => t.status === "verified"),
    [talentPool]
  );

  const totalRegistered = talentPool.length;
  const totalVerified = verifiedTalents.length;
  const totalPending = pendingTalents.length;

  // Handlers for in-place verification directly from the dashboard
  const handleVerify = async (id: string) => {
    setActionLoading(id);
    await verifyCandidateByPartner(id, "verified");
    setRefreshIndex((prev) => prev + 1);
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await verifyCandidateByPartner(id, "rejected");
    setRefreshIndex((prev) => prev + 1);
    setActionLoading(null);
  };

  const handleBatchVerify = async () => {
    setActionLoading("batch");
    await verifyAllCandidatesForInstitution(institutionName);
    setRefreshIndex((prev) => prev + 1);
    setActionLoading(null);
  };

  // Referral / invitation link for career center
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?campus=${encodeURIComponent(institutionName)}`
      : `https://proofylink.com/register?campus=${encodeURIComponent(institutionName)}`;

  const handleCopyInviteLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Tautan pendaftaran kampus berhasil disalin!", {
        description: `Bagikan ke mahasiswa & alumni ${institutionName} agar profil mereka otomatis terhubung.`,
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Halo mahasiswa & alumni ${institutionName}! Lengkapi profil profesional Anda di ProofyLink Talent Network untuk mendapatkan lencana resmi Campus Verified dari Career Center: ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Dynamic program distribution from real data
  const programDistribution = useMemo(() => {
    const map = new Map<string, number>();
    talentPool.forEach((t) => {
      const prog = t.program?.trim() || "Program Umum";
      map.set(prog, (map.get(prog) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({
        label,
        count,
        pct: talentPool.length ? Math.round((count / talentPool.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [talentPool]);

  // Dynamic top skills from real data
  const topSkills = useMemo(() => {
    const map = new Map<string, number>();
    talentPool.forEach((t) => {
      (t.skills || []).forEach((s) => {
        const key = s.trim();
        if (key) map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [talentPool]);

  // Dynamic metrics aligned with recruiter/candidate stat cells
  const statCells = [
    {
      label: "Mahasiswa Terdata",
      value: `${totalRegistered}`,
      unit: "Talenta",
      hint: totalRegistered > 0 ? `${totalRegistered} profil aktif di sistem` : "Belum ada talenta terdaftar",
      icon: Users,
      colorClass: "text-slate-900",
      bgClass: "bg-slate-100 text-slate-700",
      href: "/partner/talent",
    },
    {
      label: "Campus Verified",
      value: `${totalVerified}`,
      unit: "Profil",
      hint: totalVerified > 0 ? `${totalVerified} menyandang badge resmi` : "Belum ada verifikasi aktif",
      icon: BadgeCheck,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50 text-emerald-600",
      href: "/partner/talent",
    },
    {
      label: "Antrean Verifikasi",
      value: `${totalPending}`,
      unit: "Menunggu",
      hint: totalPending > 0 ? `${totalPending} perlu tindakan persetujuan` : "Antrean verifikasi bersih",
      icon: Clock,
      colorClass: totalPending > 0 ? "text-amber-600" : "text-slate-600",
      bgClass: totalPending > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500",
      href: "/partner/talent",
    },
    {
      label: "Aktivitas Industri",
      value: "4",
      unit: "Employer",
      hint: "Perusahaan aktif mengakses talenta",
      icon: Briefcase,
      colorClass: "text-[#7C3AED]",
      bgClass: "bg-purple-50 text-[#7C3AED]",
      href: "/partner/employers",
    },
  ];

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <GraduationCap className="size-4 text-[#7C3AED]" /> Kemitraan Career Center
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1A2E]">
              Selamat datang, {institutionName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Portal resmi kemitraan universitas — verifikasi mahasiswa &amp; alumni, pantau penyerapan kerja, dan jembatani talenta ke employer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" className="h-9 text-xs font-semibold">
              <Link href="/partner/talent">
                <Users className="size-3.5 mr-1.5" /> Kelola Talent ({totalRegistered})
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-9 text-xs font-semibold">
              <Link href="/partner/analytics">
                <BarChart3 className="size-3.5 mr-1.5" /> Laporan Tracer Study
              </Link>
            </Button>
            <Button
              onClick={handleCopyInviteLink}
              className="h-9 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs"
            >
              <Share2 className="size-3.5 mr-1.5" /> Bagikan Tautan Kampus
            </Button>
          </div>
        </div>

        {/* ── Partner Verification Status & Invitation Banner ─────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-purple-50/50 via-card to-sky-50/30 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#7C3AED]">
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">
                  Partner Terverifikasi ProofyLink · {institutionName}
                </span>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                  Mitra Aktif
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tautan resmi pendaftaran kampus agar profil mahasiswa otomatis terdata ke antrean verifikasi {institutionName}.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Input
                readOnly
                value={inviteUrl}
                className="h-8.5 pr-18 font-mono text-[11px] bg-white border-border/80 text-muted-foreground shadow-2xs"
              />
              <Button
                size="sm"
                onClick={handleCopyInviteLink}
                className="absolute right-1 top-1 h-6.5 text-[11px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-2.5 font-medium cursor-pointer"
              >
                <Copy className="size-3 mr-1" /> Salin
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareWhatsApp}
              className="h-8.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 gap-1.5 w-full sm:w-auto px-3 cursor-pointer"
            >
              <Share2 className="size-3.5" /> WhatsApp
            </Button>
          </div>
        </div>

        {/* ── Key Metrics Grid ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCells.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className={`mt-2 font-mono text-3xl font-bold tracking-tight ${stat.colorClass}`}>
                    {stat.value}{" "}
                    <span className="font-sans text-xs font-normal text-muted-foreground">
                      {stat.unit}
                    </span>
                  </p>
                  <p className="mt-1.5 truncate text-xs text-muted-foreground font-medium">
                    {stat.hint}
                  </p>
                </div>
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.bgClass}`}>
                  <stat.icon className="size-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Main Symmetrical Two-Column Content Grid ───────────── */}
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* LEFT COLUMN: Pilar Mahasiswa & Akademik */}
          <div className="space-y-6">
            {/* Urgent Verification Queue */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Clock className="size-4 text-amber-500" /> Antrean Verifikasi Mendesak
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${
                      totalPending > 0
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {totalPending} Menunggu
                  </Badge>
                </div>

                {totalPending > 1 && (
                  <Button
                    size="sm"
                    onClick={handleBatchVerify}
                    disabled={actionLoading === "batch"}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                  >
                    <UserCheck className="size-3 mr-1" />
                    {actionLoading === "batch" ? "Memproses..." : `Verifikasi Semua (${totalPending})`}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {totalPending === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                    <CheckCircle2 className="mx-auto size-7 text-emerald-600 mb-1.5" />
                    <p className="text-sm font-semibold text-foreground">Antrean Verifikasi Bersih</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Semua mahasiswa &amp; alumni dari <strong>{institutionName}</strong> telah ditinjau. Pengajuan verifikasi baru akan otomatis muncul di sini.
                    </p>
                  </div>
                ) : (
                  pendingTalents.map((talent) => (
                    <div
                      key={talent.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 transition-all hover:bg-amber-50/70"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-[#7C3AED]">
                          {talent.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-foreground">{talent.name}</p>
                            {talent.email && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                <Mail className="size-3" /> {talent.email}
                              </span>
                            )}
                            {talent.isLiveCandidate && (
                              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {talent.program} · Angkatan {talent.year}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {talent.skills.slice(0, 3).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 bg-white">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          disabled={actionLoading === talent.id}
                          onClick={() => handleVerify(talent.id)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs cursor-pointer"
                        >
                          <UserCheck className="size-3.5 mr-1" />
                          {actionLoading === talent.id ? "Memproses..." : "Verifikasi"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === talent.id}
                          onClick={() => handleReject(talent.id)}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Verified Talent Directory Snapshot */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <BadgeCheck className="size-4 text-emerald-600" /> Talenta Terverifikasi ({totalVerified})
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7">
                  <Link href="/partner/talent">
                    Kelola Semua <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {verifiedTalents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-center">
                    <GraduationCap className="mx-auto size-6 text-muted-foreground mb-1" />
                    <p className="text-sm font-semibold text-foreground">Belum ada talenta terverifikasi</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Verifikasi pengajuan dari antrean di atas untuk memberikan lencana resmi.
                    </p>
                  </div>
                ) : (
                  verifiedTalents.slice(0, 3).map((talent) => (
                    <div
                      key={talent.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-[#7C3AED]">
                          {talent.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{talent.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {talent.program} · Angkatan {talent.year}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {talent.views > 0 && (
                          <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
                            {talent.views}× dilihat
                          </span>
                        )}
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="size-2.5 mr-1" /> Campus Verified
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Program Studi & Top Skills Aggregation */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Compass className="size-4 text-sky-600" /> Sebaran Program &amp; Keahlian
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Program Studi Terbanyak</p>
                  {programDistribution.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada data program studi.</p>
                  ) : (
                    <div className="space-y-2">
                      {programDistribution.map((prog) => (
                        <div key={prog.label} className="text-xs">
                          <div className="flex justify-between font-medium mb-1">
                            <span className="truncate">{prog.label}</span>
                            <span className="font-mono text-muted-foreground">{prog.count} talent</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-sky-600" style={{ width: `${prog.pct || 15}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60">
                  <p className="text-xs font-semibold text-foreground mb-2">Keahlian Unggulan Mahasiswa</p>
                  {topSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada keahlian terdaftar.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {topSkills.map((sk) => (
                        <Badge
                          key={sk.name}
                          variant="outline"
                          className="text-[11px] font-medium border-border/80 bg-muted/40 text-foreground px-2 py-0.5"
                        >
                          {sk.name} <span className="ml-1 text-[10px] text-muted-foreground font-mono">({sk.count})</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Pilar Industri, Tracer Study, & Akses Cepat */}
          <div className="space-y-6">
            {/* Tracer Study & Career Readiness Breakdown */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <BarChart3 className="size-4 text-[#7C3AED]" /> Analisis Kesiapan Kerja &amp; Tracer Study
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7">
                  <Link href="/partner/analytics">
                    Laporan <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                    <p className="text-[11px] text-muted-foreground font-medium truncate">Siap Kerja</p>
                    <p className="mt-1 font-mono text-xl font-bold text-slate-900">54%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Open to Work</p>
                  </div>
                  <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-2.5">
                    <p className="text-[11px] text-sky-800 font-medium truncate">Siap Magang</p>
                    <p className="mt-1 font-mono text-xl font-bold text-sky-700">32%</p>
                    <p className="text-[10px] text-sky-600 mt-0.5">Internship</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5">
                    <p className="text-[11px] text-emerald-800 font-medium truncate">Diterima</p>
                    <p className="mt-1 font-mono text-xl font-bold text-emerald-700">14%</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Hired</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-foreground">
                    <span>Progres Penyerapan Alumni ke Industri</span>
                    <span className="font-mono text-[#7C3AED]">78% Target Tercapai</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#7C3AED] transition-all duration-500" style={{ width: "78%" }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <span className="text-[11px] text-muted-foreground block">Rata-rata Waktu Tunggu</span>
                    <span className="font-mono text-sm font-bold text-foreground">1.8 Bulan</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2.5">
                    <span className="text-[11px] text-muted-foreground block">Keselarasan Bidang Ilmu</span>
                    <span className="font-mono text-sm font-bold text-emerald-600">83.4% Tinggi</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Activity Snapshot */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Briefcase className="size-4 text-sky-600" /> Akses Employer
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground h-7">
                  <Link href="/partner/employers">
                    Lihat Semua <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {RECENT_EMPLOYERS.map((emp) => (
                  <div
                    key={emp.name}
                    className="flex items-center justify-between rounded-xl border border-border/60 p-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{emp.industry}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-semibold text-foreground font-mono">{emp.talent} talent</p>
                      <p className="text-[10px] text-muted-foreground">{emp.accessed}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Aksi Cepat Mitra (Persegi Panjang Penuh / Horizontal Grid) ── */}
        <Card className="rounded-2xl border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-[#7C3AED]" /> Aksi Cepat Mitra
              </CardTitle>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Akses cepat navigasi modul kemitraan &amp; career center
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  href: "/partner/talent",
                  icon: BadgeCheck,
                  label: "Kelola & Verifikasi Talent",
                  desc: `${totalPending} menunggu persetujuan`,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  href: "/partner/analytics",
                  icon: BarChart3,
                  label: "Laporan Tracer Study & IKU 1",
                  desc: "Statistik penyerapan lulusan",
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  href: "/partner/employers",
                  icon: Building2,
                  label: "Pantau Akses Perusahaan",
                  desc: "Employer yang menjelajahi kampus",
                  color: "text-sky-600",
                  bg: "bg-sky-50",
                },
                {
                  href: "/search",
                  icon: Users,
                  label: "Jelajahi Talent Pool Publik",
                  desc: "Cari kandidat di seluruh jaringan",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((act) => (
                <Link
                  key={act.href}
                  href={act.href}
                  className="flex items-center gap-3.5 rounded-xl border border-border/70 p-3.5 hover:bg-muted/40 hover:border-border transition-all group bg-card shadow-2xs hover:shadow-xs"
                >
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${act.bg}`}>
                    <act.icon className={`size-5 ${act.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-[#7C3AED] transition-colors">
                      {act.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{act.desc}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Search,
  UserCheck,
  Users,
  Mail,
  Building2,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useApp } from "@/providers/app-provider";
import { type CampusVerification, type EducationItem } from "@/types";

interface PartnerTalentItem {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  initials: string;
  institution: string;
  program: string;
  year: string;
  skills: string[];
  status: "verified" | "pending" | "rejected" | "none";
  views: number;
  isLiveCandidate?: boolean;
  campusVerification?: CampusVerification | null;
  education?: EducationItem[];
}

export default function PartnerTalentPage() {
  const {
    user,
    activePartnerInstitution,
    verifyCandidateByPartner,
    verifyAllCandidatesForInstitution,
    cvProfile,
  } = useApp();

  const partnerInstitution = user?.companyName || activePartnerInstitution || "ITB STIKOM Bali";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [apiTalents, setApiTalents] = useState<PartnerTalentItem[]>([]);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Fetch real candidates belonging strictly to THIS partner institution
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = `/api/partner/talent?institution=${encodeURIComponent(
          partnerInstitution
        )}&status=${filter}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok && !ignore) {
          const data = await res.json();
          setApiTalents(data.talents || []);
        }
      } catch (err) {
        console.error("Gagal memuat data talent mitra:", err);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [partnerInstitution, filter, refreshIndex]);

  // Combine fetched API talents with live active profile if matching this institution
  const talentPool = useMemo(() => {
    const list: PartnerTalentItem[] = [...apiTalents];

    const cvVerif = cvProfile?.campusVerification;
    if (cvVerif && !list.some((t) => t.id === cvProfile?.id)) {
      const matchInst =
        cvVerif.institution.toLowerCase().includes(partnerInstitution.toLowerCase()) ||
        partnerInstitution.toLowerCase().includes(cvVerif.institution.toLowerCase());

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
          campusVerification: cvVerif,
        });
      }
    }

    return list;
  }, [apiTalents, cvProfile, partnerInstitution]);

  const pendingCount = talentPool.filter((t) => t.status === "pending").length;
  const verifiedCount = talentPool.filter((t) => t.status === "verified").length;

  const filtered = talentPool.filter((t) => {
    const matchQ =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.program.toLowerCase().includes(query.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(query.toLowerCase())) ||
      t.institution.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === "all" || t.status === filter;
    return matchQ && matchF;
  });

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
    await verifyAllCandidatesForInstitution(partnerInstitution);
    setRefreshIndex((prev) => prev + 1);
    setActionLoading(null);
  };

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?campus=${encodeURIComponent(partnerInstitution)}`
      : `https://proofylink.com/register?campus=${encodeURIComponent(partnerInstitution)}`;

  const handleCopyInviteLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Tautan pendaftaran kampus berhasil disalin!", {
        description: `Bagikan ke mahasiswa & alumni ${partnerInstitution} agar profil mereka otomatis masuk ke sistem verifikasi.`,
      });
    }
  };

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/partner"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Kembali ke Dashboard
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <GraduationCap className="size-4" /> Talent Kampus Terverifikasi
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1A1A2E]">Kelola Talent Kampus</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Verifikasi mahasiswa &amp; alumni dari <strong>{partnerInstitution}</strong> untuk memberikan badge resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Institution Fixed Badge - Private to this partner only */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 shadow-2xs">
              <Building2 className="size-4 text-[#7C3AED]" />
              <span className="text-xs text-muted-foreground">Institusi:</span>
              <span className="text-xs font-bold text-foreground">{partnerInstitution}</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyInviteLink}
              className="text-xs font-medium gap-1.5 bg-white"
            >
              <Share2 className="size-3.5" /> Bagikan Tautan
            </Button>

            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={handleBatchVerify}
                disabled={actionLoading === "batch"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <UserCheck className="size-3.5 mr-1" />
                {actionLoading === "batch" ? "Memverifikasi..." : `Verifikasi Semua (${pendingCount})`}
              </Button>
            )}
          </div>
        </div>

        {/* Connected Stat Cells */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 shadow-xs">
          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Users className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Total Mahasiswa Terdata</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {talentPool.length} <span className="font-sans text-xs font-normal text-muted-foreground">Talenta</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Basis data kampus {partnerInstitution}</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BadgeCheck className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Campus Verified</span>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-600">
              {verifiedCount} <span className="font-sans text-xs font-normal text-muted-foreground">Disetujui</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Menyandang badge kredensial kampus</p>
          </div>

          <div className="bg-card p-5 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <span className={`flex size-8 items-center justify-center rounded-lg ${pendingCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                <Clock className="size-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Antrean Menunggu</span>
            </div>
            <p className={`mt-2.5 font-mono text-2xl font-bold tabular-nums tracking-tight ${pendingCount > 0 ? "text-amber-600" : "text-slate-600"}`}>
              {pendingCount} <span className="font-sans text-xs font-normal text-muted-foreground">Permintaan</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {pendingCount > 0 ? "Perlu ditinjau oleh tim career center" : "Semua permohonan telah selesai diproses"}
            </p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder="Cari nama, email, atau jurusan..."
              className="pl-10 rounded-xl h-10 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "verified", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {f === "all" ? "Semua" : f === "verified" ? "Terverifikasi" : "Menunggu"}
              </button>
            ))}
          </div>
        </div>

        {/* Talent List */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" /> {filtered.length} talent terdaftar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="rounded-xl bg-muted/40 p-8 text-center border border-dashed border-border/80">
                <GraduationCap className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Tidak ada antrean atau talent terdaftar</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Belum ada kandidat yang mengajukan verifikasi untuk <strong>{partnerInstitution}</strong>. Anda dapat mencoba meminta verifikasi dari akun kandidat di halaman Profil atau CV.
                </p>
              </div>
            ) : (
              filtered.map((talent) => (
                <div
                  key={talent.id}
                  className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-xs ${
                    talent.status === "pending"
                      ? "bg-amber-50/30 border-amber-200/80"
                      : talent.isLiveCandidate
                      ? "bg-purple-50/40 border-purple-200"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-[#7C3AED]">
                    {talent.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{talent.name}</p>
                      {talent.email && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="size-3" /> {talent.email}
                        </span>
                      )}
                      {talent.isLiveCandidate && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
                          Profil Anda
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">{talent.institution}</span> · {talent.program} · Angkatan {talent.year}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {talent.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {talent.views > 0 && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {talent.views}× dilihat employer
                      </span>
                    )}
                    <Badge
                      className={
                        talent.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : talent.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : talent.status === "rejected"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200"
                      }
                    >
                      {talent.status === "verified" ? (
                        <>
                          <CheckCircle2 className="mr-1 size-3" />
                          Terverifikasi
                        </>
                      ) : talent.status === "pending" ? (
                        <>
                          <Clock className="mr-1 size-3" />
                          Menunggu
                        </>
                      ) : talent.status === "rejected" ? (
                        "Ditolak"
                      ) : (
                        "Terdaftar"
                      )}
                    </Badge>

                    {talent.status === "pending" && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={actionLoading === talent.id}
                          onClick={() => handleVerify(talent.id)}
                        >
                          <BadgeCheck className="size-3 mr-1" />
                          {actionLoading === talent.id ? "Memproses..." : "Verifikasi"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          disabled={actionLoading === talent.id}
                          onClick={() => handleReject(talent.id)}
                        >
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

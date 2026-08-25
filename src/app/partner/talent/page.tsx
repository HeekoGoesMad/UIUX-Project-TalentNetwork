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
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useApp } from "@/providers/app-provider";
import { candidates } from "@/data/candidates";
import { PARTNER_CAMPUSES } from "@/types";

export default function PartnerTalentPage() {
  const {
    activePartnerInstitution,
    setActivePartnerInstitution,
    partnerVerifications,
    verifyCandidateByPartner,
    verifyAllCandidatesForInstitution,
    cvProfile,
  } = useApp();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Combine candidates and cvProfile matching the active institution
  const talentPool = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      initials: string;
      program: string;
      year: string;
      skills: string[];
      status: "verified" | "pending" | "rejected";
      views: number;
      isLiveCandidate?: boolean;
    }> = [];

    // Check candidate pool
    candidates.forEach((c, idx) => {
      const verif = partnerVerifications?.[c.id] ?? c.campusVerification;
      const institution = verif?.institution ?? c.education;
      if (institution && institution.toLowerCase().includes(activePartnerInstitution.toLowerCase())) {
        list.push({
          id: c.id,
          name: c.name,
          initials: c.initials,
          program: verif?.program ?? ["Teknik Informatika", "Desain Komunikasi Visual", "Sistem Informasi", "Manajemen Bisnis"][idx % 4],
          year: verif?.year ?? `202${3 + (idx % 2)}`,
          skills: c.skills,
          status: verif?.status ?? "verified",
          views: 2 + (idx % 6),
        });
      }
    });

    // Check if the current user's cvProfile belongs to this campus
    if (cvProfile) {
      const cvEdu = cvProfile.education?.[0];
      const cvVerif = partnerVerifications?.[cvProfile.id || "my-candidate"] ?? cvProfile.campusVerification;
      const cvInst = cvVerif?.institution || cvEdu?.school;
      if (cvInst && cvInst.toLowerCase().includes(activePartnerInstitution.toLowerCase())) {
        list.unshift({
          id: cvProfile.id || "my-candidate",
          name: `${cvProfile.fullName || "Kandidat Anda"} (Profil Aktif)`,
          initials: (cvProfile.fullName || "KA").split(" ").map((n) => n[0]).join("").slice(0, 2),
          program: cvEdu?.program || cvVerif?.program || "Program Studi Mahasiswa",
          year: cvEdu?.dates || cvVerif?.year || "2024",
          skills: cvProfile.skills.length ? cvProfile.skills : ["Product Design", "Figma"],
          status: cvVerif?.status ?? "pending",
          views: 1,
          isLiveCandidate: true,
        });
      }
    }

    return list;
  }, [activePartnerInstitution, partnerVerifications, cvProfile]);

  const verifiedCount = talentPool.filter((t) => t.status === "verified").length;
  const pendingCount = talentPool.filter((t) => t.status === "pending").length;

  const filtered = talentPool.filter((t) => {
    const matchQ = t.name.toLowerCase().includes(query.toLowerCase()) || t.program.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === "all" || t.status === filter;
    return matchQ && matchF;
  });

  const handleVerify = async (id: string) => {
    setActionLoading(id);
    await verifyCandidateByPartner(id, "verified");
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await verifyCandidateByPartner(id, "rejected");
    setActionLoading(null);
  };

  const handleBatchVerify = async () => {
    setActionLoading("batch");
    await verifyAllCandidatesForInstitution(activePartnerInstitution);
    setActionLoading(null);
  };

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8">
        <Link href="/partner" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke Dashboard
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500">
              <GraduationCap className="size-4" /> Talent Kampus Terverifikasi
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1A1A2E]">Kelola Talent Kampus</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Verifikasi mahasiswa & alumni dari <strong>{activePartnerInstitution}</strong> untuk memberikan badge resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Campus Selector */}
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-1.5 shadow-2xs">
              <span className="text-xs text-muted-foreground">Institusi:</span>
              <select
                aria-label="Pilih Institusi Kampus"
                value={activePartnerInstitution}
                onChange={(e) => setActivePartnerInstitution(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
              >
                {PARTNER_CAMPUSES.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>

            {pendingCount > 0 && (
              <Button size="sm" onClick={handleBatchVerify} disabled={actionLoading === "batch"} className="bg-emerald-600 hover:bg-emerald-700">
                <UserCheck className="size-3.5 mr-1" />
                {actionLoading === "batch" ? "Memverifikasi..." : `Verifikasi Semua (${pendingCount})`}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Talent", value: MOCK_TALENT.length, color: "text-slate-900" },
            { label: "Terverifikasi", value: MOCK_TALENT.filter((t) => t.status === "verified").length, color: "text-emerald-600" },
            { label: "Menunggu Verifikasi", value: MOCK_TALENT.filter((t) => t.status === "pending").length, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`font-mono text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3.5 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau program studi..."
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
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
              <div className="rounded-xl bg-muted/40 p-8 text-center">
                <GraduationCap className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Tidak ada talent pada kategori ini</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mahasiswa yang menginput <strong>{activePartnerInstitution}</strong> pada pendidikan profil akan otomatis muncul di sini.
                </p>
              </div>
            ) : (
              filtered.map((talent) => (
                <div
                  key={talent.id}
                  className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-xs ${
                    talent.isLiveCandidate ? "bg-purple-50/40 border-purple-200" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-[#7C3AED]">
                    {talent.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{talent.name}</p>
                      {talent.isLiveCandidate && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
                          Profil Anda
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{talent.program} · Angkatan {talent.year}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {talent.skills.slice(0, 3).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {talent.views > 0 && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">{talent.views}× dilihat employer</span>
                    )}
                    <Badge
                      className={talent.status === "verified"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : talent.status === "pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"}
                    >
                      {talent.status === "verified"
                        ? <><CheckCircle2 className="mr-1 size-3" />Terverifikasi</>
                        : <><Clock className="mr-1 size-3" />Menunggu</>}
                    </Badge>
                    {talent.status === "pending" && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
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

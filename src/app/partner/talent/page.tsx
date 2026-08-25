"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const MOCK_TALENT = [
  { id: "1", name: "Anya Fitriani", initials: "AF", program: "Teknik Informatika", year: "2024", skills: ["React", "TypeScript", "Node.js"], status: "verified", views: 3 },
  { id: "2", name: "Budi Hartono", initials: "BH", program: "Manajemen Bisnis", year: "2024", skills: ["Marketing", "Analytics", "Excel"], status: "verified", views: 1 },
  { id: "3", name: "Citra Maharani", initials: "CM", program: "Desain Komunikasi Visual", year: "2023", skills: ["Figma", "Illustrator", "UI/UX"], status: "verified", views: 5 },
  { id: "4", name: "Dian Purnomo", initials: "DP", program: "Sistem Informasi", year: "2024", skills: ["SQL", "Python", "Tableau"], status: "pending", views: 0 },
  { id: "5", name: "Eko Prasetyo", initials: "EP", program: "Akuntansi", year: "2023", skills: ["SAP", "Excel", "Financial modeling"], status: "verified", views: 2 },
  { id: "6", name: "Fitri Handayani", initials: "FH", program: "Psikologi", year: "2024", skills: ["HR", "Recruitment", "Assessment"], status: "pending", views: 0 },
  { id: "7", name: "Galih Pratama", initials: "GP", program: "Teknik Informatika", year: "2023", skills: ["Go", "Docker", "Kubernetes"], status: "verified", views: 8 },
  { id: "8", name: "Hana Rahmawati", initials: "HR", program: "Komunikasi", year: "2024", skills: ["Content", "Copywriting", "SEO"], status: "verified", views: 4 },
];

export default function PartnerTalentPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");

  const filtered = MOCK_TALENT.filter((t) => {
    const matchQ = t.name.toLowerCase().includes(query.toLowerCase()) || t.program.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === "all" || t.status === filter;
    return matchQ && matchF;
  });

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
            <p className="mt-1 text-muted-foreground text-sm">Verifikasi, pantau, dan kelola talent dari institusi Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="size-3.5" /> Filter Lanjutan
            </Button>
            <Button size="sm">
              <UserCheck className="size-3.5" /> Verifikasi Massal
            </Button>
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
              <Users className="size-4 text-muted-foreground" /> {filtered.length} talent ditemukan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 ? (
              <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
                Tidak ada talent yang cocok dengan pencarian.
              </p>
            ) : (
              filtered.map((talent) => (
                <div
                  key={talent.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm hover:bg-slate-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                    {talent.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{talent.name}</p>
                    <p className="text-xs text-muted-foreground">{talent.program} · Angkatan {talent.year}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {talent.skills.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {talent.views > 0 && (
                      <span className="text-xs text-muted-foreground">{talent.views}× dilihat employer</span>
                    )}
                    <Badge
                      className={talent.status === "verified"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"}
                    >
                      {talent.status === "verified"
                        ? <><CheckCircle2 className="mr-1 size-3" />Terverifikasi</>
                        : <><Clock className="mr-1 size-3" />Menunggu</>}
                    </Badge>
                    {talent.status === "pending" && (
                      <Button size="sm" className="h-7 text-xs">
                        <BadgeCheck className="size-3" /> Verifikasi
                      </Button>
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

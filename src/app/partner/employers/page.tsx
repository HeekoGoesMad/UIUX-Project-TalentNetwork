"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EMPLOYERS = [
  { id: "1", name: "Gojek", industry: "Technology / Superapp", location: "Jakarta", talentViewed: 12, talentHired: 3, lastActive: "2 jam lalu", tier: "Premium" },
  { id: "2", name: "Tokopedia", industry: "E-Commerce", location: "Jakarta", talentViewed: 8, talentHired: 2, lastActive: "5 jam lalu", tier: "Premium" },
  { id: "3", name: "Traveloka", industry: "Travel Tech", location: "Jakarta", talentViewed: 4, talentHired: 1, lastActive: "1 hari lalu", tier: "Standard" },
  { id: "4", name: "Kredivo", industry: "Fintech", location: "Jakarta", talentViewed: 6, talentHired: 1, lastActive: "2 hari lalu", tier: "Standard" },
  { id: "5", name: "Ruangguru", industry: "Edutech", location: "Jakarta", talentViewed: 10, talentHired: 4, lastActive: "3 hari lalu", tier: "Premium" },
  { id: "6", name: "Halodoc", industry: "Healthtech", location: "Jakarta", talentViewed: 5, talentHired: 0, lastActive: "5 hari lalu", tier: "Standard" },
];

export default function PartnerEmployersPage() {
  const totalViews = EMPLOYERS.reduce((a, e) => a + e.talentViewed, 0);
  const totalHired = EMPLOYERS.reduce((a, e) => a + e.talentHired, 0);

  return (
    <ProtectedRoute role="partner">
      <div className="container mx-auto px-4 py-8">
        <Link href="/partner" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke Dashboard
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-sky-600">
              <Building2 className="size-4" /> Employer Access
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1A1A2E]">Employer yang Mengakses</h1>
            <p className="mt-1 text-muted-foreground text-sm">Pantau perusahaan yang menjelajahi talent dari institusi Anda.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Employer", value: EMPLOYERS.length, color: "text-sky-600" },
            { label: "Total Talent Dilihat", value: totalViews, color: "text-[#7C3AED]" },
            { label: "Konfirmasi Hired", value: totalHired, color: "text-emerald-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`font-mono text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Employer List */}
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="size-4 text-sky-600" /> Daftar Employer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EMPLOYERS.map((emp) => (
              <div
                key={emp.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm hover:bg-muted/30"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-bold text-sky-700">
                  {emp.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{emp.name}</p>
                    <Badge
                      className={emp.tier === "Premium"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 text-[10px]"
                        : "bg-slate-50 text-slate-600 border border-slate-200 text-[10px]"}
                    >
                      {emp.tier}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="size-3" />{emp.industry}</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3" />{emp.location}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-center">
                  <div>
                    <p className="font-mono font-bold text-[#7C3AED]">{emp.talentViewed}</p>
                    <p className="text-[10px] text-muted-foreground">talent dilihat</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-emerald-600">{emp.talentHired}</p>
                    <p className="text-[10px] text-muted-foreground">hired</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Aktif</p>
                    <p className="text-xs font-medium">{emp.lastActive}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7">
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="mt-5 border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <TrendingUp className="size-7" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">Ingin menarik lebih banyak employer?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tingkatkan visibilitas talent kampus Anda dengan mendaftarkan lebih banyak mahasiswa ke program Campus Verified Talent.
              </p>
            </div>
            <Button asChild>
              <Link href="/partner/talent">
                Kelola Talent <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

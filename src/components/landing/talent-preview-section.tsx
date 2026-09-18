"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { candidates } from "@/data/candidates";

const CATEGORIES = [
  { id: "all", label: "Semua Peran" },
  { id: "tech", label: "Engineering & Tech" },
  { id: "design", label: "Product & Design" },
  { id: "growth", label: "Growth & Marketing" },
] as const;

export function TalentPreviewSection() {
  const [candidateFilter, setCandidateFilter] = useState<string>("all");

  const filteredCandidates = candidates.filter((c) => {
    if (candidateFilter === "all") return true;
    if (candidateFilter === "tech") {
      return (
        c.role.toLowerCase().includes("engineer") ||
        c.role.toLowerCase().includes("developer") ||
        c.role.toLowerCase().includes("tech")
      );
    }
    if (candidateFilter === "design") {
      return (
        c.role.toLowerCase().includes("designer") ||
        c.role.toLowerCase().includes("product")
      );
    }
    if (candidateFilter === "growth") {
      return (
        c.role.toLowerCase().includes("growth") ||
        c.role.toLowerCase().includes("marketing") ||
        c.role.toLowerCase().includes("lead")
      );
    }
    return true;
  }).slice(0, 4);

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl text-balance">
              Direktori Talent Terkurasi
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Pratinjau profil anonim dari profesional yang telah diverifikasi portofolio dan riwayat kontribusinya. Buka kontak lengkap dengan 1 token saat Anda siap berdiskusi.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((f) => {
              const isActive = candidateFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCandidateFilter(f.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredCandidates.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Belum ada talent pada kategori ini"
              description="Pratinjau direktori demo ini belum memiliki kandidat untuk filter yang dipilih. Coba kategori lain atau telusuri seluruh jaringan di halaman Search."
              action={
                <Button variant="outline" size="sm" onClick={() => setCandidateFilter("all")}>
                  Lihat Semua Peran
                </Button>
              }
              className="md:col-span-2 lg:col-span-4"
            />
          ) : (
            filteredCandidates.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      ID-{c.id.slice(0, 6)}
                    </span>
                    <span className="text-xs text-slate-500">{c.location}</span>
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-slate-900 line-clamp-1">
                    {c.role}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium">
                    {c.experience} tahun pengalaman terbukti
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-slate-50 border border-slate-200/70 px-2 py-0.5 font-mono text-[10px] text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-[#7C3AED] font-semibold">
                    1 Token
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 p-0 px-2"
                    asChild
                  >
                    <Link href={`/talent/${c.id}`}>
                      Periksa Sinyal <ChevronRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 font-semibold"
            asChild
          >
            <Link href="/search">
              Eksplorasi Seluruh 30+ Talent Terkurasi <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

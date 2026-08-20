"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { candidates } from "@/data/candidates";

const CATEGORIES = [
  { id: "all", label: "Semua Role" },
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
    <section className="py-20 lg:py-28 bg-[#201C45] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#DDD6FE] backdrop-blur-md">
            <UserCheck className="size-3.5" /> Eksplorasi Kandidat
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Preview Talent Network Terbuka
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-7">
            Intip profil anonim yang siap diajak berdiskusi.
          </p>

          {/* Filter Chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((f) => (
              <button
                key={f.id}
                onClick={() => setCandidateFilter(f.id)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  candidateFilter === f.id
                    ? "bg-[#7C3AED] text-white font-semibold shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredCandidates.map((c) => (
            <Card
              key={c.id}
              className="border-white/15 bg-white/95 text-[#10233f] shadow-lg backdrop-blur-md rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#7C3AED]">
                      Verified Signal
                    </span>
                    <span className="text-xs text-muted-foreground">{c.location}</span>
                  </div>

                  <h4 className="mt-4 font-bold text-base text-[#0f2040] truncate">{c.role}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.experience} Pengalaman</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">1 Token to unlock</span>
                  <Button size="sm" variant="outline" className="rounded-lg text-xs" asChild>
                    <Link href={`/talent/${c.id}`}>
                      Lihat Sinyal <ChevronRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 font-semibold"
            asChild
          >
            <Link href="/search">
              Lihat Semua 30+ Talent Network <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

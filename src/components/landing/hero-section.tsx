"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroAmbientSignals } from "@/components/landing/hero-ambient-signals";

interface HeroTalentMatch {
  id: string;
  initials: string;
  category: "tech" | "design" | "growth";
  role: string;
  seniority: string;
  location: string;
  keySignal: string;
  skills: string[];
}

const TALENT_MATCHES: HeroTalentMatch[] = [
  {
    id: "match-1",
    initials: "NP",
    category: "tech",
    role: "Staff Platform Engineer",
    seniority: "Staff / Principal",
    location: "Jakarta (Hybrid)",
    keySignal: "Audit arsitektur sistem 100K QPS & PR repo lolos",
    skills: ["Go", "Kubernetes", "PostgreSQL"],
  },
  {
    id: "match-2",
    initials: "RS",
    category: "design",
    role: "Principal Product Designer",
    seniority: "Staff / Lead",
    location: "Bandung (Remote)",
    keySignal: "Design system token & reduksi drop-off 42%",
    skills: ["Design System", "UX Research", "Figma"],
  },
  {
    id: "match-3",
    initials: "CW",
    category: "growth",
    role: "Head of Growth & Operations",
    seniority: "Lead / Director",
    location: "Jakarta (Hybrid)",
    keySignal: "Audit pipeline analitik $2M+ & model atribusi valid",
    skills: ["Growth Loops", "BigQuery", "SQL"],
  },
];

export function HeroSection() {
  const [activeCategory, setActiveCategory] = useState<"tech" | "design" | "growth">("tech");
  const [isHighlightingProof, setIsHighlightingProof] = useState<boolean>(false);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHighlight = () => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    setIsHighlightingProof(true);
    highlightTimerRef.current = setTimeout(() => {
      setIsHighlightingProof(false);
    }, 2800);
  };

  // Reorder matches so the active category match appears on top
  const displayedMatches = [
    ...TALENT_MATCHES.filter((m) => m.category === activeCategory),
    ...TALENT_MATCHES.filter((m) => m.category !== activeCategory),
  ].slice(0, 2);

  return (
    <section className="relative bg-white pt-32 sm:pt-40 lg:pt-44 pb-16 lg:pb-24 border-b border-slate-200/80 overflow-hidden">
      <HeroAmbientSignals />
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_440px] items-start">
          {/* Left Column: Heading & Value Proposition */}
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.16]">
              Temukan talent tepat dari{" "}
              <button
                type="button"
                onClick={triggerHighlight}
                title="Klik untuk menyorot bukti kerja nyata di panel samping"
                className={cn(
                  "group relative inline-block cursor-pointer select-none text-[#5B21B6] whitespace-nowrap transition-transform duration-150 active:scale-[0.98] outline-none rounded-sm align-baseline",
                  isHighlightingProof && "text-[#4C1D95]"
                )}
              >
                <span className="relative z-10 transition-colors duration-200 group-hover:text-[#4C1D95]">
                  bukti kerja nyata
                </span>
                <span
                  aria-hidden="true"
                  className="hero-underline-track absolute left-0 -bottom-1 sm:-bottom-1.5 w-full h-[3.5px] sm:h-[4.5px] pointer-events-none"
                >
                  <span
                    className={cn(
                      "hero-underline-bar block w-full h-full rounded-full shadow-[0_1px_4px_rgba(124,58,237,0.25)]",
                      isHighlightingProof && "hero-underline-bar-active"
                    )}
                  />
                  <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                    <span className="block w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  </span>
                </span>
              </button>,{" "}
              <span className="inline-block whitespace-nowrap">bukan sekadar isi resume</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl text-pretty">
              Talent Network bantu tim kamu ketemu langsung sama profesional tech yang skill-nya sudah terbukti. Lebih transparan, tanpa biaya langganan bulanan, dan privasi kandidat tetap terjaga aman.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                size="lg"
                className="h-12 px-7 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm sm:text-base justify-center transition-all shadow-sm hover:shadow-md cursor-pointer"
                asChild
              >
                <Link href="/search">
                  Jelajahi Talent <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 rounded-xl border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 font-semibold text-sm sm:text-base justify-center transition-colors cursor-pointer"
                asChild
              >
                <Link href="/login">Masuk ke Workspace</Link>
              </Button>
            </div>

            {/* Authoritative Proof Anchor Strip */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-600 font-medium pt-8 border-t border-slate-200">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#7C3AED] shrink-0" />
                <span><strong className="text-slate-900 font-semibold">30+ Talent</strong> Terverifikasi</span>
              </span>
              <span className="flex items-center gap-2">
                <Lock className="size-4 text-[#7C3AED] shrink-0" />
                <span><strong className="text-slate-900 font-semibold">Privasi Aman</strong> &amp; Berizin</span>
              </span>
              <span className="flex items-center gap-2">
                <WalletCards className="size-4 text-[#7C3AED] shrink-0" />
                <span><strong className="text-slate-900 font-semibold">Cuma 1 Token</strong> per Profil</span>
              </span>
            </div>
          </div>

          {/* Right Column: Distilled Talent Specimen Card */}
          <div className="relative w-full max-w-[440px] mx-auto lg:mx-0 lg:w-[440px] shrink-0">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: "tech", label: "Engineering" },
                      { id: "design", label: "Design" },
                      { id: "growth", label: "Growth" },
                    ] as const
                  ).map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-slate-900 text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Pratinjau Profil</span>
              </div>

              {/* Profiles List (Clean, Flat, Editorial) */}
              <div className="divide-y divide-slate-100">
                {displayedMatches.map((item, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "py-3.5 first:pt-1 last:pb-1 space-y-2.5 transition-opacity",
                        !isTop && "opacity-85"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200/80 font-mono text-xs font-semibold text-slate-700">
                            {item.initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {item.role}
                            </h3>
                            <p className="text-[11px] text-slate-500 truncate">
                              {item.seniority} · {item.location}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                          Terverifikasi
                        </span>
                      </div>

                      {/* Clean Evidence Note */}
                      <p
                        className={cn(
                          "text-xs flex items-start gap-1.5 leading-relaxed rounded-lg px-2 py-1 -mx-2 transition-all duration-300",
                          isHighlightingProof
                            ? "bg-purple-100/90 text-purple-950 font-medium ring-1 ring-purple-300/80 shadow-xs"
                            : "text-slate-600 bg-transparent"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "size-3.5 shrink-0 mt-0.5 transition-colors",
                            isHighlightingProof ? "text-[#7C3AED]" : "text-emerald-600"
                          )}
                        />
                        <span>{item.keySignal}</span>
                      </p>

                      {/* Stack Pills & Token Value */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex flex-wrap gap-1">
                          {item.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0">
                          Buka kontak · <strong className="text-slate-800 font-semibold">1 Token</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Clean Link */}
              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/search"
                  className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-primary transition-colors py-1 group cursor-pointer"
                >
                  <span>Lihat semua talent di direktori</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

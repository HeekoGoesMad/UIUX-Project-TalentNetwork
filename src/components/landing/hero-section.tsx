"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, Move, ShieldCheck, Unlock, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidatePreview {
  id: string;
  code: string;
  role: string;
  shortRole: string;
  level: string;
  location: string;
  availability: string;
  matchScore: number;
  pillars: { name: string; score: number; proof: string }[];
  verifiedSkills: string[];
  contactEmail: string;
  contactPhone: string;
}

const CANDIDATES: CandidatePreview[] = [
  {
    id: "cand-1",
    code: "TL-8842",
    role: "Staff Platform Engineer",
    shortRole: "Platform Lead",
    level: "Staff / Principal",
    location: "Jakarta (Remote / Hybrid)",
    availability: "Siap dalam 30 hari",
    matchScore: 96.4,
    pillars: [
      { name: "Arsitektur Sistem Terdistribusi", score: 98, proof: "Audit sistem 100K QPS lolos" },
      { name: "Code Quality & Automated Testing", score: 94, proof: "Top 3% PR produksi terverifikasi" },
      { name: "Production Incident Management", score: 96, proof: "Zero critical incident track record" },
    ],
    verifiedSkills: ["Go", "Kubernetes", "PostgreSQL", "Kafka"],
    contactEmail: "nur.pratama@engineer.id",
    contactPhone: "+62 812-8821-9821",
  },
  {
    id: "cand-2",
    code: "TL-7219",
    role: "Principal Product Designer",
    shortRole: "Product Designer",
    level: "Staff / Lead",
    location: "Bandung (Full Remote)",
    availability: "Tersedia segera",
    matchScore: 94.8,
    pillars: [
      { name: "Design System Architecture", score: 97, proof: "Figma token system terverifikasi" },
      { name: "Product Strategy & Discovery", score: 95, proof: "Reduksi drop-off checkout 42%" },
      { name: "Quantitative Usability Research", score: 92, proof: "Validated usability benchmarks" },
    ],
    verifiedSkills: ["Design Systems", "Figma", "Quantitative UX", "Design Ops"],
    contactEmail: "rian.saputra@outlook.com",
    contactPhone: "+62 811-9012-4432",
  },
  {
    id: "cand-3",
    code: "TL-5503",
    role: "Head of Growth & Operations",
    shortRole: "Growth Lead",
    level: "Lead / Director",
    location: "Jakarta (Hybrid)",
    availability: "Notice 45 hari",
    matchScore: 93.1,
    pillars: [
      { name: "CAC:LTV Optimization Modeling", score: 96, proof: "Audit pipeline B2B $2M+ valid" },
      { name: "Attribution & Data Pipeline Rigor", score: 94, proof: "BigQuery attribution model valid" },
      { name: "B2B SaaS Sales Cycle Acceleration", score: 92, proof: "Cycle time reduced by 28%" },
    ],
    verifiedSkills: ["Growth Loops", "BigQuery", "Attribution", "SQL"],
    contactEmail: "chandra.w@growth.id",
    contactPhone: "+62 813-2201-1190",
  },
];

export function HeroSection() {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePreview>(CANDIDATES[0]);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  // Drag physics state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSnapping, setIsSnapping] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Ignore drag start if user is clicking button controls or links
    if ((e.target as HTMLElement).closest("button, a")) return;

    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    setIsDragging(true);
    setIsSnapping(false);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;

    // Boundary damping keeps card centered near original placement
    const dampedX = rawX * 0.85;
    const dampedY = rawY * 0.85;

    setDragOffset({ x: dampedX, y: dampedY });
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(false);
    setIsSnapping(true);
    setDragOffset({ x: 0, y: 0 });

    snapTimerRef.current = setTimeout(() => {
      setIsSnapping(false);
    }, 500);
  };

  // Compute smooth transform styles
  const cardTransform = isDragging
    ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.035}deg)`
    : isSnapping
    ? "translate3d(0, 0, 0) rotate(0deg)"
    : undefined;

  return (
    <section className="relative bg-white pt-32 sm:pt-40 lg:pt-44 pb-16 lg:pb-24 border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* items-start anchors left and right columns independently */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* Left Column: Completely Independent & Stable */}
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-6xl lg:text-[4rem] font-extrabold tracking-tight text-slate-900 leading-[1.06] text-balance">
              Rekrut talent kredibel dari{" "}
              <span className="text-slate-950 underline decoration-[#7C3AED] decoration-3 underline-offset-8">
                sinyal nyata
              </span>
              , bukan klaim resume
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl text-pretty">
              ProofyLink menghubungkan hiring team dengan profesional teknologi terverifikasi di Indonesia melalui evaluasi portofolio objektif, privasi berizin (consent-first), dan model 1 token transparan tanpa biaya langganan.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                size="lg"
                className="h-12 px-7 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm sm:text-base justify-center transition-all shadow-sm hover:shadow-md"
                asChild
              >
                <Link href="/search">
                  Eksplorasi Direktori Talent <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 rounded-xl border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 font-semibold text-sm sm:text-base justify-center transition-colors"
                asChild
              >
                <Link href="/login">Masuk ke Workspace</Link>
              </Button>
            </div>

            {/* Authoritative Proof Anchor Strip */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-600 font-medium pt-8 border-t border-slate-200">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#7C3AED] shrink-0" />
                <span><strong className="text-slate-900 font-semibold">30+ Profil</strong> Terverifikasi</span>
              </span>
              <span className="flex items-center gap-2">
                <Lock className="size-4 text-[#7C3AED] shrink-0" />
                <span><strong className="text-slate-900 font-semibold">Consent-First</strong> Berizin</span>
              </span>
              <span className="flex items-center gap-2">
                <WalletCards className="size-4 text-[#7C3AED] shrink-0" />
                <span><strong className="text-slate-900 font-semibold">1 Token</strong> per Profil</span>
              </span>
            </div>
          </div>

          {/* Right Column: Distilled Draggable Talent Dossier Card */}
          <div className="relative w-full min-h-[480px]">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                transform: cardTransform,
                transition: isSnapping ? "transform 500ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease" : isDragging ? "none" : undefined,
                willChange: isDragging || isSnapping ? "transform" : "auto",
              }}
              className={`rounded-2xl border border-slate-200/90 bg-white select-none transition-shadow ${
                isDragging
                  ? "shadow-2xl shadow-slate-900/15 cursor-grabbing"
                  : isSnapping
                  ? "shadow-xl shadow-slate-900/5 cursor-grab"
                  : "shadow-xl shadow-slate-900/5 cursor-grab animate-hero-float"
              }`}
            >
              {/* Dossier Header: Geser kartu affordance + Candidate Switcher */}
              <div className="border-b border-slate-200/80 bg-slate-50/70 p-3.5 sm:px-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-1.5">
                    <Move className="size-3.5 text-slate-400" /> Geser kartu
                  </span>
                </div>

                {/* Candidate Switcher */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  {CANDIDATES.map((cand) => {
                    const isActive = cand.id === selectedCandidate.id;
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setUnlocked(false);
                        }}
                        className={`px-2.5 py-0.5 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white shadow-xs font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {cand.shortRole}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dossier Body - Sizing guaranteed constant to decouple following sections */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Candidate Header & Score */}
                <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedCandidate.code}
                      </span>
                      <span className="text-xs text-emerald-800 bg-emerald-50 font-semibold px-2 py-0.5 rounded border border-emerald-200/60">
                        Status Terverifikasi
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 truncate max-w-[240px] sm:max-w-none">
                      {selectedCandidate.role}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {selectedCandidate.level} · {selectedCandidate.location} · {selectedCandidate.availability}
                    </p>
                  </div>

                  <div className="bg-purple-50/80 border border-purple-200/70 rounded-xl px-3 py-1.5 text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#7C3AED] block tracking-wider">
                      AI Match
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#7C3AED] tabular-nums">
                      {selectedCandidate.matchScore}%
                    </span>
                  </div>
                </div>

                {/* 3 Distilled Pillar Benchmarks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Bukti Sinyal Kompetensi</span>
                    <span className="font-mono">Skala 100</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedCandidate.pillars.map((pillar) => (
                      <div key={pillar.name} className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-medium">{pillar.name}</span>
                          <span className="font-mono text-slate-900 font-bold tabular-nums">{pillar.score}/100</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                          <span>{pillar.proof}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verified Skill Stack */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedCandidate.verifiedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-white border border-slate-200 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Distilled 1-Token Unlock Bar with Stable Fixed Height */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {unlocked ? (
                        <Unlock className="size-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="size-3.5 text-slate-500" />
                      )}
                      <span>
                        {unlocked ? "Kontak Resmi Terbuka" : "Identitas Terenkripsi"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-[#7C3AED]">
                      1 Token
                    </span>
                  </div>

                  {/* Constant height container guarantees zero height shift when unlocking */}
                  <div className="h-[46px] flex flex-col justify-center bg-white px-3 py-1.5 rounded-lg border border-slate-200/80">
                    {unlocked ? (
                      <div className="space-y-0.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">WhatsApp:</span>
                          <span className="font-semibold text-slate-900">{selectedCandidate.contactPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-semibold text-slate-900">{selectedCandidate.contactEmail}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5 text-xs font-mono text-slate-400">
                        <div className="flex justify-between">
                          <span>WhatsApp:</span>
                          <span className="tracking-wider text-slate-500 font-sans text-[11px]">• • • •  • • • •  • • • •</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="tracking-wider text-slate-500 font-sans text-[11px]">••••••••••@••••••.id</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setUnlocked(!unlocked)}
                    className={`w-full h-8 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      unlocked
                        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {unlocked ? "Sembunyikan Kontak" : "Simulasikan Buka Kontak (1 Token)"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

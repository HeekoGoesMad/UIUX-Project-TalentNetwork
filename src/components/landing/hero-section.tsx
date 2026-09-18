"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidatePreview {
  id: string;
  code: string;
  role: string;
  level: string;
  location: string;
  availability: string;
  matchScore: number;
  pillars: { name: string; score: number }[];
  verifiedSkills: string[];
  proofPoints: string[];
  contactEmail: string;
  contactPhone: string;
}

const CANDIDATES: CandidatePreview[] = [
  {
    id: "cand-1",
    code: "TL-8842",
    role: "Staff Platform Engineer",
    level: "Staff / Principal",
    location: "Jakarta (Remote / Hybrid)",
    availability: "Siap dalam 30 hari",
    matchScore: 96.4,
    pillars: [
      { name: "Arsitektur Sistem Terdistribusi", score: 98 },
      { name: "Code Quality & Automated Testing", score: 94 },
      { name: "Production Incident Management", score: 96 },
      { name: "Engineering Leadership & Mentoring", score: 92 },
    ],
    verifiedSkills: ["Kubernetes", "Go", "Distributed Tracing", "PostgreSQL", "Kafka"],
    proofPoints: [
      "Audit PR Production Terverifikasi (Top 3%)",
      "Live System Design Benchmarking Lolos",
      "2 Rekomendasi VP of Engineering Valid",
    ],
    contactEmail: "n***.p******@gmail.com",
    contactPhone: "+62 812-****-9821",
  },
  {
    id: "cand-2",
    code: "TL-7219",
    role: "Principal Product Designer",
    level: "Staff / Lead",
    location: "Bandung (Full Remote)",
    availability: "Tersedia segera",
    matchScore: 94.8,
    pillars: [
      { name: "Design System Architecture", score: 97 },
      { name: "Product Strategy & Discovery", score: 95 },
      { name: "Usability Benchmarking & UX Research", score: 92 },
      { name: "Cross-functional Collaboration", score: 96 },
    ],
    verifiedSkills: ["Figma Systems", "Design Tokens", "Quantitative UX", "Design Ops", "Prototyping"],
    proofPoints: [
      "Figma Design Token Library Live Tested",
      "Case Study Reduksi Drop-off 42% Terverifikasi",
      "Peer Review dari Head of Product",
    ],
    contactEmail: "r***.s******@outlook.com",
    contactPhone: "+62 811-****-4432",
  },
  {
    id: "cand-3",
    code: "TL-5503",
    role: "Head of Growth & Performance",
    level: "Lead / Director",
    location: "Jakarta (On-site / Hybrid)",
    availability: "Notice 45 hari",
    matchScore: 93.1,
    pillars: [
      { name: "CAC:LTV Optimization Modeling", score: 96 },
      { name: "Attribution & Data Pipeline Rigor", score: 94 },
      { name: "B2B SaaS Sales Cycle Acceleration", score: 92 },
      { name: "Team Leadership & P&L Discipline", score: 91 },
    ],
    verifiedSkills: ["Growth Loops", "SQL / BigQuery", "Paid Acquisition", "Attribution Modeling", "HubSpot"],
    proofPoints: [
      "Audit Portofolio Akuisisi B2B ($2M+ Pipeline)",
      "Verifikasi Dampak Metrik oleh Ex-Founder",
      "Assessment Data-Driven Hypothesis Lolos",
    ],
    contactEmail: "c***.w******@gmail.com",
    contactPhone: "+62 813-****-1190",
  },
];

export function HeroSection() {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePreview>(CANDIDATES[0]);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  return (
    <section className="relative bg-white pt-24 sm:pt-32 pb-16 lg:pb-24 border-b border-slate-200/80">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] items-center">
          {/* Left Editorial Copy */}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-[3.75rem] lg:leading-[1.08] text-balance">
              Rekrut Talent Kredibel Berdasarkan Sinyal Nyata, Bukan Klaim Resume
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-xl text-pretty">
              ProofyLink menghubungkan hiring team dengan profesional terverifikasi melalui evaluasi sinyal kompetensi objektif, privasi berbasis izin (consent-first), dan model token transparan tanpa biaya langganan bulanan.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                size="lg"
                className="rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm px-7 font-semibold h-12 text-sm sm:text-base justify-center transition-colors"
                asChild
              >
                <Link href="/search">
                  Eksplorasi Direktori Talent <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-6 h-12 text-sm sm:text-base justify-center font-medium"
                asChild
              >
                <Link href="/login">Masuk ke Workspace</Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-xs sm:text-sm text-slate-600 font-medium">
              <div>
                <p className="text-slate-900 font-semibold">Tervalidasi Praktis</p>
                <p className="text-slate-500 text-xs mt-0.5">Audit skill & repo nyata</p>
              </div>
              <div>
                <p className="text-slate-900 font-semibold">Consent-First</p>
                <p className="text-slate-500 text-xs mt-0.5">Privasi kandidat terjaga</p>
              </div>
              <div>
                <p className="text-slate-900 font-semibold">1 Token / Unlock</p>
                <p className="text-slate-500 text-xs mt-0.5">Tanpa komitmen tahunan</p>
              </div>
            </div>
          </div>

          {/* Right: Authentic Interactive Talent Dossier Widget */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
              {/* Dossier Header & Tabs */}
              <div className="border-b border-slate-200/80 bg-slate-50/70 p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#7C3AED]" />
                  <span className="text-xs font-semibold text-slate-700">Dossier Sinyal Kandidat</span>
                  <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Live Sample
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
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                          isActive
                            ? "bg-[#7C3AED] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {cand.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dossier Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Candidate Overview Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedCandidate.code}
                      </span>
                      <span className="text-xs text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded border border-emerald-200/60">
                        Status Terverifikasi
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">
                      {selectedCandidate.role}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedCandidate.level} · {selectedCandidate.location} · {selectedCandidate.availability}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Index Kecocokan</p>
                    <p className="font-mono text-2xl sm:text-3xl font-bold text-[#7C3AED] tabular-nums">
                      {selectedCandidate.matchScore}%
                    </p>
                  </div>
                </div>

                {/* 5-Pillar Score Assessment */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5 font-medium">
                    <span>Evaluasi Pilar Kompetensi Objektif</span>
                    <span>Skala 100</span>
                  </div>
                  <div className="space-y-2">
                    {selectedCandidate.pillars.map((pillar) => (
                      <div key={pillar.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium">{pillar.name}</span>
                          <span className="font-mono text-slate-900 font-semibold tabular-nums">{pillar.score}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
                            style={{ width: `${pillar.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proof Signals & Skills */}
                <div className="space-y-3 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">Bukti Validasi yang Terverifikasi:</p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {selectedCandidate.proofPoints.map((point) => (
                        <li key={point} className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedCandidate.verifiedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-slate-100 border border-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Consent & Contact Unlock Simulation Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {unlocked ? (
                        <Unlock className="size-4 text-emerald-600" />
                      ) : (
                        <Lock className="size-4 text-amber-600" />
                      )}
                      <span className="text-xs font-semibold text-slate-800">
                        {unlocked ? "Kontak Resmi Terbuka" : "Identitas Terenkripsi"}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Biaya: 1 Token</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Email Kontak</span>
                      <span className="font-mono text-slate-800 text-[11px] truncate block">
                        {unlocked ? "nur.pratama@engineer.id" : selectedCandidate.contactEmail}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Nomor WhatsApp</span>
                      <span className="font-mono text-slate-800 text-[11px] truncate block">
                        {unlocked ? "+62 812-8821-9821" : selectedCandidate.contactPhone}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={unlocked ? "outline" : "default"}
                    onClick={() => setUnlocked(!unlocked)}
                    className={`w-full h-8 text-xs font-medium rounded-lg transition-colors ${
                      unlocked
                        ? "border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {unlocked ? "Kunci Kembali Pratinjau" : "Simulasikan Buka Kontak (1 Token)"}
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

"use client";

import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Lock,
  Search,
  Unlock,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "search", label: "Pencarian Sinyal", icon: Search },
  { id: "privacy", label: "Kendali Privasi", icon: Lock },
  { id: "tokens", label: "Kalkulator ROI", icon: WalletCards },
  { id: "ai", label: "Asisten Wawancara", icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function FeatureTabsSection() {
  const [activeTab, setActiveTab] = useState<TabId>("search");
  const [hiringGoal, setHiringGoal] = useState<number>(3);

  const handleTablistKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    setActiveTab(TABS[nextIndex].id);
    document.getElementById(`feature-tab-${TABS[nextIndex].id}`)?.focus();
  };

  // Calculations for token calculator
  // Traditional agency: avg salary 25M x 12 = 300M, 15% fee = 45M per hire
  const agencyCost = hiringGoal * 45000000;
  // ProofyLink: ~10 unlocked profiles per hire = hiringGoal * 10 tokens = ~Rp 250,000 per 10 tokens
  const proofyTokensNeeded = hiringGoal * 10;
  const proofyCost = Math.ceil(proofyTokensNeeded / 10) * 250000;
  const totalSavings = agencyCost - proofyCost;

  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200/80 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl text-balance">
            Intelijen Rekrutmen yang Transparan dan Akuntabel
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Kombinasi analisis kompetensi objektif, protokol privasi berizin, dan model biaya berbasis penggunaan yang efisien bagi perusahaan berkembang.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div
          role="tablist"
          aria-label="Fitur platform intelijen"
          onKeyDown={handleTablistKeyDown}
          className="mt-12 flex flex-wrap gap-2 border-b border-slate-200 pb-3"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`feature-tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`feature-panel-${tab.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="mt-8">
          {/* TAB 1: SEARCH */}
          <div
            role="tabpanel"
            id="feature-panel-search"
            aria-labelledby="feature-tab-search"
            tabIndex={0}
            hidden={activeTab !== "search"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Evaluasi Sinyal Kompetensi Tanpa Noise Resume
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Resume konvensional kerap diisi klaim spekulatif. ProofyLink mengevaluasi rekam jejak kode, kontribusi arsitektur produksi, serta keabsahan referensi rekan kerja.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Algoritma pencocokan 5 pilar teknis dengan akurasi 96%+</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Filter parameter: ketersediaan, ekspektasi gaji, & mode kerja</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Transparansi metrik tanpa manipulasi kata kunci</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl">
                    <Link href="/search">
                      Coba Pencarian Sekarang <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Interactive Search Mockup */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-500">
                  <Search className="size-3.5 text-slate-400" />
                  <span className="text-slate-800 font-medium">Platform Engineer (Distributed Systems)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded">Go / Rust</span>
                  <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded">Kubernetes</span>
                  <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded">Gaji: Rp 30M-45M</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-[11px] text-slate-400">#TL-8842</span>
                      <p className="font-bold text-slate-900 mt-0.5">Staff Platform & Infra Lead</p>
                      <p className="text-[11px] text-slate-500">Notice: 30 hari · Jabodetabek</p>
                    </div>
                    <span className="font-mono font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded">
                      96.4% Match
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-[11px] text-slate-400">#TL-9104</span>
                      <p className="font-bold text-slate-900 mt-0.5">Senior Backend Architect</p>
                      <p className="text-[11px] text-slate-500">Notice: Segera · Remote</p>
                    </div>
                    <span className="font-mono font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded">
                      93.8% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 2: PRIVACY */}
          <div
            role="tabpanel"
            id="feature-panel-privacy"
            aria-labelledby="feature-tab-privacy"
            tabIndex={0}
            hidden={activeTab !== "privacy"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Perlindungan Privasi Berizin (Consent-First)
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Kandidat pasif dapat mengeksplorasi kesempatan karier tanpa risiko diketahui perusahaan saat ini. Kontak langsung hanya dibuka ketika ada kesepakatan dua arah.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Identitas kandidat disamarkan secara otomatis</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Recruiter hanya membayar token untuk profil yang relevan</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Kepatuhan perlindungan data pribadi kandidat</span>
                  </div>
                </div>
              </div>

              {/* Side by side state */}
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 font-semibold text-amber-700 mb-2">
                    <Lock className="size-4 text-amber-600" />
                    <span>Sebelum Unlock (Tampilan Publik Recruiter)</span>
                  </div>
                  <p className="text-slate-600">Nama: [Disamarkan · Kandidat ID #TL-7219]</p>
                  <p className="text-slate-600">Kontak: [Tersedia setelah konfirmasi 1 token]</p>
                  <p className="text-slate-600">Portofolio: Evaluasi desain & metrik dampak tanpa nama brand sensitif.</p>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800 mb-2">
                    <Unlock className="size-4 text-emerald-600" />
                    <span>Setelah Unlock (Akses Resmi Berizin)</span>
                  </div>
                  <p className="text-slate-700">Nama: Rian Saputra (Principal Designer)</p>
                  <p className="text-slate-700">Kontak: rian.saputra@outlook.com · +62 811-9012-4432</p>
                  <p className="text-slate-700">Status: Kandidat menyetujui sesi diskusi teknis.</p>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 3: TOKENS ROI CALCULATOR */}
          <div
            role="tabpanel"
            id="feature-panel-tokens"
            aria-labelledby="feature-tab-tokens"
            tabIndex={0}
            hidden={activeTab !== "tokens"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Kalkulator Efisiensi Anggaran Rekrutmen
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Headhunter konvensional membebankan biaya 15%–20% dari gaji tahunan kandidat. ProofyLink hanya memerlukan 1 token (Rp 19.800–Rp 25.000) per pembukaan kontak terverifikasi.
                </p>

                <div className="mt-6 space-y-3">
                  <label htmlFor="hiring-goal-input" className="text-xs font-semibold text-slate-700 block">
                    Target Rekrutmen Kuartal Ini ({hiringGoal} Talent)
                  </label>
                  <input
                    id="hiring-goal-input"
                    type="range"
                    min={1}
                    max={15}
                    value={hiringGoal}
                    onChange={(e) => setHiringGoal(Number(e.target.value))}
                    className="w-full accent-[#7C3AED]"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>1 Hire</span>
                    <span>8 Hire</span>
                    <span>15 Hire</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Estimasi Agency Konvensional:</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    Rp {agencyCost.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                  <span className="text-slate-600">Biaya Token ProofyLink (~{proofyTokensNeeded} Token):</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    Rp {proofyCost.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/70 text-center">
                  <span className="text-xs text-emerald-800 font-medium block">
                    Estimasi Efisiensi Anggaran Anda:
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-emerald-700 mt-1 block">
                    Hemat Rp {totalSavings.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 4: AI CAREER ADVISOR */}
          <div
            role="tabpanel"
            id="feature-panel-ai"
            aria-labelledby="feature-tab-ai"
            tabIndex={0}
            hidden={activeTab !== "ai"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Asisten Wawancara Berdasarkan Jejak Rekam Nyata
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Bantu tim hiring menyusun pertanyaan wawancara teknis yang tajam dan relevan langsung dari sinyal pilar kandidat, memangkas waktu persiapan sesi teknis.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Dibuat berdasarkan repo & studi kasus kandidat yang diaudit</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Rubrik penilaian objektif untuk setiap pertanyaan</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Dukungan model AI transparan yang dapat diedit oleh tim</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                  <span>Asisten Wawancara Teknis</span>
                  <span className="font-mono text-slate-400">Model: GPT-4o Evaluator</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <p className="font-semibold text-slate-800">Pertanyaan Wawancara Terarah Disarankan:</p>
                  <p className="text-slate-600 leading-relaxed italic">
                    &quot;Pada arsitektur message queue Kafka yang diaudit, bagaimana Anda menangani deduplikasi pesan saat terjadi broker failover?&quot;
                  </p>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-purple-900 space-y-1">
                  <p className="font-semibold text-xs">Rubrik Penilaian Objektif:</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kandidat diharapkan menjelaskan konsep Idempotent Producer, transaction ID, dan penanganan distributed state secara praktis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

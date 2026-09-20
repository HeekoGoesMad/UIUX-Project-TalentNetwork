"use client";

import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  Kanban,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Unlock,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "search", label: "Pencarian Sinyal", icon: Search },
  { id: "ats", label: "Pipeline ATS & AI Tools", icon: Kanban },
  { id: "candidate", label: "Career Hub & CV ATS", icon: Sparkles },
  { id: "privacy", label: "Consent & Privasi", icon: Lock },
  { id: "partner", label: "Kemitraan Kampus", icon: GraduationCap, badge: "Coming Soon" },
  { id: "tokens", label: "Kalkulator ROI", icon: WalletCards },
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
  // Talent Network: ~10 unlocked profiles per hire = hiringGoal * 10 tokens = ~Rp 250,000 per 10 tokens
  const tokensNeeded = hiringGoal * 10;
  const tokenCost = Math.ceil(tokensNeeded / 10) * 250000;
  const totalSavings = agencyCost - tokenCost;

  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200/80 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl text-balance">
            Fitur Cerdas untuk Rekrutmen yang Tenang &amp; Terarah
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Semua yang kamu butuhkan untuk menemukan, mengevaluasi, dan merekrut talent tepat: sinyal 5 pilar objektif, pipeline ATS terintegrasi, alat karier talent, privasi aman dengan izin sejak awal, dan biaya token transparan.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div
          role="tablist"
          aria-label="Fitur platform intelijen"
          onKeyDown={handleTablistKeyDown}
          className="mt-12 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3"
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
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{tab.label}</span>
                {"badge" in tab && tab.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-purple-100 text-[#7C3AED]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
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
                  Cari Berdasarkan Sinyal 5 Pilar, Tanpa Drama Resume
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Resume konvensional kerap diisi klaim spekulatif. Talent Network memvalidasi 5 pilar kompetensi secara objektif: Arsitektur &amp; Kode, Problem Solving, Kolaborasi Tim, Dampak Bisnis, dan Keandalan Sistem.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Evaluasi 5 pilar kompetensi terukur dari rekam jejak nyata</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Filter parameter: ketersediaan, rentang gaji, tech stack, &amp; verifikasi kampus</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Transparansi bukti kerja konkret tanpa trik manipulasi keyword resume</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl">
                    <Link href="/search">
                      Coba Search Sekarang <ArrowRight className="ml-2 size-4" />
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
                  <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded">Go / Rust</span>
                  <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded">Kubernetes</span>
                  <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded">Gaji: Rp 30M-45M</span>
                  <span className="bg-white border border-purple-200 text-purple-700 px-2.5 py-1 rounded font-medium">Career Center Mitra</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-slate-500">#TL-8842</span>
                        <p className="font-bold text-slate-900 mt-0.5">Staff Platform &amp; Infra Lead</p>
                        <p className="text-[11px] text-slate-500">Notice: 30 hari · Jabodetabek</p>
                      </div>
                      <span className="font-mono font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded">
                        96.4% Match
                      </span>
                    </div>
                    {/* Mini 5-pillar competency radar pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Arsitektur: 94</span>
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Keandalan: 96</span>
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Problem Solving: 92</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-slate-500">#TL-9104</span>
                        <p className="font-bold text-slate-900 mt-0.5">Senior Backend Architect</p>
                        <p className="text-[11px] text-slate-500">Notice: Segera · Remote</p>
                      </div>
                      <span className="font-mono font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded">
                        93.8% Match
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Arsitektur: 92</span>
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Keandalan: 95</span>
                      <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Dampak Bisnis: 90</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 2: ATS & AI INTERVIEW */}
          <div
            role="tabpanel"
            id="feature-panel-ats"
            aria-labelledby="feature-tab-ats"
            tabIndex={0}
            hidden={activeTab !== "ats"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Pipeline Rekrutmen ATS &amp; AI Interview Berbasis Data Nyata
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Kelola seluruh proses seleksi dari satu dasbor Kanban terintegrasi. Dilengkapi ringkasan screening AI objektif dan generator pertanyaan wawancara teknis mendalam yang disusun dari pull request serta arsitektur asli kandidat.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Kanban ATS 5 tahap: Review Awal, Screening AI, Interview Teknis, Final Offer, &amp; Hired</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Generator pertanyaan wawancara teknis mendalam dengan rubrik penilaian objektif</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>AI screening summary merangkum kekuatan, trade-off arsitektur, dan kecocokan peran</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl">
                    <Link href="/recruiter/operations">
                      Lihat Pipeline Operasi <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* ATS Kanban & Interview Question Specimen */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2.5">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-[#7C3AED]" /> Model Evaluasi v2.4
                  </span>
                  <span className="font-mono text-slate-500">Pipeline ATS Terintegrasi</span>
                </div>

                {/* Mini Kanban Stages */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="bg-white border border-slate-200 p-2 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Review Awal</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">3 Talent</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg">
                    <span className="text-purple-700 block text-[10px] font-semibold">Interview Teknis</span>
                    <span className="font-bold text-purple-950 mt-0.5 block">1 Talent</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-2 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Final Offer</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">1 Talent</span>
                  </div>
                </div>

                {/* Candidate Interview Question Box */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Pertanyaan Wawancara Khusus:</span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      Staff Level
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed italic">
                    &quot;Pada arsitektur message queue Kafka yang diaudit, bagaimana Anda menangani deduplikasi pesan saat terjadi broker failover?&quot;
                  </p>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-purple-900 space-y-1">
                  <p className="font-semibold text-xs">Rubrik Penilaian Objektif:</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kandidat diharapkan menjelaskan konsep Idempotent Producer, transaction ID, dan penanganan ordered partition recovery secara praktis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 3: CANDIDATE CAREER HUB & CV ATS */}
          <div
            role="tabpanel"
            id="feature-panel-candidate"
            aria-labelledby="feature-tab-candidate"
            tabIndex={0}
            hidden={activeTab !== "candidate"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  AI Career Hub &amp; CV Builder Berstandar ATS untuk Talenta
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Talenta profesional dapat mengimpor CV PDF mereka untuk diekstraksi otomatis menjadi draf profil yang 100% dapat diedit, menghasilkan pratinjau CV ATS kontras tinggi siap cetak, serta memetakan lompatan karier dengan AI Career Advisor.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Impor CV PDF dengan ekstraksi cerdas ke draf profil yang dapat diedit sebelum disimpan</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Pratinjau CV format tunggal berstandar ATS dengan ekspor PDF siap kirim</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>AI Career Advisor dengan 3 fokus: Transition Track, Tech Lead Acceleration, &amp; Gap Analysis</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl">
                    <Link href="/candidate/cv">
                      Coba CV Workspace <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Candidate Hub Specimen */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" /> CV Workspace &amp; ATS Optimizer
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    Kesiapan: 92% (High Signal Tier)
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Format Tunggal Standar ATS</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Print-to-PDF Ready
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Struktur ramah parser otomatis tanpa tabel rumit, ikon terdistorsi, atau kolom terpisah yang sering menyebabkan resume tertolak sistem HR.
                  </p>
                </div>

                {/* AI Career Advisor Roadmap Box */}
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-purple-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#7C3AED]" /> AI Career Advisor: Tech Lead Track
                    </span>
                    <span className="text-[10px] font-mono text-purple-800 font-medium">12–18 Bulan</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-purple-950">Rekomendasi Milestone:</strong> Fokus penguatan distributed observability (OpenTelemetry), arsitektur multi-region, serta mentoring rekan kerja untuk mencapai kualifikasi Staff Engineer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 4: PRIVACY */}
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
                  Privasi Terproteksi &amp; Izin Resmi di Awal Registrasi
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Kandidat telah memberikan persetujuan akses data dan privasi resmi sejak awal registrasi akun. Identitas awal tetap diproteksi secara anonim untuk menjaga kenyamanan kandidat pasif, dan kontak langsung terbuka seketika saat rekruter menggunakan 1 token.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Persetujuan akses data resmi telah disetujui kandidat di awal registrasi</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Mode proteksi aktif: nama dan kontak langsung disamarkan secara default</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Buka kontak langsung (WhatsApp &amp; Email) seketika dengan 1 token tanpa jeda approval</span>
                  </div>
                </div>
              </div>

              {/* Side by side state */}
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <Lock className="size-4 text-amber-600" />
                      <span>Sebelum Unlock (Tampilan Publik Terproteksi)</span>
                    </div>
                    <span className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded">
                      Identitas Disamarkan
                    </span>
                  </div>
                  <p className="text-slate-600"><strong className="text-slate-700">Nama:</strong> [Disamarkan · Kandidat ID #TL-7219]</p>
                  <p className="text-slate-600"><strong className="text-slate-700">Kontak:</strong> [Terbuka seketika setelah konfirmasi 1 token]</p>
                  <p className="text-slate-600"><strong className="text-slate-700">Sinyal Terverifikasi:</strong> Arsitektur sistem &amp; portfolio dapat dievaluasi lengkap tanpa mengekspos tempat kerja saat ini.</p>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-emerald-900">
                      <Unlock className="size-4 text-emerald-600" />
                      <span>Setelah Unlock (Kontak Langsung Terbuka)</span>
                    </div>
                    <span className="text-[10px] font-medium bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                      Izin Registrasi Aktif
                    </span>
                  </div>
                  <p className="text-slate-700"><strong className="text-slate-900">Nama:</strong> Rian Saputra (Principal Designer)</p>
                  <p className="text-slate-700"><strong className="text-slate-900">Kontak Resmi:</strong> rian.saputra@outlook.com · +62 811-9012-4432</p>
                  <p className="text-slate-700"><strong className="text-slate-900">Dasar Akses:</strong> Izin resmi telah disetujui kandidat saat registrasi akun untuk dihubungi rekruter terverifikasi.</p>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 5: PARTNER ECOSYSTEM (COMING SOON) */}
          <div
            role="tabpanel"
            id="feature-panel-partner"
            aria-labelledby="feature-tab-partner"
            tabIndex={0}
            hidden={activeTab !== "partner"}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm"
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold mb-3">
                  <GraduationCap className="size-3.5" />
                  Kemitraan Career Center · Segera Hadir
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Ekosistem Mitra Career Center Kampus &amp; Lembaga Pendidikan
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Menghubungkan universitas terkemuka dan bootcamp teknologi langsung dengan jaringan rekruter verified. Institusi mitra dapat memvalidasi kredensial kelulusan mahasiswa binaan mereka dan memantau penyerapan kerja alumni secara terukur.
                </p>
                <div className="mt-6 space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Penerbitan badge verifikasi resmi institusi kampus pada profil talenta binaan</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Dasbor analitik penyerapan lulusan berdasarkan industri dan tipe penempatan kerja</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Tata kelola akses employer partner untuk rekrutmen langsung lulusan terbaik (early talent)</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button asChild variant="outline" className="rounded-xl border-slate-300 text-slate-700">
                    <Link href="/auth/register?role=partner">
                      Daftar Minat Kemitraan Kampus <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Partner Specimen Panel */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-[#7C3AED]" /> Career Center Partner Console
                  </span>
                  <span className="font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Coming Soon
                  </span>
                </div>

                {/* Partner Stats Preview */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Universitas Indonesia Career Center</p>
                      <p className="text-[11px] text-slate-500">Program Kemitraan Validasi Kredensial</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      Mitra Resmi
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div>
                      <span className="font-mono text-base font-bold text-slate-900">134</span>
                      <p className="text-[10px] text-slate-500">Talenta Terverifikasi</p>
                    </div>
                    <div>
                      <span className="font-mono text-base font-bold text-emerald-700">48%</span>
                      <p className="text-[10px] text-slate-500">Full-time Hired</p>
                    </div>
                    <div>
                      <span className="font-mono text-base font-bold text-sky-700">31%</span>
                      <p className="text-[10px] text-slate-500">Internship</p>
                    </div>
                  </div>
                </div>

                {/* Badge issuance card preview */}
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-purple-900 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#7C3AED]" />
                    <span className="font-semibold text-xs">Penerbitan Verified Campus Badge</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap lulusan yang terdaftar melalui lembaga partner menerima verifikasi terenkripsi untuk membuktikan validitas IPK, transkrip, dan program studi langsung kepada rekruter.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 6: TOKENS ROI CALCULATOR */}
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
                  Kalkulator Penghematan Biaya Rekrutmen
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Headhunter konvensional biasanya minta fee 15%–20% dari gaji tahunan kandidat. Di Talent Network, kamu cuma bayar 1 token (Rp 19.800–Rp 25.000) per pembukaan kontak terverifikasi, tanpa biaya langganan bulanan.
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
                  <span className="text-slate-600">Biaya Token Talent Network (~{tokensNeeded} Token):</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    Rp {tokenCost.toLocaleString("id-ID")}
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
        </div>
      </div>
    </section>
  );
}

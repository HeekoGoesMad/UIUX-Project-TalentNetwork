"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Check,
  Lock,
  Search,
  Sparkles,
  WalletCards,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "search", label: "Pencarian Sinyal & AI Match", icon: Search },
  { id: "privacy", label: "Buka Kontak & Privasi", icon: Lock },
  { id: "tokens", label: "Estimasi ROI Token", icon: WalletCards },
  { id: "ai", label: "AI Career Advisor", icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function FeatureTabsSection() {
  const [activeTab, setActiveTab] = useState<TabId>("search");
  const [tokenCalculatorCount, setTokenCalculatorCount] = useState<number>(10);

  return (
    <section id="features" className="py-20 lg:py-28 bg-[#F9FAFB] scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-1 text-xs font-semibold text-[#7C3AED]">
            <Zap className="size-3.5" /> Fitur Unggulan Platform
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-5xl">
            Dirancang untuk Ekosistem Rekrutmen Masa Depan
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-7">
            Jelajahi bagaimana ProofyLink memadukan kecerdasan AI, perlindungan privasi kandidat, dan efisiensi biaya berbasis token.
          </p>
        </div>

        {/* Interactive Feature Tabs */}
        <div className="mt-12 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200/80">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#7C3AED] text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-white" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Contents */}
        <div className="mt-8 max-w-5xl mx-auto">
          {activeTab === "search" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl grid gap-8 lg:grid-cols-2 items-center animate-fade-up">
              <div>
                <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                  Filter & Pencarian Cerdas
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#111827]">
                  Cari Berdasarkan Sinyal Konkrit, Bukan Sekadar Resume Text
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Filter kandidat berdasarkan keahlian terverifikasi, riwayat proyek nyata, ketersediaan karir, serta ekspektasi gaji. AI scoring mencocokkan kandidat terbaik dalam hitungan detik.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Skor kecocokan AI hingga 98% presisi",
                    "Filter fleksibel: Remote, Onsite, Seniority, Stack",
                    "Tanpa resume palsu atau informasi yang membingungkan",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="size-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white" asChild>
                  <Link href="/search">
                    Coba Simulator Pencarian <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-[#F9FAFB] p-5 shadow-inner space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kueri Pencarian Langsung</span>
                  <span className="font-mono text-xs text-[#7C3AED] font-semibold">12 Hasil Ditemukan</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl border bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#111827]">Senior Frontend Developer</span>
                      <span className="font-mono text-xs font-bold text-[#7C3AED] bg-slate-50 px-2 py-0.5 rounded">Kecocokan 96%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">React, Next.js, TypeScript · Jakarta (Remote)</p>
                  </div>
                  <div className="rounded-xl border bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#0f2040]">Lead Product Designer</span>
                      <span className="font-mono text-xs font-bold text-[#7C3AED] bg-slate-50 px-2 py-0.5 rounded">Kecocokan 93%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Figma, Design Systems, Mobile App · Bandung</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl grid gap-8 lg:grid-cols-2 items-center animate-fade-up">
              <div>
                <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Privasi by Default
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#0f2040]">
                  Kandidat Terlindungi, Recruiter Mendapat Kontak Terverifikasi
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Semua kandidat di ProofyLink terlindungi dari spam. Identitas asli hanya dapat dibuka dengan consent dan 1 token per profil, memastikan percakapan profesional dan responsif.
                </p>
                <div className="mt-6 rounded-2xl bg-[#0b2342] p-4 text-white text-xs leading-5">
                  <p className="font-semibold text-[#79e6b2] flex items-center gap-1.5">
                    <Lock className="size-3.5" /> Garansi Bebas Spam
                  </p>
                  <p className="mt-1 text-slate-300">
                    Recruiter menghemat waktu dari calon yang tidak aktif, dan kandidat hanya dihubungi untuk peluang karir yang benar-benar cocok.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Status Anonim (Sebelum Dibuka)</p>
                  <div className="mt-2 text-xs text-slate-600 space-y-1">
                    <p>Nama: <span className="font-mono text-slate-400">███████████</span></p>
                    <p>Email / WA: <span className="font-mono text-slate-400">██████@████.com</span></p>
                    <p>Sinyal: Senior UI/UX Designer (Siap berdiskusi)</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wide">Status Terbuka (Sesudah 1 Token)</p>
                  <div className="mt-2 text-xs text-slate-800 space-y-1">
                    <p>Nama: <span className="font-semibold text-[#111827]">Aditya Pratama</span></p>
                    <p>Email / WA: <span className="font-semibold text-[#7C3AED]">aditya.p@proofylink.dev</span></p>
                    <p>Portofolio Lengkap &amp; Kontak Terbuka</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl grid gap-8 lg:grid-cols-2 items-center animate-fade-up">
              <div>
                <span className="rounded-lg bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                  Harga Transparan
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#111827]">
                  Kalkulator Hemat Biaya Rekrutmen Berbasis Token
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Tanpa langganan bulanan mahal yang terbuang. Bayar sesuai kandidat yang benar-benar Anda hubungi.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Jumlah Profil Kandidat yang Dibuka:</span>
                      <span className="font-mono text-sm text-[#7C3AED]">{tokenCalculatorCount} Kandidat</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={tokenCalculatorCount}
                      onChange={(e) => setTokenCalculatorCount(parseInt(e.target.value))}
                      className="mt-2 w-full accent-[#7C3AED]"
                    />
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Estimasi Biaya ProofyLink:</span>
                      <span className="font-mono font-bold text-[#7C3AED]">Rp {(tokenCalculatorCount * 25000).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 line-through">
                      <span>Biaya Headhunter Konvensional (15-20% Gaji):</span>
                      <span className="font-mono">Rp {(tokenCalculatorCount * 5000000).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#201C45] p-6 text-white text-center space-y-4 shadow-xl">
                <WalletCards className="size-12 mx-auto text-[#DDD6FE]" />
                <h4 className="text-xl font-bold">Hemat Hingga 90% Biaya Rekrutmen</h4>
                <p className="text-xs text-slate-300 leading-5">
                  Hanya butuh 1 token untuk membuka kontak lengkap kandidat terverifikasi. Tidak ada biaya tersembunyi.
                </p>
                <Button className="w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white" asChild>
                  <Link href="#pricing">Lihat Paket Token</Link>
                </Button>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl grid gap-8 lg:grid-cols-2 items-center animate-fade-up">
              <div>
                <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Untuk Talent &amp; Pencari Kerja
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#0f2040]">
                  AI Career Advisor &amp; Optimasi ATS
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Untuk kandidat, ProofyLink menyediakan asisten AI cerdas untuk memperkuat pengalaman kerja, menyusun poin CV yang lolos ATS, serta memberikan rekomendasi peran yang tepat.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "Analisis otomatis skor kekuatan CV & skill gaps",
                    "Rekomendasi karir yang personal dan relevan",
                    "Privasi penuh: pilih perusahaan mana yang boleh melihat profil Anda",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="size-4 text-[#7C3AED] shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                  <Sparkles className="size-4 text-[#7C3AED]" /> Saran AI Advisor ProofyLink
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-5">
                  &quot;Tambahkan pencapaian kuantitatif pada pengalaman Frontend Engineer Anda (contoh: Meningkatkan performa LCP sebesar 40%) untuk meningkatkan skor match hingga +15%.&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

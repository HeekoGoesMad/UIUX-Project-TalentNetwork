"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useApp } from "@/providers/app-provider";
import {
  ArrowRight,
  Check,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  WalletCards,
  ChevronRight,
  Brain,
  FileCheck2,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { candidates } from "@/data/candidates";
import { cn } from "@/lib/utils";
import { InteractiveMarquee } from "@/components/ui/interactive-marquee";
import { AnimatedWord } from "@/components/ui/animated-word";

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"search" | "privacy" | "tokens" | "ai">("search");
  const [candidateFilter, setCandidateFilter] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [tokenCalculatorCount, setTokenCalculatorCount] = useState<number>(10);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (hydrated && user) {
      router.replace(user.role === "candidate" ? "/candidate" : "/dashboard");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top button after scrolling down past 450px (~2 scroll turns)
      if (window.scrollY > 450) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };



  const filteredCandidates = candidates.filter((c) => {
    if (candidateFilter === "all") return true;
    if (candidateFilter === "tech") return c.role.toLowerCase().includes("engineer") || c.role.toLowerCase().includes("developer") || c.role.toLowerCase().includes("tech");
    if (candidateFilter === "design") return c.role.toLowerCase().includes("designer") || c.role.toLowerCase().includes("product");
    if (candidateFilter === "growth") return c.role.toLowerCase().includes("growth") || c.role.toLowerCase().includes("marketing") || c.role.toLowerCase().includes("lead");
    return true;
  }).slice(0, 4);

  const faqs = [
    {
      q: "Bagaimana sistem Token di ProofyLink bekerja?",
      a: "Pencarian dan pemantauan profil kandidat 100% gratis. Anda hanya menggunakan 1 token saat ingin meng-unlock kontak langsung dan resume lengkap kandidat yang sesuai dengan kriteria rekomendasi Anda.",
    },
    {
      q: "Bagaimana ProofyLink menjaga privasi kandidat?",
      a: "Secara default, profil kandidat ditampilkan dalam bentuk anonim (Private Candidate) dengan sinyal kompetensi & ekspektasi karir. Kontak dan nama lengkap hanya diberikan jika recruiter menggunakan token dan terdapat kualifikasi yang relevan.",
    },
    {
      q: "Apa perbedaan ProofyLink dibanding platform rekrutmen biasa?",
      a: "Platform biasa penuh spam inbox dan CV tidak terverifikasi. ProofyLink memberikan Sinyal Terverifikasi (Signal-based matching) dengan AI scoring, memastikan kecocokan tinggi sebelum kontak dilakukan.",
    },
    {
      q: "Apakah kandidat dikenakan biaya untuk menggunakan ProofyLink?",
      a: "Kandidat 100% gratis menggunakan ProofyLink, termasuk fitur AI CV Builder, Career Advisor, dan opsi penerimaan tawaran yang relevan secara privat.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative navy-grid overflow-hidden text-white pt-24 sm:pt-28 pb-20 lg:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-[#19a974]/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

        <div className="container mx-auto px-4 relative z-10 grid gap-12 lg:grid-cols-[1.1fr_.9fr] items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#17375f] bg-[#08263f]/80 px-3.5 py-1.5 backdrop-blur-md">
              <ShieldCheck className="size-4 text-[#58d99e]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#79e6b2]">
                Verified Talent Network
              </span>
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Temukan talent yang <AnimatedWord />
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 sm:text-lg sm:leading-8 text-slate-300">
              ProofyLink membantu recruiter menemukan kandidat terverifikasi dengan konteks tinggi tanpa noise spam, privasi by default, dan akses hemat berbasis token.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button size="lg" className="rounded-xl bg-[#19a974] text-white hover:bg-[#158f62] shadow-lg shadow-[#19a974]/20 px-6 font-semibold w-full sm:w-auto h-12 text-sm sm:text-base justify-center" asChild>
                <Link href="/search">
                  Mulai eksplorasi <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md px-6 w-full sm:w-auto h-12 text-sm sm:text-base justify-center" asChild>
                <Link href="/login">Masuk ke workspace</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 border-t border-white/10 pt-6">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[#58d99e]" /> 30+ profil terkurasi
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[#58d99e]" /> Privacy by default
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[#58d99e]" /> AI Matching Signal
              </span>
            </div>
          </div>

          {/* Interactive Network Card Preview */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#19a974]/30 to-[#2563a8]/30 blur-2xl opacity-60" />
            <Card className="relative overflow-hidden border-white/15 bg-white/95 text-[#10233f] shadow-2xl backdrop-blur-xl rounded-2xl">
              <div className="border-b border-slate-200/80 bg-[#f0f6fd] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Network pulse</p>
                  <p className="text-xs text-muted-foreground">Verified profiles open to conversation</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f5ed] px-3 py-1 text-xs font-semibold text-[#08744f]">
                  Live signal
                </span>
              </div>

              <CardContent className="space-y-3 p-6">
                {[
                  { initials: "NP", role: "Senior Product Designer", city: "Jakarta", match: "98% match", tag: "Design Systems" },
                  { initials: "RS", role: "Frontend Engineer", city: "Bandung", match: "94% match", tag: "Next.js & React" },
                  { initials: "CW", role: "Growth Marketing Lead", city: "Surabaya", match: "91% match", tag: "B2B SaaS" },
                ].map((item) => (
                  <div
                    key={item.initials}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-[#19a974]/50 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d7f5e8] font-bold text-[#08744f]">
                        {item.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0f2040]">Private candidate</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.role} · {item.city}
                        </p>
                        <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                          {item.tag}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-lg bg-[#e3f5ed] px-2.5 py-1 font-mono text-xs font-bold text-[#08744f] shrink-0">
                      {item.match}
                    </span>
                  </div>
                ))}

                <div className="rounded-xl bg-[#0b2342] p-4 text-white shadow-inner">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#79e6b2]">
                    <Sparkles className="size-4" /> AI Summary & Sinyal Recruiter
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-slate-300">
                    Sinyal terverifikasi otomatis mencocokkan stack, domain expertise, dan ekspektasi gaji tanpa perlu menyaring ratusan CV manual.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CORE STATS BAR - HORIZONTAL SCROLLING MARQUEE */}
      <section className="relative overflow-hidden border-y border-slate-200/80 bg-white py-7 shadow-xs">
        {/* Edge Fade Gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

        <InteractiveMarquee speed={0.7} hoverSpeed={0.15}>
          <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
            {[
              { val: "30+", color: "text-[#0b2342]", label: "Verified Talent Profiles" },
              { val: "98%", color: "text-[#19a974]", label: "Match Accuracy Signal" },
              { val: "3x", color: "text-[#0b2342]", label: "Faster Recruiter Screening" },
              { val: "1 Token", color: "text-[#19a974]", label: "Transparent Cost per Unlock" },
              { val: "100%", color: "text-[#0b2342]", label: "Consent-First Privacy" },
              { val: "0 Spam", color: "text-[#19a974]", label: "Direct Verified Contacts" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-6 text-center shrink-0">
                <div>
                  <p className={`font-mono text-3xl font-extrabold ${item.color}`}>{item.val}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium whitespace-nowrap">{item.label}</p>
                </div>
                <span className="size-1.5 rounded-full bg-slate-300 ml-4" />
              </div>
            ))}
          </div>
        </InteractiveMarquee>
      </section>

      {/* INTERACTIVE FEATURE SHOWCASE SECTION */}
      <section id="features" className="py-20 lg:py-28 bg-[#f3f7fb] scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f5ed] px-3.5 py-1 text-xs font-semibold text-[#08744f]">
              <Zap className="size-3.5" /> Fitur Unggulan Platform
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0f2040] sm:text-5xl">
              Dirancang untuk Ekosistem Rekrutmen Masa Depan
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-7">
              Jelajahi bagaimana ProofyLink memadukan kecerdasan AI, perlindungan privasi kandidat, dan efisiensi biaya berbasis token.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="mt-12 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200/80">
            {[
              { id: "search", label: "Signal Search & AI Match", icon: Search },
              { id: "privacy", label: "Privacy Context Unlock", icon: Lock },
              { id: "tokens", label: "Token ROI Estimator", icon: WalletCards },
              { id: "ai", label: "AI Career Advisor", icon: Brain },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "search" | "privacy" | "tokens" | "ai")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#0b2342] text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-[#79e6b2]" : "text-slate-500"}`} />
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
                  <span className="rounded-lg bg-[#e3f5ed] px-3 py-1 text-xs font-semibold text-[#08744f]">
                    Smart Filter & Matching
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-[#0f2040]">
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
                        <Check className="size-4 text-[#19a974] shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-8 rounded-xl bg-[#0b2342] hover:bg-[#102c52]" asChild>
                    <Link href="/search">
                      Coba Search Simulator <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-[#f8fafc] p-5 shadow-inner space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Search Query</span>
                    <span className="font-mono text-xs text-[#08744f] font-semibold">12 Results Found</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl border bg-white p-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#0f2040]">Senior Frontend Developer</span>
                        <span className="font-mono text-xs font-bold text-[#08744f] bg-[#e3f5ed] px-2 py-0.5 rounded">96% match</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">React, Next.js, TypeScript · Jakarta (Remote)</p>
                    </div>
                    <div className="rounded-xl border bg-white p-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#0f2040]">Lead Product Designer</span>
                        <span className="font-mono text-xs font-bold text-[#08744f] bg-[#e3f5ed] px-2 py-0.5 rounded">93% match</span>
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
                    Privacy By Default
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-[#0f2040]">
                    Kandidat Terlindungi, Recruiter Mendapat Kontak Terverifikasi
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Semua kandidat di ProofyLink terlindungi dari spam. Identitas asli hanya dapat di-unlock dengan consent dan 1 token per profil, memastikan percakapan profesional dan responsif.
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
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Status Anonim (Sebelum Unlock)</p>
                    <div className="mt-2 text-xs text-slate-600 space-y-1">
                      <p>Nama: <span className="font-mono text-slate-400">███████████</span></p>
                      <p>Email / WA: <span className="font-mono text-slate-400">██████@████.com</span></p>
                      <p>Sinyal: Senior UI/UX Designer (Open for conversation)</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#19a974]/30 bg-[#e3f5ed]/40 p-4">
                    <p className="text-xs font-bold text-[#08744f] uppercase tracking-wide">Status Unlocked (Sesudah 1 Token)</p>
                    <div className="mt-2 text-xs text-slate-800 space-y-1">
                      <p>Nama: <span className="font-semibold text-[#0f2040]">Aditya Pratama</span></p>
                      <p>Email / WA: <span className="font-semibold text-[#08744f]">aditya.p@proofylink.dev</span></p>
                      <p>Full Portfolio & Contact Unlocked</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tokens" && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl grid gap-8 lg:grid-cols-2 items-center animate-fade-up">
                <div>
                  <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    Transparent Pricing
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-[#0f2040]">
                    Kalkulator Hemat Biaya Rekrutmen Berbasis Token
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Tanpa langganan bulanan mahal yang terbuang. Bayar sesuai kandidat yang benar-benar Anda hubungi.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Jumlah Profile Candidate Unlock:</span>
                        <span className="font-mono text-sm text-[#08744f]">{tokenCalculatorCount} Candidate</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={tokenCalculatorCount}
                        onChange={(e) => setTokenCalculatorCount(parseInt(e.target.value))}
                        className="mt-2 w-full accent-[#19a974]"
                      />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Estimasi Biaya ProofyLink:</span>
                        <span className="font-mono font-bold text-[#08744f]">Rp {(tokenCalculatorCount * 25000).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 line-through">
                        <span>Biaya Headhunter Konvensional (15-20% Gaji):</span>
                        <span className="font-mono">Rp {(tokenCalculatorCount * 5000000).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0b2342] p-6 text-white text-center space-y-4 shadow-xl">
                  <WalletCards className="size-12 mx-auto text-[#79e6b2]" />
                  <h4 className="text-xl font-bold">Hemat Hingga 90% Biaya Rekrutmen</h4>
                  <p className="text-xs text-slate-300 leading-5">
                    Hanya butuh 1 token untuk membuka kontak lengkap kandidat terverifikasi. Tidak ada biaya tersembunyi.
                  </p>
                  <Button className="w-full rounded-xl bg-[#19a974] hover:bg-[#158f62]" asChild>
                    <Link href="#pricing">Lihat Paket Token</Link>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl grid gap-8 lg:grid-cols-2 items-center animate-fade-up">
                <div>
                  <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    For Talent & Job Seekers
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-[#0f2040]">
                    AI Career Advisor & ATS Optimization
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Untuk kandidat, ProofyLink menyediakan asisten AI cerdas untuk mempolarisasi pengalaman kerja, menyusun poin CV yang lolos ATS, serta memberikan rekomendasi peran yang tepat.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {[
                      "Analisis otomatis skor kekuatan CV & skill gaps",
                      "Rekomendasi karir yang personal dan relevan",
                      "Privasi penuh: pilih perusahaan mana yang boleh melihat profil Anda",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="size-4 text-[#19a974] shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0b2342]">
                    <Sparkles className="size-4 text-[#19a974]" /> ProofyLink AI Advisor Suggestion
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

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-800">
              <FileCheck2 className="size-3.5 text-[#19a974]" /> Alur Kerja Sederhana
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0f2040] sm:text-5xl">
              Bagaimana ProofyLink Bekerja
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-7">
              3 langkah cepat menghubungkan perusahaan hebat dengan talent terbaik.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Filter Sinyal Kebutuhan",
                desc: "Gunakan filter spesifik role, pengalaman, lokasi, dan ekspektasi gaji tanpa harus membaca ratusan resume mentah.",
                icon: Search,
              },
              {
                step: "02",
                title: "Unlock Dengan 1 Token",
                desc: "Saat menemukan profil yang cocok, gunakan 1 token untuk membuka kontak lengkap dan resume terverifikasi.",
                icon: WalletCards,
              },
              {
                step: "03",
                title: "Percakapan Berarti",
                desc: "Hubungi kandidat secara langsung dengan konteks relevan. Dapatkan tingkat respon hingga 3x lebih tinggi.",
                icon: MessageSquare,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative rounded-3xl border border-slate-200/80 bg-[#f8fafc] p-8 transition-all duration-300 hover:border-[#19a974]/50 hover:bg-white hover:shadow-xl group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-extrabold text-slate-300 group-hover:text-[#19a974] transition-colors">
                      {item.step}
                    </span>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e3f5ed] text-[#08744f]">
                      <Icon className="size-6" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#0f2040]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE CANDIDATE NETWORK MATRIX PREVIEW */}
      <section className="py-20 lg:py-28 bg-[#0b2342] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#79e6b2] backdrop-blur-md">
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
              {[
                { id: "all", label: "Semua Role" },
                { id: "tech", label: "Engineering & Tech" },
                { id: "design", label: "Product & Design" },
                { id: "growth", label: "Growth & Marketing" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCandidateFilter(f.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    candidateFilter === f.id
                      ? "bg-[#19a974] text-white font-semibold shadow-md"
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
              <Card key={c.id} className="border-white/15 bg-white/95 text-[#10233f] shadow-lg backdrop-blur-md rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-[#e3f5ed] px-2 py-0.5 font-mono text-[11px] font-bold text-[#08744f]">
                        Verified Signal
                      </span>
                      <span className="text-xs text-muted-foreground">{c.location}</span>
                    </div>

                    <h4 className="mt-4 font-bold text-base text-[#0f2040] truncate">{c.role}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.experience} Pengalaman</p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {c.skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
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
            <Button size="lg" className="rounded-xl bg-[#19a974] hover:bg-[#158f62] text-white px-8" asChild>
              <Link href="/search">
                Lihat Semua 30+ Talent Network <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PRICING OVERVIEW SECTION */}
      <section id="pricing" className="py-20 lg:py-28 bg-[#f3f7fb] scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f5ed] px-3.5 py-1 text-xs font-semibold text-[#08744f]">
              <WalletCards className="size-3.5" /> Transparan & Tanpa Langganan
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0f2040] sm:text-5xl">
              Pilihan Token Sesuai Kebutuhan
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-7">
              Token tidak pernah kadaluarsa. Gunakan kapan pun Anda membuka rekrutmen baru.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Starter Pack</span>
                <h3 className="mt-2 text-2xl font-bold text-[#0f2040]">10 Tokens</h3>
                <p className="mt-4 font-mono text-3xl font-extrabold text-[#0f2040]">Rp 250.000</p>
                <p className="text-xs text-muted-foreground mt-1">Rp 25.000 / candidate unlock</p>

                <ul className="mt-6 space-y-3 text-sm border-t pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Unlock 10 Kontak & Resume
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> AI Talent Match Scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Fitur Shortlist & Catatan
                  </li>
                </ul>
              </div>

              <Button className="mt-8 rounded-xl w-full" variant="outline" asChild>
                <Link href="/login">Beli Starter Token</Link>
              </Button>
            </div>

            {/* Growth (Featured) */}
            <div className="rounded-3xl border-2 border-[#19a974] bg-white p-8 shadow-2xl relative flex flex-col justify-between scale-105">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#19a974] px-4 py-1 font-mono text-xs font-bold text-white shadow-md">
                MOST POPULAR
              </span>

              <div>
                <span className="text-xs font-bold text-[#08744f] uppercase tracking-wider">Growth Pack</span>
                <h3 className="mt-2 text-2xl font-bold text-[#0f2040]">50 Tokens</h3>
                <p className="mt-4 font-mono text-3xl font-extrabold text-[#08744f]">Rp 990.000</p>
                <p className="text-xs text-muted-foreground mt-1">Rp 19.800 / candidate unlock (Hemat 20%)</p>

                <ul className="mt-6 space-y-3 text-sm border-t pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Unlock 50 Kontak & Resume
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Prioritas Support Rekrutmen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> AI Custom Query Search
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Token Tidak Pernah Kadaluarsa
                  </li>
                </ul>
              </div>

              <Button className="mt-8 rounded-xl w-full bg-[#19a974] hover:bg-[#158f62] text-white shadow-md" asChild>
                <Link href="/login">Beli Growth Pack</Link>
              </Button>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise</span>
                <h3 className="mt-2 text-2xl font-bold text-[#0f2040]">Custom Tokens</h3>
                <p className="mt-4 font-mono text-3xl font-extrabold text-[#0f2040]">Hubungi Kami</p>
                <p className="text-xs text-muted-foreground mt-1">Untuk tim HR skala besar</p>

                <ul className="mt-6 space-y-3 text-sm border-t pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Multi-recruiter team seats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Integrasi ATS kustom
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-[#19a974]" /> Dedicated Talent Specialist
                  </li>
                </ul>
              </div>

              <Button className="mt-8 rounded-xl w-full" variant="outline" asChild>
                <Link href="/login">Konsultasi Enterprise</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 lg:py-28 bg-white scroll-mt-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-800">
              <HelpCircle className="size-3.5 text-[#19a974]" /> Pertanyaan Umum
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0f2040] sm:text-4xl">
              Sering Ditanyakan (FAQ)
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-[#0f2040] hover:bg-slate-100"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-5 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[#19a974]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm leading-6 text-muted-foreground border-t border-slate-200/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL HIGH-CONVERTING CTA BANNER */}
      <section className="py-20 bg-[#f3f7fb]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#0b2342] p-8 sm:p-14 text-white shadow-2xl border border-white/10">
            {/* Ambient Background Light */}
            <div className="absolute top-0 right-0 size-96 bg-[#19a974]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#79e6b2]">
                <BadgeCheck className="size-4" /> ProofyLink Talent Intelligence
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
                Siap menemukan talent terbaik tanpa noise?
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-7">
                Bergabunglah dengan recruiter & kandidat yang telah merasakan efisiensi pencarian berbasis sinyal terverifikasi.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="rounded-xl bg-[#19a974] hover:bg-[#158f62] text-white px-8 font-semibold shadow-lg" asChild>
                  <Link href="/register">
                    Daftar Bebas Biaya <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
                  <Link href="/login">Masuk Workspace</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING SCROLL TO TOP SHORTCUT BUTTON WITH SMOOTH ENTRANCE & EXIT ANIMATION */}
      <button
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-[#0b2342]/90 text-white shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-500 ease-in-out group cursor-pointer",
          showScrollTop
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto hover:scale-110 hover:bg-[#19a974] hover:border-white/40"
            : "opacity-0 translate-y-6 scale-75 pointer-events-none"
        )}
      >
        <ChevronUp className="size-6 transition-transform group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}

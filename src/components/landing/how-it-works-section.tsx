"use client";

import { useState } from "react";
import { Filter, MessageSquare, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    id: "step-1",
    index: "01",
    title: "Filter Berdasarkan Sinyal Konkret",
    summary: "Tetapkan parameter peran, senioritas, ekspektasi kompensasi, dan stack teknis tervalidasi tanpa harus membaca puluhan resume mentah.",
    icon: Filter,
    previewTitle: "Pencarian Sinyal & Parameter Terverifikasi",
  },
  {
    id: "step-2",
    index: "02",
    title: "Buka Profil dengan 1 Token Berizin",
    summary: "Saat menemukan profil yang sesuai kriteria, gunakan 1 token untuk membuka kontak lengkap. Privasi kandidat terlindungi dengan sistem persetujuan dua arah.",
    icon: WalletCards,
    previewTitle: "Protokol Pembukaan Profil Berbasis Token",
  },
  {
    id: "step-3",
    index: "03",
    title: "Percakapan Berkualitas Tinggi Tanpa Noise",
    summary: "Hubungi kandidat melalui email atau WhatsApp resmi yang telah terverifikasi. Kandidat aktif memberikan respons rata-rata di bawah 48 jam.",
    icon: MessageSquare,
    previewTitle: "Kanal Komunikasi Terkurasi & Langsung",
  },
];

export function HowItWorksSection() {
  const [activeStepId, setActiveStepId] = useState<string>("step-1");
  const activeStep = STEPS.find((s) => s.id === activeStepId) || STEPS[0];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl text-balance">
            Bagaimana ProofyLink Memangkas Siklus Skrining
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Alur kerja berbasis sinyal objektif menghilangkan estimasi spekulatif dari resume tradisional, mempertemukan recruiter dengan kandidat yang siap wawancara.
          </p>
        </div>

        {/* Editorial Split-Screen Workflow */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
          {/* Left Column: Interactive Steps Navigator */}
          <div className="space-y-4">
            {STEPS.map((step) => {
              const isActive = step.id === activeStepId;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? "border-[#7C3AED] bg-purple-50/20 shadow-sm"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-[#7C3AED] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          Langkah {step.index}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {step.summary}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Live Preview Display */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
              <span className="text-xs font-semibold text-slate-800">
                {activeStep.previewTitle}
              </span>
              <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Interaktif
              </span>
            </div>

            {activeStepId === "step-1" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Filter Parameter Sinyal</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      4 Kandidat Terverifikasi
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      Role: Staff Platform Engineer
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      Lokasi: Jabodetabek (Hybrid)
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      Gaji: Rp 30M – 45M/bln
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-500">Kandidat ID: TL-8842</p>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">Staff Platform & Distributed Eng</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded">
                      96.4% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Sinyal: Lolos audit arsitektur sistem skala 100K QPS dan validasi PR repository produksi.
                  </p>
                </div>
              </div>
            )}

            {activeStepId === "step-2" && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <ShieldCheck className="size-4 text-[#7C3AED]" />
                    <span>Konfirmasi Pembukaan Profil Kandidat</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Kandidat Dipilih:</span>
                      <span className="font-medium text-slate-900">TL-8842 (Staff Platform Eng)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Tarif Pembukaan:</span>
                      <span className="font-mono font-bold text-[#7C3AED]">1 Token</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Status Izin Privasi:</span>
                      <span className="text-emerald-700 font-medium">Kandidat Memberi Akses Kontak</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-normal">
                    Setelah konfirmasi, nomor WhatsApp dan email pribadi kandidat langsung terbuka pada workspace Anda.
                  </div>

                  <Button className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg">
                    Buka Profil Sekarang (Potong 1 Token)
                  </Button>
                </div>
              </div>
            )}

            {activeStepId === "step-3" && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Akses Langsung Terbuka</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      Aktif Siap Dihubungi
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Direct</span>
                      <span className="font-mono font-medium text-slate-900 text-xs">+62 812-8821-9821</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Resmi</span>
                      <span className="font-mono font-medium text-slate-900 text-xs">nur.pratama@engineer.id</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-purple-50/60 p-3 border border-purple-100 text-xs text-purple-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#7C3AED]">
                      <Sparkles className="size-3.5" /> Konteks Rekrutmen Siap Pakai
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Laporan 5 pilar sinyal kompetensi kandidat disertakan otomatis, memudahkan tim teknis Anda menyusun pertanyaan wawancara terarah.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

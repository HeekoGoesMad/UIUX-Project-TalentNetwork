"use client";

import { useState } from "react";
import { Filter, MessageSquare, ShieldCheck, WalletCards } from "lucide-react";

const STEPS = [
  {
    id: "step-1",
    index: "1",
    title: "Filter Berdasarkan Bukti Sinyal Nyata",
    summary: "Tentukan peran, seniority, dan tech stack yang sudah tervalidasi. Nggak perlu buang waktu menyortir tumpukan resume mentah.",
    icon: Filter,
    previewTitle: "Pencarian Berdasarkan Sinyal Kerja",
  },
  {
    id: "step-2",
    index: "2",
    title: "Buka Profil dengan 1 Token",
    summary: "Saat menemukan profil yang cocok, gunakan 1 token untuk membuka kontak lengkap. Privasi kandidat tetap terlindungi karena identitas awal disamarkan, dan kontak langsung terbuka seketika berdasarkan izin resmi yang sudah diberikan kandidat sejak awal registrasi.",
    icon: WalletCards,
    previewTitle: "Model Token & Privasi Transparan",
  },
  {
    id: "step-3",
    index: "3",
    title: "Ngobrol Langsung Tanpa Perantara",
    summary: "Hubungi kandidat langsung via WhatsApp atau email resmi. Kandidat di sini aktif dan rata-rata merespons dalam waktu di bawah 48 jam.",
    icon: MessageSquare,
    previewTitle: "Kontak Langsung & Konteks Wawancara",
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
            Cara Kerja Talent Network: Rekrut Cepat, Tanpa Ribet
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Nggak perlu pusing sortir ratusan resume yang isinya belum tentu sesuai. Mulai dari filter kriteria teknis sampai ngobrol langsung dengan kandidat, semuanya transparan dan nyaman.
          </p>
        </div>

        {/* Distilled Editorial Split-Screen Workflow */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
          {/* Left Column: Quiet Steps Navigator */}
          <div className="space-y-3.5">
            {STEPS.map((step) => {
              const isActive = step.id === activeStepId;
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left p-5 sm:p-6 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-slate-800 bg-white shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Langkah {step.index}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
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

          {/* Right Column: Distilled Specimen Panel */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="border-b border-slate-200/80 pb-3">
              <span className="text-xs font-semibold text-slate-700">
                {activeStep.previewTitle}
              </span>
            </div>

            {activeStepId === "step-1" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Parameter yang Dipilih
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800">
                      Peran: Staff Platform Engineer
                    </span>
                    <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800">
                      Lokasi: Jabodetabek (Hybrid)
                    </span>
                    <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800">
                      Gaji: Rp 30M – 45M/bln
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Contoh Hasil Sinyal Terverifikasi
                  </span>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Staff Platform Engineer</p>
                        <p className="text-[11px] text-slate-500">Kandidat TL-8842 · Pengalaman 8+ tahun</p>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                        Terverifikasi
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                      Lolos audit arsitektur sistem skala 100K QPS dan pull request repository produksi terkonfirmasi tim teknis.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pencarian langsung memfilter bukti kompetensi konkret, tanpa tebak-tebakan dari resume.
                </p>
              </div>
            )}

            {activeStepId === "step-2" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Model Akses yang Adil &amp; Transparan
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Token hanya terpakai saat kamu memutuskan ingin membuka kontak kandidat yang cocok.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Biaya Akses Kontak</span>
                    <span className="font-semibold text-slate-900">1 Token per kandidat</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Biaya Langganan Bulanan</span>
                    <span className="font-semibold text-emerald-700">Rp 0 (Tanpa langganan)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Izin Akses Data</span>
                    <span className="font-semibold text-slate-900">Disetujui di awal registrasi</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Garansi Respons</span>
                    <span className="font-semibold text-slate-900">Token kembali jika tak ada respons</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-600 bg-white border border-slate-200 p-3 rounded-xl">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    Identitas awal kandidat disamarkan secara aman hingga kamu resmi membuka kontak dengan 1 token.
                  </span>
                </div>
              </div>
            )}

            {activeStepId === "step-3" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Terhubung Langsung dengan Konteks Siap Pakai
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hubungi kandidat langsung tanpa perantara pihak ketiga.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">WhatsApp Resmi</span>
                    <span className="font-mono font-medium text-slate-900">+62 812-8821-9821</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email Kontak</span>
                    <span className="font-mono font-medium text-slate-900">nur.pratama@engineer.id</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Rata-rata Waktu Respons</span>
                    <span className="font-semibold text-emerald-700">&lt; 48 jam</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-900 block">
                    Konteks Diskusi Teknis Langsung Siap
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Ringkasan pilar kompetensi yang sudah tervalidasi memudahkan tim teknis kamu menyusun pertanyaan wawancara mendalam tanpa perlu tes awal yang berulang.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

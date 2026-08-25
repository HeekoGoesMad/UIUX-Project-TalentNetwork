"use client";

import Link from "next/link";
import { WalletCards, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] pt-24 sm:pt-28 pb-20">
      {/* HEADER HERO */}
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-4 py-1.5 text-xs font-semibold text-[#7C3AED] border border-slate-200 shadow-xs">
            <WalletCards className="size-4" /> Transparan & Tanpa Langganan
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
            Pilihan Token Sesuai Kebutuhan
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-8">
            Token tidak pernah kadaluarsa. Gunakan kapan pun Anda membuka rekrutmen baru tanpa biaya berlangganan bulanan.
          </p>
        </div>

        {/* PRICING CARDS FOR PURCHASING TOKENS */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
          {/* Starter */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paket Starter</span>
              <h2 className="mt-2 text-2xl font-bold text-[#111827]">10 Token</h2>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#111827]">Rp 250.000</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Rp 25.000 / buka profil kandidat</p>

              <ul className="mt-6 space-y-3.5 text-sm border-t pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Buka 10 Kontak &amp; Portofolio</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">AI Talent Match Scoring</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Fitur Shortlist &amp; Catatan Tim</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Token Tidak Kadaluwarsa</span>
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full py-5 font-semibold" variant="outline" asChild>
              <Link href="/login">Beli Starter Token</Link>
            </Button>
          </div>

          {/* Growth (Featured) */}
          <div className="rounded-3xl border-2 border-[#7C3AED] bg-white p-8 shadow-2xl relative flex flex-col justify-between scale-105 z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED] px-4 py-1 font-mono text-xs font-bold text-white shadow-md">
              PALING POPULER
            </span>

            <div>
              <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Paket Growth</span>
              <h2 className="mt-2 text-2xl font-bold text-[#111827]">50 Token</h2>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#7C3AED]">Rp 990.000</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Rp 19.800 / buka profil kandidat (Hemat 20%)</p>

              <ul className="mt-6 space-y-3.5 text-sm border-t pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-800 font-semibold">Buka 50 Kontak &amp; Portofolio</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-800 font-semibold">Prioritas Support Rekrutmen</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-800 font-semibold">AI Custom Query Search</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-800 font-semibold">Token Tidak Kadaluwarsa</span>
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-5 font-semibold shadow-md" asChild>
              <Link href="/login">Beli Paket Growth</Link>
            </Button>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paket Enterprise</span>
              <h2 className="mt-2 text-2xl font-bold text-[#111827]">Token Kustom</h2>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#111827]">Hubungi Kami</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Untuk tim HR &amp; Perusahaan Skala Besar</p>

              <ul className="mt-6 space-y-3.5 text-sm border-t pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Multi-recruiter Team Seats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Integrasi ATS Custom</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Dedicated Talent Specialist</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span className="text-slate-700 font-medium">Laporan Analisis Hiring</span>
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full py-5 font-semibold" variant="outline" asChild>
              <Link href="/login">Konsultasi Enterprise</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

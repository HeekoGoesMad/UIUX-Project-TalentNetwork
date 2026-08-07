"use client";

import Link from "next/link";
import { WalletCards, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f3f7fb] pt-24 sm:pt-28 pb-20">
      {/* HEADER HERO */}
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f5ed] px-4 py-1.5 text-xs font-semibold text-[#08744f] border border-[#19a974]/20 shadow-xs">
            <WalletCards className="size-4" /> Transparan & Tanpa Langganan
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0f2040] sm:text-5xl lg:text-6xl">
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
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Starter Pack</span>
              <h2 className="mt-2 text-2xl font-bold text-[#0f2040]">10 Tokens</h2>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#0f2040]">Rp 250.000</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Rp 25.000 / candidate unlock</p>

              <ul className="mt-6 space-y-3.5 text-sm border-t pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">Unlock 10 Kontak & Resume</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">AI Talent Match Scoring</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">Fitur Shortlist & Catatan Tim</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">Token Tidak Kadaluarsa</span>
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full py-5 font-semibold" variant="outline" asChild>
              <Link href="/login">Beli Starter Token</Link>
            </Button>
          </div>

          {/* Growth (Featured) */}
          <div className="rounded-3xl border-2 border-[#19a974] bg-white p-8 shadow-2xl relative flex flex-col justify-between scale-105 z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#19a974] px-4 py-1 font-mono text-xs font-bold text-white shadow-md">
              MOST POPULAR
            </span>

            <div>
              <span className="text-xs font-bold text-[#08744f] uppercase tracking-wider">Growth Pack</span>
              <h2 className="mt-2 text-2xl font-bold text-[#0f2040]">50 Tokens</h2>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#08744f]">Rp 990.000</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Rp 19.800 / candidate unlock (Hemat 20%)</p>

              <ul className="mt-6 space-y-3.5 text-sm border-t pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-800 font-semibold">Unlock 50 Kontak & Resume</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-800 font-semibold">Prioritas Support Rekrutmen</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-800 font-semibold">AI Custom Query Search</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-800 font-semibold">Token Tidak Kadaluarsa</span>
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full bg-[#19a974] hover:bg-[#158f62] text-white py-5 font-semibold shadow-md" asChild>
              <Link href="/login">Beli Growth Pack</Link>
            </Button>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise</span>
              <h2 className="mt-2 text-2xl font-bold text-[#0f2040]">Custom Tokens</h2>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#0f2040]">Hubungi Kami</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Untuk tim HR & Perusahaan Skala Besar</p>

              <ul className="mt-6 space-y-3.5 text-sm border-t pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">Multi-recruiter Team Seats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">Integrasi ATS Custom</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
                  <span className="text-slate-700 font-medium">Dedicated Talent Specialist</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#19a974] shrink-0" />
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

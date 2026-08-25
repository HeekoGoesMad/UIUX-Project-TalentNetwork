import Link from "next/link";
import { Check, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-[#F9FAFB] scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-1 text-xs font-semibold text-[#7C3AED]">
            <WalletCards className="size-3.5" /> Transparan & Tanpa Langganan
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-5xl">
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
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paket Starter</span>
              <h3 className="mt-2 text-2xl font-bold text-[#0f2040]">10 Token</h3>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#0f2040]">Rp 250.000</p>
              <p className="text-xs text-muted-foreground mt-1">Rp 25.000 / buka profil kandidat</p>

              <ul className="mt-6 space-y-3 text-sm border-t pt-6">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Buka 10 Kontak &amp; Portofolio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> AI Talent Match Scoring
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Fitur Shortlist &amp; Catatan
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full" variant="outline" asChild>
              <Link href="/login">Beli Paket Starter</Link>
            </Button>
          </div>

          {/* Growth (Featured) */}
          <div className="rounded-3xl border-2 border-[#7C3AED] bg-white p-8 shadow-2xl relative flex flex-col justify-between scale-105">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED] px-4 py-1 font-mono text-xs font-bold text-white shadow-md">
              PALING POPULER
            </span>

            <div>
              <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Paket Growth</span>
              <h3 className="mt-2 text-2xl font-bold text-[#111827]">50 Token</h3>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#7C3AED]">Rp 990.000</p>
              <p className="text-xs text-muted-foreground mt-1">Rp 19.800 / buka profil kandidat (Hemat 20%)</p>

              <ul className="mt-6 space-y-3 text-sm border-t pt-6">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Buka 50 Kontak &amp; Portofolio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Prioritas Support Rekrutmen
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> AI Custom Query Search
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Token Tidak Pernah Kedaluwarsa
                </li>
              </ul>
            </div>

            <Button className="mt-8 rounded-xl w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md" asChild>
              <Link href="/login">Beli Paket Growth</Link>
            </Button>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paket Enterprise</span>
              <h3 className="mt-2 text-2xl font-bold text-[#111827]">Kustomisasi Token</h3>
              <p className="mt-4 font-mono text-3xl font-extrabold text-[#111827]">Hubungi Kami</p>
              <p className="text-xs text-muted-foreground mt-1">Untuk tim HR skala besar</p>

              <ul className="mt-6 space-y-3 text-sm border-t pt-6">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Akses tim multi-recruiter
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Integrasi ATS kustom
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-[#7C3AED]" /> Dedicated Talent Specialist
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
  );
}

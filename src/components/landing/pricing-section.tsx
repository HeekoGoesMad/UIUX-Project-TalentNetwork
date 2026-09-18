import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-slate-50/50 border-b border-slate-200/80 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl text-balance">
            Ekonomi Token Transparan Tanpa Langganan
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Hanya bayar saat Anda menemukan kandidat yang benar-benar cocok. Token tidak pernah kedaluwarsa dan dapat digunakan kapan saja sesuai kebutuhan tim.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {/* Starter */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Paket Starter
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">10 Token</h3>
              <p className="mt-4 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                Rp 250.000
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Rp 25.000 per pembukaan kontak kandidat
              </p>

              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Buka 10 kontak resmi &amp; dossier lengkap</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Akses laporan sinyal kompetensi 5 pilar</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Pencarian dan filter direktori tanpa batas</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Token aktif selamanya tanpa kedaluwarsa</span>
                </div>
              </div>
            </div>

            <Button className="mt-8 rounded-xl w-full border-slate-200 text-slate-700 hover:bg-slate-50" variant="outline" asChild>
              <Link href="/login">Beli Paket Starter</Link>
            </Button>
          </div>

          {/* Growth (Featured Editorial) */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-slate-900 bg-white p-7 shadow-md relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                  Paket Growth
                </span>
                <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Hemat 20%
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-slate-900">50 Token</h3>
              <p className="mt-4 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                Rp 990.000
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Rp 19.800 per pembukaan kontak kandidat
              </p>

              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Buka 50 kontak resmi &amp; dossier lengkap</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Prioritas respons dari kandidat aktif</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Akses asisten penyusun pertanyaan wawancara AI</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Dukungan teknis prioritas via tim ProofyLink</span>
                </div>
              </div>
            </div>

            <Button className="mt-8 rounded-xl w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm" asChild>
              <Link href="/login">Beli Paket Growth</Link>
            </Button>
          </div>

          {/* Enterprise */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kebutuhan Korporasi
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Enterprise Custom</h3>
              <p className="mt-4 font-mono text-3xl font-bold text-slate-900">
                Sesuai Skala
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Untuk tim HR dan departemen rekrutmen volume tinggi
              </p>

              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Paket alokasi token fleksibel dengan invoice korporat</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Multi-seat account untuk seluruh recruiter tim</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Integrasi sistem ATS internal via API</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#7C3AED] shrink-0" />
                  <span>Dedicated Talent Specialist &amp; SLA garansi</span>
                </div>
              </div>
            </div>

            <Button className="mt-8 rounded-xl w-full border-slate-200 text-slate-700 hover:bg-slate-50" variant="outline" asChild>
              <Link href="/login">Hubungi Tim Korporasi</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

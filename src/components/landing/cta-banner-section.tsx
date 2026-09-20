import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBannerSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="rounded-3xl bg-[#1d193f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-[#1d193f] to-[#14112e] p-8 sm:p-14 text-white shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Multi-layered Cinematic Volumetric Glows */}
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[#7C3AED]/28 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-[#4F46E5]/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15] text-balance">
              Siap Rekrut Talent Tech Terbaik Buat Tim Kamu?
            </h2>
            <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
              Tinggalkan tebak-tebakan dari tumpukan resume biasa. Mulai temukan kandidat berbobot dengan verifikasi kompetensi nyata.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                size="lg"
                className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 font-semibold h-12 text-sm sm:text-base justify-center transition-colors shadow-sm cursor-pointer"
                asChild
              >
                <Link href="/register">
                  Daftar Gratis Sekarang <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white px-6 h-12 text-sm sm:text-base justify-center font-medium cursor-pointer"
                asChild
              >
                <Link href="/login">Masuk ke Workspace</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

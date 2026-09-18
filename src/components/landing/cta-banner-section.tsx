import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBannerSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="rounded-3xl bg-slate-950 p-8 sm:p-14 text-white shadow-xl border border-slate-800">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15] text-balance">
              Mulai Rekrut Berdasarkan Bukti Nyata Hari Ini
            </h2>
            <p className="mt-4 text-slate-300 text-base sm:text-lg leading-relaxed">
              Bergabunglah dengan hiring team dan profesional di Indonesia yang telah meninggalkan spekulasi resume manual demi evaluasi sinyal kompetensi objektif.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button
                size="lg"
                className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 font-semibold h-12 text-sm sm:text-base justify-center transition-colors shadow-sm"
                asChild
              >
                <Link href="/register">
                  Daftar Workspace Gratis <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white px-6 h-12 text-sm sm:text-base justify-center font-medium"
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

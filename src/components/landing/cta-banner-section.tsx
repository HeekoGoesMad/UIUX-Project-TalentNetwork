import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBannerSection() {
  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-[#201C45] p-8 sm:p-14 text-white shadow-2xl border border-white/10">
          {/* Ambient Background Light */}
          <div className="absolute top-0 right-0 size-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#DDD6FE]">
              <BadgeCheck className="size-4" /> ProofyLink Talent Intelligence
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
              Siap menemukan talent terbaik tanpa noise?
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-7">
              Bergabunglah dengan recruiter & kandidat yang telah merasakan efisiensi pencarian berbasis sinyal terverifikasi.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 font-semibold shadow-lg"
                asChild
              >
                <Link href="/register">
                  Daftar Bebas Biaya <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/login">Masuk Workspace</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

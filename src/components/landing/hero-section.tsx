import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedWord } from "@/components/ui/animated-word";

export function HeroSection() {
  return (
    <section className="relative navy-grid overflow-hidden text-white pt-24 sm:pt-28 pb-20 lg:pb-28">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      <div className="container mx-auto px-4 relative z-10 grid gap-12 lg:grid-cols-[1.1fr_.9fr] items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#201C45]/80 px-3.5 py-1.5 backdrop-blur-md">
            <ShieldCheck className="size-4 text-[#DDD6FE]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#DDD6FE]">
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
            <Button size="lg" className="rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/25 px-6 font-semibold w-full sm:w-auto h-12 text-sm sm:text-base justify-center" asChild>
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
              <Check className="size-4 text-[#DDD6FE]" /> 30+ profil terkurasi
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-[#DDD6FE]" /> Privacy by default
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4 text-[#DDD6FE]" /> AI Matching Signal
            </span>
          </div>
        </div>

        {/* Interactive Network Card Preview */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#7C3AED]/30 to-[#EC4899]/25 blur-2xl opacity-60" />
          <Card className="relative overflow-hidden border-white/15 bg-white/95 text-[#111827] shadow-2xl backdrop-blur-xl rounded-2xl">
            <div className="border-b border-slate-200/80 bg-[#F9FAFB] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Aktivitas Jaringan</p>
                <p className="text-xs text-muted-foreground">Profil terverifikasi yang siap berdiskusi</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                Sinyal Aktif
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
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-[#7C3AED]/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 font-bold text-[#7C3AED]">
                      {item.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111827]">Kandidat Privat</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.role} · {item.city}
                      </p>
                      <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold text-[#7C3AED] shrink-0">
                    {item.match}
                  </span>
                </div>
              ))}

              <div className="rounded-xl bg-[#201C45] p-4 text-white shadow-inner">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#DDD6FE]">
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
  );
}

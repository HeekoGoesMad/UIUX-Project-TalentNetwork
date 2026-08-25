"use client";

import Link from "next/link";
import { useEffect, ReactNode } from "react";
import { ShieldCheck, Sparkles, Check, Lock, WalletCards, GraduationCap } from "lucide-react";

export function AuthShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  useEffect(() => {
    const { body } = document;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  return (
    <div className="h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-4 sm:py-6 bg-[#f9fafb] overflow-hidden">
      <div className="w-full max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl grid lg:grid-cols-[1fr_1.25fr]">
          {/* Left Decorative & Trust Panel (Desktop) */}
          <aside className="navy-grid relative hidden flex-col justify-between p-8 lg:p-12 text-white lg:flex overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -left-20 size-80 bg-[#7c3aed]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 size-80 bg-[#ec4899]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white shadow-md">
                  <ShieldCheck className="size-5" />
                </span>
                <span className="text-xl text-white">
                  Proofy<span className="text-[#ddd6fe]">Link</span>
                </span>
              </Link>

              <div className="mt-10 max-w-md">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#ddd6fe] backdrop-blur-md border border-white/10">
                  <Sparkles className="size-3.5" /> Verified Talent Intelligence
                </div>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
                  Bangun koneksi dari sinyal yang tepat.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Sistem rekrutmen berbasis sinyal terverifikasi. Privasi kandidat terjaga by default, tanpa spam inbox, dan akses efisien berbasis token.
                </p>
              </div>

              {/* Feature Badges */}
              <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-xs text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#7c3aed]/30 text-[#ddd6fe] shrink-0">
                    <Check className="size-4" />
                  </div>
                  <span className="text-xs sm:text-sm">30+ Profil Talent Terverifikasi Siap Diskusi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#7c3aed]/30 text-[#ddd6fe] shrink-0">
                    <Lock className="size-4" />
                  </div>
                  <span className="text-xs sm:text-sm">Consent-first & Garansi 100% Bebas Spam</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#7c3aed]/30 text-[#ddd6fe] shrink-0">
                    <WalletCards className="size-4" />
                  </div>
                  <span className="text-xs sm:text-sm">Model Token Transparan Tanpa Biaya Tersembunyi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#7c3aed]/30 text-[#ddd6fe] shrink-0">
                    <GraduationCap className="size-4" />
                  </div>
                  <span className="text-xs sm:text-sm">Dukungan Kemitraan Kampus, Lembaga & Individual</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-4 text-xs text-slate-400 flex items-center justify-between">
              <span>ProofyLink Talent Network © 2026</span>
              <span className="font-mono text-[#ddd6fe]">v1.0 Demo</span>
            </div>
          </aside>

          {/* Right Main Form Container */}
          <main className="flex flex-col justify-center p-6 sm:p-10 lg:p-12 bg-white">
            <div className="w-full max-w-lg mx-auto">
              {/* Mobile Header Logo */}
              <div className="mb-4 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white">
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="text-lg text-[#111827]">
                    Proofy<span className="text-[#7c3aed]">Link</span>
                  </span>
                </Link>
              </div>

              <div className="mb-5">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold">
                  {title}
                </span>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                  {description}
                </h1>
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

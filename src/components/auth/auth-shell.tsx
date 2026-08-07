"use client";

import Link from "next/link";
import { useEffect, ReactNode } from "react";
import { ShieldCheck, Sparkles, Check, Lock, WalletCards } from "lucide-react";

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
    // Disable scrolling when on login/register view
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      // Re-enable scrolling when navigating away
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-2 sm:py-4 bg-[#f3f7fb] overflow-hidden">
      <div className="w-full max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl grid lg:grid-cols-[1fr_1.1fr]">
          {/* Left Decorative & Trust Panel (Desktop) */}
          <aside className="navy-grid relative hidden flex-col justify-between p-8 lg:p-10 text-white lg:flex overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -left-20 size-72 bg-[#19a974]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 size-72 bg-[#2563a8]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#d7f5e8] to-[#bcebd8] text-[#08744f] shadow-md">
                  <ShieldCheck className="size-5" />
                </span>
                <span className="text-lg text-white">
                  Proofy<span className="text-[#58d99e]">Link</span>
                </span>
              </Link>

              <div className="mt-8 max-w-sm">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-semibold text-[#79e6b2] backdrop-blur-md border border-white/10">
                  <Sparkles className="size-3" /> Verified Talent Intelligence
                </div>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
                  Bangun koneksi dari sinyal yang tepat.
                </h2>
                <p className="mt-2.5 text-xs leading-5 text-slate-300">
                  Sistem rekrutmen berbasis sinyal terverifikasi. Privasi kandidat terjaga by default, tanpa spam inbox, dan akses efisien berbasis token.
                </p>
              </div>

              {/* Feature Badges */}
              <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-[#19a974]/20 text-[#58d99e]">
                    <Check className="size-3.5" />
                  </div>
                  <span className="text-xs">30+ Profil Talent Terverifikasi Siap Diskusi</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-[#19a974]/20 text-[#58d99e]">
                    <Lock className="size-3.5" />
                  </div>
                  <span className="text-xs">Consent-first & Garansi 100% Bebas Spam</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-[#19a974]/20 text-[#58d99e]">
                    <WalletCards className="size-3.5" />
                  </div>
                  <span className="text-xs">Model Token Transparan Tanpa Biaya Tersembunyi</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
              <span>ProofyLink Talent Network © 2026</span>
              <span className="font-mono text-[#79e6b2]">v1.0 Demo</span>
            </div>
          </aside>

          {/* Right Main Form Container */}
          <main className="flex flex-col justify-center p-6 sm:p-8 bg-white">
            <div className="w-full max-w-sm mx-auto">
              {/* Mobile Header Logo */}
              <div className="mb-3 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-[#d7f5e8] text-[#08744f]">
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="text-base text-[#0f2040]">
                    Proofy<span className="text-[#19a974]">Link</span>
                  </span>
                </Link>
              </div>

              <div className="mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#19a974] font-bold">
                  {title}
                </span>
                <h1 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-[#0f2040]">
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

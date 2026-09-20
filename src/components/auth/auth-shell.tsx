"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { AuthConstellationBackground } from "@/components/auth/auth-constellation-background";

export function AuthShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-3.5 py-6 sm:px-6 sm:py-10 bg-[#f9fafb]">
      <div className="w-full max-w-6xl my-auto">
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-xl grid lg:grid-cols-[1fr_1.25fr]">
          {/* Left Decorative & Trust Panel (Desktop) */}
          <aside className="relative hidden flex-col justify-between p-8 lg:p-12 text-white lg:flex overflow-hidden bg-[#0e0b21] border-r border-slate-800/80">
            <AuthConstellationBackground />
            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center font-bold tracking-tight transition-opacity hover:opacity-90">
                <span className="text-xl text-white">
                  Talent<span className="text-[#ddd6fe]"> Network</span>
                </span>
              </Link>

              <div className="mt-14 max-w-md">
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight text-balance">
                  Rekrut dari bukti nyata, bukan klaim resume.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-sm">
                  Evaluasi 5 pilar kompetensi dengan proteksi privasi dan model token transparan.
                </p>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-4 text-xs text-slate-400 flex items-center">
              <span className="inline-flex items-center gap-1.5">
                <span>© 2026 Talent Network by</span>
                <span className="bg-white/90 px-1 py-0.5 rounded inline-flex items-center">
                  <Image
                    src="https://cms.solusisakti.id/assets/1b874983-6a51-42f6-873a-e504cd42e934"
                    alt="Djoin"
                    width={48}
                    height={14}
                    className="h-3 w-auto object-contain inline-block"
                  />
                </span>
              </span>
            </div>
          </aside>

          {/* Right Main Form Container */}
          <main className="flex flex-col justify-center p-5 sm:p-8 lg:p-12 bg-white">
            <div className="w-full max-w-lg mx-auto">
              {/* Mobile Header Brand */}
              <div className="mb-4 lg:hidden">
                <Link href="/" className="inline-flex items-center font-bold tracking-tight transition-opacity hover:opacity-90">
                  <span className="text-lg text-[#111827]">
                    Talent<span className="text-primary"> Network</span>
                  </span>
                </Link>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b2342]">
                  {title}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  {description}
                </p>
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

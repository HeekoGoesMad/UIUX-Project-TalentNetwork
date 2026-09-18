"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Bagaimana sistem token di ProofyLink bekerja?",
    a: "Pencarian dan eksplorasi profil sinyal kandidat 100% gratis tanpa batas. Anda hanya menggunakan 1 token saat ingin membuka kontak langsung (WhatsApp & email) dan dossier portofolio lengkap dari kandidat yang Anda pilih.",
  },
  {
    q: "Bagaimana ProofyLink melindungi privasi kandidat?",
    a: "Secara default, profil kandidat ditampilkan dalam bentuk data sinyal anonim (Kandidat Privat). Nama lengkap dan kontak hanya dapat diakses setelah recruiter mengonfirmasi penggunaan token dan kandidat memberikan persetujuan dua arah.",
  },
  {
    q: "Apa yang membedakan ProofyLink dari platform pencarian kerja biasa?",
    a: "Platform konvensional bertumpu pada klaim resume teks yang belum tentu akurat dan menghasilkan banyak spam inbox. ProofyLink mengevaluasi bukti konkret (audit commit, studi kasus produksi, validasi rekan kerja) dengan rubrik 5 pilar objektif.",
  },
  {
    q: "Apakah kandidat dikenakan biaya untuk menggunakan ProofyLink?",
    a: "Kandidat bebas biaya selamanya untuk bergabung ke direktori, membangun profil sinyal kompetensi, dan menerima tawaran diskusi kerja yang relevan.",
  },
];

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Hal mendasar mengenai sinyal verifikasi, privasi kandidat, dan penggunaan token.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            const buttonId = `faq-trigger-${idx}`;
            const panelId = `faq-panel-${idx}`;
            return (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl border transition-all duration-300 overflow-hidden",
                  isOpen
                    ? "border-slate-300/90 bg-slate-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/20"
                )}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-slate-900 cursor-pointer transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-slate-400 transition-transform duration-300 shrink-0",
                      isOpen && "rotate-180 text-slate-900"
                    )}
                  />
                </button>

                {/* Smooth Animated Accordion Grid Row Expansion */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600 border-t border-slate-100/90 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

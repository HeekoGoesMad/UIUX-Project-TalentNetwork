"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Gimana cara kerja sistem token di Talent Network?",
    a: "Kamu bisa bebas cari dan lihat sinyal kompetensi semua kandidat secara gratis tanpa batas. Token cuma dipakai (1 token) waktu kamu mau buka kontak langsung (WhatsApp & email) dan dossier lengkap dari kandidat yang kamu pilih.",
  },
  {
    q: "Gimana Talent Network melindungi privasi kandidat?",
    a: "Secara default, profil kandidat ditampilkan dalam mode proteksi tanpa memunculkan kontak pribadi atau identitas sensitif (Private Mode). Karena kandidat telah memberikan izin akses data resmi saat registrasi akun, kontak langsung (WhatsApp & email) akan langsung terbuka seketika saat kamu mengonfirmasi penggunaan 1 token, tanpa perlu menunggu proses approval tambahan.",
  },
  {
    q: "Apa bedanya Talent Network dengan job portal biasa?",
    a: "Job portal biasa umumnya cuma mengandalkan teks resume yang rawan dilebih-lebihkan dan sering bikin spam inbox. Di Talent Network, kami mengevaluasi bukti nyata (audit commit, studi kasus produksi, dan validasi rekan kerja) dengan 5 pilar kompetensi yang terukur.",
  },
  {
    q: "Apakah kandidat dikenakan biaya untuk bergabung?",
    a: "Sama sekali nggak ada biaya untuk kandidat. Kandidat bisa bergabung, melengkapi profil sinyal kompetensi, dan menerima tawaran diskusi karier yang relevan secara 100% gratis selamanya.",
  },
];

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white border-b border-slate-200/80 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Hal-hal penting seputar verifikasi sinyal, privasi kandidat, dan penggunaan token.
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

"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Bagaimana sistem Token di ProofyLink bekerja?",
    a: "Pencarian dan pemantauan profil kandidat 100% gratis. Anda hanya menggunakan 1 token saat ingin membuka kontak langsung dan portofolio lengkap kandidat yang sesuai dengan kriteria kebutuhan Anda.",
  },
  {
    q: "Bagaimana ProofyLink menjaga privasi kandidat?",
    a: "Secara default, profil kandidat ditampilkan dalam bentuk anonim (Kandidat Privat) dengan sinyal kompetensi & ekspektasi karir. Kontak dan nama lengkap hanya diberikan jika recruiter menggunakan token dan terdapat kualifikasi yang relevan.",
  },
  {
    q: "Apa perbedaan ProofyLink dibanding platform rekrutmen biasa?",
    a: "Platform biasa penuh spam inbox dan CV tidak terverifikasi. ProofyLink memberikan Sinyal Terverifikasi (Signal-based matching) dengan AI scoring, memastikan kecocokan tinggi sebelum kontak dilakukan.",
  },
  {
    q: "Apakah kandidat dikenakan biaya untuk menggunakan ProofyLink?",
    a: "Kandidat 100% gratis menggunakan ProofyLink, termasuk fitur AI CV Builder, Career Advisor, dan opsi penerimaan tawaran yang relevan secara privat.",
  },
];

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-1 text-xs font-semibold text-[#7C3AED]">
            <HelpCircle className="size-3.5 text-[#7C3AED]" /> Pertanyaan Umum
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            Sering Ditanyakan (FAQ)
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            const buttonId = `faq-trigger-${idx}`;
            const panelId = `faq-panel-${idx}`;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-[#111827] hover:bg-slate-100 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-[#7C3AED]" : ""
                    }`}
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="px-5 pb-5 text-xs sm:text-sm leading-6 text-muted-foreground border-t border-slate-200/60 pt-3"
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { FileCheck2, MessageSquare, Search, WalletCards } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Filter Sinyal Kebutuhan",
    desc: "Gunakan filter spesifik role, pengalaman, lokasi, dan ekspektasi gaji tanpa harus membaca ratusan resume mentah.",
    icon: Search,
  },
  {
    step: "02",
    title: "Buka Profil dengan 1 Token",
    desc: "Saat menemukan profil yang cocok, gunakan 1 token untuk membuka kontak lengkap dan portofolio terverifikasi.",
    icon: WalletCards,
  },
  {
    step: "03",
    title: "Percakapan Berarti",
    desc: "Hubungi kandidat secara langsung dengan konteks relevan. Dapatkan tingkat respon hingga 3x lebih tinggi.",
    icon: MessageSquare,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-1 text-xs font-semibold text-[#7C3AED]">
            <FileCheck2 className="size-3.5 text-[#7C3AED]" /> Alur Kerja Sederhana
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-5xl">
            Bagaimana ProofyLink Bekerja
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-7">
            3 langkah cepat menghubungkan perusahaan hebat dengan talent terbaik.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-3xl border border-slate-200/80 bg-[#f8fafc] p-8 transition-all duration-300 hover:border-[#7C3AED]/50 hover:bg-white hover:shadow-xl group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-extrabold text-slate-300 group-hover:text-foreground transition-colors">
                    {item.step}
                  </span>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-[#7C3AED]">
                    <Icon className="size-6" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#111827]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

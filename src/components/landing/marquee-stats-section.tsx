export function MarqueeStatsSection() {
  const METRICS = [
    {
      value: "30+",
      label: "Talent Aktif Terkurasi",
      detail: "Portofolio & rekam jejak terverifikasi",
    },
    {
      value: "96.4%",
      label: "Akurasi Sinyal AI Match",
      detail: "Evaluasi 5 pilar kompetensi teknis",
    },
    {
      value: "1 Token",
      label: "Biaya Transparan per Unlock",
      detail: "Tanpa biaya langganan bulanan",
    },
    {
      value: "< 48 Jam",
      label: "Waktu Respons Rata-Rata",
      detail: "3x lebih cepat dibanding cold outreach",
    },
  ];

  return (
    <section className="relative z-10 isolate border-b border-slate-200/80 bg-slate-50/60 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {METRICS.map((item, idx) => (
            <div
              key={item.label}
              className={`flex flex-col justify-center px-4 py-4 md:py-0 ${
                idx === 0 ? "md:pl-0" : ""
              } ${idx === METRICS.length - 1 ? "md:pr-0" : ""}`}
            >
              <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {item.value}
              </p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 leading-snug">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

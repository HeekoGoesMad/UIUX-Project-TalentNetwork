import { InteractiveMarquee } from "@/components/ui/interactive-marquee";

const STATS = [
  { val: "30+", color: "text-[#111827]", label: "Verified Talent Profiles" },
  { val: "98%", color: "text-[#7C3AED]", label: "Match Accuracy Signal" },
  { val: "3x", color: "text-[#111827]", label: "Faster Recruiter Screening" },
  { val: "1 Token", color: "text-[#7C3AED]", label: "Transparent Cost per Unlock" },
  { val: "100%", color: "text-[#111827]", label: "Consent-First Privacy" },
  { val: "0 Spam", color: "text-[#7C3AED]", label: "Direct Verified Contacts" },
];

export function MarqueeStatsSection() {
  return (
    <section className="relative overflow-hidden border-y border-slate-200/80 bg-white py-7 shadow-xs">
      {/* Edge Fade Gradients */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

      <InteractiveMarquee speed={0.7} hoverSpeed={0.15}>
        <div className="flex items-center gap-12 sm:gap-16 pr-12 sm:pr-16">
          {STATS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-6 text-center shrink-0">
              <div>
                <p className={`font-mono text-3xl font-extrabold ${item.color}`}>{item.val}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium whitespace-nowrap">{item.label}</p>
              </div>
              <span className="size-1.5 rounded-full bg-slate-300 ml-4" />
            </div>
          ))}
        </div>
      </InteractiveMarquee>
    </section>
  );
}

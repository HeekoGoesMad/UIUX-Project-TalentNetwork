"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitFork, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const aiNavItems = [
  {
    href: "/candidate/career-advisor",
    label: "Career Advisor",
    icon: Sparkles,
  },
  {
    href: "/candidate/career-gaps",
    label: "Gap Analysis",
    icon: Target,
  },
  {
    href: "/candidate/career-roadmap",
    label: "Career Roadmap",
    icon: GitFork,
  },
];

export function CandidateAiNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 rounded-2xl border bg-muted/40 p-1.5 mb-8 shadow-2xs", className)}>
      {aiNavItems.map((item) => {
        const ItemIcon = item.icon;
        const active = pathname === item.href || (item.href === "/candidate/career-advisor" && pathname.startsWith("/candidate/career-advisor"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200",
              active
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
            )}
          >
            <ItemIcon className={cn("size-3.5", active ? "text-[#7C3AED]" : "text-muted-foreground")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

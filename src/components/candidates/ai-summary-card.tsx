import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiSummaryCard({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-[#102c52] to-[#1c5a83] p-5 text-white", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-[#79e6b2]" /> AI Summary
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-200">{children}</p>
    </div>
  );
}


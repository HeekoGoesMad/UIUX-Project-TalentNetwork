import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiSummaryCard({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-[#201C45] to-[#40357F] p-5 text-white shadow-md", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-[#DDD6FE]" /> AI Summary
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-200">{children}</p>
    </div>
  );
}


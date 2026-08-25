import { TALENT_CATEGORY_CONFIG, TalentCategory } from "@/types";
import { cn } from "@/lib/utils";

interface CandidateCategoryBadgeProps {
  category: TalentCategory;
  className?: string;
  showDescription?: boolean;
}

export function CandidateCategoryBadge({ category, className, showDescription = false }: CandidateCategoryBadgeProps) {
  const config = TALENT_CATEGORY_CONFIG[category];
  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", config.badgeBg)}>
        <span>{config.badge}</span>
        {config.label}
      </span>
      {showDescription && (
        <p className="px-1 text-[10px] text-muted-foreground">{config.description}</p>
      )}
    </div>
  );
}

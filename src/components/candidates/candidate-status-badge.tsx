import { CAREER_STATUS_CONFIG, CareerStatus } from "@/types";
import { cn } from "@/lib/utils";

interface CandidateStatusBadgeProps {
  status?: CareerStatus;
  className?: string;
}

export function CandidateStatusBadge({ status = "open-to-work", className }: CandidateStatusBadgeProps) {
  const config = CAREER_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.color,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useState } from "react";

export function CandidateAvatar({
  initials,
  avatarUrl,
  name,
  locked = false,
  className,
}: {
  initials: string;
  avatarUrl?: string | null;
  name?: string;
  locked?: boolean;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(avatarUrl && !imageError);

  return (
    <div
      className={cn(
        "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-100 via-indigo-50 to-purple-200 text-sm font-semibold text-purple-700 shadow-xs ring-1 ring-black/5 dark:from-purple-950 dark:to-indigo-900 dark:text-purple-300",
        className
      )}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={name || initials}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className={cn(
            "h-full w-full object-cover transition-all duration-500",
            locked ? "scale-115 blur-[7px] opacity-75 grayscale-25" : "scale-100 blur-0 opacity-100 grayscale-0"
          )}
        />
      ) : (
        <span
          className={cn(
            "select-none transition-all duration-300",
            locked ? "blur-[5px] opacity-60" : "blur-0 opacity-100"
          )}
        >
          {initials}
        </span>
      )}

      {/* Lock Indicator overlay when locked */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] transition-opacity">
          <div className="flex size-5 sm:size-6 items-center justify-center rounded-full bg-black/70 text-white shadow-xs">
            <Lock className="size-2.5 sm:size-3 text-amber-300" />
          </div>
        </div>
      )}
    </div>
  );
}

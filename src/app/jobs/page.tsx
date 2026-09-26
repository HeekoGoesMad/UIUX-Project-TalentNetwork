import { Suspense } from "react";
import { PublicJobsPage } from "@/components/jobs/job-ui";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
          {/* Header Skeleton */}
          <div className="rounded-2xl bg-[#181433] p-6 sm:p-8 border border-white/10 space-y-3">
            <Skeleton className="h-8 w-48 bg-white/20" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/10" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-28 bg-white/10" />
              <Skeleton className="h-4 w-28 bg-white/10" />
            </div>
          </div>

          {/* Search bar skeleton */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-44 rounded-xl" />
          </div>

          {/* Row skeletons */}
          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-5"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-64 max-w-full" />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="h-5 w-28 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-2.5 shrink-0 pt-2 md:pt-0">
                  <Skeleton className="h-7 w-36 rounded-lg" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </main>
      }
    >
      <PublicJobsPage />
    </Suspense>
  );
}

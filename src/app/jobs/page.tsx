import { Suspense } from "react";
import { PublicJobsPage } from "@/components/jobs/job-ui";

export default function JobsPage() {
  return (
    <Suspense fallback={<main className="container mx-auto max-w-6xl px-4 py-8 sm:py-12"><p className="text-sm text-muted-foreground">Memuat lowongan...</p></main>}>
      <PublicJobsPage />
    </Suspense>
  );
}

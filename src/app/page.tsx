"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useApp } from "@/providers/app-provider";
import {
  HeroSection,
  MarqueeStatsSection,
  FeatureTabsSection,
  HowItWorksSection,
  TalentPreviewSection,
  PricingSection,
  FaqSection,
  CtaBannerSection,
  ScrollToTop,
} from "@/components/landing";

export default function Home() {
  return (
    <Suspense fallback={<HomeLoader />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div role="status" className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm font-medium text-muted-foreground">Memuat…</span>
      </div>
    </div>
  );
}

function HomeContent() {
  const { user, hydrated } = useApp();
  const router = useRouter();
  // ?preview=1 lets logged-in staff (e.g. admins via "Kembali ke Web") view
  // the public landing instead of being bounced to their dashboard.
  const preview = useSearchParams().get("preview") === "1";

  useEffect(() => {
    if (hydrated && user && !preview) {
      router.replace(user.role === "candidate" ? "/candidate" : "/dashboard");
    }
  }, [hydrated, user, router, preview]);

  if ((!hydrated || user) && !preview) {
    return <HomeLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <MarqueeStatsSection />
      <FeatureTabsSection />
      <HowItWorksSection />
      <TalentPreviewSection />
      <PricingSection />
      <FaqSection />
      <CtaBannerSection />
      <ScrollToTop />
    </div>
  );
}

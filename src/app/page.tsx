"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user) {
      router.replace(user.role === "candidate" ? "/candidate" : "/dashboard");
    }
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div role="status" className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">Memuat…</span>
        </div>
      </div>
    );
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

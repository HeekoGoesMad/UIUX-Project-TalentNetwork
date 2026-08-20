"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

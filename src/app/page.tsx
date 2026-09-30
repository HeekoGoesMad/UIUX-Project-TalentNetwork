import {
  LandingAuthRedirect,
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
    <div className="flex flex-col min-h-screen bg-white">
      <LandingAuthRedirect />
      <HeroSection />
      <MarqueeStatsSection />
      <HowItWorksSection />
      <FeatureTabsSection />
      <TalentPreviewSection />
      <PricingSection />
      <FaqSection />
      <CtaBannerSection />
      <ScrollToTop />
    </div>
  );
}


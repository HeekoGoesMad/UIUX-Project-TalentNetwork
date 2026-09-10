import { Suspense } from "react";
import { CandidateOnboarding } from "@/components/candidate/candidate-onboarding";

export default function CandidateOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <CandidateOnboarding />
    </Suspense>
  );
}

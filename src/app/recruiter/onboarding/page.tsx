import { Suspense } from "react";
import { RecruiterOnboarding } from "@/components/recruiter/recruiter-onboarding";

export default function RecruiterOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <RecruiterOnboarding />
    </Suspense>
  );
}

import { Suspense, type ReactElement } from "react";
import { OnboardingFlow } from "@/features/onboarding/components/OnboardingFlow";

export default function Home(): ReactElement {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}

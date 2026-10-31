import { OnboardingFlow } from "@/features/onboarding/components/OnboardingFlow";
import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";

export default function Home() {
  return (
    <OnboardingLayout>
      <OnboardingFlow />
    </OnboardingLayout>
  );
}

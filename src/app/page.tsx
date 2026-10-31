import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";
import { PersonalDetailsStep } from "@/features/onboarding/components/PersonalDetailsStep";

export default function Home() {
  return (
    <OnboardingLayout>
      <PersonalDetailsStep />
    </OnboardingLayout>
  );
}

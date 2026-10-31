"use client";

import { useState, type ReactElement } from "react";
import { OnboardingConfirmation } from "./OnboardingConfirmation";
import { OnboardingLayout } from "./OnboardingLayout";
import { PersonalDetailsStep } from "./PersonalDetailsStep";

export function OnboardingFlow(): ReactElement {
  const [isComplete, setIsComplete] = useState(false);

  return (
    <OnboardingLayout currentStep={1}>
      {isComplete ? (
        <OnboardingConfirmation />
      ) : (
        <PersonalDetailsStep onComplete={() => setIsComplete(true)} />
      )}
    </OnboardingLayout>
  );
}

"use client";

import { useState, type ReactElement } from "react";
import { OnboardingConfirmation } from "./OnboardingConfirmation";
import { OnboardingLayout } from "./OnboardingLayout";
import { OnboardingForm } from "./OnboardingForm";
import { useFormNavigation } from "../hooks/useStepNavigation";
import { STEP_ORDER } from "../types";

export function OnboardingFlow(): ReactElement {
  const [isComplete, setIsComplete] = useState(false);
  const navigation = useFormNavigation();
  const stepIndex = STEP_ORDER.indexOf(navigation.currentStep) + 1;
  return (
    <OnboardingLayout currentStep={stepIndex}>
      {isComplete ? (
        <OnboardingConfirmation />
      ) : (
        <OnboardingForm
          navigation={navigation}
          onComplete={() => setIsComplete(true)}
        />
      )}
    </OnboardingLayout>
  );
}

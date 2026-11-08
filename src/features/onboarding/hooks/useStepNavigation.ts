import { useEffect, useState } from "react";
import { ONBOARDING_STEPS, OnboardingStep, STEP_ORDER } from "../types";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

export type FormNavigation = {
  currentStep: OnboardingStep;
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  goToStep: (currentStep: OnboardingStep) => void;
};

export function useFormNavigation(): FormNavigation {
  const router = useRouter();
  const pathname = usePathname();
  const stepParam = useSearchParams().get("step");

  const currentStep =
    STEP_ORDER.find((item) => stepParam === item) ?? ONBOARDING_STEPS.PERSONAL;
  const isFirstStep = currentStep === STEP_ORDER[0];
  const isLastStep = currentStep === STEP_ORDER.at(-1);
  const index = STEP_ORDER.indexOf(currentStep);
  const [openedOnLaterStep] = useState(currentStep !== STEP_ORDER[0]);

  useEffect(() => {
    if (openedOnLaterStep) router.replace(`${pathname}?step=${STEP_ORDER[0]}`);
  }, [openedOnLaterStep, router, pathname]);

  function goToStep(step: OnboardingStep): void {
    router.push(`${pathname}?step=${step}`, { scroll: false });
  }

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    goToStep,
    onBack: () => goToStep(STEP_ORDER[index - 1]),
    onNext: () => goToStep(STEP_ORDER[index + 1]),
  };
}

import type { ReactElement, ReactNode } from "react";
import { STEP_ORDER } from "../types";

type OnboardingLayoutProps = {
  currentStep: number;
  children: ReactNode;
};

export function OnboardingLayout({
  currentStep,
  children,
}: OnboardingLayoutProps): ReactElement {
  return (
    // Anchored to the top, not centred: a centred card would move the Submit
    // button whenever its height changes.
    <main className="bg-background flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <p className="mb-8 text-lg sm:mb-22">
        Step {currentStep} of {STEP_ORDER.length}
      </p>
      <div className="border-border bg-card h-fit w-full max-w-132 rounded-2xl border px-7 py-6">
        <h1 className="mb-5 text-center text-2xl">Onboarding Form</h1>
        {children}
      </div>
    </main>
  );
}

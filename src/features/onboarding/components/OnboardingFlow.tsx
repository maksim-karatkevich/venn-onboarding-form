"use client";

import { useState } from "react";
import { OnboardingConfirmation } from "./OnboardingConfirmation";
import { PersonalDetailsStep } from "./PersonalDetailsStep";

export function OnboardingFlow() {
  const [isComplete, setIsComplete] = useState(false);

  if (isComplete) return <OnboardingConfirmation />;

  return <PersonalDetailsStep onComplete={() => setIsComplete(true)} />;
}

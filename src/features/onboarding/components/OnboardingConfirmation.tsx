"use client";

import { useEffect, useRef, type ReactElement } from "react";

export function OnboardingConfirmation(): ReactElement {
  const messageRef = useRef<HTMLParagraphElement>(null);

  // The Submit button that had focus is gone, so focus moves here to keep
  // keyboard and screen reader users in place.
  useEffect(() => {
    messageRef.current?.focus();
  }, []);

  return (
    <p ref={messageRef} tabIndex={-1} className="text-center outline-none">
      Thanks, we&apos;ve received your details.
    </p>
  );
}

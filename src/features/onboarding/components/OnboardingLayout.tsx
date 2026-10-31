import type { ReactNode } from "react";

type OnboardingLayoutProps = {
  children: ReactNode;
};

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    // Anchored to the top, not centred: a centred card would move the Submit
    // button whenever its height changes.
    <main className="bg-background flex flex-1 justify-center px-4 py-12 sm:py-24">
      <div className="border-border bg-card h-fit w-full max-w-132 rounded-2xl border px-7 py-6">
        <h1 className="mb-5 text-center text-2xl">Onboarding Form</h1>
        {children}
      </div>
    </main>
  );
}

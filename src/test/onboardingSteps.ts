import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { NUMBER } from "./onboardingMocks";

export const FIRST_NAME = "Hello";
export const LAST_NAME = "World";
export const PHONE = "+13062776103";

export function nextButton() {
  return screen.getByRole("button", { name: /next/i });
}

export function backButton() {
  return screen.getByRole("button", { name: /back/i });
}

export function submitButton() {
  return screen.getByRole("button", { name: /submit/i });
}

/** Fills in the personal details step and moves to the phone step. */
export async function completePersonalStep(user: UserEvent) {
  await user.type(screen.getByLabelText("First Name"), FIRST_NAME);
  await user.type(screen.getByLabelText("Last Name"), LAST_NAME);
  await user.click(nextButton());
  await screen.findByLabelText("Phone Number");
}

/** Fills in the first two steps and moves to the corporation number step. */
export async function goToCorporationNumberStep(user: UserEvent) {
  await completePersonalStep(user);
  await user.type(screen.getByLabelText("Phone Number"), PHONE);
  await user.click(nextButton());
  await screen.findByLabelText("Corporation Number");
}

/**
 * Fills in every step and moves to the review step. The caller mocks the
 * corporation number check so that `number` passes it.
 */
export async function goToReviewStep(user: UserEvent, number = NUMBER) {
  await goToCorporationNumberStep(user);
  await user.type(screen.getByLabelText("Corporation Number"), number);
  await user.click(nextButton());
  await screen.findByRole("button", { name: /submit/i });
}

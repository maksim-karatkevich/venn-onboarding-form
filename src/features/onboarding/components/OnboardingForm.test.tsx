import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockRouter } from "@/test/nextNavigationMock";
import { mockCheck, NUMBER, validResponse } from "@/test/onboardingMocks";
import {
  backButton,
  completePersonalStep,
  FIRST_NAME,
  goToCorporationNumberStep,
  goToReviewStep,
  LAST_NAME,
  nextButton,
  PHONE,
} from "@/test/onboardingSteps";
import { OnboardingFlow } from "./OnboardingFlow";

function setup() {
  render(<OnboardingFlow />);
  return userEvent.setup();
}

/** The browser's Back and Forward buttons. */
function browserBack() {
  act(() => mockRouter.back());
}

function browserForward() {
  act(() => mockRouter.forward());
}

describe("OnboardingForm steps", () => {
  it("starts on step 1 with only the personal details fields", () => {
    setup();

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeRequired();
    expect(screen.getByLabelText("Last Name")).toBeRequired();
    expect(screen.queryByLabelText("Phone Number")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
  });

  it("uses POST so a submit before hydration can't put values in the URL", () => {
    setup();

    expect(document.querySelector("form")).toHaveAttribute("method", "post");
  });

  it("shows no errors before the user interacts with the form", () => {
    setup();

    expect(
      screen.queryByText("First name is required"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Last name is required")).not.toBeInTheDocument();
  });

  it("validates only this step on Next, focuses the first error and stays", async () => {
    const user = setup();

    await user.click(nextButton());

    expect(
      await screen.findByText("First name is required"),
    ).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toHaveFocus();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("focuses the first invalid field on Next, skipping valid ones", async () => {
    const user = setup();

    await user.type(screen.getByLabelText("First Name"), FIRST_NAME);
    await user.click(nextButton());

    await screen.findByText("Last name is required");
    expect(screen.getByLabelText("Last Name")).toHaveFocus();
  });

  it("moves to the next step, puts its name in the URL and focuses its field", async () => {
    const user = setup();

    await completePersonalStep(user);

    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(mockRouter.search).toBe("?step=phone");
    expect(screen.getByLabelText("Phone Number")).toHaveFocus();
    expect(
      screen.queryByText("Phone number is required"),
    ).not.toBeInTheDocument();
  });

  it("moves to the next step on Enter", async () => {
    const user = setup();

    await user.type(screen.getByLabelText("First Name"), FIRST_NAME);
    await user.type(screen.getByLabelText("Last Name"), `${LAST_NAME}{Enter}`);

    expect(await screen.findByLabelText("Phone Number")).toBeInTheDocument();
  });

  it("keeps entered values when Back is clicked", async () => {
    const user = setup();
    await goToCorporationNumberStep(user);

    await user.click(backButton());
    expect(await screen.findByLabelText("Phone Number")).toHaveValue(PHONE);

    await user.click(backButton());
    expect(await screen.findByLabelText("First Name")).toHaveValue(FIRST_NAME);
    expect(screen.getByLabelText("Last Name")).toHaveValue(LAST_NAME);
    expect(mockRouter.search).toBe("?step=personal");
  });

  it("moves between steps with the browser's Back and Forward buttons", async () => {
    const user = setup();
    await goToCorporationNumberStep(user);

    browserBack();
    expect(screen.getByLabelText("Phone Number")).toHaveValue(PHONE);
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

    browserForward();
    expect(screen.getByLabelText("Corporation Number")).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });

  it("starts from step 1 on reload, because values aren't kept", () => {
    mockRouter.reset("/?step=corpNumber");

    setup();

    expect(screen.getByLabelText("First Name")).toHaveValue("");
    expect(mockRouter.search).toBe("?step=personal");
  });

  it("shows step 1 for an unknown step in the URL", () => {
    mockRouter.reset("/?step=unknown");

    setup();

    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  describe("review step", () => {
    it("shows every entered value", async () => {
      mockCheck(validResponse);
      const user = setup();

      await goToReviewStep(user);

      expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
      expect(mockRouter.search).toBe("?step=review");
      for (const value of [FIRST_NAME, LAST_NAME, PHONE, NUMBER]) {
        expect(screen.getByText(value)).toBeInTheDocument();
      }
      expect(
        screen.getByRole("button", { name: /submit/i }),
      ).toBeInTheDocument();
    });

    it("goes to a value's step on Edit, with the value kept and focused", async () => {
      mockCheck(validResponse);
      const user = setup();
      await goToReviewStep(user);

      await user.click(
        screen.getByRole("button", { name: "Edit Phone Number" }),
      );

      const phone = await screen.findByLabelText("Phone Number");
      expect(phone).toHaveValue(PHONE);
      expect(phone).toHaveFocus();
      expect(mockRouter.search).toBe("?step=phone");
    });

    it.todo("sends the user back to an earlier step that became invalid");
  });

  it.each([
    ["First Name", "First name is required"],
    ["Last Name", "Last name is required"],
  ])(
    "shows a required error when %s is left empty on blur",
    async (label, message) => {
      const user = setup();

      await user.click(screen.getByLabelText(label));
      await user.tab();

      expect(await screen.findByText(message)).toBeInTheDocument();
    },
  );

  it("shows a required error when Phone Number is left empty on blur", async () => {
    const user = setup();
    await completePersonalStep(user);

    await user.tab();

    expect(
      await screen.findByText("Phone number is required"),
    ).toBeInTheDocument();
  });

  it("only validates the field that was blurred", async () => {
    const user = setup();

    await user.click(screen.getByLabelText("First Name"));
    await user.tab();

    await screen.findByText("First name is required");
    expect(screen.queryByText("Last name is required")).not.toBeInTheDocument();
  });

  it("links the error to its input for assistive technology", async () => {
    const user = setup();
    await completePersonalStep(user);
    const phone = screen.getByLabelText("Phone Number");

    expect(phone).not.toHaveAttribute("aria-invalid");

    await user.type(phone, "123");
    await user.tab();

    const error = await screen.findByText(
      "Enter a Canadian number: +13062776103",
    );
    expect(error).toHaveAttribute("aria-live", "polite");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(
      "Enter a Canadian number: +13062776103",
    );
  });

  it("keeps validating on blur, not on every keystroke, after Next", async () => {
    const user = setup();
    const firstName = screen.getByLabelText("First Name");

    await user.click(nextButton());
    await screen.findByText("First name is required");

    await user.type(firstName, FIRST_NAME);
    // Gives validation time to run, if it were wrongly triggered by typing.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText("First name is required")).toBeInTheDocument();

    await user.tab();
    await expect
      .poll(() => screen.queryByText("First name is required"))
      .not.toBeInTheDocument();
  });

  it("validates fields changed by autofill, which never get focus or blur", async () => {
    const user = setup();
    await user.click(screen.getByLabelText("First Name"));

    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "a".repeat(51) },
    });

    expect(
      await screen.findByText("Maximum 50 characters"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("First name is required"),
    ).not.toBeInTheDocument();
  });

  it("clears the error once the corrected value is blurred", async () => {
    const user = setup();
    const firstName = screen.getByLabelText("First Name");

    await user.click(firstName);
    await user.tab();
    await screen.findByText("First name is required");

    await user.type(firstName, FIRST_NAME);
    await user.tab();

    await expect
      .poll(() => screen.queryByText("First name is required"))
      .not.toBeInTheDocument();
    expect(firstName).not.toHaveAttribute("aria-invalid");
  });
});

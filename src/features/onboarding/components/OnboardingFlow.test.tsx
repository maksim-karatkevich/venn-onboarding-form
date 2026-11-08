import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  invalidResponse,
  mockCheck,
  mockSubmit,
  NUMBER,
  serverErrorResponse,
  submitSuccessResponse,
  validResponse,
} from "@/test/onboardingMocks";
import {
  backButton,
  FIRST_NAME,
  goToCorporationNumberStep,
  goToReviewStep,
  LAST_NAME,
  nextButton,
  PHONE,
  submitButton,
} from "@/test/onboardingSteps";
import { OnboardingFlow } from "./OnboardingFlow";

const CONFIRMATION = "Thanks, we've received your details.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const SUBMITTED_DETAILS = {
  firstName: FIRST_NAME,
  lastName: LAST_NAME,
  corporationNumber: NUMBER,
  phone: PHONE,
};

/** Fills in every step and stops on the review, ready to submit. */
async function setup(number = NUMBER) {
  const user = userEvent.setup();
  render(<OnboardingFlow />);
  await goToReviewStep(user, number);
  return user;
}

describe("OnboardingFlow submit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the exact body, then shows and focuses the confirmation", async () => {
    mockCheck(validResponse);
    const requestBodies = mockSubmit();
    const user = await setup();

    await user.click(submitButton());

    const confirmation = await screen.findByText(CONFIRMATION);
    expect(confirmation).toHaveFocus();
    expect(requestBodies).toEqual([SUBMITTED_DETAILS]);
    expect(submitButton).toThrow();
  });

  it("sends the body as JSON", async () => {
    mockCheck(validResponse);
    let contentType: string | null = null;
    mockSubmit((request) => {
      contentType = request.headers.get("Content-Type");
      return submitSuccessResponse();
    });
    const user = await setup();

    await user.click(submitButton());

    await screen.findByText(CONFIRMATION);
    expect(contentType).toBe("application/json");
  });

  it("posts trimmed values", async () => {
    mockCheck(validResponse);
    const requestBodies = mockSubmit();
    const user = await setup(`${NUMBER}  `);

    await user.click(submitButton());

    await screen.findByText(CONFIRMATION);
    expect(requestBodies).toEqual([SUBMITTED_DETAILS]);
  });

  it("reuses the check that ran when leaving the corporation number step", async () => {
    const requestedUrls = mockCheck(validResponse);
    mockSubmit();
    const user = await setup();

    await user.click(submitButton());

    await screen.findByText(CONFIRMATION);
    expect(requestedUrls).toHaveLength(1);
  });

  describe("clicking Submit while the check is still running", () => {
    it("waits for it, then posts once it succeeds", async () => {
      const pendingCheck = Promise.withResolvers<Response>();
      const requestedUrls = mockCheck(() => pendingCheck.promise);
      const requestBodies = mockSubmit();
      const user = await setup();

      await user.click(submitButton());

      expect(submitButton()).toHaveTextContent("Submitting...");
      expect(requestBodies).toEqual([]);

      pendingCheck.resolve(validResponse());

      await screen.findByText(CONFIRMATION);
      expect(requestedUrls).toHaveLength(1);
      expect(requestBodies).toHaveLength(1);
    });

    it("doesn't post if the number turns out to be invalid", async () => {
      const pendingCheck = Promise.withResolvers<Response>();
      mockCheck(() => pendingCheck.promise);
      const requestBodies = mockSubmit();
      const user = await setup();

      await user.click(submitButton());
      pendingCheck.resolve(invalidResponse());

      await waitFor(() => expect(submitButton()).toHaveTextContent(/^Submit$/));
      expect(requestBodies).toEqual([]);
    });
  });

  it("retries a check that failed earlier, and posts when it passes", async () => {
    const responses = [serverErrorResponse, validResponse];
    const requestedUrls = mockCheck(() => responses.shift()!());
    const requestBodies = mockSubmit();
    const user = await setup();

    await user.click(submitButton());

    await screen.findByText(CONFIRMATION);
    expect(requestedUrls).toHaveLength(2);
    expect(requestBodies).toHaveLength(1);
  });

  it.todo(
    "sends the user back to the corporation number step when the number is invalid",
  );

  describe("when the POST fails", () => {
    it("shows the server's 400 message and keeps the entered values", async () => {
      mockCheck(validResponse);
      mockSubmit(() =>
        HttpResponse.json({ message: "Invalid phone number" }, { status: 400 }),
      );
      const user = await setup();

      await user.click(submitButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Invalid phone number",
      );
      expect(screen.getByText(FIRST_NAME)).toBeInTheDocument();
      expect(submitButton()).not.toHaveAttribute("aria-disabled", "true");
      expect(screen.queryByText(CONFIRMATION)).not.toBeInTheDocument();
    });

    it.each([
      ["a 5xx", serverErrorResponse],
      ["a network failure", () => HttpResponse.error()],
      ["a 400 without a message", () => HttpResponse.json({}, { status: 400 })],
      ["a 400 that isn't JSON", () => new HttpResponse("no", { status: 400 })],
      [
        "a 400 whose message isn't text",
        () => HttpResponse.json({ message: { code: 1 } }, { status: 400 }),
      ],
    ])("shows a generic message for %s", async (_description, respond) => {
      mockCheck(validResponse);
      mockSubmit(respond);
      const user = await setup();

      await user.click(submitButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(GENERIC_ERROR);
    });

    it("clears the message on Back", async () => {
      mockCheck(validResponse);
      mockSubmit(serverErrorResponse);
      const user = await setup();

      await user.click(submitButton());
      await screen.findByRole("alert");

      await user.click(backButton());

      await screen.findByLabelText("Corporation Number");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("keeps focus on the button throughout, so Enter can retry", async () => {
      mockCheck(validResponse);
      const pendingSubmit = Promise.withResolvers<Response>();
      const responses = [pendingSubmit.promise, submitSuccessResponse()];
      const requestBodies = mockSubmit(() => responses.shift()!);
      const user = await setup();

      await user.click(submitButton());
      await waitFor(() => expect(requestBodies).toHaveLength(1));
      expect(submitButton()).toHaveFocus();

      pendingSubmit.resolve(serverErrorResponse());
      await screen.findByRole("alert");
      expect(submitButton()).toHaveFocus();

      await user.keyboard("{Enter}");

      await screen.findByText(CONFIRMATION);
      expect(requestBodies).toHaveLength(2);
    });

    it("clears the message and posts again on the next submit", async () => {
      mockCheck(validResponse);
      const pendingRetry = Promise.withResolvers<Response>();
      const responses = [serverErrorResponse(), pendingRetry.promise];
      const requestBodies = mockSubmit(() => responses.shift()!);
      const user = await setup();

      await user.click(submitButton());
      await screen.findByRole("alert");

      await user.click(submitButton());
      await waitFor(() => expect(requestBodies).toHaveLength(2));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      pendingRetry.resolve(submitSuccessResponse());
      await screen.findByText(CONFIRMATION);
    });

    it("shows a generic message when the POST times out", async () => {
      const requestedUrls = mockCheck(validResponse);
      mockSubmit();
      const user = userEvent.setup();
      render(<OnboardingFlow />);
      await goToCorporationNumberStep(user);

      // The check finishes first, so that only the POST gets the aborted signal.
      await user.type(screen.getByLabelText("Corporation Number"), NUMBER);
      await user.tab();
      await waitFor(() => expect(requestedUrls).toHaveLength(1));
      await waitFor(() =>
        expect(screen.queryByText("Checking...")).not.toBeInTheDocument(),
      );
      await user.click(nextButton());
      await screen.findByRole("button", { name: "Edit First Name" });
      const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockImplementation(() => AbortSignal.abort());

      await user.click(submitButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(GENERIC_ERROR);
      expect(timeout).toHaveBeenCalledWith(10_000);
    });
  });

  describe("while submitting", () => {
    async function setupPendingSubmit() {
      const pendingSubmit = Promise.withResolvers<Response>();
      mockCheck(validResponse);
      const requestBodies = mockSubmit(() => pendingSubmit.promise);
      const user = await setup();
      return { user, pendingSubmit, requestBodies };
    }

    it("disables both buttons and shows Submitting...", async () => {
      const { user, pendingSubmit, requestBodies } = await setupPendingSubmit();

      await user.click(submitButton());
      await waitFor(() => expect(requestBodies).toHaveLength(1));

      expect(submitButton()).toHaveAttribute("aria-disabled", "true");
      expect(submitButton()).toHaveTextContent("Submitting...");
      expect(backButton()).toHaveAttribute("aria-disabled", "true");

      pendingSubmit.resolve(submitSuccessResponse());
      await screen.findByText(CONFIRMATION);
    });

    it("sends one POST for a double click", async () => {
      const { user, pendingSubmit, requestBodies } = await setupPendingSubmit();

      await user.dblClick(submitButton());
      await waitFor(() => expect(requestBodies).toHaveLength(1));

      pendingSubmit.resolve(submitSuccessResponse());
      await screen.findByText(CONFIRMATION);
      expect(requestBodies).toHaveLength(1);
    });

    it("ignores a submit event that gets past the button", async () => {
      const { user, pendingSubmit, requestBodies } = await setupPendingSubmit();

      await user.click(submitButton());
      await waitFor(() => expect(requestBodies).toHaveLength(1));

      fireEvent.submit(document.querySelector("form")!);
      // Gives a second POST time to reach the mock, if one were sent.
      await new Promise((resolve) => setTimeout(resolve, 50));

      pendingSubmit.resolve(submitSuccessResponse());
      await screen.findByText(CONFIRMATION);
      expect(requestBodies).toHaveLength(1);
    });

    it("sends one POST when Enter is pressed again", async () => {
      const { user, pendingSubmit, requestBodies } = await setupPendingSubmit();

      await user.keyboard("{Enter}");
      await waitFor(() => expect(requestBodies).toHaveLength(1));
      await user.keyboard("{Enter}");

      pendingSubmit.resolve(submitSuccessResponse());
      await screen.findByText(CONFIRMATION);
      expect(requestBodies).toHaveLength(1);
    });
  });
});

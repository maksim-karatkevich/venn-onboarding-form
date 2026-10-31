import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INVALID_MESSAGE,
  invalidResponse,
  mockCheck,
  mockSubmit,
  NUMBER,
  serverErrorResponse,
  submitSuccessResponse,
  UNAVAILABLE_MESSAGE,
  validResponse,
} from "@/test/onboardingMocks";
import { OnboardingFlow } from "./OnboardingFlow";

const CONFIRMATION = "Thanks, we've received your details.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const SUBMITTED_DETAILS = {
  firstName: "Hello",
  lastName: "World",
  corporationNumber: NUMBER,
  phone: "+13062776103",
};

function submitButton() {
  return screen.getByRole("button", { name: /submit/i });
}

async function setup() {
  const user = userEvent.setup();
  render(<OnboardingFlow />);

  await user.type(screen.getByLabelText("First Name"), "Hello");
  await user.type(screen.getByLabelText("Last Name"), "World");
  await user.type(screen.getByLabelText("Phone Number"), "+13062776103");
  await user.type(screen.getByLabelText("Corporation Number"), NUMBER);

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
    expect(screen.queryByLabelText("First Name")).not.toBeInTheDocument();
  });

  it("posts trimmed values", async () => {
    mockCheck(validResponse);
    const requestBodies = mockSubmit();
    const user = await setup();

    await user.type(screen.getByLabelText("First Name"), "  ");
    await user.click(submitButton());

    await screen.findByText(CONFIRMATION);
    expect(requestBodies).toEqual([SUBMITTED_DETAILS]);
  });

  describe("clicking Submit during a pending check", () => {
    it("sends one GET, then the POST after it succeeds", async () => {
      const pendingCheck = Promise.withResolvers<Response>();
      const requestedUrls = mockCheck(() => pendingCheck.promise);
      const requestBodies = mockSubmit();
      const user = await setup();

      // Clicking moves focus off the field, so the blur check starts first.
      await user.click(submitButton());
      await waitFor(() => expect(requestedUrls).toHaveLength(1));

      expect(screen.getByText("Checking...")).toBeInTheDocument();
      expect(submitButton()).toHaveTextContent("Submitting...");
      expect(requestBodies).toEqual([]);

      pendingCheck.resolve(validResponse());

      await screen.findByText(CONFIRMATION);
      expect(requestedUrls).toHaveLength(1);
      expect(requestBodies).toHaveLength(1);
    });

    it("doesn't post if the number turns out to be invalid", async () => {
      const pendingCheck = Promise.withResolvers<Response>();
      const requestedUrls = mockCheck(() => pendingCheck.promise);
      const requestBodies = mockSubmit();
      const user = await setup();

      await user.click(submitButton());
      await waitFor(() => expect(requestedUrls).toHaveLength(1));

      pendingCheck.resolve(invalidResponse());

      expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
      expect(requestBodies).toEqual([]);
    });
  });

  it("reuses a finished blur check on submit", async () => {
    const requestedUrls = mockCheck(validResponse);
    mockSubmit();
    const user = await setup();

    await user.tab();
    await waitFor(() => expect(requestedUrls).toHaveLength(1));
    await waitFor(() =>
      expect(screen.queryByText("Checking...")).not.toBeInTheDocument(),
    );

    await user.click(submitButton());

    await screen.findByText(CONFIRMATION);
    expect(requestedUrls).toHaveLength(1);
  });

  describe("when the corporation number blocks the submit", () => {
    it("shows the error, focuses the field and doesn't post", async () => {
      mockCheck(invalidResponse);
      const requestBodies = mockSubmit();
      const user = await setup();

      await user.click(submitButton());

      expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByLabelText("Corporation Number")).toHaveFocus(),
      );
      expect(requestBodies).toEqual([]);
    });

    it("still checks the number when another field is invalid, and doesn't post", async () => {
      mockCheck(invalidResponse);
      const requestBodies = mockSubmit();
      const user = userEvent.setup();
      render(<OnboardingFlow />);

      // Enter submits without leaving the field, so no blur check runs first.
      await user.type(
        screen.getByLabelText("Corporation Number"),
        `${NUMBER}{Enter}`,
      );

      expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
      expect(
        await screen.findByText("First name is required"),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByLabelText("First Name")).toHaveFocus(),
      );
      expect(requestBodies).toEqual([]);
    });
  });

  describe("retrying after the number couldn't be verified", () => {
    /** Submits once with the API down, and leaves `nextResponse` for the retry. */
    async function submitDuringOutage(nextResponse: () => Response) {
      const responses = [serverErrorResponse, nextResponse];
      const requestedUrls = mockCheck(() => responses.shift()!());
      const requestBodies = mockSubmit();
      const user = await setup();

      await user.click(submitButton());
      await screen.findByText(UNAVAILABLE_MESSAGE);
      await waitFor(() =>
        expect(submitButton()).not.toHaveAttribute("aria-disabled", "true"),
      );
      expect(requestBodies).toEqual([]);

      return { user, requestedUrls, requestBodies };
    }

    it("clears the error and posts when the number is now valid", async () => {
      const { user, requestedUrls, requestBodies } =
        await submitDuringOutage(validResponse);

      await user.click(submitButton());

      await screen.findByText(CONFIRMATION);
      expect(requestedUrls).toHaveLength(2);
      expect(requestBodies).toHaveLength(1);
    });

    it("shows the invalid error and doesn't post when the number is now invalid", async () => {
      const { user, requestBodies } = await submitDuringOutage(invalidResponse);

      await user.click(submitButton());

      expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByText(UNAVAILABLE_MESSAGE)).not.toBeInTheDocument();
      expect(requestBodies).toEqual([]);
    });

    it("keeps the same message and stays enabled when the check fails again", async () => {
      const { user, requestedUrls, requestBodies } =
        await submitDuringOutage(serverErrorResponse);

      await user.click(submitButton());

      await waitFor(() => expect(requestedUrls).toHaveLength(2));
      expect(await screen.findByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
      await waitFor(() =>
        expect(submitButton()).not.toHaveAttribute("aria-disabled", "true"),
      );
      expect(requestBodies).toEqual([]);
    });
  });

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
      expect(screen.getByLabelText("First Name")).toHaveValue("Hello");
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
      const user = await setup();

      // The check finishes first, so that only the POST gets the aborted signal.
      await user.tab();
      await waitFor(() => expect(requestedUrls).toHaveLength(1));
      await waitFor(() =>
        expect(screen.queryByText("Checking...")).not.toBeInTheDocument(),
      );
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

    it("disables the button, shows Submitting... and makes inputs read-only", async () => {
      const { user, pendingSubmit, requestBodies } = await setupPendingSubmit();

      await user.click(submitButton());
      await waitFor(() => expect(requestBodies).toHaveLength(1));

      expect(submitButton()).toHaveAttribute("aria-disabled", "true");
      expect(submitButton()).toHaveTextContent("Submitting...");
      for (const label of [
        "First Name",
        "Last Name",
        "Phone Number",
        "Corporation Number",
      ]) {
        expect(screen.getByLabelText(label)).toHaveAttribute("readonly");
      }

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

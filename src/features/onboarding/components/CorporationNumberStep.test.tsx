import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INVALID_MESSAGE,
  invalidResponse,
  mockCheck,
  NUMBER,
  OTHER_NUMBER,
  serverErrorResponse,
  UNAVAILABLE_MESSAGE,
  validResponse,
} from "@/test/onboardingMocks";
import {
  backButton,
  goToCorporationNumberStep,
  nextButton,
} from "@/test/onboardingSteps";
import { API_BASE_URL } from "../api/config";
import { OnboardingFlow } from "./OnboardingFlow";

async function setup() {
  render(<OnboardingFlow />);
  const user = userEvent.setup();
  await goToCorporationNumberStep(user);
  return { user, input: screen.getByLabelText("Corporation Number") };
}

async function waitForCheckToFinish() {
  await waitFor(() =>
    expect(screen.queryByText("Checking...")).not.toBeInTheDocument(),
  );
}

describe("CorporationNumberStep check", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Checking... while the request runs, then no error for a valid number", async () => {
    const pendingResponse = Promise.withResolvers<Response>();
    const requestedUrls = mockCheck(() => pendingResponse.promise);
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();

    expect(await screen.findByText("Checking...")).toBeInTheDocument();

    pendingResponse.resolve(validResponse());
    await waitForCheckToFinish();

    expect(requestedUrls).toEqual([
      `${API_BASE_URL}/corporation-number/${NUMBER}`,
    ]);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("shows an error for an invalid number", async () => {
    mockCheck(invalidResponse);
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();

    expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(INVALID_MESSAGE);
  });

  it("treats a 200 with valid: false as invalid", async () => {
    mockCheck(() => HttpResponse.json({ valid: false }));
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();

    expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
  });

  it("shows a length error and makes no request when it isn't 9 characters", async () => {
    const requestedUrls = mockCheck(validResponse);
    const { user, input } = await setup();

    await user.type(input, "12345678");
    await user.tab();

    expect(
      await screen.findByText("Corporation number must be 9 characters"),
    ).toBeInTheDocument();
    expect(requestedUrls).toEqual([]);
  });

  it("trims the number and encodes it in the URL", async () => {
    const requestedUrls = mockCheck(validResponse);
    const { user, input } = await setup();

    await user.type(input, " abcd/1234 ");
    await user.tab();
    await waitFor(() => expect(requestedUrls).toHaveLength(1));

    expect(requestedUrls[0]).toBe(
      `${API_BASE_URL}/corporation-number/abcd%2F1234`,
    );
  });

  it("reuses the saved result when the same number is checked again", async () => {
    const requestedUrls = mockCheck((number) =>
      number === NUMBER ? invalidResponse() : validResponse(),
    );
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();
    await screen.findByText(INVALID_MESSAGE);

    await user.clear(input);
    await user.type(input, OTHER_NUMBER);
    await user.tab();
    await waitFor(() => expect(requestedUrls).toHaveLength(2));
    await waitForCheckToFinish();

    await user.clear(input);
    await user.type(input, NUMBER);
    await user.tab();

    expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
    expect(requestedUrls).toHaveLength(2);
  });

  it("waits for a running check instead of starting another request", async () => {
    const pendingResponse = Promise.withResolvers<Response>();
    const requestedUrls = mockCheck(() => pendingResponse.promise);
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();
    await screen.findByText("Checking...");

    await user.clear(input);
    await user.type(input, NUMBER);
    await user.tab();
    await screen.findByText("Checking...");

    pendingResponse.resolve(invalidResponse());

    expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
    expect(requestedUrls).toHaveLength(1);
  });

  it("clears a format error as soon as the number is edited", async () => {
    mockCheck(validResponse);
    const { user, input } = await setup();

    await user.type(input, "12345678");
    await user.tab();
    await screen.findByText("Corporation number must be 9 characters");

    await user.type(input, "9");

    expect(
      screen.queryByText("Corporation number must be 9 characters"),
    ).not.toBeInTheDocument();
  });

  it("clears the error as soon as the number is edited", async () => {
    mockCheck(invalidResponse);
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();
    await screen.findByText(INVALID_MESSAGE);

    await user.type(input, "1");

    expect(screen.queryByText(INVALID_MESSAGE)).not.toBeInTheDocument();
  });

  it("keeps saved checks when the user goes back and returns", async () => {
    const requestedUrls = mockCheck(invalidResponse);
    const { user, input } = await setup();

    await user.type(input, NUMBER);
    await user.tab();
    await screen.findByText(INVALID_MESSAGE);

    await user.click(backButton());
    await screen.findByLabelText("Phone Number");
    await user.click(nextButton());
    await user.click(await screen.findByLabelText("Corporation Number"));
    await user.tab();

    expect(await screen.findByText(INVALID_MESSAGE)).toBeInTheDocument();
    expect(requestedUrls).toHaveLength(1);
  });

  describe("when the API can't answer", () => {
    it.each([
      ["a 5xx", serverErrorResponse],
      ["a network failure", () => HttpResponse.error()],
      ["an unexpected 4xx", () => new HttpResponse(null, { status: 429 })],
      ["a malformed body", () => HttpResponse.text("not json")],
      ["a body without valid", () => HttpResponse.json({})],
    ])("doesn't call %s invalid", async (_description, respond) => {
      mockCheck(respond);
      const { user, input } = await setup();

      await user.type(input, NUMBER);
      await user.tab();

      expect(await screen.findByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByText(INVALID_MESSAGE)).not.toBeInTheDocument();
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(input).toHaveAccessibleDescription(UNAVAILABLE_MESSAGE);
    });

    it("treats a timeout as unavailable", async () => {
      const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockImplementation(() => AbortSignal.abort());
      mockCheck(validResponse);
      const { user, input } = await setup();

      await user.type(input, NUMBER);
      await user.tab();

      expect(await screen.findByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
      expect(timeout).toHaveBeenCalledWith(10_000);
    });

    it("doesn't save the failure, so the next attempt calls the API again", async () => {
      const responses = [serverErrorResponse(), validResponse()];
      const requestedUrls = mockCheck(() => responses.shift()!);
      const { user, input } = await setup();

      await user.type(input, NUMBER);
      await user.tab();
      await screen.findByText(UNAVAILABLE_MESSAGE);

      await user.click(input);
      await user.tab();

      await waitFor(() =>
        expect(screen.queryByText(UNAVAILABLE_MESSAGE)).not.toBeInTheDocument(),
      );
      await waitForCheckToFinish();
      expect(requestedUrls).toHaveLength(2);
      expect(input).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("stale responses", () => {
    it("ignores an older response that arrives after a newer one", async () => {
      const firstResponse = Promise.withResolvers<Response>();
      mockCheck((number) =>
        number === NUMBER ? firstResponse.promise : validResponse(),
      );
      const { user, input } = await setup();

      await user.type(input, NUMBER);
      await user.tab();
      await screen.findByText("Checking...");

      await user.clear(input);
      await user.type(input, OTHER_NUMBER);
      await user.tab();
      await waitForCheckToFinish();

      firstResponse.resolve(invalidResponse());
      // Let the late response finish being handled before asserting.
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(screen.queryByText(INVALID_MESSAGE)).not.toBeInTheDocument();
      expect(input).not.toHaveAttribute("aria-invalid");
    });

    it("ignores a response for a number that has since been edited", async () => {
      const pendingResponse = Promise.withResolvers<Response>();
      mockCheck(() => pendingResponse.promise);
      const { user, input } = await setup();

      await user.type(input, NUMBER);
      await user.tab();
      await screen.findByText("Checking...");

      await user.type(input, "1");
      expect(screen.queryByText("Checking...")).not.toBeInTheDocument();

      pendingResponse.resolve(invalidResponse());
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(screen.queryByText(INVALID_MESSAGE)).not.toBeInTheDocument();
    });
  });
});

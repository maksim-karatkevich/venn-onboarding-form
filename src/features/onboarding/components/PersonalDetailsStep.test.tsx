import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PersonalDetailsStep } from "./PersonalDetailsStep";

const REQUIRED_FIELDS = [
  ["First Name", "First name is required"],
  ["Last Name", "Last name is required"],
  ["Phone Number", "Phone number is required"],
  ["Corporation Number", "Corporation number is required"],
];

function setup() {
  render(<PersonalDetailsStep onComplete={() => undefined} />);
  return userEvent.setup();
}

describe("PersonalDetailsStep", () => {
  it("marks every field as required for assistive technology", () => {
    setup();

    REQUIRED_FIELDS.forEach(([label]) => {
      expect(screen.getByLabelText(label)).toBeRequired();
    });
  });

  it("uses POST so a submit before hydration can't put values in the URL", () => {
    setup();

    expect(document.querySelector("form")).toHaveAttribute("method", "post");
  });

  it("shows no errors before the user interacts with the form", () => {
    setup();

    REQUIRED_FIELDS.forEach(([, message]) => {
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    });
  });

  it.each(REQUIRED_FIELDS)(
    "shows a required error when %s is left empty on blur",
    async (label, message) => {
      const user = setup();

      await user.click(screen.getByLabelText(label));
      await user.tab();

      expect(await screen.findByText(message)).toBeInTheDocument();
    },
  );

  it("only validates the field that was blurred", async () => {
    const user = setup();

    await user.click(screen.getByLabelText("First Name"));
    await user.tab();

    await screen.findByText("First name is required");
    expect(screen.queryByText("Last name is required")).not.toBeInTheDocument();
  });

  it("links the error to its input for assistive technology", async () => {
    const user = setup();
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

  it("keeps validating on blur, not on every keystroke, after a submit", async () => {
    const user = setup();
    const firstName = screen.getByLabelText("First Name");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    await screen.findByText("First name is required");

    await user.type(firstName, "Hello");
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

    fireEvent.change(screen.getByLabelText("Phone Number"), {
      target: { value: "+12025550123" },
    });

    expect(
      await screen.findByText("Enter a Canadian number: +13062776103"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Last name is required")).not.toBeInTheDocument();
  });

  it("clears the error once the corrected value is blurred", async () => {
    const user = setup();
    const firstName = screen.getByLabelText("First Name");

    await user.click(firstName);
    await user.tab();
    await screen.findByText("First name is required");

    await user.type(firstName, "Hello");
    await user.tab();

    await expect
      .poll(() => screen.queryByText("First name is required"))
      .not.toBeInTheDocument();
    expect(firstName).not.toHaveAttribute("aria-invalid");
  });

  it("shows every required error on submit and focuses the first field", async () => {
    const user = setup();

    await user.click(screen.getByRole("button", { name: "Submit" }));

    for (const [, message] of REQUIRED_FIELDS) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
    expect(screen.getByLabelText("First Name")).toHaveFocus();
  });

  it("focuses the first invalid field on submit, skipping valid ones", async () => {
    const user = setup();

    await user.type(screen.getByLabelText("First Name"), "Hello");
    await user.type(screen.getByLabelText("Last Name"), "World");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await screen.findByText("Phone number is required");
    expect(screen.getByLabelText("Phone Number")).toHaveFocus();
  });
});

import { render, screen } from "@testing-library/react";
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

    await screen.findByText("Enter a Canadian number like +13062776103");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(
      "Enter a Canadian number like +13062776103",
    );
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

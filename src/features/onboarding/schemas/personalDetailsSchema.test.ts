import { describe, expect, it } from "vitest";
import { personalDetailsSchema } from "./personalDetailsSchema";

const validDetails = {
  firstName: "Hello",
  lastName: "World",
  phone: "+13062776103",
  corporationNumber: "000000000",
};

function firstError(overrides: Partial<typeof validDetails>) {
  const result = personalDetailsSchema.safeParse({
    ...validDetails,
    ...overrides,
  });
  return result.error?.issues[0]?.message;
}

describe("personalDetailsSchema", () => {
  describe("names", () => {
    it.each(["José", "O'Brien", "Anne-Marie", "St. John", "Mary Ann", "李"])(
      "accepts %s",
      (firstName) => {
        expect(firstError({ firstName })).toBeUndefined();
      },
    );

    it("rejects whitespace-only values", () => {
      expect(firstError({ firstName: "   " })).toBe("First name is required");
    });

    it("allows 50 characters and rejects 51", () => {
      expect(firstError({ lastName: "a".repeat(50) })).toBeUndefined();
      expect(firstError({ lastName: "a".repeat(51) })).toBe(
        "Maximum 50 characters",
      );
    });

    it("trims the value and doesn't count surrounding spaces", () => {
      const firstName = `  ${"a".repeat(50)}  `;
      const parsed = personalDetailsSchema.parse({
        ...validDetails,
        firstName,
      });
      expect(parsed.firstName).toBe("a".repeat(50));
    });
  });

  describe("phone", () => {
    it.each(["+13062776103", "+14165550123"])("accepts %s", (phone) => {
      expect(firstError({ phone })).toBeUndefined();
    });

    it.each([
      ["a US number", "+12025550123"],
      ["a toll-free number", "+18005550123"],
      ["punctuation", "+1 (306) 277-6103"],
      ["no plus sign", "13062776103"],
      ["no country code", "3062776103"],
      ["another country code", "+443062776103"],
      ["too few digits", "+1306277610"],
      ["too many digits", "+130627761034"],
      ["an invalid area code", "+11062776103"],
    ])("rejects %s", (_description, phone) => {
      expect(firstError({ phone })).toBe(
        "Enter a Canadian number like +13062776103",
      );
    });

    it("reports an empty value as required", () => {
      expect(firstError({ phone: "" })).toBe("Phone number is required");
    });
  });

  describe("corporation number", () => {
    it("reports an empty value as required", () => {
      expect(firstError({ corporationNumber: "" })).toBe(
        "Corporation number is required",
      );
    });

    it.each(["12345678", "1234567890"])("rejects %s by length", (value) => {
      expect(firstError({ corporationNumber: value })).toBe(
        "Corporation number must be 9 characters",
      );
    });

    it("leaves non-numeric values for the API to decide", () => {
      expect(firstError({ corporationNumber: "abcdefghi" })).toBeUndefined();
    });

    it("keeps leading zeros and trims surrounding spaces", () => {
      const parsed = personalDetailsSchema.parse({
        ...validDetails,
        corporationNumber: " 000000001 ",
      });
      expect(parsed.corporationNumber).toBe("000000001");
    });
  });
});

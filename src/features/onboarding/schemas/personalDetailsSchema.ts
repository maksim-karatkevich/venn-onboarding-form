import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { z } from "zod";
import { PERSONAL_DETAILS_FIELD } from "../types";

const NAME_MAX_LENGTH = 50;
const CORPORATION_NUMBER_LENGTH = 9;
// libphonenumber-js accepts punctuation such as "+1 (306) 277-6103", which the spec forbids.
const PHONE_FORMAT = /^\+1\d{10}$/;

function isCanadianPhoneNumber(value: string) {
  return (
    PHONE_FORMAT.test(value) &&
    // +1 is shared with the US, so the country has to be resolved from the area code.
    parsePhoneNumberFromString(value)?.country === "CA"
  );
}

function nameField(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(NAME_MAX_LENGTH, `Maximum ${NAME_MAX_LENGTH} characters`);
}

export const personalDetailsSchema = z.object({
  [PERSONAL_DETAILS_FIELD.FIRST_NAME]: nameField("First name"),
  [PERSONAL_DETAILS_FIELD.LAST_NAME]: nameField("Last name"),
  [PERSONAL_DETAILS_FIELD.PHONE]: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isCanadianPhoneNumber, "Enter a Canadian number like +13062776103"),
  [PERSONAL_DETAILS_FIELD.CORPORATION_NUMBER]: z
    .string()
    .trim()
    .min(1, "Corporation number is required")
    .length(
      CORPORATION_NUMBER_LENGTH,
      `Corporation number must be ${CORPORATION_NUMBER_LENGTH} characters`,
    ),
});

export type PersonalDetails = z.infer<typeof personalDetailsSchema>;

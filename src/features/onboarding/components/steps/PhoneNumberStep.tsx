import type { ReactElement } from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/FormField";
import type { PersonalDetails } from "../../schemas/personalDetailsSchema";
import { PERSONAL_DETAILS_FIELD } from "../../types";

const { PHONE } = PERSONAL_DETAILS_FIELD;

export function PhoneNumberStep(): ReactElement {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<PersonalDetails>();

  return (
    <FormField
      label="Phone Number"
      type="tel"
      autoComplete="tel"
      required
      readOnly={isSubmitting}
      error={errors[PHONE]?.message}
      {...register(PHONE)}
    />
  );
}

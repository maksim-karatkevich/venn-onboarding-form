import type { ReactElement } from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/FormField";
import type { PersonalDetails } from "../../schemas/personalDetailsSchema";
import { PERSONAL_DETAILS_FIELD } from "../../types";

export const { FIRST_NAME, LAST_NAME } = PERSONAL_DETAILS_FIELD;

export function PersonalDetailsStep(): ReactElement {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<PersonalDetails>();

  return (
    <div className="grid gap-x-5 sm:grid-cols-2">
      <FormField
        label="First Name"
        autoComplete="given-name"
        required
        readOnly={isSubmitting}
        error={errors[FIRST_NAME]?.message}
        {...register(FIRST_NAME)}
      />
      <FormField
        label="Last Name"
        autoComplete="family-name"
        required
        readOnly={isSubmitting}
        error={errors[LAST_NAME]?.message}
        {...register(LAST_NAME)}
      />
    </div>
  );
}

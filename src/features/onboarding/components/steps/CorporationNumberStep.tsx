import type { ReactElement } from "react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { FormField } from "@/components/FormField";
import type { CorporationNumberValidation } from "../../hooks/useCorporationNumberValidation";
import type { PersonalDetails } from "../../schemas/personalDetailsSchema";
import { PERSONAL_DETAILS_FIELD } from "../../types";

const { CORPORATION_NUMBER } = PERSONAL_DETAILS_FIELD;

type CorporationNumberStepProps = {
  /** Lives in the parent, because the submit also waits for the check. */
  corporationNumberValidation: CorporationNumberValidation;
};

export function CorporationNumberStep({
  corporationNumberValidation,
}: CorporationNumberStepProps): ReactElement {
  const {
    register,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useFormContext<PersonalDetails>();
  const {
    isChecking,
    isInvalid: isCheckInvalid,
    error: checkError,
    validateCorporationNumber,
    reset: resetCheck,
  } = corporationNumberValidation;

  const corporationNumberOptions: RegisterOptions<
    PersonalDetails,
    typeof CORPORATION_NUMBER
  > = {
    onBlur: ({ target }) => validateCorporationNumber(target.value),
    onChange: () => {
      if (errors[CORPORATION_NUMBER]) clearErrors(CORPORATION_NUMBER);
      resetCheck();
    },
  };

  return (
    <FormField
      label="Corporation Number"
      autoComplete="off"
      required
      readOnly={isSubmitting}
      error={errors[CORPORATION_NUMBER]?.message ?? checkError}
      isInvalid={Boolean(errors[CORPORATION_NUMBER]) || isCheckInvalid}
      status={isChecking ? "Checking..." : undefined}
      messageClassName="min-h-8 sm:min-h-4"
      {...register(CORPORATION_NUMBER, corporationNumberOptions)}
    />
  );
}

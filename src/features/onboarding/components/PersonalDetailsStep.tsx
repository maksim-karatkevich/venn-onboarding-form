"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import {
  useForm,
  type RegisterOptions,
  type UseFormProps,
} from "react-hook-form";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { submitPersonalDetails } from "../api/submitPersonalDetails";
import { useCorporationNumberValidation } from "../hooks/useCorporationNumberValidation";
import {
  personalDetailsSchema,
  type PersonalDetails,
} from "../schemas/personalDetailsSchema";
import { CORPORATION_NUMBER_STATUS, PERSONAL_DETAILS_FIELD } from "../types";

const { FIRST_NAME, LAST_NAME, PHONE, CORPORATION_NUMBER } =
  PERSONAL_DETAILS_FIELD;

const INITIAL_VALUES: PersonalDetails = {
  [FIRST_NAME]: "",
  [LAST_NAME]: "",
  [PHONE]: "",
  [CORPORATION_NUMBER]: "",
};

const FORM_CONFIG: UseFormProps<PersonalDetails> = {
  resolver: zodResolver(personalDetailsSchema),
  mode: "onBlur",
  reValidateMode: "onBlur",
  defaultValues: INITIAL_VALUES,
};

type PersonalDetailsStepProps = {
  onComplete: () => void;
};

export function PersonalDetailsStep({ onComplete }: PersonalDetailsStepProps) {
  const {
    register,
    handleSubmit,
    clearErrors,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetails>(FORM_CONFIG);
  const {
    isChecking,
    error: checkError,
    validateCorporationNumber,
    reset: resetCheck,
  } = useCorporationNumberValidation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Only the options live here: React Hook Form focuses the first error in
  // registration order, so fields have to be registered in order in the JSX.
  const corporationNumberOptions: RegisterOptions<
    PersonalDetails,
    typeof CORPORATION_NUMBER
  > = {
    onBlur: ({ target }) => validateCorporationNumber(target.value),
    onChange: () => {
      clearErrors(CORPORATION_NUMBER);
      resetCheck();
    },
  };

  async function submitDetails(details: PersonalDetails) {
    const status = await validateCorporationNumber(details[CORPORATION_NUMBER]);
    if (status !== CORPORATION_NUMBER_STATUS.VALID) {
      setFocus(CORPORATION_NUMBER);
      return;
    }

    const result = await submitPersonalDetails(details);
    if (result.ok) {
      onComplete();
    } else {
      setSubmitError(result.message);
    }
  }

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    setSubmitError(null);
    return handleSubmit(submitDetails, () =>
      // Other fields are invalid, but the corporation number still gets
      // checked so that every message appears at once.
      validateCorporationNumber(getValues(CORPORATION_NUMBER)),
    )(event);
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <FormField
          label="First Name"
          autoComplete="given-name"
          readOnly={isSubmitting}
          error={errors[FIRST_NAME]?.message}
          {...register(FIRST_NAME)}
        />
        <FormField
          label="Last Name"
          autoComplete="family-name"
          readOnly={isSubmitting}
          error={errors[LAST_NAME]?.message}
          {...register(LAST_NAME)}
        />
      </div>
      <FormField
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        readOnly={isSubmitting}
        error={errors[PHONE]?.message}
        {...register(PHONE)}
      />
      <FormField
        label="Corporation Number"
        autoComplete="off"
        readOnly={isSubmitting}
        error={errors[CORPORATION_NUMBER]?.message ?? checkError}
        status={isChecking ? "Checking..." : undefined}
        // The "couldn't verify" message wraps to two lines on narrow screens.
        messageClassName="min-h-10 sm:min-h-5"
        {...register(CORPORATION_NUMBER, corporationNumberOptions)}
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-3.5 h-11.5 w-full rounded-[10px] font-normal"
      >
        {isSubmitting ? (
          "Submitting..."
        ) : (
          <>
            Submit
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>
      {/* Below the button so that it can't move the button when it appears. */}
      {submitError && (
        <p role="alert" className="text-destructive mt-2 text-center text-xs">
          {submitError}
        </p>
      )}
    </form>
  );
}

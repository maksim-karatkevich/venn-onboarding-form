"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import {
  useState,
  type ChangeEvent,
  type ReactElement,
  type SubmitEvent,
} from "react";
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

export function PersonalDetailsStep({
  onComplete,
}: PersonalDetailsStepProps): ReactElement {
  const {
    register,
    handleSubmit,
    clearErrors,
    getValues,
    trigger,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetails>(FORM_CONFIG);
  const {
    isChecking,
    isInvalid: isCheckInvalid,
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
      if (errors[CORPORATION_NUMBER]) clearErrors(CORPORATION_NUMBER);
      resetCheck();
    },
  };

  function handleFormChange({ target }: ChangeEvent<HTMLFormElement>): void {
    setSubmitError(null);

    // Autofill changes fields without focusing them, so they never blur.
    const autofilledField = Object.values(PERSONAL_DETAILS_FIELD).find(
      (field) => field === target.name && target !== document.activeElement,
    );
    if (autofilledField) trigger(autofilledField);
  }

  async function submitDetails(details: PersonalDetails): Promise<void> {
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

  async function onSubmit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    // The button blocks repeat clicks itself, but a POST shouldn't rely on that.
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    setSubmitError(null);
    await handleSubmit(submitDetails, () =>
      // Other fields are invalid, but the corporation number still gets
      // checked so that every message appears at once.
      validateCorporationNumber(getValues(CORPORATION_NUMBER)),
    )(event);
  }

  return (
    <form
      method="post"
      noValidate
      onSubmit={onSubmit}
      onChange={handleFormChange}
    >
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
      <FormField
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        required
        readOnly={isSubmitting}
        error={errors[PHONE]?.message}
        {...register(PHONE)}
      />
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
      <Button
        type="submit"
        disabled={isSubmitting}
        focusableWhenDisabled
        className="mt-5.5 h-11.5 w-full rounded-[10px] font-normal aria-disabled:opacity-50"
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
      {submitError && (
        <p role="alert" className="text-destructive mt-2 text-center text-xs">
          {submitError}
        </p>
      )}
    </form>
  );
}

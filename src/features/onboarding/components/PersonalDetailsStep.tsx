"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import {
  useForm,
  type RegisterOptions,
  type UseFormProps,
} from "react-hook-form";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { useCorporationNumberValidation } from "../hooks/useCorporationNumberValidation";
import {
  personalDetailsSchema,
  type PersonalDetails,
} from "../schemas/personalDetailsSchema";
import { PERSONAL_DETAILS_FIELD } from "../types";

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

export function PersonalDetailsStep() {
  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm<PersonalDetails>(FORM_CONFIG);
  const {
    isChecking,
    error: checkError,
    handleBlur,
    reset: resetCheck,
  } = useCorporationNumberValidation();

  // Only the options live here: React Hook Form focuses the first error in
  // registration order, so fields have to be registered in order in the JSX.
  const corporationNumberOptions: RegisterOptions<
    PersonalDetails,
    typeof CORPORATION_NUMBER
  > = {
    onBlur: ({ target }) => handleBlur(target.value),
    onChange: () => {
      clearErrors(CORPORATION_NUMBER);
      resetCheck();
    },
  };

  return (
    <form noValidate onSubmit={handleSubmit(() => undefined)}>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <FormField
          label="First Name"
          autoComplete="given-name"
          error={errors[FIRST_NAME]?.message}
          {...register(FIRST_NAME)}
        />
        <FormField
          label="Last Name"
          autoComplete="family-name"
          error={errors[LAST_NAME]?.message}
          {...register(LAST_NAME)}
        />
      </div>
      <FormField
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        error={errors[PHONE]?.message}
        {...register(PHONE)}
      />
      <FormField
        label="Corporation Number"
        autoComplete="off"
        error={errors[CORPORATION_NUMBER]?.message ?? checkError}
        status={isChecking ? "Checking..." : undefined}
        // The "couldn't verify" message wraps to two lines on narrow screens.
        messageClassName="min-h-10 sm:min-h-5"
        {...register(CORPORATION_NUMBER, corporationNumberOptions)}
      />
      <Button
        type="submit"
        className="mt-3.5 h-11.5 w-full rounded-[10px] font-normal"
      >
        Submit
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}

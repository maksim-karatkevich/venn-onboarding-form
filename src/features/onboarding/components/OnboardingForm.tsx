"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactElement,
  type SubmitEvent,
} from "react";
import { FormProvider, useForm, type UseFormProps } from "react-hook-form";
import { submitPersonalDetails } from "../api/submitPersonalDetails";
import { useCorporationNumberValidation } from "../hooks/useCorporationNumberValidation";
import {
  personalDetailsSchema,
  type PersonalDetails,
} from "../schemas/personalDetailsSchema";
import {
  CORPORATION_NUMBER_STATUS,
  ONBOARDING_STEPS,
  OnboardingStep,
  PERSONAL_DETAILS_FIELD,
  STEP_FIELDS,
} from "../types";
import { CorporationNumberStep } from "./steps/CorporationNumberStep";
import { PersonalDetailsStep } from "./steps/PersonalDetailsStep";
import { PhoneNumberStep } from "./steps/PhoneNumberStep";
import { StepButtons } from "./StepButtons";
import { FormNavigation } from "../hooks/useStepNavigation";
import { ReviewStep } from "./steps/ReviewStep";

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

type OnboardingFormProps = {
  onComplete: () => void;
  navigation: FormNavigation;
};

export function OnboardingForm({
  onComplete,
  navigation,
}: OnboardingFormProps): ReactElement {
  const form = useForm<PersonalDetails>(FORM_CONFIG);
  const {
    handleSubmit,
    getValues,
    trigger,
    setFocus,
    formState: { isSubmitting },
  } = form;
  const corpNumberValidation = useCorporationNumberValidation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { currentStep, isFirstStep, isLastStep, onBack, onNext, goToStep } =
    navigation;

  useEffect(() => {
    setFocus(STEP_FIELDS[currentStep][0]);
  }, [currentStep, setFocus, goToStep]);

  function handleBack(): void {
    setSubmitError(null);
    onBack();
  }

  function handleOnEdit(step: OnboardingStep): void {
    goToStep(step);
  }

  function handleFormChange({ target }: ChangeEvent<HTMLFormElement>): void {
    setSubmitError(null);

    // Autofill changes fields without focusing them, so they never blur.
    const autofilledField = Object.values(PERSONAL_DETAILS_FIELD).find(
      (field) => field === target.name && target !== document.activeElement,
    );
    if (autofilledField) trigger(autofilledField);
  }

  async function submitDetails(details: PersonalDetails): Promise<void> {
    const status = await corpNumberValidation.validateCorporationNumber(
      details[CORPORATION_NUMBER],
    );
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
    event.preventDefault();
    // The button blocks repeat clicks itself, but a POST shouldn't rely on that.
    if (isSubmitting) {
      return;
    }
    if (!isLastStep) {
      const isValid = await trigger(STEP_FIELDS[currentStep], {
        shouldFocus: true,
      });

      if (isValid) {
        onNext();
      }
      return;
    }

    setSubmitError(null);
    await handleSubmit(submitDetails, () =>
      // Other fields are invalid, but the corporation number still gets
      // checked so that every message appears at once.
      corpNumberValidation.validateCorporationNumber(
        getValues(CORPORATION_NUMBER),
      ),
    )(event);
  }

  return (
    <FormProvider {...form}>
      <form
        method="post"
        noValidate
        onSubmit={onSubmit}
        onChange={handleFormChange}
      >
        {currentStep === ONBOARDING_STEPS.PERSONAL && <PersonalDetailsStep />}
        {currentStep === ONBOARDING_STEPS.PHONE && <PhoneNumberStep />}
        {currentStep === ONBOARDING_STEPS.CORP_NUMBER && (
          <CorporationNumberStep
            corporationNumberValidation={corpNumberValidation}
          />
        )}
        {currentStep === ONBOARDING_STEPS.REVIEW && (
          <ReviewStep onEdit={handleOnEdit} />
        )}
        <StepButtons
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          onBack={handleBack}
        ></StepButtons>
        {submitError && (
          <p role="alert" className="text-destructive mt-2 text-center text-xs">
            {submitError}
          </p>
        )}
      </form>
    </FormProvider>
  );
}

import type { ReactElement } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { PersonalDetails } from "../../schemas/personalDetailsSchema";
import {
  ONBOARDING_STEPS,
  PERSONAL_DETAILS_FIELD,
  type OnboardingStep,
} from "../../types";

const { FIRST_NAME, LAST_NAME, PHONE, CORPORATION_NUMBER } =
  PERSONAL_DETAILS_FIELD;

// What the review shows, in order, and which step edits each value.
const REVIEW_ROWS: {
  label: string;
  field: keyof PersonalDetails;
  step: OnboardingStep;
}[] = [
  { label: "First Name", field: FIRST_NAME, step: ONBOARDING_STEPS.PERSONAL },
  { label: "Last Name", field: LAST_NAME, step: ONBOARDING_STEPS.PERSONAL },
  { label: "Phone Number", field: PHONE, step: ONBOARDING_STEPS.PHONE },
  {
    label: "Corporation Number",
    field: CORPORATION_NUMBER,
    step: ONBOARDING_STEPS.CORP_NUMBER,
  },
];

type ReviewStepProps = {
  /** Sends the user back to the step that holds a value. */
  onEdit: (step: OnboardingStep) => void;
};

export function ReviewStep({ onEdit }: ReviewStepProps): ReactElement {
  // Nothing can change on this step, so reading once is enough. No need to
  // subscribe with watch().
  const { getValues } = useFormContext<PersonalDetails>();
  const values = getValues();

  return (
    <dl className="divide-border divide-y">
      {REVIEW_ROWS.map(({ label, field, step }) => (
        <div key={field} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <dt className="text-muted-foreground text-[13px]">{label}</dt>
            <dd className="truncate">{values[field]}</dd>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(step)}
            aria-label={`Edit ${label}`}
          >
            Edit
          </Button>
        </div>
      ))}
    </dl>
  );
}

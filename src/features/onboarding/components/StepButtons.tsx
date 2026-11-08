import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";

const BUTTON_CLASS_NAME =
  "h-11.5 flex-1 rounded-[10px] font-normal aria-disabled:opacity-50";

type StepButtonsProps = {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onBack: () => void;
};

export function StepButtons({
  isFirstStep,
  isLastStep,
  isSubmitting,
  onBack,
}: StepButtonsProps): ReactElement {
  return (
    <div className="mt-5.5 flex gap-3">
      {!isFirstStep && (
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          focusableWhenDisabled
          onClick={onBack}
          className={BUTTON_CLASS_NAME}
        >
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      )}
      {/* Next is a submit button too, so Enter in a field moves on. The
          form's onSubmit decides whether to go next or send the POST. */}
      <Button
        type="submit"
        disabled={isSubmitting}
        focusableWhenDisabled
        className={BUTTON_CLASS_NAME}
      >
        {isSubmitting ? (
          "Submitting..."
        ) : (
          <>
            {isLastStep ? "Submit" : "Next"}
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>
    </div>
  );
}

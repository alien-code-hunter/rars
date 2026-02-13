import { Button } from "@/components/ui/button";

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  saving: boolean;
  submitting: boolean;
  canSubmit: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function FormNavigation({
  currentStep,
  totalSteps,
  saving,
  submitting,
  canSubmit,
  onPrevStep,
  onNextStep,
  onSaveDraft,
  onSubmit,
}: FormNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 0}
      >
        Previous
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        {isLastStep ? (
          <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        ) : (
          <Button onClick={onNextStep}>Next</Button>
        )}
      </div>
    </div>
  );
}

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

interface StepDefinition {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface FormStepperProps {
  steps: StepDefinition[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(index)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-left transition",
              isActive && "border-primary bg-primary/5",
              isComplete && "border-success/60"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border",
                isActive && "border-primary text-primary",
                isComplete && "border-success text-success"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

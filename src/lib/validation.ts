import type { ApplicationFormData } from "@/hooks/useApplicationForm";

export function validateSubmission(formData: ApplicationFormData) {
  if (!formData.title.trim()) {
    return { valid: false, message: "Please enter a research title", step: 1 };
  }

  if (!formData.ethics_approved) {
    return { valid: false, message: "Ethics approval is mandatory before submission", step: 3 };
  }

  return { valid: true, message: "", step: 0 };
}

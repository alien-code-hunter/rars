import { describe, it, expect } from "vitest";
import { validateSubmission } from "@/lib/validation";
import type { ApplicationFormData } from "@/hooks/useApplicationForm";

const base: ApplicationFormData = {
  title: "Study title",
  abstract: "",
  objectives: "",
  methodology: "",
  data_type: "AGGREGATED",
  sensitivity_level: "PUBLIC",
  sensitivity_reason: "",
  regions_facilities: [],
  start_date: "",
  end_date: "",
  ethics_approved: true,
  supervisor_name: "",
  supervisor_email: "",
};

describe("validateSubmission", () => {
  it("rejects missing title", () => {
    const result = validateSubmission({ ...base, title: "" });
    expect(result.valid).toBe(false);
    expect(result.step).toBe(1);
  });

  it("rejects missing ethics approval", () => {
    const result = validateSubmission({ ...base, ethics_approved: false });
    expect(result.valid).toBe(false);
    expect(result.step).toBe(3);
  });

  it("accepts valid submission", () => {
    const result = validateSubmission(base);
    expect(result.valid).toBe(true);
  });
});

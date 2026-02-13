import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notifications";
import { sendWorkflowEmail } from "@/lib/email";
import type { Application, DataType, SensitivityLevel } from "@/lib/types";
import { validateSubmission } from "@/lib/validation";

export interface ApplicationFormData {
  title: string;
  abstract: string;
  objectives: string;
  methodology: string;
  data_type: DataType;
  sensitivity_level: SensitivityLevel;
  sensitivity_reason: string;
  regions_facilities: string[];
  start_date: string;
  end_date: string;
  ethics_approved: boolean;
  supervisor_name: string;
  supervisor_email: string;
}

const initialFormData: ApplicationFormData = {
  title: "",
  abstract: "",
  objectives: "",
  methodology: "",
  data_type: "AGGREGATED",
  sensitivity_level: "PUBLIC",
  sensitivity_reason: "",
  regions_facilities: [],
  start_date: "",
  end_date: "",
  ethics_approved: false,
  supervisor_name: "",
  supervisor_email: "",
};

export function useApplicationForm(userId: string | undefined) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const applicationId = useMemo(() => id ?? createdId, [id, createdId]);

  const fetchApplication = useCallback(async () => {
    if (!applicationId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (data) {
        const app = data as unknown as Application;
        setFormData({
          title: app.title || "",
          abstract: app.abstract || "",
          objectives: app.objectives || "",
          methodology: app.methodology || "",
          data_type: app.data_type || "AGGREGATED",
          sensitivity_level: app.sensitivity_level || "PUBLIC",
          sensitivity_reason: app.sensitivity_reason || "",
          regions_facilities: app.regions_facilities || [],
          start_date: app.start_date || "",
          end_date: app.end_date || "",
          ethics_approved: app.ethics_approved || false,
          supervisor_name: app.supervisor_name || "",
          supervisor_email: app.supervisor_email || "",
        });
      }
    } catch (fetchErr) {
      console.error("Error fetching application:", fetchErr);
      toast({
        title: "Failed to load application",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId, fetchApplication]);

  const handleInputChange = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const upsertDraft = async (notify = true) => {
    if (!userId) return null;
    setSaving(true);
    setError("");

    try {
      if (applicationId) {
        const { error: updateError } = await supabase
          .from("applications")
          .update({
            ...formData,
            title: formData.title || "Untitled Application",
          })
          .eq("id", applicationId);

        if (updateError) throw updateError;
        if (notify) {
          toast({
            title: "Draft saved",
            description: "Your application draft has been saved.",
          });
        }
        return applicationId;
      }

      const { data, error: insertError } = await supabase
        .from("applications")
        .insert({
          ...formData,
          title: formData.title || "Untitled Application",
          applicant_id: userId,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      if (data?.id) {
        setCreatedId(data.id);
        navigate(`/applications/${data.id}/edit`, { replace: true });
      }

      if (notify) {
        toast({
          title: "Draft created",
          description: "Your application draft has been created.",
        });
      }

      return data?.id ?? null;
    } catch (saveErr) {
      const message = saveErr instanceof Error ? saveErr.message : "Failed to save draft";
      console.error("Error saving draft:", saveErr);
      setError(message);
      if (notify) {
        toast({
          title: "Unable to save",
          description: message,
          variant: "destructive",
        });
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    await upsertDraft(true);
  };

  const ensureApplicationId = async () => {
    if (applicationId) return applicationId;
    return await upsertDraft(false);
  };

  const submitApplication = async () => {
    if (!userId) return;
    const ensuredId = await ensureApplicationId();
    if (!ensuredId) return;

    const validation = validateSubmission(formData);
    if (!validation.valid) {
      setError(validation.message);
      setCurrentStep(validation.step);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          ...formData,
          status: "SUBMITTED",
        })
        .eq("id", ensuredId);

      if (updateError) throw updateError;

      toast({
        title: "Application submitted",
        description: "Your application has been submitted for review.",
      });
      await createNotification({
        user_id: userId,
        title: "Application submitted",
        body: "Your application is now in the review queue.",
        link: `/applications/${ensuredId}/manage`,
        type: "status",
      });
      const { data: authData } = await supabase.auth.getUser();
      const applicantEmail = authData?.user?.email;
      if (applicantEmail) {
        await sendWorkflowEmail({
          to: applicantEmail,
          subject: "Application submitted",
          html: `<p>Your application has been submitted for review.</p>`,
        });
      }
      navigate("/dashboard");
    } catch (submitErr) {
      const message = submitErr instanceof Error ? submitErr.message : "Failed to submit application";
      console.error("Error submitting application:", submitErr);
      setError(message);
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    id: applicationId,
    formData,
    saving,
    submitting,
    error,
    currentStep,
    setCurrentStep,
    handleInputChange,
    saveDraft,
    ensureApplicationId,
    submitApplication,
    nextStep,
    prevStep,
  };
}

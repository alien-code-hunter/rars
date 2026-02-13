import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { ApplicantType } from "@/lib/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApplicationForm } from "@/hooks/useApplicationForm";
import { ApplicantInfoStep } from "@/components/application/ApplicantInfoStep";
import { StudyDetailsStep } from "@/components/application/StudyDetailsStep";
import { DataRequestStep } from "@/components/application/DataRequestStep";
import { DocumentsStep } from "@/components/application/DocumentsStep";
import { ReviewStep } from "@/components/application/ReviewStep";
import { FormNavigation } from "@/components/application/FormNavigation";
import { FormStepper } from "@/components/application/FormStepper";
import {
  ArrowLeft,
  User,
  FileText,
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const steps = [
  { id: "applicant", label: "Applicant Info", icon: User },
  { id: "study", label: "Study Details", icon: FileText },
  { id: "data", label: "Data Request", icon: Database },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "review", label: "Review & Submit", icon: CheckCircle },
];

export default function ApplicationWizard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const {
    id,
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
  } = useApplicationForm(user?.id);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    institution: "",
    department: "",
    applicant_type: "OTHER" as ApplicantType,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        institution: profile.institution || "",
        department: profile.department || "",
        applicant_type: (profile.applicant_type || "OTHER") as ApplicantType,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner */}
      <section className="hero-gradient hero-surface text-primary-foreground">
        <div className="container hero-content py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-3 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 -ml-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            {id ? "Edit Application" : "New Research Application"}
          </h1>
          <p className="mt-1 text-primary-foreground/70">
            Complete all sections to submit your research application for approval.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <FormStepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

        {error && (
          <Alert variant="destructive" className="mb-6 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border border-border/50 shadow-sm">
          <CardContent className="pt-8 pb-8">
            {currentStep === 0 && (
              <ApplicantInfoStep
                profile={profile}
                profileForm={profileForm}
                formData={{
                  supervisor_name: formData.supervisor_name,
                  supervisor_email: formData.supervisor_email,
                }}
                onProfileChange={(field, value) =>
                  setProfileForm((prev) => ({ ...prev, [field]: value }))
                }
                onSaveProfile={async () => {
                  if (!user) return;
                  setSavingProfile(true);
                  const { error } = await supabase
                    .from("profiles")
                    .update({
                      full_name: profileForm.full_name,
                      institution: profileForm.institution,
                      department: profileForm.department,
                      applicant_type: profileForm.applicant_type,
                    })
                    .eq("id", user.id);

                  setSavingProfile(false);
                  if (!error) {
                    await refreshProfile();
                  }
                }}
                savingProfile={savingProfile}
                onInputChange={handleInputChange}
              />
            )}

            {currentStep === 1 && (
              <StudyDetailsStep
                formData={{
                  title: formData.title,
                  abstract: formData.abstract,
                  objectives: formData.objectives,
                  methodology: formData.methodology,
                  start_date: formData.start_date,
                  end_date: formData.end_date,
                }}
                onInputChange={handleInputChange}
              />
            )}

            {currentStep === 2 && (
              <DataRequestStep
                formData={{
                  data_type: formData.data_type,
                  sensitivity_level: formData.sensitivity_level,
                  sensitivity_reason: formData.sensitivity_reason,
                }}
                onInputChange={handleInputChange}
              />
            )}

            {currentStep === 3 && (
              <DocumentsStep
                applicationId={id}
                userId={user?.id}
                onEnsureApplicationId={ensureApplicationId}
                profile={profile}
                formData={{
                  ethics_approved: formData.ethics_approved,
                }}
                onInputChange={handleInputChange}
              />
            )}

            {currentStep === 4 && (
              <ReviewStep
                formData={{
                  title: formData.title,
                  abstract: formData.abstract,
                  data_type: formData.data_type,
                  sensitivity_level: formData.sensitivity_level,
                  ethics_approved: formData.ethics_approved,
                }}
              />
            )}

            <FormNavigation
              currentStep={currentStep}
              totalSteps={steps.length}
              saving={saving}
              submitting={submitting}
              canSubmit={formData.ethics_approved}
              onPrevStep={prevStep}
              onNextStep={nextStep}
              onSaveDraft={saveDraft}
              onSubmit={submitApplication}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

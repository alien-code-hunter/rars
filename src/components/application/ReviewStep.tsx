import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ReviewStepProps {
  formData: {
    title: string;
    abstract: string;
    data_type: string;
    sensitivity_level: string;
    ethics_approved: boolean;
  };
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const checklist = [
    {
      label: "Research title provided",
      completed: Boolean(formData.title),
    },
    {
      label: "Abstract provided",
      completed: Boolean(formData.abstract),
    },
    {
      label: "Ethics approval confirmed",
      completed: formData.ethics_approved,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
        <p className="text-muted-foreground mb-6">
          Review your application before submitting.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Study Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Title</Label>
              <p className="font-medium">{formData.title || "Not provided"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Abstract</Label>
              <p className="text-sm">{formData.abstract || "Not provided"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Data Type</Label>
                <p className="font-medium">{formData.data_type}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Sensitivity</Label>
                <p className="font-medium">{formData.sensitivity_level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submission Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

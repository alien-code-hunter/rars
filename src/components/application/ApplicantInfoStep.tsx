import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";

interface ApplicantInfoStepProps {
  profile: Profile | null;
  profileForm: {
    full_name: string;
    institution: string;
    department: string;
    applicant_type: string;
  };
  formData: {
    supervisor_name: string;
    supervisor_email: string;
  };
  onProfileChange: (field: string, value: string) => void;
  onSaveProfile: () => void;
  savingProfile: boolean;
  onInputChange: (field: string, value: string) => void;
}

export function ApplicantInfoStep({
  profile,
  profileForm,
  formData,
  onProfileChange,
  onSaveProfile,
  savingProfile,
  onInputChange,
}: ApplicantInfoStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Applicant Information</h2>
        <p className="text-muted-foreground mb-6">
          Update your profile details and provide supervisor information if applicable.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={profileForm.full_name}
            onChange={(event) => onProfileChange("full_name", event.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={profile?.email || ""} disabled className="mt-2" />
        </div>
        <div>
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            value={profileForm.institution}
            onChange={(event) => onProfileChange("institution", event.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={profileForm.department}
            onChange={(event) => onProfileChange("department", event.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
        <div>
          <p className="text-sm font-medium">Applicant Type</p>
          <p className="text-xs text-muted-foreground">Needed for document requirements</p>
        </div>
        <Input
          className="max-w-[220px]"
          value={profileForm.applicant_type}
          onChange={(event) => onProfileChange("applicant_type", event.target.value)}
        />
      </div>

      <Button onClick={onSaveProfile} disabled={savingProfile}>
        {savingProfile ? "Saving..." : "Save Profile"}
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="supervisor_name">Supervisor Name</Label>
          <Input
            id="supervisor_name"
            value={formData.supervisor_name}
            onChange={(event) => onInputChange("supervisor_name", event.target.value)}
            placeholder="Enter supervisor name"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="supervisor_email">Supervisor Email</Label>
          <Input
            id="supervisor_email"
            type="email"
            value={formData.supervisor_email}
            onChange={(event) => onInputChange("supervisor_email", event.target.value)}
            placeholder="Enter supervisor email"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

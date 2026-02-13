import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DataType, SensitivityLevel } from "@/lib/types";

interface DataRequestStepProps {
  formData: {
    data_type: DataType;
    sensitivity_level: SensitivityLevel;
    sensitivity_reason: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export function DataRequestStep({ formData, onInputChange }: DataRequestStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Data Request</h2>
        <p className="text-muted-foreground mb-6">
          Specify the type of data you need for your research.
        </p>
      </div>

      <div>
        <Label>Data Type *</Label>
        <Select
          value={formData.data_type}
          onValueChange={(value: DataType) => onInputChange("data_type", value)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select data type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AGGREGATED">Aggregated Data</SelectItem>
            <SelectItem value="PATIENT_LEVEL">Patient-Level Data</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          Patient-level data requires additional justification and may be restricted.
        </p>
      </div>

      <div>
        <Label>Sensitivity Level *</Label>
        <Select
          value={formData.sensitivity_level}
          onValueChange={(value: SensitivityLevel) => onInputChange("sensitivity_level", value)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select sensitivity level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public - Can be published openly</SelectItem>
            <SelectItem value="RESTRICTED">Restricted - Contains sensitive information</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.sensitivity_level === "RESTRICTED" && (
        <div>
          <Label htmlFor="sensitivity_reason">Reason for Restriction *</Label>
          <Textarea
            id="sensitivity_reason"
            value={formData.sensitivity_reason}
            onChange={(event) => onInputChange("sensitivity_reason", event.target.value)}
            placeholder="Explain why this research requires restricted access"
            className="mt-2"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

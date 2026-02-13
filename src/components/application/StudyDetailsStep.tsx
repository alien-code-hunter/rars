import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StudyDetailsStepProps {
  formData: {
    title: string;
    abstract: string;
    objectives: string;
    methodology: string;
    start_date: string;
    end_date: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export function StudyDetailsStep({ formData, onInputChange }: StudyDetailsStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Study Details</h2>
        <p className="text-muted-foreground mb-6">
          Provide the summary and timeline for your research.
        </p>
      </div>

      <div>
        <Label htmlFor="title">Research Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(event) => onInputChange("title", event.target.value)}
          placeholder="Enter research title"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="abstract">Abstract *</Label>
        <Textarea
          id="abstract"
          value={formData.abstract}
          onChange={(event) => onInputChange("abstract", event.target.value)}
          placeholder="Provide a brief abstract"
          className="mt-2"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="objectives">Objectives</Label>
        <Textarea
          id="objectives"
          value={formData.objectives}
          onChange={(event) => onInputChange("objectives", event.target.value)}
          placeholder="List key objectives"
          className="mt-2"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="methodology">Methodology</Label>
        <Textarea
          id="methodology"
          value={formData.methodology}
          onChange={(event) => onInputChange("methodology", event.target.value)}
          placeholder="Describe your methodology"
          className="mt-2"
          rows={3}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(event) => onInputChange("start_date", event.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(event) => onInputChange("end_date", event.target.value)}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

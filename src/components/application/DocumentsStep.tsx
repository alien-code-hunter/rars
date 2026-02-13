import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UploadCloud } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Document, DocumentType, Profile } from "@/lib/types";

interface DocumentsStepProps {
  applicationId?: string;
  userId?: string;
  onEnsureApplicationId?: () => Promise<string | null>;
  profile: Profile | null;
  formData: {
    ethics_approved: boolean;
  };
  onInputChange: (field: string, value: boolean) => void;
}

const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: "ETHICS_LETTER", label: "Ethics Approval Letter" },
  { value: "SUPERVISOR_LETTER", label: "Supervisor Letter" },
  { value: "INSTITUTION_LETTER", label: "Institution Letter" },
  { value: "PROPOSAL", label: "Research Proposal" },
  { value: "TOOL", label: "Research Tool" },
  { value: "DATASET", label: "Dataset" },
  { value: "CODEBOOK", label: "Codebook" },
  { value: "OTHER", label: "Other Document" },
];

export function DocumentsStep({
  applicationId,
  userId,
  onEnsureApplicationId,
  profile,
  formData,
  onInputChange,
}: DocumentsStepProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<Record<DocumentType, boolean>>({} as Record<DocumentType, boolean>);
  const [selectedFiles, setSelectedFiles] = useState<Record<DocumentType, File | null>>({} as Record<DocumentType, File | null>);
  const inputRefs = useRef<Record<DocumentType, HTMLInputElement | null>>({} as Record<DocumentType, HTMLInputElement | null>);

  const requiredTypes = useMemo(() => {
    const base = ["ETHICS_LETTER", "PROPOSAL"] as DocumentType[];
    if (profile?.applicant_type === "STUDENT") {
      base.push("SUPERVISOR_LETTER", "INSTITUTION_LETTER");
    }
    return base;
  }, [profile?.applicant_type]);

  useEffect(() => {
    if (!applicationId) return;
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Unable to load documents",
          description: error.message || "Please check your connection and try again.",
          variant: "destructive",
        });
        return;
      }

      setDocuments((data as unknown as Document[]) || []);
    };

    fetchDocuments();
  }, [applicationId]);

  const uploadDocument = async (type: DocumentType) => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    let targetApplicationId = applicationId;
    if (!targetApplicationId && onEnsureApplicationId) {
      targetApplicationId = await onEnsureApplicationId();
    }

    if (!targetApplicationId) {
      toast({
        title: "Save your draft first",
        description: "You need to save the application before uploading documents.",
        variant: "destructive",
      });
      return;
    }

    const file = selectedFiles[type];
    if (!file) {
      toast({
        title: "Select a file",
        description: "Please choose a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));

    try {
      const nextVersion =
        Math.max(
          0,
          ...documents
            .filter((doc) => doc.document_type === type)
            .map((doc) => doc.version)
        ) + 1;

      const filePath = `${userId}/${targetApplicationId}/${type}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("research-documents")
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("documents").insert({
        application_id: targetApplicationId,
        document_type: type,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        size_bytes: file.size,
        version: nextVersion,
        uploaded_by: userId,
      });

      if (insertError) throw insertError;

      if (type === "ETHICS_LETTER") {
        onInputChange("ethics_approved", true);
      }

      toast({
        title: "Document uploaded",
        description: "Your document has been added to the application.",
      });

      setSelectedFiles((prev) => ({ ...prev, [type]: null }));

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("application_id", targetApplicationId)
        .order("uploaded_at", { ascending: false });

      if (!error) {
        setDocuments((data as unknown as Document[]) || []);
      }
    } catch (uploadErr) {
      console.error("Error uploading document:", uploadErr);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Ethics & Documents</h2>
        <p className="text-muted-foreground mb-6">
          Upload required documents to support your application.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
        <Checkbox
          id="ethics_approved"
          checked={formData.ethics_approved}
          onCheckedChange={(checked) => onInputChange("ethics_approved", Boolean(checked))}
        />
        <div>
          <Label htmlFor="ethics_approved" className="text-sm">
            Ethics approval letter uploaded
          </Label>
          <p className="text-xs text-muted-foreground">
            Submission is blocked until ethics approval is confirmed.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {documentTypeOptions.map((option) => {
          const exists = documents.some((doc) => doc.document_type === option.value);
          return (
            <div key={option.value} className="flex flex-col gap-3 rounded-lg border border-border/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {exists ? "Uploaded" : "Not uploaded"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles[option.value]?.name ?? "No file selected"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    className="hidden"
                    id={`doc-${option.value}`}
                    ref={(node) => {
                      inputRefs.current[option.value] = node;
                    }}
                    onChange={(event) =>
                      setSelectedFiles((prev) => ({
                        ...prev,
                        [option.value]: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => inputRefs.current[option.value]?.click()}
                  >
                    <UploadCloud className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => uploadDocument(option.value)}
                    disabled={uploading[option.value]}
                  >
                    {uploading[option.value] ? "Uploading..." : "Attach"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Required Documents</h3>
        <div className="flex flex-wrap gap-2">
          {requiredTypes.map((type) => {
            const exists = documents.some((doc) => doc.document_type === type);
            return (
              <Badge key={type} variant={exists ? "secondary" : "outline"}>
                {type.replace("_", " ")}
              </Badge>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{doc.file_name}</p>
                  <Badge variant="outline">v{doc.version}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{doc.document_type.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

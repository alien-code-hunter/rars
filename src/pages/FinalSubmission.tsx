import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import type { Application, DocumentType } from "@/lib/types";

const optionalTypes: DocumentType[] = ["TOOL", "DATASET", "CODEBOOK"];

export default function FinalSubmission() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [finalPaper, setFinalPaper] = useState<File | null>(null);
  const [optionalFiles, setOptionalFiles] = useState<Partial<Record<DocumentType, File | null>>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error loading application:", error);
        return;
      }

      setApplication(data as unknown as Application);
    };

    fetchApplication();
  }, [id]);

  const uploadDocument = async (type: DocumentType, file: File) => {
    const filePath = `${user?.id}/${id}/${type}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("research-documents")
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("documents").insert({
      application_id: id,
      document_type: type,
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user?.id,
    });

    if (insertError) throw insertError;
  };

  const submitFinalPackage = async () => {
    if (!finalPaper || !user || !id) {
      toast({
        title: "Final paper required",
        description: "Upload the final graded paper before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await uploadDocument("FINAL_PAPER", finalPaper);

      for (const type of optionalTypes) {
        const file = optionalFiles[type];
        if (file) {
          await uploadDocument(type, file);
        }
      }

      await supabase
        .from("applications")
        .update({ status: "FINAL_SUBMISSION_PENDING" })
        .eq("id", id);

      await logAudit({
        actorId: user.id,
        entityType: "application",
        entityId: id,
        action: "FINAL_SUBMISSION",
      });

      toast({ title: "Final submission received" });
    } catch (error) {
      console.error("Final submission failed:", error);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Final Submission</h1>
          <p className="text-muted-foreground mt-2">
            Upload the final graded paper and supporting artifacts.
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">{application?.title || "Application"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Final graded paper (required)</p>
              <Input type="file" onChange={(event) => setFinalPaper(event.target.files?.[0] ?? null)} />
            </div>

            {optionalTypes.map((type) => (
              <div key={type}>
                <p className="text-sm font-medium">{type.replace("_", " ")}</p>
                <Input
                  type="file"
                  onChange={(event) =>
                    setOptionalFiles((prev) => ({ ...prev, [type]: event.target.files?.[0] ?? null }))
                  }
                />
              </div>
            ))}

            <Button onClick={submitFinalPackage} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Final Package"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

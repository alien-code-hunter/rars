import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function LegacyImport() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [institution, setInstitution] = useState("");
  const [keywords, setKeywords] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitLegacy = async () => {
    if (!user || !title || !year || !file) {
      toast({
        title: "Missing required fields",
        description: "Title, year, and PDF are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: applicationData, error: appError } = await supabase
        .from("applications")
        .insert({
          applicant_id: user.id,
          title,
          abstract: authors,
          status: "PUBLISHED",
        })
        .select("id")
        .single();

      if (appError) throw appError;

      const filePath = `${user.id}/legacy/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("research-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      await supabase.from("documents").insert({
        application_id: applicationData.id,
        document_type: "FINAL_PAPER",
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });

      await supabase.from("repository_items").insert({
        application_id: applicationData.id,
        public_visible: true,
        restricted,
        keywords: keywords.split(",").map((word) => word.trim()).filter(Boolean),
        publication_year: Number(year),
        institution,
      });

      toast({ title: "Legacy item imported" });
      setTitle("");
      setAuthors("");
      setYear("");
      setInstitution("");
      setKeywords("");
      setRestricted(false);
      setFile(null);
    } catch (error) {
      console.error("Legacy import failed:", error);
      toast({
        title: "Import failed",
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
          <h1 className="text-3xl font-bold">Legacy Digitization</h1>
          <p className="text-muted-foreground mt-2">
            Import historical papers into the repository.
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Import Paper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea
              placeholder="Authors or summary"
              value={authors}
              onChange={(event) => setAuthors(event.target.value)}
            />
            <Input placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} />
            <Input
              placeholder="Institution"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
            />
            <Input
              placeholder="Keywords (comma-separated)"
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="restricted"
                checked={restricted}
                onCheckedChange={(checked) => setRestricted(Boolean(checked))}
              />
              <label htmlFor="restricted" className="text-sm">
                Restricted access
              </label>
            </div>
            <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <Button onClick={submitLegacy} disabled={submitting}>
              {submitting ? "Importing..." : "Import Paper"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

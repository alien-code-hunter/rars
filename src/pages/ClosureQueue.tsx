import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import type { Application } from "@/lib/types";

interface PublishState {
  publication_year: string;
  institution: string;
  program_area: string;
  keywords: string;
  restricted: boolean;
}

export default function ClosureQueue() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [publishState, setPublishState] = useState<Record<string, PublishState>>({});

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("status", "FINAL_SUBMISSION_PENDING")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Unable to load closure queue",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const apps = (data as unknown as Application[]) || [];
    setApplications(apps);

    const nextState: Record<string, PublishState> = {};
    apps.forEach((app) => {
      nextState[app.id] = {
        publication_year: new Date().getFullYear().toString(),
        institution: "",
        program_area: "",
        keywords: "",
        restricted: app.sensitivity_level === "RESTRICTED" || app.data_type === "PATIENT_LEVEL",
      };
    });
    setPublishState(nextState);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateState = (appId: string, patch: Partial<PublishState>) => {
    setPublishState((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], ...patch },
    }));
  };

  const publishApplication = async (application: Application) => {
    const state = publishState[application.id];
    if (!state?.publication_year) {
      toast({
        title: "Publication year required",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase.from("repository_items").insert({
        application_id: application.id,
        public_visible: true,
        restricted: state.restricted,
        keywords: state.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        publication_year: Number(state.publication_year),
        institution: state.institution,
        program_area: state.program_area,
      });

      await supabase
        .from("applications")
        .update({ status: "PUBLISHED" })
        .eq("id", application.id);

      await logAudit({
        actorId: user?.id,
        entityType: "application",
        entityId: application.id,
        action: "PUBLISH_REPOSITORY",
      });

      toast({ title: "Published to repository" });
      fetchApplications();
    } catch (error) {
      console.error("Publish failed:", error);
      toast({
        title: "Publish failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Closure & Publishing</h1>
          <p className="text-muted-foreground mt-2">
            Publish final submissions to the public repository.
          </p>
        </div>

        {applications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-8 text-center text-muted-foreground">
              No applications awaiting closure.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <Card key={application.id} className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-base">{application.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Publication year"
                    value={publishState[application.id]?.publication_year || ""}
                    onChange={(event) => updateState(application.id, { publication_year: event.target.value })}
                  />
                  <Input
                    placeholder="Institution"
                    value={publishState[application.id]?.institution || ""}
                    onChange={(event) => updateState(application.id, { institution: event.target.value })}
                  />
                  <Input
                    placeholder="Program area"
                    value={publishState[application.id]?.program_area || ""}
                    onChange={(event) => updateState(application.id, { program_area: event.target.value })}
                  />
                  <Input
                    placeholder="Keywords (comma-separated)"
                    value={publishState[application.id]?.keywords || ""}
                    onChange={(event) => updateState(application.id, { keywords: event.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`restricted-${application.id}`}
                      checked={publishState[application.id]?.restricted || false}
                      onCheckedChange={(checked) =>
                        updateState(application.id, { restricted: Boolean(checked) })
                      }
                    />
                    <label htmlFor={`restricted-${application.id}`} className="text-sm">
                      Restricted access
                    </label>
                  </div>
                  <Button onClick={() => publishApplication(application)}>
                    Publish to Repository
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

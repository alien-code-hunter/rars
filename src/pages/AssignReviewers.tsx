import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import type { Application, Profile, ReviewStage } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

const stages: ReviewStage[] = ["PROGRAM", "HIS", "DATA_OWNER", "TECHNICAL", "OTHER"];

export default function AssignReviewers() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviewers, setReviewers] = useState<Profile[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<ReviewStage>("PROGRAM");

  const eligibleApplications = useMemo(
    () => applications.filter((app) => ["SUBMITTED", "SCREENING"].includes(app.status)),
    [applications]
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: appData } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: true });

      setApplications((appData as unknown as Application[]) || []);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "REVIEWER");

      const reviewerIds = (roleData || []).map((row) => row.user_id);

      if (reviewerIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", reviewerIds);

        setReviewers((profileData as unknown as Profile[]) || []);
      }
    };

    fetchData();
  }, []);

  const assignReviewer = async (application: Application) => {
    if (!selectedReviewer) {
      toast({
        title: "Select a reviewer",
        description: "Please choose a reviewer first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        application_id: application.id,
        reviewer_id: selectedReviewer,
        review_stage: selectedStage,
      });

      if (error) throw error;

      await supabase
        .from("applications")
        .update({ status: "IN_REVIEW" })
        .eq("id", application.id);

      await logAudit({
        actorId: user?.id,
        entityType: "review",
        entityId: application.id,
        action: "ASSIGN_REVIEWER",
        after: { reviewer_id: selectedReviewer, review_stage: selectedStage },
      });

      await createNotification({
        user_id: selectedReviewer,
        title: "New review assigned",
        body: `Review ${application.reference_number} (${selectedStage}) is ready for your input.`,
        link: "/reviews",
        type: "review",
      });

      toast({ title: "Reviewer assigned" });
    } catch (assignError) {
      console.error("Assignment failed:", assignError);
      toast({
        title: "Assignment failed",
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
          <h1 className="text-3xl font-bold">Assign Reviewers</h1>
          <p className="text-muted-foreground mt-2">
            Route applications to reviewers and stages.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {eligibleApplications.length === 0 ? (
              <Card className="card-elevated">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No applications awaiting assignment.
                </CardContent>
              </Card>
            ) : (
              eligibleApplications.map((application) => (
                <Card key={application.id} className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {application.title || "Untitled Application"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Ref: {application.reference_number}
                    </div>
                    <Button size="sm" onClick={() => assignReviewer(application)}>
                      Assign
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card className="card-elevated h-fit">
            <CardHeader>
              <CardTitle className="text-base">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Reviewer</p>
                <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers.map((reviewer) => (
                      <SelectItem key={reviewer.id} value={reviewer.id}>
                        {reviewer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium">Review Stage</p>
                <Select value={selectedStage} onValueChange={(value: ReviewStage) => setSelectedStage(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

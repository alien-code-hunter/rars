import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getUserEmail, sendWorkflowEmail } from "@/lib/email";
import type { Application, ApplicationStatus } from "@/lib/types";
import { Clock, ArrowRight, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const screeningStatuses: ApplicationStatus[] = ["SUBMITTED", "SCREENING", "RETURNED"];

export default function ScreeningQueue() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .in("status", screeningStatuses)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setApplications((data as unknown as Application[]) || []);
    } catch (error) {
      console.error("Error loading screening queue:", error);
      toast({
        title: "Unable to load queue",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const returnForCorrection = async (application: Application) => {
    const reason = window.prompt("Reason for return?");
    if (!reason) return;

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "RETURNED" })
        .eq("id", application.id);

      if (error) throw error;

      await supabase.from("messages").insert({
        application_id: application.id,
        sender_id: user?.id,
        message_text: `Returned for correction: ${reason}`,
      });

      await logAudit({
        actorId: user?.id,
        entityType: "application",
        entityId: application.id,
        action: "RETURN_FOR_CORRECTION",
        before: { status: application.status },
        after: { status: "RETURNED" },
      });

      await createNotification({
        user_id: application.applicant_id,
        title: "Application returned for correction",
        body: "Please review the feedback and resubmit your application.",
        link: `/applications/${application.id}/manage`,
        type: "status",
      });

      const applicantEmail = await getUserEmail(application.applicant_id);
      if (applicantEmail) {
        await sendWorkflowEmail({
          to: applicantEmail,
          subject: "Application returned for correction",
          html: "<p>Your application was returned for correction. Please review feedback and resubmit.</p>",
        });
      }

      toast({ title: "Application returned" });
      fetchQueue();
    } catch (error) {
      console.error("Return failed:", error);
      toast({
        title: "Return failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const forwardToReview = async (application: Application) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "IN_REVIEW" })
        .eq("id", application.id);

      if (error) throw error;

      await logAudit({
        actorId: user?.id,
        entityType: "application",
        entityId: application.id,
        action: "FORWARD_TO_REVIEW",
        before: { status: application.status },
        after: { status: "IN_REVIEW" },
      });

      await createNotification({
        user_id: application.applicant_id,
        title: "Application in review",
        body: "Your application has moved to the review stage.",
        link: `/applications/${application.id}/manage`,
        type: "status",
      });

      const applicantEmail = await getUserEmail(application.applicant_id);
      if (applicantEmail) {
        await sendWorkflowEmail({
          to: applicantEmail,
          subject: "Application moved to review",
          html: "<p>Your application is now in the review stage.</p>",
        });
      }

      toast({ title: "Forwarded to review" });
      fetchQueue();
    } catch (error) {
      console.error("Forward failed:", error);
      toast({
        title: "Unable to forward",
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
          <h1 className="text-3xl font-bold">Screening Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review new submissions and return incomplete applications.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-24" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-10 text-center text-muted-foreground">
              No applications in the screening queue.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="card-elevated">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">
                    {application.title || "Untitled Application"}
                  </CardTitle>
                  <StatusBadge status={application.status} />
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Ref: {application.reference_number}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/applications/${application.id}/manage`}>
                        <Clock className="mr-2 h-4 w-4" />
                        Open
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => returnForCorrection(application)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Return
                    </Button>
                    <Button size="sm" onClick={() => forwardToReview(application)}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Forward
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

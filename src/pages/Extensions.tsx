import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Application, Extension, ExtensionStatus } from "@/lib/types";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getUserEmail, sendWorkflowEmail } from "@/lib/email";

export default function Extensions() {
  const { user, roles } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [requestedEndDate, setRequestedEndDate] = useState("");
  const [reason, setReason] = useState("");

  const isStaff = useMemo(
    () => roles.includes("ADMIN_OFFICER") || roles.includes("EXECUTIVE_DIRECTOR") || roles.includes("SYSTEM_ADMIN"),
    [roles]
  );

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: appData } = await supabase
      .from("applications")
      .select("*")
      .in("status", ["APPROVED", "ACTIVE_RESEARCH"])
      .order("updated_at", { ascending: false });

    setApplications((appData as unknown as Application[]) || []);

    const extensionQuery = supabase.from("extensions").select("*");

    const { data: extData } = isStaff
      ? await extensionQuery
      : await extensionQuery.eq("requested_by", user.id);

    setExtensions((extData as unknown as Extension[]) || []);
  }, [isStaff, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitRequest = async () => {
    if (!user || !selectedApp || !requestedEndDate || !reason) {
      toast({
        title: "Complete all fields",
        description: "Select an application and provide a reason.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentApp = applications.find((app) => app.id === selectedApp);
      const { error } = await supabase.from("extensions").insert({
        application_id: selectedApp,
        requested_by: user.id,
        reason,
        current_end_date: currentApp?.end_date ?? null,
        requested_end_date: requestedEndDate,
      });

      if (error) throw error;

      await logAudit({
        actorId: user.id,
        entityType: "extension",
        entityId: selectedApp,
        action: "REQUEST_EXTENSION",
      });

      toast({ title: "Extension requested" });
      setRequestedEndDate("");
      setReason("");
      fetchData();
    } catch (submitError) {
      console.error("Extension request failed:", submitError);
      toast({
        title: "Request failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const decideExtension = async (extension: Extension, status: ExtensionStatus) => {
    try {
      const { error } = await supabase
        .from("extensions")
        .update({ status, decided_by: user?.id, decision_date: new Date().toISOString() })
        .eq("id", extension.id);

      if (error) throw error;

      if (status === "APPROVED") {
        await supabase
          .from("applications")
          .update({ end_date: extension.requested_end_date })
          .eq("id", extension.application_id);
      }

      await logAudit({
        actorId: user?.id,
        entityType: "extension",
        entityId: extension.id,
        action: status,
      });

      await createNotification({
        user_id: extension.requested_by,
        title: `Extension ${status.toLowerCase()}`,
        body: "Your extension request has been reviewed.",
        link: `/applications/${extension.application_id}/manage`,
        type: "extension",
      });

      const applicantEmail = await getUserEmail(extension.requested_by);
      if (applicantEmail) {
        await sendWorkflowEmail({
          to: applicantEmail,
          subject: `Extension ${status.toLowerCase()}`,
          html: "<p>Your extension request has been reviewed. Check the portal for details.</p>",
        });
      }

      toast({ title: `Extension ${status.toLowerCase()}` });
      fetchData();
    } catch (decisionError) {
      console.error("Extension decision failed:", decisionError);
      toast({
        title: "Decision failed",
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
          <h1 className="text-3xl font-bold">Extension Requests</h1>
          <p className="text-muted-foreground mt-2">
            Request new end dates or review pending extensions.
          </p>
        </div>

        {!isStaff && (
          <Card className="card-elevated mb-8">
            <CardHeader>
              <CardTitle className="text-base">Request an extension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {application.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={requestedEndDate}
                onChange={(event) => setRequestedEndDate(event.target.value)}
              />
              <Textarea
                placeholder="Reason for extension"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <Button onClick={submitRequest}>Submit Request</Button>
            </CardContent>
          </Card>
        )}

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {extensions.length === 0 ? (
              <p className="text-muted-foreground">No extension requests found.</p>
            ) : (
              extensions.map((extension) => (
                <div
                  key={extension.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{extension.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested end date: {extension.requested_end_date}
                    </p>
                    <p className="text-xs text-muted-foreground">Status: {extension.status}</p>
                  </div>
                  {isStaff && extension.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => decideExtension(extension, "APPROVED")}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => decideExtension(extension, "REJECTED")}>Reject</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

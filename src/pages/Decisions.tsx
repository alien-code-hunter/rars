import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getUserEmail, sendWorkflowEmail } from "@/lib/email";
import { useAuth } from "@/contexts/AuthContext";
import type { Application, DecisionType } from "@/lib/types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export default function Decisions() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [decisions, setDecisions] = useState<Record<string, DecisionType>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("status", "ED_DECISION")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading decisions:", error);
      toast({
        title: "Unable to load decisions",
        description: "Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setApplications((data as unknown as Application[]) || []);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const generateLetterPdf = async (
    application: Application,
    decision: DecisionType,
    note: string | undefined,
    applicantName: string,
    verifyUrl?: string,
    signatureHash?: string
  ) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const hasSignature = Boolean(verifyUrl && signatureHash);
    const qrImage = hasSignature
      ? await pdfDoc.embedPng(await QRCode.toDataURL(verifyUrl as string, { margin: 1, width: 120 }))
      : null;

    let y = 770;
    page.drawText("Ministry of Health", { x: 60, y, size: 16, font: boldFont });
    y -= 24;
    page.drawText("Research Approval & Repository System", { x: 60, y, size: 12, font });

    y -= 32;
    page.drawText("Official Approval Letter", { x: 60, y, size: 14, font: boldFont });

    y -= 28;
    page.drawText(`Applicant: ${applicantName}`, { x: 60, y, size: 12, font });
    y -= 18;
    page.drawText(`Reference: ${application.reference_number}`, { x: 60, y, size: 12, font });
    y -= 18;
    page.drawText(`Title: ${application.title}`, { x: 60, y, size: 12, font });
    y -= 18;
    page.drawText(`Decision: ${decision}`, { x: 60, y, size: 12, font: boldFont, color: rgb(0.1, 0.4, 0.2) });

    if (note) {
      y -= 24;
      page.drawText("Notes:", { x: 60, y, size: 12, font: boldFont });
      y -= 16;
      page.drawText(note, { x: 60, y, size: 11, font });
    }

    y -= 40;
    page.drawText(`Issued by: ${profile?.full_name || "Executive Director"}`, { x: 60, y, size: 12, font });
    y -= 18;
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 60, y, size: 12, font });

    if (hasSignature && qrImage) {
      page.drawText("Digital signature", { x: 360, y: 250, size: 11, font: boldFont });
      page.drawImage(qrImage, { x: 360, y: 130, width: 120, height: 120 });
      page.drawText("Verify this letter:", { x: 360, y: 110, size: 9, font });
      page.drawText(verifyUrl as string, { x: 360, y: 96, size: 8, font, maxWidth: 200 });
      page.drawText(`Signature hash: ${signatureHash}`, { x: 60, y: 80, size: 8, font });
    }

    return await pdfDoc.save();
  };

  const submitDecision = async (application: Application) => {
    const decision = decisions[application.id];
    if (!decision) {
      toast({
        title: "Select a decision",
        description: "Please choose approve or reject.",
        variant: "destructive",
      });
      return;
    }

    try {
      const applicantProfile = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", application.applicant_id)
        .single();

      const applicantName = applicantProfile.data?.full_name || "Applicant";
      const signatureToken = decision === "APPROVED" ? crypto.randomUUID() : null;
      const verifyUrl = signatureToken ? `${window.location.origin}/verify/${signatureToken}` : undefined;
      const payload = `${application.reference_number}|${application.title}|${applicantName}|${decision}`;
      const hashBuffer = signatureToken
        ? await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(`${payload}|${signatureToken}`)
          )
        : null;
      const signatureHash = hashBuffer
        ? Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        : undefined;

      const pdfBytes = await generateLetterPdf(
        application,
        decision,
        notes[application.id],
        applicantName,
        verifyUrl,
        signatureHash
      );
      const filePath = `${user?.id}/letters/${application.id}_${decision}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("research-documents")
        .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });

      if (uploadError) throw uploadError;

      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          application_id: application.id,
          document_type: decision === "APPROVED" ? "APPROVAL_LETTER" : "REJECTION_LETTER",
          file_name: `Decision_${application.reference_number}.pdf`,
          file_path: filePath,
          mime_type: "application/pdf",
          size_bytes: pdfBytes.byteLength,
          uploaded_by: user?.id,
        })
        .select("id")
        .single();

      if (docError) throw docError;

      const { data: decisionRow, error: decisionError } = await supabase.from("decisions").insert({
        application_id: application.id,
        decision,
        decided_by: user?.id,
        decision_date: new Date().toISOString(),
        letter_document_id: docData?.id,
        notes: notes[application.id] || "",
      }).select("id").single();

      if (decisionError) throw decisionError;

      if (decision === "APPROVED" && decisionRow?.id && signatureToken && signatureHash) {
        await supabase.from("approval_signatures").insert({
          decision_id: decisionRow.id,
          token: signatureToken,
          payload_hash: signatureHash,
        });
      }

      await supabase
        .from("applications")
        .update({ status: decision === "APPROVED" ? "APPROVED" : "REJECTED" })
        .eq("id", application.id);

      await logAudit({
        actorId: user?.id,
        entityType: "decision",
        entityId: application.id,
        action: decision,
        after: { decision },
      });

      await createNotification({
        user_id: application.applicant_id,
        title: `Decision recorded: ${decision === "APPROVED" ? "Approved" : "Rejected"}`,
        body: "Your decision letter is now available.",
        link: `/applications/${application.id}/manage`,
        type: "decision",
      });

      const applicantEmail = await getUserEmail(application.applicant_id);
      if (applicantEmail) {
        await sendWorkflowEmail({
          to: applicantEmail,
          subject: `Decision recorded: ${decision === "APPROVED" ? "Approved" : "Rejected"}`,
          html: "<p>Your decision letter is now available in the portal.</p>",
        });
      }

      toast({ title: "Decision recorded" });
      fetchApplications();
    } catch (submitErr) {
      console.error("Decision failed:", submitErr);
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
          <h1 className="text-3xl font-bold">ED Decisions</h1>
          <p className="text-muted-foreground mt-2">
            Approve or reject applications and issue decision letters.
          </p>
        </div>

        {applications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-8 text-center text-muted-foreground">
              No applications awaiting decision.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <Card key={application.id} className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-base">
                    {application.title || "Untitled Application"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={decisions[application.id] || ""}
                    onValueChange={(value: DecisionType) =>
                      setDecisions((prev) => ({ ...prev, [application.id]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVED">Approve</SelectItem>
                      <SelectItem value="REJECTED">Reject</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Decision notes (optional)"
                    value={notes[application.id] || ""}
                    onChange={(event) =>
                      setNotes((prev) => ({ ...prev, [application.id]: event.target.value }))
                    }
                  />

                  <Button onClick={() => submitDecision(application)}>Record Decision</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

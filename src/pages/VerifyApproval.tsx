import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface VerificationResult {
  valid: boolean;
  issued_at?: string;
  decision?: string;
  decision_date?: string;
  reference_number?: string;
  title?: string;
  applicant_name?: string | null;
  payload_hash?: string;
}

export default function VerifyApproval() {
  const { token } = useParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("verify-approval", {
        body: { token },
      });

      if (error) {
        setResult({ valid: false });
        setLoading(false);
        return;
      }

      setResult(data as VerificationResult);
      setLoading(false);
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Approval Letter Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-muted-foreground">Verifying...</p>
            ) : result?.valid ? (
              <>
                <Badge variant="secondary">Valid</Badge>
                <p className="text-sm"><strong>Applicant:</strong> {result.applicant_name || "—"}</p>
                <p className="text-sm"><strong>Reference:</strong> {result.reference_number}</p>
                <p className="text-sm"><strong>Title:</strong> {result.title}</p>
                <p className="text-sm"><strong>Decision:</strong> {result.decision}</p>
                <p className="text-sm"><strong>Decision Date:</strong> {formatDate(result.decision_date)}</p>
                <p className="text-xs text-muted-foreground">Hash: {result.payload_hash}</p>
              </>
            ) : (
              <Badge variant="destructive">Invalid or expired token</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

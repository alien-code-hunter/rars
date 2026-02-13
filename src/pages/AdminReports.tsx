import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const downloadFile = (content: string, filename: string, mime = "text/plain") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const header = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    header
      .map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
};

export default function AdminReports() {
  const [loading, setLoading] = useState(false);

  const exportTable = async (table: string) => {
    setLoading(true);
    const { data } = await supabase.from(table).select("*");
    const rows = (data as Record<string, unknown>[]) || [];
    downloadFile(JSON.stringify(rows, null, 2), `${table}.json`, "application/json");
    downloadFile(toCsv(rows), `${table}.csv`, "text/csv");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Reports & Exports</h1>
          <p className="text-muted-foreground mt-2">Download system data for analysis.</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Exports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={() => exportTable("applications")} disabled={loading}>
              Export applications
            </Button>
            <Button variant="outline" onClick={() => exportTable("reviews")} disabled={loading}>
              Export reviews
            </Button>
            <Button variant="outline" onClick={() => exportTable("decisions")} disabled={loading}>
              Export decisions
            </Button>
            <Button variant="outline" onClick={() => exportTable("access_logs")} disabled={loading}>
              Export repository access logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

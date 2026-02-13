import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  actor_id?: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const downloadFile = (content: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    downloadFile(JSON.stringify(logs, null, 2), "audit-logs.json", "application/json");
  };

  const exportCsv = () => {
    const header = ["id", "actor_id", "entity_type", "entity_id", "action", "created_at"].join(",");
    const rows = logs.map((log) =>
      [
        log.id,
        log.actor_id ?? "",
        log.entity_type,
        log.entity_id,
        log.action,
        log.created_at,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    downloadFile([header, ...rows].join("\n"), "audit-logs.csv", "text/csv");
  };

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setLogs((data as AuditLog[]) || []);
    };

    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground mt-2">
              Latest activity across the system.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportJson}>
              Export JSON
            </Button>
          </div>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No audit events recorded.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 text-sm"
                >
                  <span className="font-medium">{log.action}</span>
                  <span className="text-muted-foreground">
                    {log.entity_type} · {log.entity_id}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

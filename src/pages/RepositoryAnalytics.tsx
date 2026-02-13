import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { RepositoryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface AccessLogRow {
  repository_item_id: string;
  action: "VIEW" | "DOWNLOAD";
  created_at: string;
}

export default function RepositoryAnalytics() {
  const [logs, setLogs] = useState<AccessLogRow[]>([]);
  const [items, setItems] = useState<Record<string, RepositoryItem>>({});

  useEffect(() => {
    const fetchLogs = async () => {
      const start = new Date();
      start.setDate(start.getDate() - 13);
      start.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("access_logs")
        .select("repository_item_id, action, created_at")
        .gte("created_at", start.toISOString());

      const rows = (data as AccessLogRow[]) || [];
      setLogs(rows);

      const itemIds = [...new Set(rows.map((row) => row.repository_item_id))];
      if (itemIds.length > 0) {
        const { data: itemData } = await supabase
          .from("repository_items")
          .select("id, institution, applications (title)")
          .in("id", itemIds);

        const map: Record<string, RepositoryItem> = {};
        (itemData as RepositoryItem[] | null)?.forEach((item) => {
          map[item.id] = item;
        });
        setItems(map);
      }
    };

    fetchLogs();
  }, []);

  const summary = useMemo(() => {
    const totals = {
      views: logs.filter((log) => log.action === "VIEW").length,
      downloads: logs.filter((log) => log.action === "DOWNLOAD").length,
      items: new Set(logs.map((log) => log.repository_item_id)).size,
    };

    const byDay: Record<string, { date: string; views: number; downloads: number }> = {};
    logs.forEach((log) => {
      const day = new Date(log.created_at).toISOString().slice(0, 10);
      if (!byDay[day]) {
        byDay[day] = { date: day, views: 0, downloads: 0 };
      }
      if (log.action === "VIEW") byDay[day].views += 1;
      if (log.action === "DOWNLOAD") byDay[day].downloads += 1;
    });

    const chart = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

    const downloadByItem: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.action !== "DOWNLOAD") return;
      downloadByItem[log.repository_item_id] = (downloadByItem[log.repository_item_id] || 0) + 1;
    });

    const topDownloads = Object.entries(downloadByItem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        id,
        count,
        title: items[id]?.applications?.title || "Untitled Research",
      }));

    return { totals, chart, topDownloads };
  }, [logs, items]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Repository Analytics</h1>
          <p className="text-muted-foreground mt-2">Usage trends for the past 14 days.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Views</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{summary.totals.views}</CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Downloads</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{summary.totals.downloads}</CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Active Items</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{summary.totals.items}</CardContent>
          </Card>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Views vs downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                views: { label: "Views", color: "hsl(var(--primary))" },
                downloads: { label: "Downloads", color: "hsl(var(--accent))" },
              }}
            >
              <LineChart data={summary.chart} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} />
                <Line type="monotone" dataKey="downloads" stroke="var(--color-downloads)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Top downloads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.topDownloads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No downloads yet.</p>
            ) : (
              summary.topDownloads.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Updated {formatDate(new Date().toISOString())}</p>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

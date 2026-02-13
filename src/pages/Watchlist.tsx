import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { RepositoryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface WatchlistRow {
  repository_item_id: string;
  repository_items: RepositoryItem;
  created_at: string;
}

export default function Watchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistRow[]>([]);

  const fetchWatchlist = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("repository_watchlist")
      .select("repository_item_id, created_at, repository_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setItems((data as WatchlistRow[]) || []);
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user?.id]);

  const removeItem = async (repositoryItemId: string) => {
    if (!user) return;
    await supabase
      .from("repository_watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("repository_item_id", repositoryItemId);

    fetchWatchlist();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tracked Research</h1>
          <p className="text-muted-foreground mt-2">
            Follow studies to track updates and access quick links.
          </p>
        </div>

        {items.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-10 text-center text-muted-foreground">
              You are not tracking any studies yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((row) => (
              <Card key={row.repository_item_id} className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-base">
                    {row.repository_items?.applications?.title || "Untitled Research"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Followed {formatDate(row.created_at)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/repository/${row.repository_item_id}`}>Open</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeItem(row.repository_item_id)}>
                      Remove
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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/lib/types";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-2">Updates about your applications and reviews.</p>
          </div>
          <Button variant="outline" onClick={markAllRead}>
            Mark all read
          </Button>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Recent updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{notification.title}</span>
                    {!notification.is_read && (
                      <span className="text-xs text-primary">New</span>
                    )}
                  </div>
                  {notification.body && (
                    <span className="text-muted-foreground">{notification.body}</span>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(notification.created_at)}</span>
                    {notification.link && (
                      <Link to={notification.link} className="text-primary hover:underline">
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

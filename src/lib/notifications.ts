import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/lib/types";

export type NotificationPayload = Pick<
  Notification,
  "user_id" | "title" | "body" | "link" | "type"
>;

export async function createNotification(payload: NotificationPayload) {
  const { error } = await supabase.from("notifications").insert({
    user_id: payload.user_id,
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
    type: payload.type ?? "info",
  });

  if (error) {
    console.warn("Notification insert failed:", error);
  }
}

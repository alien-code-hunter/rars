import { supabase } from "@/integrations/supabase/client";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendWorkflowEmail(payload: EmailPayload) {
  const { error } = await supabase.functions.invoke("send-email", {
    body: payload,
  });

  if (error) {
    console.warn("Email send failed:", error.message);
  }
}

export async function getUserEmail(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  return data?.email || null;
}

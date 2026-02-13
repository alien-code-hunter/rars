import { supabase } from "@/integrations/supabase/client";

import type { Json } from "@/integrations/supabase/types";

interface AuditPayload {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: Json | null;
  after?: Json | null;
}

export async function logAudit({
  actorId,
  entityType,
  entityId,
  action,
  before,
  after,
}: AuditPayload) {
  try {
    await supabase.from("audit_logs").insert([{
      actor_id: actorId ?? null,
      entity_type: entityType,
      entity_id: entityId,
      action,
      before_json: before ?? null,
      after_json: after ?? null,
    }]);
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

import { supabase } from "@/integrations/supabase/client";

export type SystemSettings = {
  // Maintenance
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement_banner_text: string;
  announcement_visible: boolean;
  announcement_dismissible: boolean;
  allow_public_readonly: boolean;

  // Notifications
  enable_email_notifications: boolean;
  pending_alert_threshold: number;
  admin_emails: string; // comma-separated
  daily_summary_enabled: boolean;
  weekly_summary_enabled: boolean;

  // Security
  session_timeout_minutes: number;
  password_expiry_days: number;
  require_mfa_admins: boolean;
  failed_login_limit: number;
  account_lockout_minutes: number;

  // Audit & retention
  audit_log_retention_days: number;
  archive_threshold_months: number;
  auto_backup_hours: number;

  // DHIS2 / Integrations
  // (DHIS2 integration removed)

  // API / Rate limits
  enable_external_api: boolean;
  api_rate_limit_per_minute: number;

  // Performance
  cache_duration_minutes: number;
  max_search_results: number;
  db_query_timeout_seconds: number;
};

export const DEFAULT_SETTINGS: SystemSettings = {
  maintenance_mode: false,
  maintenance_message: "",
  announcement_banner_text: "",
  announcement_visible: false,
  announcement_dismissible: true,
  allow_public_readonly: false,

  enable_email_notifications: true,
  pending_alert_threshold: 10,
  admin_emails: "",
  daily_summary_enabled: false,
  weekly_summary_enabled: false,

  session_timeout_minutes: 480,
  password_expiry_days: 90,
  require_mfa_admins: false,
  failed_login_limit: 5,
  account_lockout_minutes: 30,

  audit_log_retention_days: 180,
  archive_threshold_months: 12,
  auto_backup_hours: 24,

  // DHIS2 integration removed

  enable_external_api: true,
  api_rate_limit_per_minute: 1000,

  cache_duration_minutes: 5,
  max_search_results: 100,
  db_query_timeout_seconds: 30,
};

const SETTINGS_KEY = "global";

export async function getSystemSettings(): Promise<SystemSettings> {
  // Avoid calling Supabase in local dev when env is not configured
  try {
    // lazy import to avoid circular issues
    const { SUPABASE_CONFIGURED } = await import("@/integrations/supabase/client");
    if (!SUPABASE_CONFIGURED) return DEFAULT_SETTINGS;
  } catch (e) {
    // ignore and continue
  }
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.value) return DEFAULT_SETTINGS;

    return { ...DEFAULT_SETTINGS, ...data.value };
  } catch (err) {
    console.error("Error loading system settings:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>) {
  try {
    const merged = { ...(await getSystemSettings()), ...settings };

    const { error } = await supabase
      .from("system_settings")
      .upsert({ key: SETTINGS_KEY, value: merged }, { onConflict: ["key"] });

    if (error) throw error;

    return merged;
  } catch (err) {
    console.error("Error updating system settings:", err);
    throw err;
  }
}

export async function resetSystemSettingsToDefaults() {
  try {
    const { error } = await supabase
      .from("system_settings")
      .upsert({ key: SETTINGS_KEY, value: DEFAULT_SETTINGS }, { onConflict: ["key"] });
    if (error) throw error;
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.error("Error resetting system settings:", err);
    throw err;
  }
}

-- Create system_settings table to store global configuration as JSONB
BEGIN;

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.refresh_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_settings_update ON public.system_settings;
CREATE TRIGGER trg_system_settings_update
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_updated_at();

-- Enable Row Level Security and allow access only to SYSTEM_ADMIN users
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: only users with role 'SYSTEM_ADMIN' in user_roles can SELECT/INSERT/UPDATE
CREATE POLICY system_settings_admin_only ON public.system_settings
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'SYSTEM_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'SYSTEM_ADMIN'
    )
  );

-- Insert default global settings row if not present
INSERT INTO public.system_settings (key, value)
VALUES (
  'global',
  jsonb_build_object(
    'maintenance_mode', false,
    'maintenance_message', '',
    'announcement_banner_text', '',
    'announcement_visible', false,
    'announcement_dismissible', true,
    'allow_public_readonly', false,
    'enable_email_notifications', true,
    'pending_alert_threshold', 10,
    'admin_emails', '',
    'daily_summary_enabled', false,
    'weekly_summary_enabled', false,
    'session_timeout_minutes', 480,
    'password_expiry_days', 90,
    'require_mfa_admins', false,
    'failed_login_limit', 5,
    'account_lockout_minutes', 30,
    'audit_log_retention_days', 180,
    'archive_threshold_months', 12,
    'auto_backup_hours', 24,
    'enable_external_api', true,
    'api_rate_limit_per_minute', 1000,
    'cache_duration_minutes', 5,
    'max_search_results', 100,
    'db_query_timeout_seconds', 30
  )
)
ON CONFLICT (key) DO NOTHING;

COMMIT;

import * as React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const AdminSettings: React.FC = () => {
  const { data, isLoading, updateSettings, resetSettings } = useSystemSettings();
  const toast = useToast();

  const [form, setForm] = React.useState({
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
    dhis2_enabled: false,
    dhis2_base_url: "",
    dhis2_auto_sync_hours: 24,
    enable_external_api: true,
    api_rate_limit_per_minute: 1000,
    cache_duration_minutes: 5,
    max_search_results: 100,
    db_query_timeout_seconds: 30,
  });

  React.useEffect(() => {
    if (data) {
      setForm((s) => ({
        ...s,
        maintenance_mode: data.maintenance_mode,
        maintenance_message: data.maintenance_message || "",
        announcement_banner_text: data.announcement_banner_text || "",
        announcement_visible: data.announcement_visible ?? false,
        announcement_dismissible: data.announcement_dismissible ?? true,
        allow_public_readonly: data.allow_public_readonly,
        enable_email_notifications: data.enable_email_notifications ?? true,
        pending_alert_threshold: data.pending_alert_threshold,
        admin_emails: data.admin_emails || "",
        daily_summary_enabled: data.daily_summary_enabled ?? false,
        weekly_summary_enabled: data.weekly_summary_enabled ?? false,
        session_timeout_minutes: data.session_timeout_minutes,
        password_expiry_days: data.password_expiry_days,
        require_mfa_admins: data.require_mfa_admins ?? false,
        failed_login_limit: data.failed_login_limit ?? 5,
        account_lockout_minutes: data.account_lockout_minutes ?? 30,
        audit_log_retention_days: data.audit_log_retention_days,
        archive_threshold_months: data.archive_threshold_months,
        auto_backup_hours: data.auto_backup_hours,
        // DHIS2 integration removed
        enable_external_api: data.enable_external_api ?? true,
        api_rate_limit_per_minute: data.api_rate_limit_per_minute ?? 1000,
        cache_duration_minutes: data.cache_duration_minutes,
        max_search_results: data.max_search_results ?? 100,
        db_query_timeout_seconds: data.db_query_timeout_seconds ?? 30,
      }));
    }
  }, [data]);

  const save = async () => {
    try {
      await updateSettings.mutateAsync({ ...form });
      toast.toast({ title: "Settings saved" });
    } catch (err) {
      toast.toast({ title: "Unable to save settings", description: String(err), variant: "destructive" });
    }
  };

  const reset = async () => {
    try {
      await resetSettings.mutateAsync();
      toast.toast({ title: "Settings reset to defaults" });
    } catch (err) {
      toast.toast({ title: "Unable to reset settings", description: String(err), variant: "destructive" });
    }
  };

  if (isLoading) return <div>Loading settings…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">System Settings</h1>

      <div className="space-y-6">
        <section className="p-4 border rounded">
          <h2 className="font-medium">Maintenance & Announcement</h2>
          <div className="mt-2 flex items-center gap-4">
            <Switch
              checked={form.maintenance_mode}
              onCheckedChange={(v) => setForm((s) => ({ ...s, maintenance_mode: Boolean(v) }))}
            />
            <span className="text-sm text-muted-foreground">Enable maintenance mode (admins bypass)</span>
          </div>
          <textarea
            value={form.maintenance_message}
            onChange={(e) => setForm((s) => ({ ...s, maintenance_message: e.target.value }))}
            placeholder="Announcement message shown to public during maintenance"
            className="mt-3 w-full rounded border p-2"
            rows={3}
          />

          <div className="mt-4">
            <label className="block text-sm">Announcement banner text</label>
            <input
              value={form.announcement_banner_text}
              onChange={(e) => setForm((s) => ({ ...s, announcement_banner_text: e.target.value }))}
              className="mt-1 w-full rounded border p-2"
            />
            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.announcement_visible} onChange={(e) => setForm((s) => ({ ...s, announcement_visible: e.target.checked }))} />
                <span className="text-sm">Show announcement banner</span>
              </label>
            </div>
          </div>
        </section>

        <section className="p-4 border rounded">
          <h2 className="font-medium">Session, Alerts & Security</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm">Session timeout (minutes)</div>
              <input
                type="number"
                value={form.session_timeout_minutes}
                onChange={(e) => setForm((s) => ({ ...s, session_timeout_minutes: Number(e.target.value) }))}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            <label className="block">
              <div className="text-sm">Pending approval alert threshold</div>
              <input
                type="number"
                value={form.pending_alert_threshold}
                onChange={(e) => setForm((s) => ({ ...s, pending_alert_threshold: Number(e.target.value) }))}
                className="mt-1 w-full rounded border p-2"
              />
            </label>

            <label className="block">
              <div className="text-sm">Failed login attempt limit</div>
              <input type="number" value={form.failed_login_limit} onChange={(e) => setForm((s) => ({ ...s, failed_login_limit: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>

            <label className="block">
              <div className="text-sm">Account lockout (minutes)</div>
              <input type="number" value={form.account_lockout_minutes} onChange={(e) => setForm((s) => ({ ...s, account_lockout_minutes: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>
          </div>
        </section>

        <section className="p-4 border rounded">
          <h2 className="font-medium">Notifications & API</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm">Admin emails (comma-separated)</div>
              <input value={form.admin_emails} onChange={(e) => setForm((s) => ({ ...s, admin_emails: e.target.value }))} className="mt-1 w-full rounded border p-2" />
            </label>

            <label className="block">
              <div className="text-sm">API rate limit (requests/min)</div>
              <input type="number" value={form.api_rate_limit_per_minute} onChange={(e) => setForm((s) => ({ ...s, api_rate_limit_per_minute: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>
          </div>
        </section>

        {/* DHIS2 integration removed */}

        <section className="p-4 border rounded">
          <h2 className="font-medium">Retention & Performance</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm">Audit log retention (days)</div>
              <input type="number" value={form.audit_log_retention_days} onChange={(e) => setForm((s) => ({ ...s, audit_log_retention_days: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>
            <label className="block">
              <div className="text-sm">Archive threshold (months)</div>
              <input type="number" value={form.archive_threshold_months} onChange={(e) => setForm((s) => ({ ...s, archive_threshold_months: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>
            <label className="block">
              <div className="text-sm">Cache duration (minutes)</div>
              <input type="number" value={form.cache_duration_minutes} onChange={(e) => setForm((s) => ({ ...s, cache_duration_minutes: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>
            <label className="block">
              <div className="text-sm">Max search results</div>
              <input type="number" value={form.max_search_results} onChange={(e) => setForm((s) => ({ ...s, max_search_results: Number(e.target.value) }))} className="mt-1 w-full rounded border p-2" />
            </label>
          </div>
        </section>

        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={save}>Save</button>
          <button className="btn" onClick={reset}>Reset to defaults</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

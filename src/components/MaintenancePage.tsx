import * as React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const MaintenancePage: React.FC = () => {
  const { data } = useSystemSettings();
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const reload = setInterval(() => window.location.reload(), 30_000);
    return () => {
      clearInterval(t);
      clearInterval(reload);
    };
  }, []);

  const message = data?.maintenance_message || data?.announcement_banner_text || "The system is under maintenance.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white rounded shadow p-8 text-center">
        <h1 className="text-2xl font-semibold">Maintenance Mode</h1>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 text-xs text-muted-foreground">Current time: {now.toUTCString()}</div>
        <div className="mt-4 text-xs text-muted-foreground">This page will refresh automatically every 30 seconds.</div>
      </div>
    </div>
  );
};

export default MaintenancePage;

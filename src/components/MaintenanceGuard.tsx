import * as React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/contexts/AuthContext";
import MaintenancePage from "@/components/MaintenancePage";

const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading } = useSystemSettings();
  const { loading: authLoading, hasRole } = useAuth();

  if (isLoading || authLoading) return <>{children}</>;

  const maintenance = data?.maintenance_mode;

  if (maintenance && !hasRole("SYSTEM_ADMIN")) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/types";

export function useAppPermissions() {
  const { roles } = useAuth();

  const permissions = useMemo(() => {
    const hasRole = (role: UserRole) => roles.includes(role);
    const isStaff = () =>
      hasRole("ADMIN_OFFICER") ||
      hasRole("REVIEWER") ||
      hasRole("EXECUTIVE_DIRECTOR") ||
      hasRole("SYSTEM_ADMIN");
    const isAdmin = () => hasRole("SYSTEM_ADMIN");

    return {
      roles,
      hasRole,
      isStaff,
      isAdmin,
    };
  }, [roles]);

  return permissions;
}

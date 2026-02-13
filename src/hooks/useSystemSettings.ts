import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemSettings, updateSystemSettings, resetSystemSettingsToDefaults, SystemSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export function useSystemSettings() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["system_settings"],
    queryFn: getSystemSettings,
    staleTime: 1000 * 60,
  });

  const update = useMutation({
    mutationFn: (patch: Partial<SystemSettings>) => updateSystemSettings(patch),
    onSuccess: () => qc.invalidateQueries(["system_settings"]),
  });

  const reset = useMutation({
    mutationFn: () => resetSystemSettingsToDefaults(),
    onSuccess: () => qc.invalidateQueries(["system_settings"]),
  });

  return {
    ...q,
    updateSettings: update,
    resetSettings: reset,
    defaults: DEFAULT_SETTINGS,
  };
}

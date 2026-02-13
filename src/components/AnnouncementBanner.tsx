import * as React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/contexts/AuthContext";

const AnnouncementBanner: React.FC = () => {
  const { data } = useSystemSettings();
  const { hasRole } = useAuth();

  if (!data) return null;

  if (!data.announcement_visible) return null;

  // Admins always see full site; show banner to everyone
  return (
    <div className="w-full bg-yellow-100 text-yellow-900 py-2 text-center text-sm">
      <div className="max-w-6xl mx-auto px-4">{data.announcement_banner_text}</div>
    </div>
  );
};

export default AnnouncementBanner;

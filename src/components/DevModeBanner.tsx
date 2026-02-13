import * as React from "react";
import { isSupabaseConfigured } from "@/lib/supabaseHelpers";

const DevModeBanner: React.FC = () => {
  if (import.meta.env.PROD) return null;

  const configured = isSupabaseConfigured();
  if (configured) return null;

  return (
    <div className="w-full bg-yellow-50 text-yellow-800 py-2 text-center border-b">
      <div className="max-w-6xl mx-auto px-4">
        Supabase is not configured — running in limited dev mode. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to enable full features.
      </div>
    </div>
  );
};

export default DevModeBanner;

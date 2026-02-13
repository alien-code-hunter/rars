import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import { isSupabaseConfigured } from "@/lib/supabaseHelpers";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (sentryDsn) {
	Sentry.init({
		dsn: sentryDsn,
		tracesSampleRate: 0.2,
	});
}

if (!isSupabaseConfigured()) {
  console.warn(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local."
  );
}

createRoot(document.getElementById("root")!).render(<App />);

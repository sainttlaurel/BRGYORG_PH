import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV || "development",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.request?.headers) delete event.request.headers;
      if (event.request?.cookies) delete event.request.cookies;
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(b => {
          const msg = typeof b.message === "string" ? b.message : "";
          const data = b.data as Record<string, unknown> | undefined;
          if (
            msg.includes("resident") || msg.includes("documents") ||
            msg.includes("complaints") || msg.includes("blotter") ||
            msg.includes("contact")
          ) {
            return { ...b, message: "[scrubbed]", data: undefined };
          }
          if (data && typeof data === "object") {
            const scrubbed: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(data)) {
              if (["name", "resident", "complainant", "respondent", "content", "message", "email", "contact", "purpose"].includes(k)) {
                scrubbed[k] = "[scrubbed]";
              } else {
                scrubbed[k] = v;
              }
            }
            return { ...b, data: scrubbed };
          }
          return b;
        });
      }
      return event;
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

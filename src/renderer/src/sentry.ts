import { init } from "@sentry/electron/renderer";
import { createSentryConfig } from "../../shared/sentryConfig";

export function initRendererSentry(): void {
  const config = createSentryConfig({
    env: {
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
      VITE_SENTRY_DISABLED: import.meta.env.VITE_SENTRY_DISABLED,
      VITE_SENTRY_RELEASE: import.meta.env.VITE_SENTRY_RELEASE,
      MODE: import.meta.env.MODE
    },
    version: import.meta.env.VITE_APP_VERSION ?? "0.0.0"
  });

  if (!config.enabled) {
    return;
  }

  init({
    sendDefaultPii: false,
    attachStacktrace: true,
    tracesSampleRate: 0
  });
}

import { init } from "@sentry/electron/main";
import { createSentryConfig } from "../shared/sentryConfig";

export function initMainSentry(version: string): void {
  const config = createSentryConfig({
    env: {
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
      SENTRY_DISABLED: process.env.SENTRY_DISABLED,
      SENTRY_RELEASE: process.env.SENTRY_RELEASE,
      NODE_ENV: process.env.NODE_ENV
    },
    version
  });

  if (!config.enabled) {
    return;
  }

  init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    sendDefaultPii: false,
    attachStacktrace: true,
    tracesSampleRate: 0
  });
}

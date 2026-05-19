import { describe, expect, it } from "vitest";
import { createSentryConfig } from "./sentryConfig";

describe("sentryConfig", () => {
  it("keeps Sentry disabled when no DSN is configured", () => {
    expect(
      createSentryConfig({
        env: {},
        version: "0.1.0"
      })
    ).toEqual({
      enabled: false,
      dsn: undefined,
      environment: "production",
      release: "tinypals-desktop-pet@0.1.0"
    });
  });

  it("enables Sentry with a trimmed DSN and explicit environment", () => {
    expect(
      createSentryConfig({
        env: {
          SENTRY_DSN: " https://examplePublicKey@o0.ingest.sentry.io/0 ",
          SENTRY_ENVIRONMENT: " staging "
        },
        version: "0.1.0"
      })
    ).toEqual({
      enabled: true,
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      environment: "staging",
      release: "tinypals-desktop-pet@0.1.0"
    });
  });

  it("uses Vite-prefixed renderer environment variables", () => {
    expect(
      createSentryConfig({
        env: {
          VITE_SENTRY_DSN: "https://rendererKey@o0.ingest.sentry.io/0",
          VITE_SENTRY_ENVIRONMENT: "production"
        },
        version: "0.1.0"
      })
    ).toMatchObject({
      enabled: true,
      dsn: "https://rendererKey@o0.ingest.sentry.io/0",
      environment: "production"
    });
  });

  it("uses an explicit release override when configured", () => {
    expect(
      createSentryConfig({
        env: {
          SENTRY_DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
          SENTRY_RELEASE: "tinypals-desktop-pet@0.1.0+abc123"
        },
        version: "0.1.0"
      }).release
    ).toBe("tinypals-desktop-pet@0.1.0+abc123");
  });

  it("allows Sentry to be disabled even when a DSN exists", () => {
    expect(
      createSentryConfig({
        env: {
          SENTRY_DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
          SENTRY_DISABLED: "true"
        },
        version: "0.1.0"
      }).enabled
    ).toBe(false);
  });
});

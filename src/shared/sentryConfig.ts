export type SentryEnvironment = {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_DISABLED?: string;
  SENTRY_RELEASE?: string;
  VITE_SENTRY_DSN?: string;
  VITE_SENTRY_ENVIRONMENT?: string;
  VITE_SENTRY_DISABLED?: string;
  VITE_SENTRY_RELEASE?: string;
  NODE_ENV?: string;
  MODE?: string;
};

export type SentryConfig =
  | {
      enabled: true;
      dsn: string;
      environment: string;
      release: string;
    }
  | {
      enabled: false;
      dsn: undefined;
      environment: string;
      release: string;
    };

const RELEASE_PREFIX = "tinypals-desktop-pet";

function readNonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readBooleanFlag(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(
    readNonEmpty(value)?.toLowerCase() ?? ""
  );
}

function readEnvironment(env: SentryEnvironment): string {
  return (
    readNonEmpty(env.SENTRY_ENVIRONMENT) ??
    readNonEmpty(env.VITE_SENTRY_ENVIRONMENT) ??
    (env.NODE_ENV === "development" || env.MODE === "development"
      ? "development"
      : "production")
  );
}

export function createSentryConfig({
  env,
  version
}: {
  env: SentryEnvironment;
  version: string;
}): SentryConfig {
  const environment = readEnvironment(env);
  const release =
    readNonEmpty(env.SENTRY_RELEASE) ??
    readNonEmpty(env.VITE_SENTRY_RELEASE) ??
    `${RELEASE_PREFIX}@${version}`;
  const disabled =
    readBooleanFlag(env.SENTRY_DISABLED) ||
    readBooleanFlag(env.VITE_SENTRY_DISABLED);

  if (disabled) {
    return {
      enabled: false,
      dsn: undefined,
      environment,
      release
    };
  }

  const dsn = readNonEmpty(env.SENTRY_DSN) ?? readNonEmpty(env.VITE_SENTRY_DSN);

  if (!dsn) {
    return {
      enabled: false,
      dsn: undefined,
      environment,
      release
    };
  }

  return {
    enabled: true,
    dsn,
    environment,
    release
  };
}

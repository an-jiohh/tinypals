export type SentryBuildEnvironment = Record<string, string | undefined>;

export type SentryBuildSettings = {
  authToken?: string;
  dsn?: string;
  environment?: string;
  org?: string;
  project?: string;
  release: string;
  sourceMapSetting: "hidden" | false;
  shouldUploadSourceMaps: boolean;
  viteDisabled?: string;
  viteDsn?: string;
  viteEnvironment?: string;
};

function readBooleanFlag(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(
    value?.trim().toLowerCase() ?? ""
  );
}

function readNonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function createSentryBuildSettings(
  env: SentryBuildEnvironment,
  packageVersion: string
): SentryBuildSettings {
  const release =
    readNonEmpty(env.SENTRY_RELEASE) ??
    readNonEmpty(env.VITE_SENTRY_RELEASE) ??
    `tinypals-desktop-pet@${packageVersion}`;
  const isDisabled =
    readBooleanFlag(env.SENTRY_DISABLED) ||
    readBooleanFlag(env.VITE_SENTRY_DISABLED);
  const sourceMapUploadRequested = readBooleanFlag(
    env.SENTRY_UPLOAD_SOURCEMAPS
  );
  const shouldUploadSourceMaps = Boolean(
    sourceMapUploadRequested &&
      env.SENTRY_AUTH_TOKEN &&
      env.SENTRY_ORG &&
      env.SENTRY_PROJECT &&
      !isDisabled
  );

  return {
    authToken: env.SENTRY_AUTH_TOKEN,
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    release,
    sourceMapSetting: shouldUploadSourceMaps ? "hidden" : false,
    shouldUploadSourceMaps,
    viteDisabled: env.VITE_SENTRY_DISABLED ?? env.SENTRY_DISABLED,
    viteDsn: env.VITE_SENTRY_DSN ?? env.SENTRY_DSN,
    viteEnvironment: env.VITE_SENTRY_ENVIRONMENT ?? env.SENTRY_ENVIRONMENT
  };
}

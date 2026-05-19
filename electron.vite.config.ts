import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

type PackageJson = {
  version: string;
};

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf8")
) as PackageJson;

type BuildEnv = Record<string, string | undefined>;

type SentryBuildSettings = {
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

function getBuildEnv(mode: string): BuildEnv {
  return {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env
  };
}

function getSentryBuildSettings(mode: string): SentryBuildSettings {
  const env = getBuildEnv(mode);
  const release =
    readNonEmpty(env.SENTRY_RELEASE) ??
    readNonEmpty(env.VITE_SENTRY_RELEASE) ??
    `tinypals-desktop-pet@${packageJson.version}`;
  const isDisabled =
    readBooleanFlag(env.SENTRY_DISABLED) ||
    readBooleanFlag(env.VITE_SENTRY_DISABLED);
  const shouldUploadSourceMaps = Boolean(
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

function createSentrySourceMapPlugins(
  settings: SentryBuildSettings,
  filesToDeleteAfterUpload: string
) {
  if (!settings.shouldUploadSourceMaps) {
    return [];
  }

  return [
    sentryVitePlugin({
      org: settings.org!,
      project: settings.project!,
      authToken: settings.authToken!,
      release: {
        name: settings.release
      },
      sourcemaps: {
        filesToDeleteAfterUpload
      },
      errorHandler: (error) => {
        throw error;
      },
      telemetry: false
    })
  ];
}

function copyMainAssetsPlugin() {
  return {
    name: "copy-main-assets",
    writeBundle(): void {
      const from = resolve(__dirname, "src/main/assets/tray-icon-template.png");
      const to = resolve(__dirname, "out/main/assets/tray-icon-template.png");

      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
    }
  };
}

export default defineConfig(({ mode }) => {
  const sentry = getSentryBuildSettings(mode);

  return {
    main: {
      plugins: [
        externalizeDepsPlugin(),
        copyMainAssetsPlugin(),
        ...createSentrySourceMapPlugins(sentry, "out/main/**/*.map")
      ],
      define: {
        "process.env.SENTRY_DSN": JSON.stringify(sentry.dsn ?? ""),
        "process.env.SENTRY_ENVIRONMENT": JSON.stringify(
          sentry.environment ?? ""
        ),
        "process.env.SENTRY_DISABLED": JSON.stringify(
          sentry.viteDisabled ?? ""
        ),
        "process.env.SENTRY_RELEASE": JSON.stringify(sentry.release)
      },
      build: {
        sourcemap: sentry.sourceMapSetting,
        rollupOptions: {
          input: {
            index: resolve(__dirname, "src/main/main.ts")
          }
        }
      }
    },
    preload: {
      plugins: [
        externalizeDepsPlugin(),
        ...createSentrySourceMapPlugins(sentry, "out/preload/**/*.map")
      ],
      build: {
        sourcemap: sentry.sourceMapSetting,
        rollupOptions: {
          input: {
            index: resolve(__dirname, "src/preload/preload.ts")
          }
        }
      }
    },
    renderer: {
      root: "src/renderer",
      plugins: [
        react(),
        ...createSentrySourceMapPlugins(sentry, "out/renderer/**/*.map")
      ],
      define: {
        "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
        "import.meta.env.VITE_SENTRY_DSN": JSON.stringify(
          sentry.viteDsn ?? ""
        ),
        "import.meta.env.VITE_SENTRY_ENVIRONMENT": JSON.stringify(
          sentry.viteEnvironment ?? ""
        ),
        "import.meta.env.VITE_SENTRY_DISABLED": JSON.stringify(
          sentry.viteDisabled ?? ""
        ),
        "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(sentry.release)
      },
      build: {
        sourcemap: sentry.sourceMapSetting,
        assetsInlineLimit: 0
      }
    }
  };
});

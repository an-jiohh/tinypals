import { describe, expect, it } from "vitest";
import { createSentryBuildSettings } from "./sentryBuildSettings";

const uploadEnv = {
  SENTRY_AUTH_TOKEN: "token",
  SENTRY_ORG: "org",
  SENTRY_PROJECT: "project"
};

describe("sentryBuildSettings", () => {
  it("does not upload source maps just because credentials exist", () => {
    expect(
      createSentryBuildSettings(uploadEnv, "0.1.0")
    ).toMatchObject({
      shouldUploadSourceMaps: false,
      sourceMapSetting: false
    });
  });

  it("uploads source maps only when explicitly requested", () => {
    expect(
      createSentryBuildSettings(
        {
          ...uploadEnv,
          SENTRY_UPLOAD_SOURCEMAPS: "true"
        },
        "0.1.0"
      )
    ).toMatchObject({
      shouldUploadSourceMaps: true,
      sourceMapSetting: "hidden"
    });
  });

  it("keeps source map upload disabled when Sentry is disabled", () => {
    expect(
      createSentryBuildSettings(
        {
          ...uploadEnv,
          SENTRY_UPLOAD_SOURCEMAPS: "true",
          SENTRY_DISABLED: "true"
        },
        "0.1.0"
      )
    ).toMatchObject({
      shouldUploadSourceMaps: false,
      sourceMapSetting: false
    });
  });

  it("uses the package version for the default release", () => {
    expect(createSentryBuildSettings({}, "0.2.3").release).toBe(
      "tinypals-desktop-pet@0.2.3"
    );
  });
});

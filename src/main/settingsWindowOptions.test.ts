import { describe, expect, it } from "vitest";
import { createSettingsWindowOptions } from "./settingsWindowOptions";

describe("createSettingsWindowOptions", () => {
  it("uses a transparent host so CSS owns the rounded settings border", () => {
    const options = createSettingsWindowOptions("/tmp/preload.mjs");

    expect(options.frame).toBe(false);
    expect(options.transparent).toBe(true);
    expect(options.roundedCorners).toBe(false);
    expect(options.backgroundColor).toBe("#00000000");
  });

  it("uses an in-memory Chromium session partition", () => {
    const options = createSettingsWindowOptions("/tmp/preload.mjs");

    expect(options.webPreferences?.partition).toBe("tinypals:runtime");
    expect(options.webPreferences?.partition).not.toMatch(/^persist:/);
  });
});

import { describe, expect, it } from "vitest";
import { createPetWindowOptions } from "./windowService";
import type { AppSettings } from "../shared/types";

const settings: AppSettings = {
  alwaysOnTop: true,
  launchAtLogin: false,
  selectedAssetPack: "dough-penguin",
  windowBounds: {
    x: 10,
    y: 20,
    width: 144,
    height: 156
  }
};

describe("createPetWindowOptions", () => {
  it("uses an in-memory Chromium session partition", () => {
    const options = createPetWindowOptions(settings, "/tmp/preload.mjs");

    expect(options.webPreferences?.partition).toBe("tinypals:runtime");
    expect(options.webPreferences?.partition).not.toMatch(/^persist:/);
  });
});

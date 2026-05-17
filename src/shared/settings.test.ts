import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  getDefaultWindowBounds,
  normalizeWindowBounds,
  PET_WINDOW_DEFAULT_SIZE,
  PET_WINDOW_MARGIN,
  normalizeSettings
} from "./settings";
import type { DisplayBounds } from "./types";

const display: DisplayBounds = {
  x: 100,
  y: 200,
  width: 1440,
  height: 900
};

describe("settings", () => {
  it("exports the approved window sizing constants", () => {
    expect(PET_WINDOW_DEFAULT_SIZE).toBe(96);
    expect(PET_WINDOW_MARGIN).toBe(24);
  });

  it("defines the approved default settings", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      windowBounds: { x: 24, y: 24, width: 96, height: 96 },
      alwaysOnTop: true,
      launchAtLogin: false,
      selectedAssetPack: "temporary-pingu"
    });
  });

  it("places default window bounds at the display bottom right with a margin", () => {
    expect(getDefaultWindowBounds(display)).toEqual({
      x: 1420,
      y: 980,
      width: 96,
      height: 96
    });
  });

  it("merges partial settings with defaults", () => {
    expect(normalizeSettings({ alwaysOnTop: false }, display)).toEqual({
      windowBounds: { x: 1420, y: 980, width: 96, height: 96 },
      alwaysOnTop: false,
      launchAtLogin: false,
      selectedAssetPack: "temporary-pingu"
    });
  });

  it("normalizes undefined settings using display-aware defaults", () => {
    expect(normalizeSettings(undefined, display)).toEqual({
      windowBounds: { x: 1420, y: 980, width: 96, height: 96 },
      alwaysOnTop: true,
      launchAtLogin: false,
      selectedAssetPack: "temporary-pingu"
    });
  });

  it("repairs out-of-screen bounds to the default position", () => {
    expect(
      normalizeSettings(
        {
          windowBounds: {
            x: 10_000,
            y: -500,
            width: 96,
            height: 96
          }
        },
        display
      ).windowBounds
    ).toEqual({ x: 1420, y: 980, width: 96, height: 96 });
  });

  it("resets off-screen bounds to the full default bounds", () => {
    expect(
      normalizeWindowBounds(
        {
          x: 10_000,
          y: -500,
          width: 180,
          height: 72
        },
        display
      )
    ).toEqual({ x: 1420, y: 980, width: 96, height: 96 });
  });

  it("ignores persisted size and keeps the pet window fixed", () => {
    expect(
      normalizeSettings(
        {
          windowBounds: {
            x: 320,
            y: 360,
            width: 40,
            height: 240
          }
        },
        display
      ).windowBounds
    ).toEqual({ x: 320, y: 360, width: 96, height: 96 });
  });
});

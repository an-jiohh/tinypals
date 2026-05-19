import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  getBottomRightWindowBounds,
  getDefaultWindowBounds,
  normalizeWindowBounds,
  PET_WINDOW_DEFAULT_HEIGHT,
  PET_WINDOW_DEFAULT_WIDTH,
  PET_WINDOW_MARGIN,
  PET_WINDOW_MAX_HEIGHT,
  PET_WINDOW_MAX_WIDTH,
  PET_WINDOW_MIN_HEIGHT,
  PET_WINDOW_MIN_WIDTH,
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
    expect(PET_WINDOW_DEFAULT_WIDTH).toBe(144);
    expect(PET_WINDOW_DEFAULT_HEIGHT).toBe(156);
    expect(PET_WINDOW_MIN_WIDTH).toBe(96);
    expect(PET_WINDOW_MIN_HEIGHT).toBe(104);
    expect(PET_WINDOW_MAX_WIDTH).toBe(384);
    expect(PET_WINDOW_MAX_HEIGHT).toBe(416);
    expect(PET_WINDOW_MARGIN).toBe(24);
  });

  it("defines the approved default settings", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      windowBounds: { x: 24, y: 24, width: 144, height: 156 },
      alwaysOnTop: true,
      launchAtLogin: false,
      selectedAssetPack: "dough-penguin"
    });
  });

  it("places default window bounds at the display bottom right with a margin", () => {
    expect(getDefaultWindowBounds(display)).toEqual({
      x: 1372,
      y: 920,
      width: 144,
      height: 156
    });
  });

  it("places a resized window at the display bottom right without changing its size", () => {
    expect(
      getBottomRightWindowBounds(display, { width: 192, height: 208 })
    ).toEqual({
      x: 1324,
      y: 868,
      width: 192,
      height: 208
    });
  });

  it("merges partial settings with defaults", () => {
    expect(normalizeSettings({ alwaysOnTop: false }, display)).toEqual({
      windowBounds: { x: 1372, y: 920, width: 144, height: 156 },
      alwaysOnTop: false,
      launchAtLogin: false,
      selectedAssetPack: "dough-penguin"
    });
  });

  it("normalizes undefined settings using display-aware defaults", () => {
    expect(normalizeSettings(undefined, display)).toEqual({
      windowBounds: { x: 1372, y: 920, width: 144, height: 156 },
      alwaysOnTop: true,
      launchAtLogin: false,
      selectedAssetPack: "dough-penguin"
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
            height: 104
          }
        },
        display
      ).windowBounds
    ).toEqual({ x: 1372, y: 920, width: 144, height: 156 });
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
    ).toEqual({ x: 1372, y: 920, width: 144, height: 156 });
  });

  it("preserves persisted size while keeping the pet window aspect ratio", () => {
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
    ).toEqual({ x: 320, y: 360, width: 222, height: 240 });
  });

  it("clamps persisted size to the approved resize range", () => {
    expect(
      normalizeSettings(
        {
          windowBounds: {
            x: 320,
            y: 360,
            width: 20,
            height: 20
          }
        },
        display
      ).windowBounds
    ).toEqual({ x: 320, y: 360, width: 96, height: 104 });

    expect(
      normalizeSettings(
        {
          windowBounds: {
            x: 320,
            y: 360,
            width: 900,
            height: 900
          }
        },
        display
      ).windowBounds
    ).toEqual({ x: 320, y: 360, width: 384, height: 416 });
  });
});

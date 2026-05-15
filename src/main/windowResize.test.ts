import { describe, expect, it } from "vitest";
import {
  SETTINGS_WINDOW_MAX_SIZE,
  getSettingsResizeBounds
} from "./windowResize";
import type { DisplayBounds, WindowBounds } from "../shared/types";

const display: DisplayBounds = { x: 0, y: 0, width: 500, height: 400 };

describe("getSettingsResizeBounds", () => {
  it("keeps the current position when the resized window fits", () => {
    const current: WindowBounds = { x: 40, y: 60, width: 96, height: 96 };

    expect(
      getSettingsResizeBounds(current, { width: 220, height: 240 }, display)
    ).toEqual({ x: 40, y: 60, width: 220, height: 240 });
  });

  it("moves only enough to fit near the right and bottom display edges", () => {
    const current: WindowBounds = { x: 430, y: 340, width: 96, height: 96 };

    expect(
      getSettingsResizeBounds(current, { width: 220, height: 240 }, display)
    ).toEqual({ x: 280, y: 160, width: 220, height: 240 });
  });

  it("clamps settings resize dimensions to their own safe bounds", () => {
    const current: WindowBounds = { x: 10, y: 20, width: 96, height: 96 };

    expect(
      getSettingsResizeBounds(current, { width: 900, height: 20 }, display)
    ).toEqual({
      x: 10,
      y: 20,
      width: SETTINGS_WINDOW_MAX_SIZE,
      height: 72
    });
  });
});

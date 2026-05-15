import { PET_WINDOW_MIN_SIZE } from "../shared/settings";
import type { DisplayBounds, WindowBounds } from "../shared/types";

export const SETTINGS_WINDOW_MAX_SIZE = 320;

type WindowSize = {
  width: number;
  height: number;
};

export function getSettingsResizeBounds(
  currentBounds: WindowBounds,
  requestedSize: WindowSize,
  display: DisplayBounds
): WindowBounds {
  const width = clamp(
    Math.round(requestedSize.width),
    PET_WINDOW_MIN_SIZE,
    Math.min(SETTINGS_WINDOW_MAX_SIZE, display.width)
  );
  const height = clamp(
    Math.round(requestedSize.height),
    PET_WINDOW_MIN_SIZE,
    Math.min(SETTINGS_WINDOW_MAX_SIZE, display.height)
  );

  return {
    x: clampPosition(
      currentBounds.x,
      display.x,
      display.x + display.width - width
    ),
    y: clampPosition(
      currentBounds.y,
      display.y,
      display.y + display.height - height
    ),
    width,
    height
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampPosition(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return clamp(value, min, max);
}

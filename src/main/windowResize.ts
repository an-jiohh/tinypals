import { PET_WINDOW_MIN_SIZE } from "../shared/settings";
import type { DisplayBounds, WindowBounds } from "../shared/types";

export const SETTINGS_WINDOW_MAX_SIZE = 320;

type WindowSize = {
  width: number;
  height: number;
};

export type ResizeRequestGate = {
  shouldApply(requestId: number): boolean;
  isLatest(requestId: number): boolean;
};

export function createResizeRequestGate(): ResizeRequestGate {
  let latestRequestId = 0;

  return {
    shouldApply(requestId: number): boolean {
      if (requestId < latestRequestId) {
        return false;
      }

      latestRequestId = requestId;
      return true;
    },
    isLatest(requestId: number): boolean {
      return requestId >= latestRequestId;
    }
  };
}

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

export function getRuntimeWindowBounds(
  bounds: WindowBounds,
  display: DisplayBounds
): WindowBounds {
  const width = clamp(
    Math.round(bounds.width),
    PET_WINDOW_MIN_SIZE,
    display.width
  );
  const height = clamp(
    Math.round(bounds.height),
    PET_WINDOW_MIN_SIZE,
    display.height
  );

  return {
    x: clampPosition(
      Math.round(bounds.x),
      display.x,
      display.x + display.width - width
    ),
    y: clampPosition(
      Math.round(bounds.y),
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

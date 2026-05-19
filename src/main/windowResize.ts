import { normalizeWindowSize } from "../shared/settings";
import type { DisplayBounds, WindowBounds } from "../shared/types";

export type ProgrammaticBoundsEvent = "moved" | "resized";

export type ProgrammaticBoundsSuppressor = {
  suppressNext(bounds: WindowBounds): void;
  shouldSuppress(event: ProgrammaticBoundsEvent, bounds: WindowBounds): boolean;
};

export function createProgrammaticBoundsSuppressor(): ProgrammaticBoundsSuppressor {
  let nextSuppressedBoundsByEvent = new Map<
    ProgrammaticBoundsEvent,
    WindowBounds
  >();

  return {
    suppressNext(bounds: WindowBounds): void {
      nextSuppressedBoundsByEvent = new Map([
        ["moved", { ...bounds }],
        ["resized", { ...bounds }]
      ]);
    },
    shouldSuppress(event: ProgrammaticBoundsEvent, bounds: WindowBounds): boolean {
      const nextSuppressedBounds = nextSuppressedBoundsByEvent.get(event);

      if (!nextSuppressedBounds) {
        return false;
      }

      nextSuppressedBoundsByEvent.delete(event);

      if (!isSameBounds(bounds, nextSuppressedBounds)) {
        return false;
      }

      return true;
    }
  };
}

export function getRuntimeWindowBounds(
  bounds: WindowBounds,
  display: DisplayBounds
): WindowBounds {
  const { width, height } = normalizeWindowSize(
    bounds.width,
    bounds.height,
    display
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

function isSameBounds(first: WindowBounds, second: WindowBounds): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

import { PET_WINDOW_MIN_SIZE } from "../shared/settings";
import type { DisplayBounds, WindowBounds } from "../shared/types";

export const SETTINGS_WINDOW_MAX_SIZE = 320;

type WindowSize = {
  width: number;
  height: number;
};

type ResizePayload = {
  requestId: number;
};

type ResizeApply<TPayload extends ResizePayload, TResult> = (
  payload: TPayload,
  isLatest: () => boolean
) => Promise<TResult>;

export type ResizeRequestQueue<TPayload extends ResizePayload, TResult> = {
  enqueue(payload: TPayload): Promise<TResult>;
};

export type ProgrammaticBoundsSuppressor = {
  suppressNext(bounds: WindowBounds): void;
  shouldSuppress(bounds: WindowBounds): boolean;
};

export function createProgrammaticBoundsSuppressor(): ProgrammaticBoundsSuppressor {
  let nextSuppressedBounds: WindowBounds | undefined;

  return {
    suppressNext(bounds: WindowBounds): void {
      nextSuppressedBounds = { ...bounds };
    },
    shouldSuppress(bounds: WindowBounds): boolean {
      if (!nextSuppressedBounds || !isSameBounds(bounds, nextSuppressedBounds)) {
        return false;
      }

      nextSuppressedBounds = undefined;
      return true;
    }
  };
}

export function createResizeRequestQueue<TPayload extends ResizePayload, TResult>(
  loadCurrent: () => Promise<TResult>,
  applyLatest: ResizeApply<TPayload, TResult>
): ResizeRequestQueue<TPayload, TResult> {
  let latestRequestId = 0;
  let resizeQueue = Promise.resolve();

  return {
    enqueue(payload: TPayload): Promise<TResult> {
      latestRequestId = Math.max(latestRequestId, payload.requestId);

      const run = async (): Promise<TResult> => {
        const isLatest = (): boolean => payload.requestId === latestRequestId;

        if (!isLatest()) {
          return loadCurrent();
        }

        return applyLatest(payload, isLatest);
      };

      const result = resizeQueue.then(run, run);
      resizeQueue = result.then(
        () => undefined,
        () => undefined
      );
      return result;
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

function isSameBounds(first: WindowBounds, second: WindowBounds): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}

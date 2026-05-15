import { describe, expect, it } from "vitest";
import {
  SETTINGS_WINDOW_MAX_SIZE,
  createProgrammaticBoundsSuppressor,
  createResizeRequestQueue,
  getRuntimeWindowBounds,
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

  it("clamps runtime bounds to fit without resetting to the default position", () => {
    expect(
      getRuntimeWindowBounds(
        { x: 480, y: 390, width: 180, height: 180 },
        display
      )
    ).toEqual({ x: 320, y: 220, width: 180, height: 180 });
  });

  it("clamps oversized runtime bounds to display size and origin", () => {
    expect(
      getRuntimeWindowBounds(
        { x: -20, y: -30, width: 900, height: 700 },
        display
      )
    ).toEqual({ x: 0, y: 0, width: 500, height: 400 });
  });

  it("serializes resize requests and lets running handlers skip stale writes", async () => {
    const appliedRequestIds: number[] = [];
    let releaseFirstRequest: (() => void) | undefined;
    const firstRequestStarted = new Promise<void>((resolveStarted) => {
      releaseFirstRequest = resolveStarted;
    });
    let allowFirstRequestToContinue: (() => void) | undefined;
    const firstRequestCanContinue = new Promise<void>((resolveContinue) => {
      allowFirstRequestToContinue = resolveContinue;
    });
    const queue = createResizeRequestQueue<{ requestId: number }, string>(
      async () => "current",
      async (payload, isLatest) => {
        if (payload.requestId === 1) {
          releaseFirstRequest?.();
          await firstRequestCanContinue;
        }

        if (!isLatest()) {
          return "stale";
        }

        appliedRequestIds.push(payload.requestId);
        return `applied-${payload.requestId}`;
      }
    );

    const first = queue.enqueue({ requestId: 1 });
    await firstRequestStarted;
    const second = queue.enqueue({ requestId: 2 });
    allowFirstRequestToContinue?.();

    await expect(first).resolves.toBe("stale");
    await expect(second).resolves.toBe("applied-2");
    expect(appliedRequestIds).toEqual([2]);
  });

  it("suppresses the matching moved and resized events from one programmatic bounds update", () => {
    const suppressor = createProgrammaticBoundsSuppressor();
    const programmaticBounds: WindowBounds = {
      x: 20,
      y: 30,
      width: 220,
      height: 240
    };

    suppressor.suppressNext(programmaticBounds);

    expect(
      suppressor.shouldSuppress("moved", {
        x: 20,
        y: 30,
        width: 96,
        height: 96
      })
    ).toBe(false);
    expect(suppressor.shouldSuppress("moved", programmaticBounds)).toBe(false);
    expect(suppressor.shouldSuppress("resized", programmaticBounds)).toBe(true);

    suppressor.suppressNext(programmaticBounds);

    expect(suppressor.shouldSuppress("moved", programmaticBounds)).toBe(true);
    expect(suppressor.shouldSuppress("resized", programmaticBounds)).toBe(true);
    expect(suppressor.shouldSuppress("moved", programmaticBounds)).toBe(false);
    expect(suppressor.shouldSuppress("resized", programmaticBounds)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  createProgrammaticBoundsSuppressor,
  getRuntimeWindowBounds
} from "./windowResize";
import type { DisplayBounds, WindowBounds } from "../shared/types";

const display: DisplayBounds = { x: 0, y: 0, width: 500, height: 400 };

describe("getRuntimeWindowBounds", () => {
  it("clamps runtime position while preserving a resized pet size", () => {
    expect(
      getRuntimeWindowBounds(
        { x: 480, y: 390, width: 180, height: 180 },
        display
      )
    ).toEqual({ x: 320, y: 205, width: 180, height: 195 });
  });

  it("keeps runtime bounds inside very small displays", () => {
    expect(
      getRuntimeWindowBounds(
        { x: -20, y: -30, width: 900, height: 700 },
        { x: 0, y: 0, width: 80, height: 70 }
      )
    ).toEqual({ x: 0, y: 0, width: 80, height: 70 });
  });
});

describe("createProgrammaticBoundsSuppressor", () => {
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
        height: 104
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

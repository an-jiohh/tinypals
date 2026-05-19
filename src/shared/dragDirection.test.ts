import { describe, expect, it } from "vitest";
import { getDragDirectionChange } from "./dragDirection";

describe("getDragDirectionChange", () => {
  it("returns a new direction when horizontal drag movement changes sign", () => {
    expect(getDragDirectionChange(-6, undefined)).toBe("left");
    expect(getDragDirectionChange(8, "left")).toBe("right");
    expect(getDragDirectionChange(-4, "right")).toBe("left");
  });

  it("does not return a change while continuing in the same direction", () => {
    expect(getDragDirectionChange(-6, "left")).toBeUndefined();
    expect(getDragDirectionChange(8, "right")).toBeUndefined();
  });

  it("keeps the current direction when movement is vertical", () => {
    expect(getDragDirectionChange(0, "left")).toBeUndefined();
    expect(getDragDirectionChange(0, "right")).toBeUndefined();
    expect(getDragDirectionChange(0, undefined)).toBe("right");
  });
});

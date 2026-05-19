import { describe, expect, it } from "vitest";
import { reducePetState } from "./petStateMachine";
import type { PetRuntimeState } from "./petTypes";

const baseState: PetRuntimeState = {
  mood: "idle",
  lastInteractionAt: 1000,
  animationNonce: 0
};

describe("reducePetState", () => {
  it("starts in idle when the app starts", () => {
    expect(reducePetState(baseState, { type: "app_started", now: 2000 })).toEqual({
      mood: "idle",
      lastInteractionAt: 2000,
      animationNonce: 1
    });
  });

  it("shows a waving animation when clicked", () => {
    expect(reducePetState(baseState, { type: "user_clicked", now: 3000 })).toEqual({
      mood: "waving",
      lastInteractionAt: 3000,
      animationNonce: 1
    });
  });

  it("uses directional running states while the window is dragged", () => {
    expect(
      reducePetState(baseState, { type: "user_drag_started", direction: "right", now: 4000 })
    ).toEqual({
      mood: "running-right",
      lastInteractionAt: 4000,
      animationNonce: 1
    });
    expect(
      reducePetState(baseState, { type: "user_drag_started", direction: "left", now: 5000 })
    ).toEqual({
      mood: "running-left",
      lastInteractionAt: 5000,
      animationNonce: 1
    });
  });

  it("returns to idle after dragging ends", () => {
    const dragging: PetRuntimeState = {
      mood: "running-right",
      lastInteractionAt: 4000,
      animationNonce: 2
    };

    expect(reducePetState(dragging, { type: "user_drag_ended", now: 5000 })).toEqual({
      mood: "idle",
      lastInteractionAt: 5000,
      animationNonce: 3
    });
  });

  it("switches to waiting after an idle timeout", () => {
    expect(reducePetState(baseState, { type: "idle_timeout", now: 8000 })).toEqual({
      mood: "waiting",
      lastInteractionAt: 1000,
      animationNonce: 1
    });
  });

  it("reserves future timer and schedule reactions", () => {
    expect(reducePetState(baseState, { type: "timer_started", now: 9000 }).mood).toBe("running");
    expect(reducePetState(baseState, { type: "timer_paused", now: 9000 }).mood).toBe("waiting");
    expect(reducePetState(baseState, { type: "timer_completed", now: 9000 }).mood).toBe("jumping");
    expect(reducePetState(baseState, { type: "schedule_due", now: 9000 }).mood).toBe("review");
  });
});

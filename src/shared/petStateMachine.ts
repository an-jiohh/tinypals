import type { PetEvent, PetMood, PetRuntimeState } from "./petTypes";

function bump(state: PetRuntimeState, mood: PetMood, now: number, updateInteraction: boolean): PetRuntimeState {
  return {
    mood,
    lastInteractionAt: updateInteraction ? now : state.lastInteractionAt,
    animationNonce: state.animationNonce + 1
  };
}

export function createInitialPetState(now: number): PetRuntimeState {
  return {
    mood: "idle",
    lastInteractionAt: now,
    animationNonce: 0
  };
}

export function reducePetState(state: PetRuntimeState, event: PetEvent): PetRuntimeState {
  switch (event.type) {
    case "app_started":
      return bump(state, "idle", event.now, true);
    case "user_clicked":
      return bump(state, "waving", event.now, true);
    case "user_drag_started":
      return bump(state, event.direction === "left" ? "running-left" : "running-right", event.now, true);
    case "user_drag_ended":
      return bump(state, "idle", event.now, true);
    case "idle_timeout":
      return bump(state, "waiting", event.now, false);
    case "settings_changed":
      return bump(state, "idle", event.now, true);
    case "timer_started":
      return bump(state, "running", event.now, true);
    case "timer_paused":
      return bump(state, "waiting", event.now, true);
    case "timer_completed":
      return bump(state, "jumping", event.now, true);
    case "schedule_due":
      return bump(state, "review", event.now, true);
  }
}

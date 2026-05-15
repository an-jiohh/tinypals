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
      return bump(state, "greet", event.now, true);
    case "user_drag_started":
      return bump(state, "dragging", event.now, true);
    case "user_drag_ended":
      return bump(state, "idle", event.now, true);
    case "idle_timeout":
      return bump(state, "sleepy", event.now, false);
    case "settings_changed":
      return bump(state, "idle", event.now, true);
    case "timer_started":
      return bump(state, "attention", event.now, true);
    case "timer_paused":
      return bump(state, "sleepy", event.now, true);
    case "timer_completed":
      return bump(state, "happy", event.now, true);
    case "schedule_due":
      return bump(state, "attention", event.now, true);
  }
}

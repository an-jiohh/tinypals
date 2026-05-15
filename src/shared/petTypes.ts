export type PetMood = "idle" | "greet" | "dragging" | "sleepy" | "happy" | "attention";

export type PetEvent =
  | { type: "app_started"; now: number }
  | { type: "user_clicked"; now: number }
  | { type: "user_drag_started"; now: number }
  | { type: "user_drag_ended"; now: number }
  | { type: "idle_timeout"; now: number }
  | { type: "settings_changed"; now: number }
  | { type: "timer_started"; now: number }
  | { type: "timer_paused"; now: number }
  | { type: "timer_completed"; now: number }
  | { type: "schedule_due"; now: number };

export type PetRuntimeState = {
  mood: PetMood;
  lastInteractionAt: number;
  animationNonce: number;
};

export type PetAssetState = PetMood;

export type PetAssetManifest = {
  id: string;
  displayName: string;
  license: "official-licensed" | "temporary" | "custom";
  states: Record<PetAssetState, string>;
};

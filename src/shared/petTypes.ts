export type PetMood =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

export type PetDirection = "left" | "right";

export type PetEvent =
  | { type: "app_started"; now: number }
  | { type: "user_clicked"; now: number }
  | { type: "user_drag_started"; direction: PetDirection; now: number }
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

export type PetFrameSize = {
  width: number;
  height: number;
};

export type PetStateAsset = {
  file: string;
  frameCount: number;
  fps: number;
  loop: boolean;
};

export type PetAssetSource = {
  type: "hatch-pet-atlas";
  atlasFile: string;
  cell: PetFrameSize;
  outputScale: number;
};

export type PetAssetManifest = {
  id: string;
  displayName: string;
  description: string;
  license: "official-licensed" | "placeholder" | "custom";
  source?: PetAssetSource;
  frame: PetFrameSize;
  states: Record<PetAssetState, PetStateAsset>;
};

export type ResolvedPetAsset = PetStateAsset & {
  state: PetAssetState;
  frameWidth: number;
  frameHeight: number;
};

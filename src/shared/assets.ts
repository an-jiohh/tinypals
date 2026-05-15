import type { PetAssetManifest, PetAssetState, PetMood } from "./petTypes";

export const PET_ASSET_STATES = ["idle", "greet", "dragging", "sleepy", "happy", "attention"] as const satisfies readonly PetAssetState[];

export function validateAssetManifest(manifest: PetAssetManifest): string[] {
  return PET_ASSET_STATES.flatMap((state) => {
    const path = manifest.states[state];

    return typeof path === "string" && path.trim().length > 0 ? [] : [`Missing asset for state: ${state}`];
  });
}

export function getAssetForMood(manifest: PetAssetManifest, mood: PetMood): string {
  const requestedPath = manifest.states[mood];

  return typeof requestedPath === "string" && requestedPath.trim().length > 0 ? requestedPath : manifest.states.idle;
}

import type { PetAssetManifest, PetAssetState, PetMood, PetStateAsset, ResolvedPetAsset } from "./petTypes";

export const PET_ASSET_STATES = [
  "idle",
  "running-right",
  "running-left",
  "waving",
  "jumping",
  "failed",
  "waiting",
  "running",
  "review"
] as const satisfies readonly PetAssetState[];

export function validateAssetManifest(manifest: PetAssetManifest): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(manifest.frame.width) || manifest.frame.width <= 0) {
    errors.push("Invalid frame width");
  }

  if (!Number.isInteger(manifest.frame.height) || manifest.frame.height <= 0) {
    errors.push("Invalid frame height");
  }

  if (manifest.source) {
    if (manifest.source.type !== "hatch-pet-atlas") {
      errors.push("Invalid asset source type");
    }

    if (
      typeof manifest.source.atlasFile !== "string" ||
      manifest.source.atlasFile.trim().length === 0
    ) {
      errors.push("Missing source atlas file");
    }

    if (!Number.isInteger(manifest.source.cell.width) || manifest.source.cell.width <= 0) {
      errors.push("Invalid source cell width");
    }

    if (!Number.isInteger(manifest.source.cell.height) || manifest.source.cell.height <= 0) {
      errors.push("Invalid source cell height");
    }

    if (
      typeof manifest.source.outputScale !== "number" ||
      !Number.isFinite(manifest.source.outputScale) ||
      manifest.source.outputScale <= 0
    ) {
      errors.push("Invalid source output scale");
    }
  }

  for (const state of PET_ASSET_STATES) {
    const asset = manifest.states[state];

    if (!asset) {
      errors.push(`Missing asset for state: ${state}`);
      continue;
    }

    if (typeof asset.file !== "string" || asset.file.trim().length === 0) {
      errors.push(`Missing asset file for state: ${state}`);
    }

    if (!Number.isInteger(asset.frameCount) || asset.frameCount <= 0) {
      errors.push(`Invalid frame count for state: ${state}`);
    }

    if (typeof asset.fps !== "number" || !Number.isFinite(asset.fps) || asset.fps <= 0) {
      errors.push(`Invalid fps for state: ${state}`);
    }
  }

  return errors;
}

export function getAssetForMood(manifest: PetAssetManifest, mood: PetMood): ResolvedPetAsset {
  const requestedAsset = manifest.states[mood];
  const asset = isUsableStateAsset(requestedAsset) ? requestedAsset : manifest.states.idle;
  const state = asset === requestedAsset ? mood : "idle";

  return {
    state,
    file: asset.file,
    frameCount: asset.frameCount,
    fps: asset.fps,
    loop: asset.loop,
    frameWidth: manifest.frame.width,
    frameHeight: manifest.frame.height
  };
}

function isUsableStateAsset(asset: PetStateAsset | undefined): asset is PetStateAsset {
  return typeof asset?.file === "string" && asset.file.trim().length > 0;
}

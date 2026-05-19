import pinguManifestData from "../assets/pingu/pet.json";
import pinguFailedAssetUrl from "../assets/pingu/pingu_failed.png";
import pinguIdleAssetUrl from "../assets/pingu/pingu_idle.png";
import pinguJumpingAssetUrl from "../assets/pingu/pingu_jumping.png";
import pinguReviewAssetUrl from "../assets/pingu/pingu_review.png";
import pinguRunningAssetUrl from "../assets/pingu/pingu_running.png";
import pinguRunningLeftAssetUrl from "../assets/pingu/pingu_running_left.png";
import pinguRunningRightAssetUrl from "../assets/pingu/pingu_running_right.png";
import pinguWaitingAssetUrl from "../assets/pingu/pingu_waiting.png";
import pinguWavingAssetUrl from "../assets/pingu/pingu_waving.png";
import pinguTestManifestData from "../assets/pingu-test/pet.json";
import pinguTestFailedAssetUrl from "../assets/pingu-test/pingu_failed.png";
import pinguTestIdleAssetUrl from "../assets/pingu-test/pingu_idle.png";
import pinguTestJumpingAssetUrl from "../assets/pingu-test/pingu_jumping.png";
import pinguTestReviewAssetUrl from "../assets/pingu-test/pingu_review.png";
import pinguTestRunningAssetUrl from "../assets/pingu-test/pingu_running.png";
import pinguTestRunningLeftAssetUrl from "../assets/pingu-test/pingu_running_left.png";
import pinguTestRunningRightAssetUrl from "../assets/pingu-test/pingu_running_right.png";
import pinguTestWaitingAssetUrl from "../assets/pingu-test/pingu_waiting.png";
import pinguTestWavingAssetUrl from "../assets/pingu-test/pingu_waving.png";
import { PET_ASSET_STATES } from "../../shared/assets";
import type {
  PetAssetManifest,
  PetAssetState,
  PetStateAsset
} from "../../shared/petTypes";

type PetAssetFileMap = Record<PetAssetState, string>;

export type PetAssetPack = {
  id: string;
  displayName: string;
  manifest: PetAssetManifest;
};

export type PetAssetPackOption = {
  id: string;
  displayName: string;
};

export const DEFAULT_PET_ASSET_PACK_ID = "dough-penguin";

const pinguAssetFiles = {
  idle: pinguIdleAssetUrl,
  "running-right": pinguRunningRightAssetUrl,
  "running-left": pinguRunningLeftAssetUrl,
  waving: pinguWavingAssetUrl,
  jumping: pinguJumpingAssetUrl,
  failed: pinguFailedAssetUrl,
  waiting: pinguWaitingAssetUrl,
  running: pinguRunningAssetUrl,
  review: pinguReviewAssetUrl
} satisfies PetAssetFileMap;

const pinguTestAssetFiles = {
  idle: pinguTestIdleAssetUrl,
  "running-right": pinguTestRunningRightAssetUrl,
  "running-left": pinguTestRunningLeftAssetUrl,
  waving: pinguTestWavingAssetUrl,
  jumping: pinguTestJumpingAssetUrl,
  failed: pinguTestFailedAssetUrl,
  waiting: pinguTestWaitingAssetUrl,
  running: pinguTestRunningAssetUrl,
  review: pinguTestReviewAssetUrl
} satisfies PetAssetFileMap;

export const petAssetPacks = [
  createPetAssetPack(pinguManifestData as PetAssetManifest, pinguAssetFiles),
  createPetAssetPack(
    pinguTestManifestData as PetAssetManifest,
    pinguTestAssetFiles
  )
] as const satisfies readonly PetAssetPack[];

export const PET_ASSET_PACK_OPTIONS: readonly PetAssetPackOption[] =
  petAssetPacks.map(({ id, displayName }) => ({ id, displayName }));

export function getPetAssetPack(id: string | undefined): PetAssetPack {
  return (
    petAssetPacks.find((pack) => pack.id === id) ??
    petAssetPacks.find((pack) => pack.id === DEFAULT_PET_ASSET_PACK_ID) ??
    petAssetPacks[0]
  );
}

function createPetAssetPack(
  source: PetAssetManifest,
  files: PetAssetFileMap
): PetAssetPack {
  const states = Object.fromEntries(
    PET_ASSET_STATES.map((state) => [
      state,
      {
        ...source.states[state],
        file: files[state]
      }
    ])
  ) as Record<PetAssetState, PetStateAsset>;
  const manifest = {
    ...source,
    states
  };

  return {
    id: manifest.id,
    displayName: manifest.displayName,
    manifest
  };
}

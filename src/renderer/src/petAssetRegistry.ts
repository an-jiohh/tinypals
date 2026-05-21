import tinypalsManifestData from "../assets/tinypals/pet.json";
import tinypalsFailedAssetUrl from "../assets/tinypals/tinypals_failed.png";
import tinypalsIdleAssetUrl from "../assets/tinypals/tinypals_idle.png";
import tinypalsJumpingAssetUrl from "../assets/tinypals/tinypals_jumping.png";
import tinypalsReviewAssetUrl from "../assets/tinypals/tinypals_review.png";
import tinypalsRunningAssetUrl from "../assets/tinypals/tinypals_running.png";
import tinypalsRunningLeftAssetUrl from "../assets/tinypals/tinypals_running_left.png";
import tinypalsRunningRightAssetUrl from "../assets/tinypals/tinypals_running_right.png";
import tinypalsWaitingAssetUrl from "../assets/tinypals/tinypals_waiting.png";
import tinypalsWavingAssetUrl from "../assets/tinypals/tinypals_waving.png";
import tinypalsTestManifestData from "../assets/tinypals-test/pet.json";
import tinypalsTestFailedAssetUrl from "../assets/tinypals-test/tinypals_failed.png";
import tinypalsTestIdleAssetUrl from "../assets/tinypals-test/tinypals_idle.png";
import tinypalsTestJumpingAssetUrl from "../assets/tinypals-test/tinypals_jumping.png";
import tinypalsTestReviewAssetUrl from "../assets/tinypals-test/tinypals_review.png";
import tinypalsTestRunningAssetUrl from "../assets/tinypals-test/tinypals_running.png";
import tinypalsTestRunningLeftAssetUrl from "../assets/tinypals-test/tinypals_running_left.png";
import tinypalsTestRunningRightAssetUrl from "../assets/tinypals-test/tinypals_running_right.png";
import tinypalsTestWaitingAssetUrl from "../assets/tinypals-test/tinypals_waiting.png";
import tinypalsTestWavingAssetUrl from "../assets/tinypals-test/tinypals_waving.png";
import artistPenguinManifestData from "../assets/artist-penguin/pet.json";
import artistPenguinFailedAssetUrl from "../assets/artist-penguin/artist_penguin_failed.png";
import artistPenguinIdleAssetUrl from "../assets/artist-penguin/artist_penguin_idle.png";
import artistPenguinJumpingAssetUrl from "../assets/artist-penguin/artist_penguin_jumping.png";
import artistPenguinReviewAssetUrl from "../assets/artist-penguin/artist_penguin_review.png";
import artistPenguinRunningAssetUrl from "../assets/artist-penguin/artist_penguin_running.png";
import artistPenguinRunningLeftAssetUrl from "../assets/artist-penguin/artist_penguin_running_left.png";
import artistPenguinRunningRightAssetUrl from "../assets/artist-penguin/artist_penguin_running_right.png";
import artistPenguinWaitingAssetUrl from "../assets/artist-penguin/artist_penguin_waiting.png";
import artistPenguinWavingAssetUrl from "../assets/artist-penguin/artist_penguin_waving.png";
import cleanerPenguinManifestData from "../assets/cleaner-penguin/pet.json";
import cleanerPenguinFailedAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_failed.png";
import cleanerPenguinIdleAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_idle.png";
import cleanerPenguinJumpingAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_jumping.png";
import cleanerPenguinReviewAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_review.png";
import cleanerPenguinRunningAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_running.png";
import cleanerPenguinRunningLeftAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_running_left.png";
import cleanerPenguinRunningRightAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_running_right.png";
import cleanerPenguinWaitingAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_waiting.png";
import cleanerPenguinWavingAssetUrl from "../assets/cleaner-penguin/cleaner_penguin_waving.png";
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

const tinypalsAssetFiles = {
  idle: tinypalsIdleAssetUrl,
  "running-right": tinypalsRunningRightAssetUrl,
  "running-left": tinypalsRunningLeftAssetUrl,
  waving: tinypalsWavingAssetUrl,
  jumping: tinypalsJumpingAssetUrl,
  failed: tinypalsFailedAssetUrl,
  waiting: tinypalsWaitingAssetUrl,
  running: tinypalsRunningAssetUrl,
  review: tinypalsReviewAssetUrl
} satisfies PetAssetFileMap;

const tinypalsTestAssetFiles = {
  idle: tinypalsTestIdleAssetUrl,
  "running-right": tinypalsTestRunningRightAssetUrl,
  "running-left": tinypalsTestRunningLeftAssetUrl,
  waving: tinypalsTestWavingAssetUrl,
  jumping: tinypalsTestJumpingAssetUrl,
  failed: tinypalsTestFailedAssetUrl,
  waiting: tinypalsTestWaitingAssetUrl,
  running: tinypalsTestRunningAssetUrl,
  review: tinypalsTestReviewAssetUrl
} satisfies PetAssetFileMap;

const artistPenguinAssetFiles = {
  idle: artistPenguinIdleAssetUrl,
  "running-right": artistPenguinRunningRightAssetUrl,
  "running-left": artistPenguinRunningLeftAssetUrl,
  waving: artistPenguinWavingAssetUrl,
  jumping: artistPenguinJumpingAssetUrl,
  failed: artistPenguinFailedAssetUrl,
  waiting: artistPenguinWaitingAssetUrl,
  running: artistPenguinRunningAssetUrl,
  review: artistPenguinReviewAssetUrl
} satisfies PetAssetFileMap;

const cleanerPenguinAssetFiles = {
  idle: cleanerPenguinIdleAssetUrl,
  "running-right": cleanerPenguinRunningRightAssetUrl,
  "running-left": cleanerPenguinRunningLeftAssetUrl,
  waving: cleanerPenguinWavingAssetUrl,
  jumping: cleanerPenguinJumpingAssetUrl,
  failed: cleanerPenguinFailedAssetUrl,
  waiting: cleanerPenguinWaitingAssetUrl,
  running: cleanerPenguinRunningAssetUrl,
  review: cleanerPenguinReviewAssetUrl
} satisfies PetAssetFileMap;

export const petAssetPacks = [
  createPetAssetPack(tinypalsManifestData as PetAssetManifest, tinypalsAssetFiles),
  createPetAssetPack(
    artistPenguinManifestData as PetAssetManifest,
    artistPenguinAssetFiles
  ),
  createPetAssetPack(
    cleanerPenguinManifestData as PetAssetManifest,
    cleanerPenguinAssetFiles
  ),
  createPetAssetPack(
    tinypalsTestManifestData as PetAssetManifest,
    tinypalsTestAssetFiles
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

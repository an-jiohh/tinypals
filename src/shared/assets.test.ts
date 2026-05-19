import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import tinypalsManifestData from "../renderer/assets/tinypals/pet.json";
import { getAssetForMood, PET_ASSET_STATES, validateAssetManifest } from "./assets";
import type { PetAssetManifest } from "./petTypes";

const completeManifest: PetAssetManifest = {
  id: "dough-penguin",
  displayName: "Dough Penguin",
  description: "A stop-motion clay penguin baker pet.",
  license: "custom",
  frame: {
    width: 96,
    height: 104
  },
  states: {
    idle: { file: "/assets/tinypals/tinypals_idle.png", frameCount: 6, fps: 6, loop: true },
    "running-right": { file: "/assets/tinypals/tinypals_running_right.png", frameCount: 8, fps: 10, loop: true },
    "running-left": { file: "/assets/tinypals/tinypals_running_left.png", frameCount: 8, fps: 10, loop: true },
    waving: { file: "/assets/tinypals/tinypals_waving.png", frameCount: 4, fps: 8, loop: false },
    jumping: { file: "/assets/tinypals/tinypals_jumping.png", frameCount: 5, fps: 10, loop: false },
    failed: { file: "/assets/tinypals/tinypals_failed.png", frameCount: 8, fps: 8, loop: false },
    waiting: { file: "/assets/tinypals/tinypals_waiting.png", frameCount: 6, fps: 6, loop: true },
    running: { file: "/assets/tinypals/tinypals_running.png", frameCount: 6, fps: 8, loop: true },
    review: { file: "/assets/tinypals/tinypals_review.png", frameCount: 6, fps: 6, loop: true }
  }
};

function readPngSize(file: string): { width: number; height: number } {
  const data = readFileSync(new URL(`../renderer/assets/tinypals/${file}`, import.meta.url));

  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  };
}

describe("PET_ASSET_STATES", () => {
  it("lists every supported pet asset state in runtime order", () => {
    expect(PET_ASSET_STATES).toEqual([
      "idle",
      "running-right",
      "running-left",
      "waving",
      "jumping",
      "failed",
      "waiting",
      "running",
      "review"
    ]);
  });
});

describe("validateAssetManifest", () => {
  it("returns no errors for a complete manifest", () => {
    expect(validateAssetManifest(completeManifest)).toEqual([]);
  });

  it("reports missing paths for missing and blank state entries", () => {
    const manifest: PetAssetManifest = {
      ...completeManifest,
      states: {
        ...completeManifest.states,
        waving: { ...completeManifest.states.waving, file: "" },
        failed: { ...completeManifest.states.failed, file: "   " }
      }
    };
    delete (manifest.states as Partial<PetAssetManifest["states"]>).waiting;

    expect(validateAssetManifest(manifest)).toEqual([
      "Missing asset file for state: waving",
      "Missing asset file for state: failed",
      "Missing asset for state: waiting"
    ]);
  });

  it("reports invalid frame metadata", () => {
    const manifest: PetAssetManifest = {
      ...completeManifest,
      frame: {
        width: 0,
        height: 104
      },
      states: {
        ...completeManifest.states,
        jumping: { ...completeManifest.states.jumping, frameCount: 0 },
        running: { ...completeManifest.states.running, fps: 0 }
      }
    };

    expect(validateAssetManifest(manifest)).toEqual([
      "Invalid frame width",
      "Invalid frame count for state: jumping",
      "Invalid fps for state: running"
    ]);
  });
});

describe("tinypals pet manifest", () => {
  it("records the hatch-pet atlas source used to derive row sprites", () => {
    const manifest = tinypalsManifestData as unknown as {
      source?: {
        type: string;
        atlasFile: string;
        cell: { width: number; height: number };
        outputScale: number;
      };
    };

    expect(manifest.source).toEqual({
      type: "hatch-pet-atlas",
      atlasFile: "spritesheet-2x.png",
      cell: { width: 384, height: 416 },
      outputScale: 1
    });
  });

  it("keeps renderer row sprites at the 2x atlas raster resolution", () => {
    const manifest = tinypalsManifestData as PetAssetManifest;

    for (const state of PET_ASSET_STATES) {
      const asset = manifest.states[state];

      expect(readPngSize(asset.file)).toEqual({
        width: 384 * asset.frameCount,
        height: 416
      });
    }
  });
});

describe("getAssetForMood", () => {
  it("returns the requested mood asset when present", () => {
    expect(getAssetForMood(completeManifest, "jumping")).toEqual({
      state: "jumping",
      file: "/assets/tinypals/tinypals_jumping.png",
      frameCount: 5,
      fps: 10,
      loop: false,
      frameWidth: 96,
      frameHeight: 104
    });
  });

  it("falls back to idle when the requested mood asset is missing", () => {
    const manifest: PetAssetManifest = {
      ...completeManifest,
      states: {
        ...completeManifest.states,
        review: { ...completeManifest.states.review, file: "" }
      }
    };

    expect(getAssetForMood(manifest, "review")).toEqual({
      state: "idle",
      file: "/assets/tinypals/tinypals_idle.png",
      frameCount: 6,
      fps: 6,
      loop: true,
      frameWidth: 96,
      frameHeight: 104
    });
  });
});

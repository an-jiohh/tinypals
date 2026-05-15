import { describe, expect, it } from "vitest";
import { getAssetForMood, PET_ASSET_STATES, validateAssetManifest } from "./assets";
import type { PetAssetManifest } from "./petTypes";

const completeManifest: PetAssetManifest = {
  id: "placeholder-pingu",
  displayName: "Placeholder Pingu",
  license: "placeholder",
  states: {
    idle: "/assets/pingu/idle.svg",
    greet: "/assets/pingu/greet.svg",
    dragging: "/assets/pingu/dragging.svg",
    sleepy: "/assets/pingu/sleepy.svg",
    happy: "/assets/pingu/happy.svg",
    attention: "/assets/pingu/attention.svg"
  }
};

describe("PET_ASSET_STATES", () => {
  it("lists every supported pet asset state in runtime order", () => {
    expect(PET_ASSET_STATES).toEqual(["idle", "greet", "dragging", "sleepy", "happy", "attention"]);
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
        greet: "",
        dragging: "   "
      }
    };
    delete (manifest.states as Partial<PetAssetManifest["states"]>).sleepy;

    expect(validateAssetManifest(manifest)).toEqual([
      "Missing asset for state: greet",
      "Missing asset for state: dragging",
      "Missing asset for state: sleepy"
    ]);
  });
});

describe("getAssetForMood", () => {
  it("returns the requested mood asset when present", () => {
    expect(getAssetForMood(completeManifest, "happy")).toBe("/assets/pingu/happy.svg");
  });

  it("falls back to idle when the requested mood asset is missing", () => {
    const manifest: PetAssetManifest = {
      ...completeManifest,
      states: {
        ...completeManifest.states,
        happy: ""
      }
    };

    expect(getAssetForMood(manifest, "happy")).toBe("/assets/pingu/idle.svg");
  });
});

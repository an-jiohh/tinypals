import { describe, expect, it } from "vitest";
import { PET_ASSET_STATES, validateAssetManifest } from "../../shared/assets";
import {
  DEFAULT_PET_ASSET_PACK_ID,
  PET_ASSET_PACK_OPTIONS,
  getPetAssetPack,
  petAssetPacks
} from "./petAssetRegistry";

describe("petAssetRegistry", () => {
  it("exposes registered asset packs for settings", () => {
    expect(DEFAULT_PET_ASSET_PACK_ID).toBe("dough-penguin");
    expect(PET_ASSET_PACK_OPTIONS).toEqual([
      { id: "dough-penguin", displayName: "Dough Penguin" },
      { id: "artist-penguin", displayName: "Artist Penguin" },
      { id: "cleaner-penguin", displayName: "Cleaner Penguin" },
      { id: "dough-penguin-test", displayName: "Dough Penguin Test" }
    ]);
  });

  it("falls back to the default asset pack for unknown ids", () => {
    expect(getPetAssetPack("missing-pack").manifest.id).toBe("dough-penguin");
  });

  it("builds valid manifests for every registered asset pack", () => {
    for (const pack of petAssetPacks) {
      expect(validateAssetManifest(pack.manifest)).toEqual([]);
      expect(Object.keys(pack.manifest.states)).toEqual([...PET_ASSET_STATES]);
    }
  });
});

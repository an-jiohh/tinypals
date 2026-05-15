import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSettingsStore } from "./settingsStore";
import type { DisplayBounds } from "../shared/types";

const display: DisplayBounds = { x: 0, y: 0, width: 1280, height: 720 };
let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("settingsStore", () => {
  it("loads defaults when no settings file exists", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    await expect(store.load()).resolves.toMatchObject({
      windowBounds: { x: 24, y: 24, width: 96, height: 96 },
      alwaysOnTop: true
    });
  });

  it("persists merged settings", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    await store.save({ alwaysOnTop: false });
    const raw = JSON.parse(await readFile(join(tempDir, "settings.json"), "utf8"));

    expect(raw.alwaysOnTop).toBe(false);
    await expect(store.load()).resolves.toMatchObject({ alwaysOnTop: false });
  });

  it("recovers from invalid json", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    await writeFile(join(tempDir, "settings.json"), "{bad json", "utf8");
    const store = createSettingsStore(tempDir, () => display);

    await expect(store.load()).resolves.toMatchObject({
      selectedAssetPack: "temporary-pingu"
    });
  });
});

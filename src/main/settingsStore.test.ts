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

  it("preserves existing persisted fields when saving a later patch", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    await store.save({ selectedAssetPack: "custom-pack" });
    await store.save({ alwaysOnTop: false });

    await expect(store.load()).resolves.toMatchObject({
      selectedAssetPack: "custom-pack",
      alwaysOnTop: false
    });
  });

  it("normalizes patched off-screen window bounds before saving", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);
    const safeBounds = { x: 24, y: 24, width: 96, height: 96 };

    const saved = await store.save({
      windowBounds: { x: 5000, y: 5000, width: 20, height: 500 }
    });
    const raw = JSON.parse(await readFile(join(tempDir, "settings.json"), "utf8"));

    expect(saved.windowBounds).toEqual(safeBounds);
    expect(raw.windowBounds).toEqual(safeBounds);
  });

  it("persists a pre-normalized settings window size without changing position", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    const saved = await store.saveWindowBounds({
      x: 40,
      y: 60,
      width: 220,
      height: 220
    });

    expect(saved.windowBounds).toEqual({ x: 40, y: 60, width: 220, height: 220 });
  });

  it("minimally clamps runtime window bounds before persisting", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    const saved = await store.saveWindowBounds({
      x: 1240,
      y: 700,
      width: 96,
      height: 96
    });
    const raw = JSON.parse(await readFile(join(tempDir, "settings.json"), "utf8"));

    expect(saved.windowBounds).toEqual({
      x: 1184,
      y: 624,
      width: 96,
      height: 96
    });
    expect(raw.windowBounds).toEqual({ x: 1184, y: 624, width: 96, height: 96 });
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

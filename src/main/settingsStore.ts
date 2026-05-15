import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeSettings } from "../shared/settings";
import type { AppSettings, DisplayBounds } from "../shared/types";

export type SettingsStore = {
  load(): Promise<AppSettings>;
  save(patch: Partial<AppSettings>): Promise<AppSettings>;
};

export function createSettingsStore(
  userDataPath: string,
  getPrimaryDisplayBounds: () => DisplayBounds
): SettingsStore {
  const filePath = join(userDataPath, "settings.json");

  async function readPersisted(): Promise<Partial<AppSettings> | undefined> {
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as Partial<AppSettings>;
    } catch {
      return undefined;
    }
  }

  async function load(): Promise<AppSettings> {
    return normalizeSettings(await readPersisted(), getPrimaryDisplayBounds());
  }

  async function save(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await load();
    const next = normalizeSettings({ ...current, ...patch }, getPrimaryDisplayBounds());
    await mkdir(userDataPath, { recursive: true });
    await writeFile(filePath, JSON.stringify(next, null, 2), "utf8");
    return next;
  }

  return { load, save };
}

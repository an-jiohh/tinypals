import { describe, expect, it } from "vitest";
import { resolveElectronAutoUpdater } from "./electronUpdaterClient";

describe("electronUpdaterClient", () => {
  it("reads autoUpdater from a CommonJS-compatible default import shape", () => {
    const fakeUpdater = {
      autoDownload: true,
      checkForUpdates: () => Promise.resolve(null),
      downloadUpdate: () => Promise.resolve([]),
      quitAndInstall: () => {}
    };

    const updater = resolveElectronAutoUpdater({
      autoUpdater: fakeUpdater
    });

    expect(updater).toBe(fakeUpdater);
  });

  it("fails clearly when the package shape changes", () => {
    expect(() => resolveElectronAutoUpdater({})).toThrow(
      "electron-updater autoUpdater export is missing"
    );
  });
});

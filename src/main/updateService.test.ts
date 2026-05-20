import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import {
  createUpdateService,
  type UpdateServiceUpdater
} from "./updateService";

class FakeUpdater extends EventEmitter implements UpdateServiceUpdater {
  autoDownload = true;
  allowPrerelease = true;
  checkCalls = 0;
  downloadCalls = 0;
  installCalls = 0;
  checkResult: Promise<unknown | null> = Promise.resolve(null);
  downloadResult: Promise<string[]> = Promise.resolve(["/tmp/update"]);

  async checkForUpdates(): Promise<unknown | null> {
    this.checkCalls += 1;
    return this.checkResult;
  }

  async downloadUpdate(): Promise<string[]> {
    this.downloadCalls += 1;
    return this.downloadResult;
  }

  quitAndInstall(): void {
    this.installCalls += 1;
  }
}

function createService(isPackaged: boolean, updater = new FakeUpdater()) {
  return {
    service: createUpdateService({
      app: {
        getVersion: () => "0.1.0",
        isPackaged
      },
      updater
    }),
    updater
  };
}

describe("updateService", () => {
  it("keeps update checks disabled in development builds", async () => {
    const { service, updater } = createService(false);

    const status = await service.checkForUpdates();

    expect(status.state).toBe("disabled-development");
    expect(status.currentVersion).toBe("0.1.0");
    expect(updater.checkCalls).toBe(0);
    expect(updater.autoDownload).toBe(false);
    expect(updater.allowPrerelease).toBe(false);
  });

  it("coalesces duplicate update checks while a check is in progress", async () => {
    const { service, updater } = createService(true);
    let resolveCheck: (value: null) => void = () => {};
    updater.checkResult = new Promise((resolve) => {
      resolveCheck = resolve;
    });

    const first = service.checkForUpdates();
    const second = service.checkForUpdates();

    expect(updater.checkCalls).toBe(1);
    expect(service.getStatus().state).toBe("checking");

    resolveCheck(null);
    const statuses = await Promise.all([first, second]);

    expect(statuses.map((status) => status.state)).toEqual([
      "not-available",
      "not-available"
    ]);
  });

  it("maps updater events into public update statuses", () => {
    const { service, updater } = createService(true);
    const listener = vi.fn();
    service.onStatusChanged(listener);

    updater.emit("update-available", {
      version: "0.2.0",
      releaseDate: "2026-05-20T00:00:00.000Z"
    });
    expect(service.getStatus()).toMatchObject({
      state: "available",
      currentVersion: "0.1.0",
      latestVersion: "0.2.0"
    });

    updater.emit("download-progress", {
      percent: 42.25,
      transferred: 4225,
      total: 10000
    });
    expect(service.getStatus()).toMatchObject({
      state: "downloading",
      percent: 42.25
    });

    updater.emit("update-downloaded", {
      version: "0.2.0"
    });
    expect(service.getStatus()).toMatchObject({
      state: "downloaded",
      latestVersion: "0.2.0"
    });

    updater.emit("error", new Error("network unavailable"));
    expect(service.getStatus()).toMatchObject({
      state: "error",
      message: "network unavailable"
    });
    expect(listener).toHaveBeenCalled();
  });

  it("only installs after an update has been downloaded", async () => {
    const { service, updater } = createService(true);

    await service.installUpdate();
    expect(updater.installCalls).toBe(0);

    updater.emit("update-downloaded", {
      version: "0.2.0"
    });
    await service.installUpdate();

    expect(updater.installCalls).toBe(1);
  });
});

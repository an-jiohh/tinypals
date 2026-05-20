import type { UpdateStatus } from "../shared/types";

type UpdateInfoLike = {
  releaseDate?: string;
  version?: string;
};

type ProgressInfoLike = {
  percent?: number;
};

export type UpdateServiceUpdater = {
  allowPrerelease: boolean;
  autoDownload: boolean;
  checkForUpdates(): Promise<unknown | null>;
  downloadUpdate(): Promise<string[]>;
  on(event: "checking-for-update", listener: () => void): UpdateServiceUpdater;
  on(
    event: "update-not-available",
    listener: (info: UpdateInfoLike) => void
  ): UpdateServiceUpdater;
  on(
    event: "update-available",
    listener: (info: UpdateInfoLike) => void
  ): UpdateServiceUpdater;
  on(
    event: "download-progress",
    listener: (info: ProgressInfoLike) => void
  ): UpdateServiceUpdater;
  on(
    event: "update-downloaded",
    listener: (info: UpdateInfoLike) => void
  ): UpdateServiceUpdater;
  on(
    event: "error",
    listener: (error: Error, message?: string) => void
  ): UpdateServiceUpdater;
  quitAndInstall(): void;
};

type UpdateServiceApp = {
  getVersion(): string;
  isPackaged: boolean;
};

type CreateUpdateServiceOptions = {
  app: UpdateServiceApp;
  captureException?: (error: Error) => void;
  updater: UpdateServiceUpdater;
};

export type UpdateService = {
  checkForUpdates(): Promise<UpdateStatus>;
  downloadUpdate(): Promise<UpdateStatus>;
  getStatus(): UpdateStatus;
  installUpdate(): Promise<void>;
  onStatusChanged(listener: (status: UpdateStatus) => void): () => void;
};

function readVersion(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof value.version === "string" &&
    value.version.trim()
  ) {
    return value.version;
  }

  return undefined;
}

function readReleaseDate(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "releaseDate" in value &&
    typeof value.releaseDate === "string" &&
    value.releaseDate.trim()
  ) {
    return value.releaseDate;
  }

  return undefined;
}

function readUpdateInfo(value: unknown): UpdateInfoLike | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  if ("updateInfo" in value) {
    return readUpdateInfo(value.updateInfo);
  }

  return {
    releaseDate: readReleaseDate(value),
    version: readVersion(value)
  };
}

function getLatestVersion(status: UpdateStatus): string | undefined {
  return "latestVersion" in status ? status.latestVersion : undefined;
}

function getErrorMessage(error: Error, fallback?: string): string {
  return error.message.trim() || fallback?.trim() || "Update failed";
}

export function createUpdateService({
  app,
  captureException,
  updater
}: CreateUpdateServiceOptions): UpdateService {
  updater.autoDownload = false;
  updater.allowPrerelease = false;

  const listeners = new Set<(status: UpdateStatus) => void>();
  const currentVersion = app.getVersion();
  let status: UpdateStatus = {
    currentVersion,
    state: "idle"
  };
  let checkPromise: Promise<UpdateStatus> | undefined;
  let downloadPromise: Promise<UpdateStatus> | undefined;

  function setStatus(nextStatus: UpdateStatus): UpdateStatus {
    status = nextStatus;
    for (const listener of listeners) {
      listener(status);
    }
    return status;
  }

  function setDevelopmentDisabled(): UpdateStatus {
    return setStatus({
      currentVersion,
      state: "disabled-development"
    });
  }

  function setError(error: Error, message?: string): UpdateStatus {
    captureException?.(error);
    return setStatus({
      currentVersion,
      message: getErrorMessage(error, message),
      state: "error"
    });
  }

  updater.on("checking-for-update", () => {
    setStatus({
      currentVersion,
      state: "checking"
    });
  });

  updater.on("update-not-available", (info) => {
    setStatus({
      currentVersion,
      latestVersion: info.version,
      state: "not-available"
    });
  });

  updater.on("update-available", (info) => {
    setStatus({
      currentVersion,
      latestVersion: info.version ?? currentVersion,
      releaseDate: info.releaseDate,
      state: "available"
    });
  });

  updater.on("download-progress", (info) => {
    setStatus({
      currentVersion,
      latestVersion: getLatestVersion(status),
      percent: info.percent,
      state: "downloading"
    });
  });

  updater.on("update-downloaded", (info) => {
    setStatus({
      currentVersion,
      latestVersion: info.version ?? getLatestVersion(status) ?? currentVersion,
      state: "downloaded"
    });
  });

  updater.on("error", (error, message) => {
    setError(error, message);
  });

  return {
    checkForUpdates: async () => {
      if (!app.isPackaged) {
        return setDevelopmentDisabled();
      }

      if (checkPromise) {
        return checkPromise;
      }

      setStatus({
        currentVersion,
        state: "checking"
      });

      checkPromise = updater
        .checkForUpdates()
        .then((result) => {
          if (status.state === "checking") {
            const info = readUpdateInfo(result);
            return setStatus({
              currentVersion,
              latestVersion: info?.version,
              state: "not-available"
            });
          }

          return status;
        })
        .catch((error: Error) => setError(error))
        .finally(() => {
          checkPromise = undefined;
        });

      return checkPromise;
    },
    downloadUpdate: async () => {
      if (!app.isPackaged) {
        return setDevelopmentDisabled();
      }

      if (status.state === "downloaded") {
        return status;
      }

      if (downloadPromise) {
        return downloadPromise;
      }

      const latestVersion = getLatestVersion(status);
      setStatus({
        currentVersion,
        latestVersion,
        state: "downloading"
      });

      downloadPromise = updater
        .downloadUpdate()
        .then(() => {
          if (status.state === "downloading" && latestVersion) {
            return setStatus({
              currentVersion,
              latestVersion,
              state: "downloaded"
            });
          }

          return status;
        })
        .catch((error: Error) => setError(error))
        .finally(() => {
          downloadPromise = undefined;
        });

      return downloadPromise;
    },
    getStatus: () => status,
    installUpdate: async () => {
      if (status.state !== "downloaded") {
        return;
      }

      updater.quitAndInstall();
    },
    onStatusChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

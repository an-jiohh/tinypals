export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DisplayBounds = WindowBounds;

export type WindowSize = {
  width: number;
  height: number;
};

export type AppSettings = {
  windowBounds: WindowBounds;
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  selectedAssetPack: string;
};

export type AppInfo = {
  name: string;
  version: string;
  platform: NodeJS.Platform;
};

export type UpdateStatus =
  | {
      state: "idle";
      currentVersion: string;
    }
  | {
      state: "disabled-development";
      currentVersion: string;
    }
  | {
      state: "checking";
      currentVersion: string;
    }
  | {
      state: "not-available";
      currentVersion: string;
      latestVersion?: string;
    }
  | {
      state: "available";
      currentVersion: string;
      latestVersion: string;
      releaseDate?: string;
    }
  | {
      state: "downloading";
      currentVersion: string;
      latestVersion?: string;
      percent?: number;
    }
  | {
      state: "downloaded";
      currentVersion: string;
      latestVersion: string;
    }
  | {
      state: "error";
      currentVersion: string;
      message: string;
    };

export type TinyPalsDesktopApi = {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  onSettingsChanged(listener: (settings: AppSettings) => void): () => void;
  openSettingsWindow(): Promise<void>;
  showTinyPals(): Promise<void>;
  moveWindowToBottomRight(): Promise<AppSettings>;
  moveWindowBy(delta: { x: number; y: number }): Promise<AppSettings>;
  resizeWindowTo(size: WindowSize): Promise<AppSettings>;
  setAlwaysOnTop(enabled: boolean): Promise<AppSettings>;
  quit(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
  getUpdateStatus(): Promise<UpdateStatus>;
  checkForUpdates(): Promise<UpdateStatus>;
  downloadUpdate(): Promise<UpdateStatus>;
  installUpdate(): Promise<void>;
  onUpdateStatusChanged(listener: (status: UpdateStatus) => void): () => void;
};

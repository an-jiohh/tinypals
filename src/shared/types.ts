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

export type PinguDesktopApi = {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  onSettingsChanged(listener: (settings: AppSettings) => void): () => void;
  openSettingsWindow(): Promise<void>;
  showPingu(): Promise<void>;
  moveWindowToBottomRight(): Promise<AppSettings>;
  moveWindowBy(delta: { x: number; y: number }): Promise<AppSettings>;
  resizeWindowTo(size: WindowSize): Promise<AppSettings>;
  setAlwaysOnTop(enabled: boolean): Promise<AppSettings>;
  quit(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
};

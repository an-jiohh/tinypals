export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DisplayBounds = WindowBounds;

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
  resetWindowPosition(): Promise<AppSettings>;
  moveWindowBy(delta: { x: number; y: number }): Promise<AppSettings>;
  resizeWindow(size: { width: number; height: number }): Promise<AppSettings>;
  setAlwaysOnTop(enabled: boolean): Promise<AppSettings>;
  quit(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
};

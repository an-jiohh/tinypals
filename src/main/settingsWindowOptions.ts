import type { BrowserWindowConstructorOptions } from "electron";

export const SETTINGS_WINDOW_WIDTH = 420;
export const SETTINGS_WINDOW_HEIGHT = 420;
export const SETTINGS_WINDOW_BACKGROUND = "#00000000";

export function createSettingsWindowOptions(
  preloadPath: string
): BrowserWindowConstructorOptions {
  return {
    width: SETTINGS_WINDOW_WIDTH,
    height: SETTINGS_WINDOW_HEIGHT,
    minWidth: SETTINGS_WINDOW_WIDTH,
    minHeight: SETTINGS_WINDOW_HEIGHT,
    maxWidth: SETTINGS_WINDOW_WIDTH,
    maxHeight: SETTINGS_WINDOW_HEIGHT,
    frame: false,
    transparent: true,
    roundedCorners: false,
    resizable: false,
    movable: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: SETTINGS_WINDOW_BACKGROUND,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };
}

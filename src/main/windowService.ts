import {
  BrowserWindow,
  screen,
  type BrowserWindowConstructorOptions
} from "electron";
import { join } from "node:path";
import {
  PET_WINDOW_DEFAULT_HEIGHT,
  PET_WINDOW_DEFAULT_WIDTH,
  PET_WINDOW_MAX_HEIGHT,
  PET_WINDOW_MAX_WIDTH,
  PET_WINDOW_MIN_HEIGHT,
  PET_WINDOW_MIN_WIDTH
} from "../shared/settings";
import type { AppSettings, DisplayBounds, WindowBounds } from "../shared/types";
import { TINYPALS_RUNTIME_SESSION_PARTITION } from "./windowSession";

export function getPrimaryDisplayBounds(): DisplayBounds {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  return { x, y, width, height };
}

export function createPetWindowOptions(
  settings: AppSettings,
  preloadPath = join(__dirname, "../preload/index.mjs")
): BrowserWindowConstructorOptions {
  return {
    x: settings.windowBounds.x,
    y: settings.windowBounds.y,
    width: settings.windowBounds.width,
    height: settings.windowBounds.height,
    minWidth: PET_WINDOW_MIN_WIDTH,
    minHeight: PET_WINDOW_MIN_HEIGHT,
    maxWidth: PET_WINDOW_MAX_WIDTH,
    maxHeight: PET_WINDOW_MAX_HEIGHT,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    hasShadow: false,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: preloadPath,
      partition: TINYPALS_RUNTIME_SESSION_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };
}

export function createPetWindow(settings: AppSettings): BrowserWindow {
  const petWindow = new BrowserWindow(createPetWindowOptions(settings));

  petWindow.setAlwaysOnTop(settings.alwaysOnTop, "floating");
  petWindow.setAspectRatio(PET_WINDOW_DEFAULT_WIDTH / PET_WINDOW_DEFAULT_HEIGHT);
  return petWindow;
}

export function getWindowBounds(petWindow: BrowserWindow): WindowBounds {
  const { x, y, width, height } = petWindow.getBounds();
  return { x, y, width, height };
}

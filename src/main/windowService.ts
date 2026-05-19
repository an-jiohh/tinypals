import { BrowserWindow, screen } from "electron";
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

export function getPrimaryDisplayBounds(): DisplayBounds {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  return { x, y, width, height };
}

export function createPetWindow(settings: AppSettings): BrowserWindow {
  const petWindow = new BrowserWindow({
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
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  petWindow.setAlwaysOnTop(settings.alwaysOnTop, "floating");
  petWindow.setAspectRatio(PET_WINDOW_DEFAULT_WIDTH / PET_WINDOW_DEFAULT_HEIGHT);
  return petWindow;
}

export function getWindowBounds(petWindow: BrowserWindow): WindowBounds {
  const { x, y, width, height } = petWindow.getBounds();
  return { x, y, width, height };
}

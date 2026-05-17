import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import { PET_WINDOW_DEFAULT_SIZE } from "../shared/settings";
import type { AppSettings, DisplayBounds, WindowBounds } from "../shared/types";

export function getPrimaryDisplayBounds(): DisplayBounds {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  return { x, y, width, height };
}

export function createPetWindow(settings: AppSettings): BrowserWindow {
  const petWindow = new BrowserWindow({
    x: settings.windowBounds.x,
    y: settings.windowBounds.y,
    width: PET_WINDOW_DEFAULT_SIZE,
    height: PET_WINDOW_DEFAULT_SIZE,
    minWidth: PET_WINDOW_DEFAULT_SIZE,
    minHeight: PET_WINDOW_DEFAULT_SIZE,
    maxWidth: PET_WINDOW_DEFAULT_SIZE,
    maxHeight: PET_WINDOW_DEFAULT_SIZE,
    frame: false,
    transparent: true,
    resizable: false,
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
  return petWindow;
}

export function getWindowBounds(petWindow: BrowserWindow): WindowBounds {
  const { x, y, width, height } = petWindow.getBounds();
  return { x, y, width, height };
}

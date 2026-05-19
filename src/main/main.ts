import { app, BrowserWindow, Tray, ipcMain } from "electron";
import { join } from "node:path";
import { APP_DISPLAY_NAME } from "../shared/appIdentity";
import {
  getBottomRightWindowBounds,
  getDefaultWindowBounds
} from "../shared/settings";
import type {
  AppInfo,
  AppSettings,
  WindowBounds,
  WindowSize
} from "../shared/types";
import { createSettingsStore } from "./settingsStore";
import { createSettingsWindowOptions } from "./settingsWindowOptions";
import { createTray, installApplicationMenu } from "./trayService";
import {
  createPetWindow,
  getPrimaryDisplayBounds,
  getWindowBounds
} from "./windowService";
import {
  createProgrammaticBoundsSuppressor,
  getRuntimeWindowBounds
} from "./windowResize";

type WindowMoveDelta = {
  x: number;
  y: number;
};

let petWindow: BrowserWindow | undefined;
let settingsWindow: BrowserWindow | undefined;
let tray: Tray | undefined;

app.setName(APP_DISPLAY_NAME);

if (process.env.PINGU_USER_DATA_DIR) {
  app.setPath("userData", process.env.PINGU_USER_DATA_DIR);
}

const store = createSettingsStore(app.getPath("userData"), getPrimaryDisplayBounds);
const programmaticBoundsSuppressor = createProgrammaticBoundsSuppressor();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFiniteNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${fieldName} must be a finite number`);
  }

  return value;
}

function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${fieldName} must be a boolean`);
  }

  return value;
}

function readSettingsPatch(value: unknown): Partial<AppSettings> {
  if (!isRecord(value)) {
    throw new TypeError("settings patch must be an object");
  }

  const patch: Partial<AppSettings> = {};

  if ("alwaysOnTop" in value) {
    patch.alwaysOnTop = readBoolean(value.alwaysOnTop, "alwaysOnTop");
  }

  if ("launchAtLogin" in value) {
    patch.launchAtLogin = readBoolean(value.launchAtLogin, "launchAtLogin");
  }

  if ("selectedAssetPack" in value) {
    if (typeof value.selectedAssetPack !== "string") {
      throw new TypeError("selectedAssetPack must be a string");
    }

    patch.selectedAssetPack = value.selectedAssetPack;
  }

  if ("windowBounds" in value) {
    patch.windowBounds = readWindowBounds(value.windowBounds);
  }

  return patch;
}

function readWindowBounds(value: unknown): WindowBounds {
  if (!isRecord(value)) {
    throw new TypeError("windowBounds must be an object");
  }

  return {
    x: Math.round(readFiniteNumber(value.x, "windowBounds.x")),
    y: Math.round(readFiniteNumber(value.y, "windowBounds.y")),
    width: Math.round(readFiniteNumber(value.width, "windowBounds.width")),
    height: Math.round(readFiniteNumber(value.height, "windowBounds.height"))
  };
}

function readMoveDelta(value: unknown): WindowMoveDelta {
  if (!isRecord(value)) {
    throw new TypeError("move delta must be an object");
  }

  return {
    x: Math.round(readFiniteNumber(value.x, "delta.x")),
    y: Math.round(readFiniteNumber(value.y, "delta.y"))
  };
}

function readWindowSize(value: unknown): WindowSize {
  if (!isRecord(value)) {
    throw new TypeError("window size must be an object");
  }

  return {
    width: Math.round(readFiniteNumber(value.width, "size.width")),
    height: Math.round(readFiniteNumber(value.height, "size.height"))
  };
}

async function persistWindowBounds(): Promise<void> {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  await store.saveWindowBounds(getWindowBounds(petWindow));
}

function applyProgrammaticBounds(bounds: WindowBounds): void {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  programmaticBoundsSuppressor.suppressNext(bounds);
  petWindow.setBounds(bounds);
}

async function loadRendererWindow(
  window: BrowserWindow,
  hash?: string
): Promise<void> {
  if (process.env.ELECTRON_RENDERER_URL) {
    const url = new URL(process.env.ELECTRON_RENDERER_URL);
    if (hash) {
      url.hash = hash;
    }
    await window.loadURL(url.toString());
    return;
  }

  await window.loadFile(join(__dirname, "../renderer/index.html"), {
    hash
  });
}

async function createWindow(): Promise<void> {
  const settings = await store.load();
  petWindow = createPetWindow(settings);

  petWindow.on("moved", () => {
    if (
      petWindow &&
      !petWindow.isDestroyed() &&
      programmaticBoundsSuppressor.shouldSuppress(
        "moved",
        getWindowBounds(petWindow)
      )
    ) {
      return;
    }

    void persistWindowBounds();
  });
  petWindow.on("resized", () => {
    if (
      petWindow &&
      !petWindow.isDestroyed() &&
      programmaticBoundsSuppressor.shouldSuppress(
        "resized",
        getWindowBounds(petWindow)
      )
    ) {
      return;
    }

    void persistWindowBounds();
  });
  petWindow.once("ready-to-show", () => {
    petWindow?.show();
  });

  await loadRendererWindow(petWindow);
}

async function showOrCreateWindow(): Promise<void> {
  if (!petWindow || petWindow.isDestroyed()) {
    await createWindow();
    return;
  }

  petWindow.show();
  petWindow.focus();
}

async function showOrCreateSettingsWindow(): Promise<void> {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow(
    createSettingsWindowOptions(join(__dirname, "../preload/index.mjs"))
  );
  settingsWindow.setAlwaysOnTop(true, "floating");
  settingsWindow.once("ready-to-show", () => {
    settingsWindow?.show();
  });
  settingsWindow.on("closed", () => {
    settingsWindow = undefined;
  });

  await loadRendererWindow(settingsWindow, "settings");
}

async function movePetWindowToBottomRight(): Promise<AppSettings> {
  const display = getPrimaryDisplayBounds();
  const currentSettings = await store.load();
  const currentBounds =
    petWindow && !petWindow.isDestroyed()
      ? getWindowBounds(petWindow)
      : currentSettings.windowBounds;
  const bottomRightBounds = getBottomRightWindowBounds(display, currentBounds);
  const settings = await store.saveWindowBounds(bottomRightBounds);
  applyProgrammaticBounds(settings.windowBounds);
  return settings;
}

async function resizePetWindowTo(size: WindowSize): Promise<AppSettings> {
  if (!petWindow || petWindow.isDestroyed()) {
    return store.load();
  }

  const current = petWindow.getBounds();
  const nextBounds = getRuntimeWindowBounds(
    {
      ...current,
      width: size.width,
      height: size.height
    },
    getPrimaryDisplayBounds()
  );
  applyProgrammaticBounds(nextBounds);
  return store.saveWindowBounds(nextBounds);
}

async function saveSettingsPatch(patch: Partial<AppSettings>): Promise<AppSettings> {
  const settings = await store.save(patch);
  petWindow?.setAlwaysOnTop(settings.alwaysOnTop, "floating");
  petWindow?.webContents.send("settings:changed", settings);
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
  return settings;
}

function registerIpc(): void {
  ipcMain.handle("settings:get", () => store.load());

  ipcMain.handle("settings:update", (_event, patch: unknown) =>
    saveSettingsPatch(readSettingsPatch(patch))
  );

  ipcMain.handle("settings:open-window", () => showOrCreateSettingsWindow());

  ipcMain.handle("window:show-pingu", () => showOrCreateWindow());

  ipcMain.handle("window:move-to-bottom-right", () =>
    movePetWindowToBottomRight()
  );

  ipcMain.handle("window:move-by", async (_event, rawDelta: unknown) => {
    const delta = readMoveDelta(rawDelta);

    if (!petWindow || petWindow.isDestroyed()) {
      return store.load();
    }

    const current = petWindow.getBounds();
    petWindow.setPosition(current.x + delta.x, current.y + delta.y);
    return store.saveWindowBounds(getWindowBounds(petWindow));
  });

  ipcMain.handle("window:resize-to", (_event, rawSize: unknown) =>
    resizePetWindowTo(readWindowSize(rawSize))
  );

  ipcMain.handle("window:set-always-on-top", (_event, enabled: unknown) =>
    saveSettingsPatch({ alwaysOnTop: readBoolean(enabled, "enabled") })
  );

  ipcMain.handle("app:quit", () => {
    app.quit();
  });

  ipcMain.handle("app:info", (): AppInfo => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform
    };
  });
}

app.on("window-all-closed", () => {
  // Keep the tray and IPC process alive until the user explicitly quits.
});

app.on("activate", () => {
  void showOrCreateWindow();
});

void app.whenReady().then(async () => {
  registerIpc();
  await createWindow();
  const menuActions = {
    onOpenSettings: () => {
      void showOrCreateSettingsWindow();
    },
    onShowPingu: () => {
      void showOrCreateWindow();
    }
  };
  installApplicationMenu(menuActions);
  tray = createTray(menuActions);

  const settings = await store.load();
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
});

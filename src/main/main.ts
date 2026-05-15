import { app, BrowserWindow, Tray, ipcMain } from "electron";
import { join } from "node:path";
import { getDefaultWindowBounds } from "../shared/settings";
import type { AppInfo, AppSettings, WindowBounds } from "../shared/types";
import { createSettingsStore } from "./settingsStore";
import { createTray } from "./trayService";
import {
  createPetWindow,
  getPrimaryDisplayBounds,
  getWindowBounds
} from "./windowService";

type WindowMoveDelta = {
  x: number;
  y: number;
};

let petWindow: BrowserWindow | undefined;
let tray: Tray | undefined;

const store = createSettingsStore(app.getPath("userData"), getPrimaryDisplayBounds);

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

async function persistWindowBounds(): Promise<void> {
  if (!petWindow || petWindow.isDestroyed()) {
    return;
  }

  await store.save({ windowBounds: getWindowBounds(petWindow) });
}

async function createWindow(): Promise<void> {
  const settings = await store.load();
  petWindow = createPetWindow(settings);

  petWindow.on("moved", () => {
    void persistWindowBounds();
  });
  petWindow.on("resized", () => {
    void persistWindowBounds();
  });
  petWindow.once("ready-to-show", () => {
    petWindow?.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await petWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await petWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

async function showOrCreateWindow(): Promise<void> {
  if (!petWindow || petWindow.isDestroyed()) {
    await createWindow();
    return;
  }

  petWindow.show();
  petWindow.focus();
}

async function saveSettingsPatch(patch: Partial<AppSettings>): Promise<AppSettings> {
  const settings = await store.save(patch);
  petWindow?.setAlwaysOnTop(settings.alwaysOnTop, "floating");
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
  return settings;
}

function registerIpc(): void {
  ipcMain.handle("settings:get", () => store.load());

  ipcMain.handle("settings:update", (_event, patch: unknown) =>
    saveSettingsPatch(readSettingsPatch(patch))
  );

  ipcMain.handle("window:reset-position", async () => {
    const current = await store.load();
    const display = getPrimaryDisplayBounds();
    const defaultBounds = getDefaultWindowBounds(display);
    const settings = await store.save({
      windowBounds: {
        ...current.windowBounds,
        x: defaultBounds.x,
        y: defaultBounds.y
      }
    });

    petWindow?.setBounds(settings.windowBounds);
    return settings;
  });

  ipcMain.handle("window:move-by", async (_event, rawDelta: unknown) => {
    const delta = readMoveDelta(rawDelta);

    if (!petWindow || petWindow.isDestroyed()) {
      return store.load();
    }

    const current = petWindow.getBounds();
    petWindow.setPosition(current.x + delta.x, current.y + delta.y);
    return store.save({ windowBounds: getWindowBounds(petWindow) });
  });

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
  tray = createTray(() => {
    void showOrCreateWindow();
  });

  const settings = await store.load();
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
});

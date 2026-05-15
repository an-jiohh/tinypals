import { contextBridge, ipcRenderer } from "electron";
import type { AppInfo, AppSettings, PinguDesktopApi } from "../shared/types";

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api: PinguDesktopApi = {
  getSettings: () => invoke<AppSettings>("settings:get"),
  updateSettings: (patch) => invoke<AppSettings>("settings:update", patch),
  resetWindowPosition: () => invoke<AppSettings>("window:reset-position"),
  moveWindowBy: (delta) => invoke<AppSettings>("window:move-by", delta),
  resizeWindow: (size) => invoke<AppSettings>("window:resize", size),
  setAlwaysOnTop: (enabled) =>
    invoke<AppSettings>("window:set-always-on-top", enabled),
  quit: () => invoke<void>("app:quit"),
  getAppInfo: () => invoke<AppInfo>("app:info")
};

contextBridge.exposeInMainWorld("pinguDesktop", api);

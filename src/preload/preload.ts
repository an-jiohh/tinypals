import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";
import type {
  AppInfo,
  AppSettings,
  TinyPalsDesktopApi,
  UpdateStatus
} from "../shared/types";

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api: TinyPalsDesktopApi = {
  getSettings: () => invoke<AppSettings>("settings:get"),
  updateSettings: (patch) => invoke<AppSettings>("settings:update", patch),
  onSettingsChanged: (listener) => {
    const handler = (_event: IpcRendererEvent, settings: AppSettings) => {
      listener(settings);
    };

    ipcRenderer.on("settings:changed", handler);
    return () => {
      ipcRenderer.removeListener("settings:changed", handler);
    };
  },
  openSettingsWindow: () => invoke<void>("settings:open-window"),
  showTinyPals: () => invoke<void>("window:show-tinypals"),
  moveWindowToBottomRight: () => invoke<AppSettings>("window:move-to-bottom-right"),
  moveWindowBy: (delta) => invoke<AppSettings>("window:move-by", delta),
  resizeWindowTo: (size) => invoke<AppSettings>("window:resize-to", size),
  setAlwaysOnTop: (enabled) =>
    invoke<AppSettings>("window:set-always-on-top", enabled),
  quit: () => invoke<void>("app:quit"),
  getAppInfo: () => invoke<AppInfo>("app:info"),
  getUpdateStatus: () => invoke<UpdateStatus>("update:get-status"),
  checkForUpdates: () => invoke<UpdateStatus>("update:check"),
  downloadUpdate: () => invoke<UpdateStatus>("update:download"),
  installUpdate: () => invoke<void>("update:install"),
  onUpdateStatusChanged: (listener) => {
    const handler = (_event: IpcRendererEvent, status: UpdateStatus) => {
      listener(status);
    };

    ipcRenderer.on("update:status-changed", handler);
    return () => {
      ipcRenderer.removeListener("update:status-changed", handler);
    };
  }
};

contextBridge.exposeInMainWorld("tinyPalsDesktop", api);

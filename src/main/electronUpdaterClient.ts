import electronUpdater from "electron-updater";
import type { UpdateServiceUpdater } from "./updateService";

type ElectronUpdaterPackage = {
  autoUpdater?: unknown;
};

export function resolveElectronAutoUpdater(
  updaterPackage: ElectronUpdaterPackage
): UpdateServiceUpdater {
  if (!updaterPackage.autoUpdater) {
    throw new Error("electron-updater autoUpdater export is missing");
  }

  return updaterPackage.autoUpdater as UpdateServiceUpdater;
}

export function getElectronAutoUpdater(): UpdateServiceUpdater {
  return resolveElectronAutoUpdater(electronUpdater);
}

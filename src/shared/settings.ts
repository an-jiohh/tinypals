import type { AppSettings, DisplayBounds, WindowBounds } from "./types";

export const PET_WINDOW_MIN_SIZE = 72;
export const PET_WINDOW_DEFAULT_SIZE = 96;
export const PET_WINDOW_MAX_SIZE = 180;
export const PET_WINDOW_MARGIN = 24;

export const DEFAULT_SETTINGS: AppSettings = {
  windowBounds: { x: 24, y: 24, width: 96, height: 96 },
  alwaysOnTop: true,
  launchAtLogin: false,
  selectedAssetPack: "temporary-pingu"
};

export function getDefaultWindowBounds(display: DisplayBounds): WindowBounds {
  return {
    x: display.x + PET_WINDOW_MARGIN,
    y: display.y + PET_WINDOW_MARGIN,
    width: PET_WINDOW_DEFAULT_SIZE,
    height: PET_WINDOW_DEFAULT_SIZE
  };
}

export function normalizeWindowBounds(
  bounds: WindowBounds | undefined,
  display: DisplayBounds
): WindowBounds {
  const defaultBounds = getDefaultWindowBounds(display);
  const mergedBounds = {
    ...defaultBounds,
    ...bounds
  };

  const width = clampSize(mergedBounds.width);
  const height = clampSize(mergedBounds.height);
  const normalizedBounds = {
    x: mergedBounds.x,
    y: mergedBounds.y,
    width,
    height
  };

  if (!isWithinDisplay(normalizedBounds, display)) {
    return defaultBounds;
  }

  return normalizedBounds;
}

export function normalizeSettings(
  input: Partial<AppSettings> | undefined,
  display: DisplayBounds
): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    alwaysOnTop: input?.alwaysOnTop ?? DEFAULT_SETTINGS.alwaysOnTop,
    launchAtLogin: input?.launchAtLogin ?? DEFAULT_SETTINGS.launchAtLogin,
    selectedAssetPack: input?.selectedAssetPack ?? DEFAULT_SETTINGS.selectedAssetPack,
    windowBounds: normalizeWindowBounds(input?.windowBounds, display)
  };
}

function clampSize(size: number): number {
  return Math.min(PET_WINDOW_MAX_SIZE, Math.max(PET_WINDOW_MIN_SIZE, size));
}

function isWithinDisplay(bounds: WindowBounds, display: DisplayBounds): boolean {
  return (
    bounds.x >= display.x &&
    bounds.y >= display.y &&
    bounds.x + bounds.width <= display.x + display.width &&
    bounds.y + bounds.height <= display.y + display.height
  );
}

import type { AppSettings, DisplayBounds, WindowBounds } from "./types";

const DEFAULT_MARGIN = 24;
const DEFAULT_WINDOW_SIZE = 96;
const MIN_WINDOW_SIZE = 72;
const MAX_WINDOW_SIZE = 180;

export type SettingsInput = Partial<
  Omit<AppSettings, "windowBounds"> & {
    windowBounds: Partial<WindowBounds>;
  }
>;

export const DEFAULT_SETTINGS: AppSettings = {
  windowBounds: { x: 24, y: 24, width: 96, height: 96 },
  alwaysOnTop: true,
  launchAtLogin: false,
  selectedAssetPack: "temporary-pingu"
};

export function getDefaultWindowBounds(display: DisplayBounds): WindowBounds {
  return {
    x: display.x + DEFAULT_MARGIN,
    y: display.y + DEFAULT_MARGIN,
    width: DEFAULT_WINDOW_SIZE,
    height: DEFAULT_WINDOW_SIZE
  };
}

export function normalizeSettings(input: SettingsInput, display: DisplayBounds): AppSettings {
  const defaultBounds = getDefaultWindowBounds(display);
  const mergedBounds = {
    ...defaultBounds,
    ...input.windowBounds
  };

  const width = clampSize(mergedBounds.width);
  const height = clampSize(mergedBounds.height);
  const bounds = {
    x: mergedBounds.x,
    y: mergedBounds.y,
    width,
    height
  };

  if (!isWithinDisplay(bounds, display)) {
    bounds.x = defaultBounds.x;
    bounds.y = defaultBounds.y;
  }

  return {
    ...DEFAULT_SETTINGS,
    alwaysOnTop: input.alwaysOnTop ?? DEFAULT_SETTINGS.alwaysOnTop,
    launchAtLogin: input.launchAtLogin ?? DEFAULT_SETTINGS.launchAtLogin,
    selectedAssetPack: input.selectedAssetPack ?? DEFAULT_SETTINGS.selectedAssetPack,
    windowBounds: bounds
  };
}

function clampSize(size: number): number {
  return Math.min(MAX_WINDOW_SIZE, Math.max(MIN_WINDOW_SIZE, size));
}

function isWithinDisplay(bounds: WindowBounds, display: DisplayBounds): boolean {
  return (
    bounds.x >= display.x &&
    bounds.y >= display.y &&
    bounds.x + bounds.width <= display.x + display.width &&
    bounds.y + bounds.height <= display.y + display.height
  );
}

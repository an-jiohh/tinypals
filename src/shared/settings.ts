import type { AppSettings, DisplayBounds, WindowBounds, WindowSize } from "./types";

export const PET_WINDOW_DEFAULT_WIDTH = 144;
export const PET_WINDOW_DEFAULT_HEIGHT = 156;
export const PET_WINDOW_MIN_WIDTH = 96;
export const PET_WINDOW_MIN_HEIGHT = 104;
export const PET_WINDOW_MAX_WIDTH = 384;
export const PET_WINDOW_MAX_HEIGHT = 416;
export const PET_WINDOW_MARGIN = 24;

export const DEFAULT_SETTINGS: AppSettings = {
  windowBounds: { x: 24, y: 24, width: PET_WINDOW_DEFAULT_WIDTH, height: PET_WINDOW_DEFAULT_HEIGHT },
  alwaysOnTop: true,
  launchAtLogin: false,
  selectedAssetPack: "dough-penguin"
};

export function getDefaultWindowBounds(display: DisplayBounds): WindowBounds {
  return getBottomRightWindowBounds(display);
}

export function getBottomRightWindowBounds(
  display: DisplayBounds,
  size?: WindowSize
): WindowBounds {
  const normalizedSize = normalizeWindowSize(size?.width, size?.height, display);

  return {
    x: display.x + display.width - normalizedSize.width - PET_WINDOW_MARGIN,
    y: display.y + display.height - normalizedSize.height - PET_WINDOW_MARGIN,
    width: normalizedSize.width,
    height: normalizedSize.height
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

  const size = normalizeWindowSize(
    mergedBounds.width,
    mergedBounds.height,
    display
  );
  const normalizedBounds = {
    x: mergedBounds.x,
    y: mergedBounds.y,
    width: size.width,
    height: size.height
  };

  if (!isWithinDisplay(normalizedBounds, display)) {
    return defaultBounds;
  }

  return normalizedBounds;
}

export function normalizeWindowSize(
  width: number | undefined,
  height: number | undefined,
  display: DisplayBounds
): Pick<WindowBounds, "width" | "height"> {
  if (display.width < PET_WINDOW_MIN_WIDTH || display.height < PET_WINDOW_MIN_HEIGHT) {
    return {
      width: Math.min(display.width, PET_WINDOW_MIN_WIDTH),
      height: Math.min(display.height, PET_WINDOW_MIN_HEIGHT)
    };
  }

  const widthScale = isFinitePositiveNumber(width)
    ? width / PET_WINDOW_DEFAULT_WIDTH
    : 1;
  const heightScale = isFinitePositiveNumber(height)
    ? height / PET_WINDOW_DEFAULT_HEIGHT
    : 1;
  const minScale = Math.max(
    PET_WINDOW_MIN_WIDTH / PET_WINDOW_DEFAULT_WIDTH,
    PET_WINDOW_MIN_HEIGHT / PET_WINDOW_DEFAULT_HEIGHT
  );
  const maxScale = Math.min(
    PET_WINDOW_MAX_WIDTH / PET_WINDOW_DEFAULT_WIDTH,
    PET_WINDOW_MAX_HEIGHT / PET_WINDOW_DEFAULT_HEIGHT,
    display.width / PET_WINDOW_DEFAULT_WIDTH,
    display.height / PET_WINDOW_DEFAULT_HEIGHT
  );
  const scale = clamp(Math.max(widthScale, heightScale), minScale, maxScale);

  return {
    width: Math.round(PET_WINDOW_DEFAULT_WIDTH * scale),
    height: Math.round(PET_WINDOW_DEFAULT_HEIGHT * scale)
  };
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

function isWithinDisplay(bounds: WindowBounds, display: DisplayBounds): boolean {
  return (
    bounds.x >= display.x &&
    bounds.y >= display.y &&
    bounds.x + bounds.width <= display.x + display.width &&
    bounds.y + bounds.height <= display.y + display.height
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isFinitePositiveNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

import {
  type CSSProperties,
  useEffect,
  useReducer,
  useRef,
  useState,
  type PointerEvent
} from "react";
import { getAssetForMood } from "../../shared/assets";
import { getDragDirectionChange } from "../../shared/dragDirection";
import {
  createInitialPetState,
  reducePetState
} from "../../shared/petStateMachine";
import {
  PET_WINDOW_DEFAULT_HEIGHT,
  PET_WINDOW_DEFAULT_WIDTH
} from "../../shared/settings";
import type {
  PetDirection,
  PetEvent,
  ResolvedPetAsset
} from "../../shared/petTypes";
import type { AppSettings } from "../../shared/types";
import {
  DEFAULT_PET_ASSET_PACK_ID,
  PET_ASSET_PACK_OPTIONS,
  getPetAssetPack
} from "./petAssetRegistry";

const DRAG_START_DISTANCE = 3;
const IDLE_TIMEOUT_MS = 120000;
const IDLE_CHECK_INTERVAL_MS = 15000;

type DragState = {
  pointerId: number;
  screenX: number;
  screenY: number;
  moved: boolean;
  dragging: boolean;
  direction?: PetDirection;
};

type ResizeState = {
  pointerId: number;
  screenX: number;
  screenY: number;
  width: number;
  height: number;
};

type FrameSize = {
  width: number;
  height: number;
};

function createPetEvent(type: Exclude<PetEvent["type"], "user_drag_started">): PetEvent {
  return { type, now: Date.now() } as PetEvent;
}

function getSpriteStyle(asset: ResolvedPetAsset, frameSize: FrameSize): CSSProperties {
  return {
    "--sprite-image": `url("${asset.file}")`,
    "--sprite-frame-width": `${frameSize.width}px`,
    "--sprite-frame-height": `${frameSize.height}px`,
    "--sprite-strip-width": `${frameSize.width * asset.frameCount}px`,
    "--sprite-frame-offset": `${frameSize.width * (asset.frameCount - 1)}px`,
    "--sprite-frame-steps": Math.max(asset.frameCount - 1, 1),
    "--sprite-duration": `${(asset.frameCount / asset.fps) * 1000}ms`,
    "--sprite-iteration-count": asset.loop ? "infinite" : "1"
  } as CSSProperties;
}

function getCurrentFrameSize(): FrameSize {
  if (typeof window === "undefined") {
    return {
      width: PET_WINDOW_DEFAULT_WIDTH,
      height: PET_WINDOW_DEFAULT_HEIGHT
    };
  }

  const aspectRatio = PET_WINDOW_DEFAULT_WIDTH / PET_WINDOW_DEFAULT_HEIGHT;
  const availableWidth = Math.max(1, window.innerWidth);
  const availableHeight = Math.max(1, window.innerHeight);
  const width = Math.min(availableWidth, availableHeight * aspectRatio);

  return {
    width,
    height: width / aspectRatio
  };
}

function getResizeBoundsFromPointer(state: ResizeState, screenX: number, screenY: number): FrameSize {
  const widthScale =
    (state.width + screenX - state.screenX) / PET_WINDOW_DEFAULT_WIDTH;
  const heightScale =
    (state.height + screenY - state.screenY) / PET_WINDOW_DEFAULT_HEIGHT;
  const scale = Math.max(widthScale, heightScale);

  return {
    width: Math.round(PET_WINDOW_DEFAULT_WIDTH * scale),
    height: Math.round(PET_WINDOW_DEFAULT_HEIGHT * scale)
  };
}

function useWindowFrameSize(): FrameSize {
  const [frameSize, setFrameSize] = useState<FrameSize>(() => getCurrentFrameSize());

  useEffect(() => {
    function updateFrameSize(): void {
      setFrameSize(getCurrentFrameSize());
    }

    window.addEventListener("resize", updateFrameSize);
    return () => window.removeEventListener("resize", updateFrameSize);
  }, []);

  return frameSize;
}

export function App() {
  return window.location.hash === "#settings" ? <SettingsApp /> : <PetApp />;
}

function PetApp() {
  const [petState, dispatchPet] = useReducer(
    reducePetState,
    createInitialPetState(Date.now())
  );
  const dragRef = useRef<DragState | undefined>(undefined);
  const resizeRef = useRef<ResizeState | undefined>(undefined);
  const suppressNextClickRef = useRef(false);
  const [selectedAssetPack, setSelectedAssetPack] = useState(
    DEFAULT_PET_ASSET_PACK_ID
  );
  const frameSize = useWindowFrameSize();
  const assetPack = getPetAssetPack(selectedAssetPack);
  const asset = getAssetForMood(assetPack.manifest, petState.mood);
  const spriteStyle = getSpriteStyle(asset, frameSize);

  useEffect(() => {
    dispatchPet(createPetEvent("app_started"));
  }, []);

  useEffect(() => {
    let mounted = true;

    void window.tinyPalsDesktop
      .getSettings()
      .then((loadedSettings) => {
        if (mounted) {
          setSelectedAssetPack(
            getPetAssetPack(loadedSettings.selectedAssetPack).id
          );
        }
      })
      .catch(() => {});

    const unsubscribe = window.tinyPalsDesktop.onSettingsChanged((nextSettings) => {
      setSelectedAssetPack(getPetAssetPack(nextSettings.selectedAssetPack).id);
      dispatchPet(createPetEvent("settings_changed"));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        Date.now() - petState.lastInteractionAt > IDLE_TIMEOUT_MS &&
        petState.mood !== "waiting"
      ) {
        dispatchPet(createPetEvent("idle_timeout"));
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [petState.lastInteractionAt, petState.mood]);

  function handlePetClick(): void {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    dispatchPet(createPetEvent("user_clicked"));
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    dragRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      moved: false,
      dragging: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function handlePointerMove(
    event: PointerEvent<HTMLButtonElement>
  ): Promise<void> {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.screenX - drag.screenX;
    const deltaY = event.screenY - drag.screenY;
    const movedFarEnough =
      Math.abs(deltaX) >= DRAG_START_DISTANCE ||
      Math.abs(deltaY) >= DRAG_START_DISTANCE;

    if (!drag.moved && !movedFarEnough) {
      return;
    }

    const directionChange = getDragDirectionChange(deltaX, drag.direction);

    if (directionChange) {
      dispatchPet({
        type: "user_drag_started",
        direction: directionChange,
        now: Date.now()
      });
    }

    dragRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      moved: true,
      dragging: true,
      direction: directionChange ?? drag.direction
    };
    await window.tinyPalsDesktop.moveWindowBy({ x: deltaX, y: deltaY });
  }

  function finishPointerInteraction(
    event: PointerEvent<HTMLButtonElement>
  ): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.dragging) {
      suppressNextClickRef.current = true;
      dispatchPet(createPetEvent("user_drag_ended"));
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }

    dragRef.current = undefined;
  }

  function handleResizePointerDown(event: PointerEvent<HTMLSpanElement>): void {
    resizeRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      width: window.innerWidth,
      height: window.innerHeight
    };
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function handleResizePointerMove(
    event: PointerEvent<HTMLSpanElement>
  ): Promise<void> {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    await window.tinyPalsDesktop.resizeWindowTo(
      getResizeBoundsFromPointer(resize, event.screenX, event.screenY)
    );
  }

  function finishResizeInteraction(event: PointerEvent<HTMLSpanElement>): void {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resizeRef.current = undefined;
  }

  return (
    <main className="app-shell">
      <button
        className={`pet-button pet-${petState.mood}`}
        type="button"
        aria-label="Greet TinyPals"
        onClick={handlePetClick}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => void handlePointerMove(event)}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
      >
        <span
          key={`${assetPack.id}-${asset.state}-${petState.animationNonce}`}
          className="pet-sprite"
          style={spriteStyle}
          aria-hidden="true"
        />
      </button>
      <span
        className="resize-handle"
        role="presentation"
        onPointerDown={handleResizePointerDown}
        onPointerMove={(event) => void handleResizePointerMove(event)}
        onPointerUp={finishResizeInteraction}
        onPointerCancel={finishResizeInteraction}
      />
    </main>
  );
}

function SettingsApp() {
  const [settings, setSettings] = useState<AppSettings | undefined>();

  useEffect(() => {
    let mounted = true;

    void window.tinyPalsDesktop
      .getSettings()
      .then((loadedSettings) => {
        if (mounted) {
          setSettings(loadedSettings);
        }
      })
      .catch(() => {});

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        window.close();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      mounted = false;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function updateAlwaysOnTop(enabled: boolean): Promise<void> {
    try {
      const nextSettings = await window.tinyPalsDesktop.setAlwaysOnTop(enabled);
      setSettings(nextSettings);
    } catch {}
  }

  async function updateLaunchAtLogin(enabled: boolean): Promise<void> {
    try {
      const nextSettings = await window.tinyPalsDesktop.updateSettings({
        launchAtLogin: enabled
      });
      setSettings(nextSettings);
    } catch {}
  }

  async function updateSelectedAssetPack(selectedAssetPack: string): Promise<void> {
    try {
      const nextSettings = await window.tinyPalsDesktop.updateSettings({
        selectedAssetPack
      });
      setSettings(nextSettings);
    } catch {}
  }

  async function moveToBottomRight(): Promise<void> {
    try {
      const nextSettings = await window.tinyPalsDesktop.moveWindowToBottomRight();
      setSettings(nextSettings);
    } catch {}
  }

  async function showTinyPals(): Promise<void> {
    try {
      await window.tinyPalsDesktop.showTinyPals();
    } catch {}
  }

  return (
    <main className="settings-shell">
      <section className="settings-panel" aria-label="TinyPals settings">
        <header className="settings-header">
          <h1>Preferences</h1>
          <button
            className="icon-button"
            type="button"
            aria-label="Close settings"
            onClick={() => window.close()}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        <div className="settings-content">
          <section className="settings-section" aria-labelledby="general-title">
            <div className="settings-section-heading">
              <h2 id="general-title">General</h2>
            </div>
            <div className="settings-card">
              <label className="settings-row">
                <span>
                  <strong>Always on Top</strong>
                  <small>Keep the pet visible above other windows</small>
                </span>
                <span className="switch-control">
                  <input
                    type="checkbox"
                    checked={settings?.alwaysOnTop ?? false}
                    disabled={!settings}
                    onChange={(event) =>
                      void updateAlwaysOnTop(event.currentTarget.checked)
                    }
                  />
                  <span className="switch-track" aria-hidden="true">
                    <span className="switch-thumb" />
                  </span>
                </span>
              </label>

              <label className="settings-row">
                <span>
                  <strong>Start at Login</strong>
                  <small>Open TinyPals when macOS starts</small>
                </span>
                <span className="switch-control">
                  <input
                    type="checkbox"
                    checked={settings?.launchAtLogin ?? false}
                    disabled={!settings}
                    onChange={(event) =>
                      void updateLaunchAtLogin(event.currentTarget.checked)
                    }
                  />
                  <span className="switch-track" aria-hidden="true">
                    <span className="switch-thumb" />
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="settings-section" aria-labelledby="window-title">
            <div className="settings-section-heading">
              <h2 id="window-title">Window</h2>
            </div>
            <div className="settings-card">
              <button
                className="settings-row action-row"
                type="button"
                onClick={() => void moveToBottomRight()}
              >
                <span>
                  <strong>Move to Bottom Right</strong>
                  <small>Place TinyPals back in the desktop corner</small>
                </span>
                <span className="row-action">Move</span>
              </button>

              <button
                className="settings-row action-row"
                type="button"
                onClick={() => void showTinyPals()}
              >
                <span>
                  <strong>Show TinyPals</strong>
                  <small>Bring the pet window forward</small>
                </span>
                <span className="row-action">Show</span>
              </button>
            </div>
          </section>

          <section className="settings-section" aria-labelledby="character-title">
            <div className="settings-section-heading">
              <h2 id="character-title">Character</h2>
            </div>
            <div className="settings-card">
              <label className="settings-row">
                <span>
                  <strong>Pet Character</strong>
                  <small>Choose which hatch-pet asset pack is shown</small>
                </span>
                <select
                  className="select-control"
                  value={getPetAssetPack(settings?.selectedAssetPack).id}
                  disabled={!settings}
                  onChange={(event) =>
                    void updateSelectedAssetPack(event.currentTarget.value)
                  }
                >
                  {PET_ASSET_PACK_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.displayName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="settings-section" aria-labelledby="app-title">
            <div className="settings-section-heading">
              <h2 id="app-title">App</h2>
            </div>
            <div className="settings-card">
              <button
                className="settings-row action-row danger-row"
                type="button"
                onClick={() => void window.tinyPalsDesktop.quit()}
              >
                <span>
                  <strong>Quit</strong>
                  <small>Close TinyPals</small>
                </span>
                <span className="row-action">Quit</span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type PointerEvent
} from "react";
import attentionAssetUrl from "../assets/pingu/attention.svg";
import draggingAssetUrl from "../assets/pingu/dragging.svg";
import greetAssetUrl from "../assets/pingu/greet.svg";
import happyAssetUrl from "../assets/pingu/happy.svg";
import idleAssetUrl from "../assets/pingu/idle.svg";
import manifest from "../assets/pingu/manifest.json";
import sleepyAssetUrl from "../assets/pingu/sleepy.svg";
import { getAssetForMood } from "../../shared/assets";
import {
  createInitialPetState,
  reducePetState
} from "../../shared/petStateMachine";
import type { PetAssetManifest, PetEvent } from "../../shared/petTypes";
import type { AppSettings } from "../../shared/types";

const DRAG_START_DISTANCE = 3;
const IDLE_TIMEOUT_MS = 120000;
const IDLE_CHECK_INTERVAL_MS = 15000;

const petManifest: PetAssetManifest = {
  ...(manifest as Omit<PetAssetManifest, "states">),
  states: {
    idle: idleAssetUrl,
    greet: greetAssetUrl,
    dragging: draggingAssetUrl,
    sleepy: sleepyAssetUrl,
    happy: happyAssetUrl,
    attention: attentionAssetUrl
  }
};

type DragState = {
  pointerId: number;
  screenX: number;
  screenY: number;
  moved: boolean;
  dragging: boolean;
};

function createPetEvent(type: PetEvent["type"]): PetEvent {
  return { type, now: Date.now() } as PetEvent;
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
  const suppressNextClickRef = useRef(false);
  const assetPath = getAssetForMood(petManifest, petState.mood);

  useEffect(() => {
    dispatchPet(createPetEvent("app_started"));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        Date.now() - petState.lastInteractionAt > IDLE_TIMEOUT_MS &&
        petState.mood !== "sleepy"
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

    if (!drag.dragging) {
      dispatchPet(createPetEvent("user_drag_started"));
    }

    dragRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      moved: true,
      dragging: true
    };
    await window.pinguDesktop.moveWindowBy({ x: deltaX, y: deltaY });
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

  return (
    <main className="app-shell">
      <button
        className={`pet-button pet-${petState.mood}`}
        type="button"
        aria-label="Greet Pingu"
        onClick={handlePetClick}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => void handlePointerMove(event)}
        onPointerUp={finishPointerInteraction}
        onPointerCancel={finishPointerInteraction}
      >
        <img
          key={`${petState.mood}-${petState.animationNonce}`}
          src={assetPath}
          alt=""
          draggable={false}
        />
      </button>
    </main>
  );
}

function SettingsApp() {
  const [settings, setSettings] = useState<AppSettings | undefined>();

  useEffect(() => {
    let mounted = true;

    void window.pinguDesktop
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
      const nextSettings = await window.pinguDesktop.setAlwaysOnTop(enabled);
      setSettings(nextSettings);
    } catch {}
  }

  async function updateLaunchAtLogin(enabled: boolean): Promise<void> {
    try {
      const nextSettings = await window.pinguDesktop.updateSettings({
        launchAtLogin: enabled
      });
      setSettings(nextSettings);
    } catch {}
  }

  async function moveToBottomRight(): Promise<void> {
    try {
      const nextSettings = await window.pinguDesktop.moveWindowToBottomRight();
      setSettings(nextSettings);
    } catch {}
  }

  async function showPingu(): Promise<void> {
    try {
      await window.pinguDesktop.showPingu();
    } catch {}
  }

  return (
    <main className="settings-shell">
      <section className="settings-panel" aria-label="Pingu settings">
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
                  <small>Open Pingu when macOS starts</small>
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
                  <small>Place Pingu back in the desktop corner</small>
                </span>
                <span className="row-action">Move</span>
              </button>

              <button
                className="settings-row action-row"
                type="button"
                onClick={() => void showPingu()}
              >
                <span>
                  <strong>Show Pingu</strong>
                  <small>Bring the pet window forward</small>
                </span>
                <span className="row-action">Show</span>
              </button>
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
                onClick={() => void window.pinguDesktop.quit()}
              >
                <span>
                  <strong>Quit</strong>
                  <small>Close Pingu Desktop Pet</small>
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

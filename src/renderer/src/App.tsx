import {
  useEffect,
  useMemo,
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
import { getAssetForMood, validateAssetManifest } from "../../shared/assets";
import {
  createInitialPetState,
  reducePetState
} from "../../shared/petStateMachine";
import type { PetAssetManifest, PetEvent } from "../../shared/petTypes";
import type { AppSettings } from "../../shared/types";

const DRAG_START_DISTANCE = 3;
const IDLE_TIMEOUT_MS = 120000;
const IDLE_CHECK_INTERVAL_MS = 15000;
const PET_WINDOW_SIZE = { width: 96, height: 96 };
const SETTINGS_WINDOW_SIZE = { width: 220, height: 240 };

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
  const [petState, dispatchPet] = useReducer(
    reducePetState,
    createInitialPetState(Date.now())
  );
  const [settings, setSettings] = useState<AppSettings | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const dragRef = useRef<DragState | undefined>(undefined);
  const suppressNextClickRef = useRef(false);
  const resizeRequestRef = useRef(0);

  const manifestWarnings = useMemo(() => validateAssetManifest(petManifest), []);
  const assetPath = getAssetForMood(petManifest, petState.mood);

  useEffect(() => {
    let mounted = true;
    const startupRequestId = resizeRequestRef.current;

    void (async () => {
      try {
        const loadedSettings = await window.pinguDesktop.getSettings();

        if (mounted) {
          setSettings(loadedSettings);
        }

        if (
          loadedSettings.windowBounds.width !== PET_WINDOW_SIZE.width ||
          loadedSettings.windowBounds.height !== PET_WINDOW_SIZE.height
        ) {
          if (resizeRequestRef.current !== startupRequestId) {
            return;
          }

          const requestId = ++resizeRequestRef.current;
          const resizedSettings = await window.pinguDesktop.resizeWindow({
            ...PET_WINDOW_SIZE,
            requestId
          });

          if (mounted && requestId === resizeRequestRef.current) {
            setSettings(resizedSettings);
            dispatchPet(createPetEvent("settings_changed"));
          }
        }
      } catch {
        if (mounted) {
          setStatusMessage("Could not load settings");
        }
      }
    })();
    dispatchPet(createPetEvent("app_started"));

    return () => {
      mounted = false;
    };
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

  async function updateAlwaysOnTop(enabled: boolean): Promise<void> {
    try {
      const nextSettings = await window.pinguDesktop.setAlwaysOnTop(enabled);
      setSettings(nextSettings);
      dispatchPet(createPetEvent("settings_changed"));
      setStatusMessage("Saved");
    } catch {
      setStatusMessage("Could not save");
    }
  }

  async function updateLaunchAtLogin(enabled: boolean): Promise<void> {
    try {
      const nextSettings = await window.pinguDesktop.updateSettings({
        launchAtLogin: enabled
      });
      setSettings(nextSettings);
      dispatchPet(createPetEvent("settings_changed"));
      setStatusMessage("Saved");
    } catch {
      setStatusMessage("Could not save");
    }
  }

  async function resetPosition(): Promise<void> {
    try {
      const nextSettings = await window.pinguDesktop.resetWindowPosition();
      setSettings(nextSettings);
      dispatchPet(createPetEvent("settings_changed"));
      setStatusMessage("Position reset");
    } catch {
      setStatusMessage("Could not reset");
    }
  }

  async function resizeWindow(
    size: typeof PET_WINDOW_SIZE,
    requestId: number
  ): Promise<void> {
    const nextSettings = await window.pinguDesktop.resizeWindow({
      ...size,
      requestId
    });
    if (requestId !== resizeRequestRef.current) {
      return;
    }

    setSettings(nextSettings);
    dispatchPet(createPetEvent("settings_changed"));
  }

  async function setSettingsOpen(open: boolean): Promise<void> {
    const requestId = ++resizeRequestRef.current;

    setPopoverOpen(open);
    setStatusMessage("");

    try {
      await resizeWindow(
        open ? SETTINGS_WINDOW_SIZE : PET_WINDOW_SIZE,
        requestId
      );
    } catch {
      if (requestId === resizeRequestRef.current) {
        setStatusMessage(open ? "Could not expand" : "Could not shrink");
      }
    }
  }

  function handlePetClick(): void {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    void setSettingsOpen(!popoverOpen);
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
    const nextSettings = await window.pinguDesktop.moveWindowBy({
      x: deltaX,
      y: deltaY
    });
    setSettings(nextSettings);
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
    <main className={`app-shell${popoverOpen ? " settings-open" : ""}`}>
      <button
        className={`pet-button pet-${petState.mood}`}
        type="button"
        aria-label="Open Pingu settings"
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

      {popoverOpen ? (
        <section className="settings-popover" aria-label="Pingu settings">
          <div className="settings-title">Pingu</div>
          <label className="setting-row">
            <span>Always on top</span>
            <input
              type="checkbox"
              checked={settings?.alwaysOnTop ?? false}
              disabled={!settings}
              onChange={(event) =>
                void updateAlwaysOnTop(event.currentTarget.checked)
              }
            />
          </label>
          <label className="setting-row">
            <span>Start at login</span>
            <input
              type="checkbox"
              checked={settings?.launchAtLogin ?? false}
              disabled={!settings}
              onChange={(event) =>
                void updateLaunchAtLogin(event.currentTarget.checked)
              }
            />
          </label>
          <button
            className="settings-action"
            type="button"
            onClick={() => void resetPosition()}
          >
            Reset position
          </button>
          <button
            className="settings-action"
            type="button"
            onClick={() => void window.pinguDesktop.quit()}
          >
            Quit
          </button>
          {statusMessage ? (
            <p className="settings-message">{statusMessage}</p>
          ) : null}
          {manifestWarnings.length > 0 ? (
            <p className="settings-message">Using fallback asset</p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

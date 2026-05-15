# Pingu Desktop Pet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 Electron desktop app where a small Pingu-inspired pet floats on the desktop, reacts to basic interactions, and stores minimal local settings.

**Architecture:** Use Electron for OS-level window, tray, and settings responsibilities; React for the small pet UI and settings popover; shared TypeScript modules for state, settings, and asset validation. Keep timer and schedule features out of v1, but define reserved pet events so future modules can attach without rewriting the pet state model.

**Tech Stack:** Electron, electron-vite, TypeScript, React, Vite, Vitest, npm.

---

## Source Documents

- Product design: `docs/superpowers/specs/2026-05-16-pingu-desktop-pet-design.md`
- Character research: `docs/research/pingu-character-research-2026-05-15.md`

## File Structure

Create the app as a TypeScript Electron project:

- `package.json`: npm scripts, runtime dependencies, dev dependencies, electron-builder metadata.
- `electron.vite.config.ts`: main, preload, renderer build entry configuration.
- `tsconfig.json`: shared TypeScript config.
- `vitest.config.ts`: unit test configuration for shared logic.
- `src/shared/types.ts`: app settings, display bounds, app info, and preload API types.
- `src/shared/petTypes.ts`: pet state, event, asset state, and asset manifest types.
- `src/shared/petStateMachine.ts`: deterministic event-to-state reducer.
- `src/shared/settings.ts`: defaults, settings normalization, and display bounds correction.
- `src/shared/assets.ts`: asset manifest validation and state fallback selection.
- `src/main/settingsStore.ts`: JSON file persistence in Electron `userData`.
- `src/main/windowService.ts`: frameless transparent floating window creation and bounds handling.
- `src/main/trayService.ts`: tray menu creation.
- `src/main/main.ts`: app lifecycle, IPC handlers, services wiring.
- `src/preload/preload.ts`: safe `window.pinguDesktop` API exposure.
- `src/renderer/index.html`: renderer HTML entry.
- `src/renderer/src/main.tsx`: React mount.
- `src/renderer/src/App.tsx`: pet UI state orchestration and popover.
- `src/renderer/src/styles.css`: floating pet, animation, and popover styling.
- `src/renderer/src/global.d.ts`: renderer global API typing.
- `src/renderer/assets/pingu/manifest.json`: temporary asset manifest.
- `src/renderer/assets/pingu/*.svg`: temporary SVG states.
- `src/shared/*.test.ts`: unit tests for state, settings, and assets.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/main/.gitkeep`
- Create: `src/preload/.gitkeep`
- Create: `src/renderer/src/.gitkeep`
- Create: `src/shared/.gitkeep`

- [ ] **Step 1: Create npm package manifest**

Create `package.json` with this content:

```json
{
  "name": "pingu-desktop-pet",
  "version": "0.1.0",
  "description": "A minimal floating desktop pet inspired by Pingu, with local-first settings and replaceable assets.",
  "private": true,
  "main": "out/main/index.js",
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "npm run typecheck && npm run test && electron-vite build",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:win": "npm run build && electron-builder --win"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^5.0.0",
    "electron": "^42.0.1",
    "electron-builder": "^26.0.0",
    "electron-vite": "^3.1.0",
    "typescript": "^5.8.0",
    "vite": "^6.3.0",
    "vitest": "^3.1.0"
  },
  "engines": {
    "node": ">=22.12.0",
    "npm": ">=10"
  },
  "build": {
    "appId": "com.pingu.desktoppet",
    "productName": "Pingu Desktop Pet",
    "files": [
      "out/**",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        "dmg"
      ]
    },
    "win": {
      "target": [
        "nsis"
      ]
    }
  }
}
```

- [ ] **Step 2: Create electron-vite config**

Create `electron.vite.config.ts`:

```ts
import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/main.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/preload.ts")
        }
      }
    }
  },
  renderer: {
    root: "src/renderer",
    plugins: [react()]
  }
});
```

- [ ] **Step 3: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "electron.vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
```

- [ ] **Step 5: Create `.gitignore`**

Create `.gitignore`:

```gitignore
.DS_Store
node_modules/
out/
dist/
release/
.superpowers/
coverage/
*.log
```

- [ ] **Step 6: Create empty source directories**

Create `.gitkeep` files in the listed directories:

```text
src/main/.gitkeep
src/preload/.gitkeep
src/renderer/src/.gitkeep
src/shared/.gitkeep
```

- [ ] **Step 7: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 8: Commit scaffold**

Run:

```bash
git add package.json package-lock.json electron.vite.config.ts tsconfig.json vitest.config.ts .gitignore src
git commit -m "chore: scaffold Electron desktop app"
```

## Task 2: Shared Types and Pet State Machine

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/petTypes.ts`
- Create: `src/shared/petStateMachine.ts`
- Create: `src/shared/petStateMachine.test.ts`

- [ ] **Step 1: Write failing pet state tests**

Create `src/shared/petStateMachine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { reducePetState } from "./petStateMachine";
import type { PetRuntimeState } from "./petTypes";

const baseState: PetRuntimeState = {
  mood: "idle",
  lastInteractionAt: 1000,
  animationNonce: 0
};

describe("reducePetState", () => {
  it("starts in idle when the app starts", () => {
    expect(reducePetState(baseState, { type: "app_started", now: 2000 })).toEqual({
      mood: "idle",
      lastInteractionAt: 2000,
      animationNonce: 1
    });
  });

  it("shows a short greeting when clicked", () => {
    expect(reducePetState(baseState, { type: "user_clicked", now: 3000 })).toEqual({
      mood: "greet",
      lastInteractionAt: 3000,
      animationNonce: 1
    });
  });

  it("uses dragging state while the window is dragged", () => {
    expect(reducePetState(baseState, { type: "user_drag_started", now: 4000 })).toEqual({
      mood: "dragging",
      lastInteractionAt: 4000,
      animationNonce: 1
    });
  });

  it("returns to idle after dragging ends", () => {
    const dragging: PetRuntimeState = {
      mood: "dragging",
      lastInteractionAt: 4000,
      animationNonce: 2
    };

    expect(reducePetState(dragging, { type: "user_drag_ended", now: 5000 })).toEqual({
      mood: "idle",
      lastInteractionAt: 5000,
      animationNonce: 3
    });
  });

  it("switches to sleepy after an idle timeout", () => {
    expect(reducePetState(baseState, { type: "idle_timeout", now: 8000 })).toEqual({
      mood: "sleepy",
      lastInteractionAt: 1000,
      animationNonce: 1
    });
  });

  it("reserves future timer and schedule reactions", () => {
    expect(reducePetState(baseState, { type: "timer_started", now: 9000 }).mood).toBe("attention");
    expect(reducePetState(baseState, { type: "timer_paused", now: 9000 }).mood).toBe("sleepy");
    expect(reducePetState(baseState, { type: "timer_completed", now: 9000 }).mood).toBe("happy");
    expect(reducePetState(baseState, { type: "schedule_due", now: 9000 }).mood).toBe("attention");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/shared/petStateMachine.test.ts
```

Expected: FAIL because `src/shared/petStateMachine.ts` and `src/shared/petTypes.ts` do not exist.

- [ ] **Step 3: Implement shared API and pet types**

Create `src/shared/types.ts`:

```ts
export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DisplayBounds = WindowBounds;

export type AppSettings = {
  windowBounds: WindowBounds;
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  selectedAssetPack: string;
};

export type AppInfo = {
  name: string;
  version: string;
  platform: NodeJS.Platform;
};

export type PinguDesktopApi = {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  resetWindowPosition(): Promise<AppSettings>;
  moveWindowBy(delta: { x: number; y: number }): Promise<AppSettings>;
  setAlwaysOnTop(enabled: boolean): Promise<AppSettings>;
  quit(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
};
```

Create `src/shared/petTypes.ts`:

```ts
export type PetMood = "idle" | "greet" | "dragging" | "sleepy" | "happy" | "attention";

export type PetEvent =
  | { type: "app_started"; now: number }
  | { type: "user_clicked"; now: number }
  | { type: "user_drag_started"; now: number }
  | { type: "user_drag_ended"; now: number }
  | { type: "idle_timeout"; now: number }
  | { type: "settings_changed"; now: number }
  | { type: "timer_started"; now: number }
  | { type: "timer_paused"; now: number }
  | { type: "timer_completed"; now: number }
  | { type: "schedule_due"; now: number };

export type PetRuntimeState = {
  mood: PetMood;
  lastInteractionAt: number;
  animationNonce: number;
};

export type PetAssetState = PetMood;

export type PetAssetManifest = {
  id: string;
  displayName: string;
  license: "official-licensed" | "placeholder" | "custom";
  states: Record<PetAssetState, string>;
};
```

- [ ] **Step 4: Implement pet reducer**

Create `src/shared/petStateMachine.ts`:

```ts
import type { PetEvent, PetMood, PetRuntimeState } from "./petTypes";

function bump(state: PetRuntimeState, mood: PetMood, now: number, updateInteraction: boolean): PetRuntimeState {
  return {
    mood,
    lastInteractionAt: updateInteraction ? now : state.lastInteractionAt,
    animationNonce: state.animationNonce + 1
  };
}

export function createInitialPetState(now: number): PetRuntimeState {
  return {
    mood: "idle",
    lastInteractionAt: now,
    animationNonce: 0
  };
}

export function reducePetState(state: PetRuntimeState, event: PetEvent): PetRuntimeState {
  switch (event.type) {
    case "app_started":
      return bump(state, "idle", event.now, true);
    case "user_clicked":
      return bump(state, "greet", event.now, true);
    case "user_drag_started":
      return bump(state, "dragging", event.now, true);
    case "user_drag_ended":
      return bump(state, "idle", event.now, true);
    case "idle_timeout":
      return bump(state, "sleepy", event.now, false);
    case "settings_changed":
      return bump(state, "idle", event.now, true);
    case "timer_started":
      return bump(state, "attention", event.now, true);
    case "timer_paused":
      return bump(state, "sleepy", event.now, true);
    case "timer_completed":
      return bump(state, "happy", event.now, true);
    case "schedule_due":
      return bump(state, "attention", event.now, true);
  }
}
```

- [ ] **Step 5: Run state tests**

Run:

```bash
npm run test -- src/shared/petStateMachine.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit pet state model**

Run:

```bash
git add src/shared/types.ts src/shared/petTypes.ts src/shared/petStateMachine.ts src/shared/petStateMachine.test.ts
git commit -m "feat: add pet state model"
```

## Task 3: Settings Defaults and Bounds Normalization

**Files:**
- Create: `src/shared/settings.ts`
- Create: `src/shared/settings.test.ts`

- [ ] **Step 1: Write failing settings tests**

Create `src/shared/settings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, getDefaultWindowBounds, normalizeSettings } from "./settings";
import type { DisplayBounds } from "./types";

const display: DisplayBounds = { x: 0, y: 0, width: 1440, height: 900 };

describe("settings", () => {
  it("defines the v1 defaults", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      windowBounds: { x: 24, y: 24, width: 96, height: 96 },
      alwaysOnTop: true,
      launchAtLogin: false,
      selectedAssetPack: "temporary-pingu"
    });
  });

  it("uses a safe default window position for a display", () => {
    expect(getDefaultWindowBounds(display)).toEqual({ x: 24, y: 24, width: 96, height: 96 });
  });

  it("merges partial persisted settings with defaults", () => {
    expect(normalizeSettings({ alwaysOnTop: false }, display)).toEqual({
      ...DEFAULT_SETTINGS,
      alwaysOnTop: false
    });
  });

  it("repairs out-of-screen bounds", () => {
    expect(
      normalizeSettings(
        {
          windowBounds: { x: 2000, y: 1200, width: 96, height: 96 },
          selectedAssetPack: "custom-pack"
        },
        display
      )
    ).toEqual({
      ...DEFAULT_SETTINGS,
      selectedAssetPack: "custom-pack",
      windowBounds: { x: 24, y: 24, width: 96, height: 96 }
    });
  });

  it("enforces a 72px minimum and 180px maximum pet window size", () => {
    expect(
      normalizeSettings(
        {
          windowBounds: { x: 50, y: 50, width: 20, height: 300 }
        },
        display
      ).windowBounds
    ).toEqual({ x: 50, y: 50, width: 72, height: 180 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/shared/settings.test.ts
```

Expected: FAIL because `src/shared/settings.ts` does not exist.

- [ ] **Step 3: Implement settings normalization**

Create `src/shared/settings.ts`:

```ts
import type { AppSettings, DisplayBounds, WindowBounds } from "./types";

export const PET_WINDOW_MIN_SIZE = 72;
export const PET_WINDOW_DEFAULT_SIZE = 96;
export const PET_WINDOW_MAX_SIZE = 180;
export const PET_WINDOW_MARGIN = 24;

export const DEFAULT_SETTINGS: AppSettings = {
  windowBounds: {
    x: PET_WINDOW_MARGIN,
    y: PET_WINDOW_MARGIN,
    width: PET_WINDOW_DEFAULT_SIZE,
    height: PET_WINDOW_DEFAULT_SIZE
  },
  alwaysOnTop: true,
  launchAtLogin: false,
  selectedAssetPack: "temporary-pingu"
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getDefaultWindowBounds(display: DisplayBounds): WindowBounds {
  return {
    x: display.x + PET_WINDOW_MARGIN,
    y: display.y + PET_WINDOW_MARGIN,
    width: PET_WINDOW_DEFAULT_SIZE,
    height: PET_WINDOW_DEFAULT_SIZE
  };
}

export function normalizeWindowBounds(bounds: WindowBounds | undefined, display: DisplayBounds): WindowBounds {
  if (!bounds) {
    return getDefaultWindowBounds(display);
  }

  const width = clamp(Math.round(bounds.width), PET_WINDOW_MIN_SIZE, PET_WINDOW_MAX_SIZE);
  const height = clamp(Math.round(bounds.height), PET_WINDOW_MIN_SIZE, PET_WINDOW_MAX_SIZE);
  const maxX = display.x + display.width - width;
  const maxY = display.y + display.height - height;
  const x = Math.round(bounds.x);
  const y = Math.round(bounds.y);

  if (x < display.x || y < display.y || x > maxX || y > maxY) {
    return getDefaultWindowBounds(display);
  }

  return { x, y, width, height };
}

export function normalizeSettings(input: Partial<AppSettings> | undefined, display: DisplayBounds): AppSettings {
  return {
    windowBounds: normalizeWindowBounds(input?.windowBounds, display),
    alwaysOnTop: input?.alwaysOnTop ?? DEFAULT_SETTINGS.alwaysOnTop,
    launchAtLogin: input?.launchAtLogin ?? DEFAULT_SETTINGS.launchAtLogin,
    selectedAssetPack: input?.selectedAssetPack ?? DEFAULT_SETTINGS.selectedAssetPack
  };
}
```

- [ ] **Step 4: Run settings tests**

Run:

```bash
npm run test -- src/shared/settings.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit settings logic**

Run:

```bash
git add src/shared/settings.ts src/shared/settings.test.ts
git commit -m "feat: add settings normalization"
```

## Task 4: Asset Manifest Validation

**Files:**
- Create: `src/shared/assets.ts`
- Create: `src/shared/assets.test.ts`

- [ ] **Step 1: Write failing asset tests**

Create `src/shared/assets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PET_ASSET_STATES, getAssetForMood, validateAssetManifest } from "./assets";
import type { PetAssetManifest } from "./petTypes";

const completeManifest: PetAssetManifest = {
  id: "temporary-pingu",
  displayName: "Temporary Pingu",
  license: "placeholder",
  states: {
    idle: "idle.svg",
    greet: "greet.svg",
    dragging: "dragging.svg",
    sleepy: "sleepy.svg",
    happy: "happy.svg",
    attention: "attention.svg"
  }
};

describe("assets", () => {
  it("lists every required asset state", () => {
    expect(PET_ASSET_STATES).toEqual(["idle", "greet", "dragging", "sleepy", "happy", "attention"]);
  });

  it("accepts a complete manifest", () => {
    expect(validateAssetManifest(completeManifest)).toEqual([]);
  });

  it("reports missing states", () => {
    const manifest = {
      ...completeManifest,
      states: {
        ...completeManifest.states,
        happy: ""
      }
    };

    expect(validateAssetManifest(manifest)).toEqual(["Missing asset for state: happy"]);
  });

  it("falls back to idle when a requested mood is missing", () => {
    const manifest = {
      ...completeManifest,
      states: {
        ...completeManifest.states,
        sleepy: ""
      }
    };

    expect(getAssetForMood(manifest, "sleepy")).toBe("idle.svg");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/shared/assets.test.ts
```

Expected: FAIL because `src/shared/assets.ts` does not exist.

- [ ] **Step 3: Implement asset helpers**

Create `src/shared/assets.ts`:

```ts
import type { PetAssetManifest, PetAssetState, PetMood } from "./petTypes";

export const PET_ASSET_STATES: PetAssetState[] = ["idle", "greet", "dragging", "sleepy", "happy", "attention"];

export function validateAssetManifest(manifest: PetAssetManifest): string[] {
  return PET_ASSET_STATES.flatMap((state) => {
    const path = manifest.states[state];
    return path && path.trim().length > 0 ? [] : [`Missing asset for state: ${state}`];
  });
}

export function getAssetForMood(manifest: PetAssetManifest, mood: PetMood): string {
  const requested = manifest.states[mood];
  if (requested && requested.trim().length > 0) {
    return requested;
  }

  return manifest.states.idle;
}
```

- [ ] **Step 4: Run asset tests**

Run:

```bash
npm run test -- src/shared/assets.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit asset validation**

Run:

```bash
git add src/shared/assets.ts src/shared/assets.test.ts
git commit -m "feat: add pet asset validation"
```

## Task 5: Temporary SVG Asset Pack

**Files:**
- Create: `src/renderer/assets/pingu/manifest.json`
- Create: `src/renderer/assets/pingu/idle.svg`
- Create: `src/renderer/assets/pingu/greet.svg`
- Create: `src/renderer/assets/pingu/dragging.svg`
- Create: `src/renderer/assets/pingu/sleepy.svg`
- Create: `src/renderer/assets/pingu/happy.svg`
- Create: `src/renderer/assets/pingu/attention.svg`

- [ ] **Step 1: Create manifest**

Create `src/renderer/assets/pingu/manifest.json`:

```json
{
  "id": "temporary-pingu",
  "displayName": "Temporary Pingu",
  "license": "placeholder",
  "states": {
    "idle": "/assets/pingu/idle.svg",
    "greet": "/assets/pingu/greet.svg",
    "dragging": "/assets/pingu/dragging.svg",
    "sleepy": "/assets/pingu/sleepy.svg",
    "happy": "/assets/pingu/happy.svg",
    "attention": "/assets/pingu/attention.svg"
  }
}
```

- [ ] **Step 2: Create idle SVG**

Create `src/renderer/assets/pingu/idle.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Temporary Pingu idle">
  <ellipse cx="48" cy="82" rx="22" ry="6" fill="#D9DEE8"/>
  <ellipse cx="48" cy="48" rx="28" ry="34" fill="#1E2430"/>
  <ellipse cx="48" cy="56" rx="20" ry="25" fill="#F7F8F2"/>
  <circle cx="39" cy="35" r="4" fill="#F7F8F2"/>
  <circle cx="57" cy="35" r="4" fill="#F7F8F2"/>
  <circle cx="40" cy="35" r="2" fill="#111827"/>
  <circle cx="56" cy="35" r="2" fill="#111827"/>
  <path d="M43 43 Q48 47 53 43 Q49 55 43 43Z" fill="#F3A23B"/>
  <path d="M26 58 Q14 62 23 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M70 58 Q82 62 73 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <ellipse cx="36" cy="84" rx="10" ry="4" fill="#F3A23B"/>
  <ellipse cx="60" cy="84" rx="10" ry="4" fill="#F3A23B"/>
</svg>
```

- [ ] **Step 3: Create greet SVG**

Create `src/renderer/assets/pingu/greet.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Temporary Pingu greeting">
  <ellipse cx="48" cy="82" rx="22" ry="6" fill="#D9DEE8"/>
  <ellipse cx="48" cy="48" rx="28" ry="34" fill="#1E2430"/>
  <ellipse cx="48" cy="56" rx="20" ry="25" fill="#F7F8F2"/>
  <circle cx="39" cy="35" r="4" fill="#F7F8F2"/>
  <circle cx="57" cy="35" r="4" fill="#F7F8F2"/>
  <circle cx="40" cy="35" r="2" fill="#111827"/>
  <circle cx="56" cy="35" r="2" fill="#111827"/>
  <path d="M43 43 Q48 47 53 43 Q49 55 43 43Z" fill="#F3A23B"/>
  <path d="M26 58 Q14 62 23 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M70 55 Q86 42 76 68" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <ellipse cx="36" cy="84" rx="10" ry="4" fill="#F3A23B"/>
  <ellipse cx="60" cy="84" rx="10" ry="4" fill="#F3A23B"/>
</svg>
```

- [ ] **Step 4: Create dragging SVG**

Create `src/renderer/assets/pingu/dragging.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Temporary Pingu dragging">
  <ellipse cx="48" cy="82" rx="22" ry="6" fill="#D9DEE8"/>
  <g transform="rotate(-7 48 48)">
    <ellipse cx="48" cy="48" rx="28" ry="34" fill="#1E2430"/>
    <ellipse cx="48" cy="56" rx="20" ry="25" fill="#F7F8F2"/>
    <circle cx="39" cy="35" r="5" fill="#F7F8F2"/>
    <circle cx="57" cy="35" r="5" fill="#F7F8F2"/>
    <circle cx="40" cy="35" r="2" fill="#111827"/>
    <circle cx="56" cy="35" r="2" fill="#111827"/>
    <path d="M43 43 Q48 47 53 43 Q49 55 43 43Z" fill="#F3A23B"/>
    <path d="M26 58 Q14 62 23 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M70 58 Q82 62 73 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
    <ellipse cx="36" cy="84" rx="10" ry="4" fill="#F3A23B"/>
    <ellipse cx="60" cy="84" rx="10" ry="4" fill="#F3A23B"/>
  </g>
</svg>
```

- [ ] **Step 5: Create sleepy SVG**

Create `src/renderer/assets/pingu/sleepy.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Temporary Pingu sleepy">
  <ellipse cx="48" cy="82" rx="22" ry="6" fill="#D9DEE8"/>
  <ellipse cx="48" cy="50" rx="28" ry="32" fill="#1E2430"/>
  <ellipse cx="48" cy="58" rx="20" ry="23" fill="#F7F8F2"/>
  <path d="M35 35 Q40 38 45 35" stroke="#111827" stroke-width="2" fill="none"/>
  <path d="M51 35 Q56 38 61 35" stroke="#111827" stroke-width="2" fill="none"/>
  <path d="M43 44 Q48 47 53 44 Q49 53 43 44Z" fill="#F3A23B"/>
  <path d="M26 60 Q14 64 23 71" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M70 60 Q82 64 73 71" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <ellipse cx="36" cy="84" rx="10" ry="4" fill="#F3A23B"/>
  <ellipse cx="60" cy="84" rx="10" ry="4" fill="#F3A23B"/>
</svg>
```

- [ ] **Step 6: Create happy SVG**

Create `src/renderer/assets/pingu/happy.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Temporary Pingu happy">
  <ellipse cx="48" cy="86" rx="22" ry="6" fill="#D9DEE8"/>
  <ellipse cx="48" cy="46" rx="28" ry="34" fill="#1E2430"/>
  <ellipse cx="48" cy="54" rx="20" ry="25" fill="#F7F8F2"/>
  <path d="M35 34 Q39 30 43 34" stroke="#111827" stroke-width="2" fill="none"/>
  <path d="M53 34 Q57 30 61 34" stroke="#111827" stroke-width="2" fill="none"/>
  <path d="M40 42 Q48 54 56 42 Q48 62 40 42Z" fill="#F3A23B"/>
  <path d="M26 57 Q13 52 22 67" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M70 57 Q83 52 74 67" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <ellipse cx="36" cy="84" rx="10" ry="4" fill="#F3A23B"/>
  <ellipse cx="60" cy="84" rx="10" ry="4" fill="#F3A23B"/>
</svg>
```

- [ ] **Step 7: Create attention SVG**

Create `src/renderer/assets/pingu/attention.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Temporary Pingu attention">
  <ellipse cx="48" cy="82" rx="22" ry="6" fill="#D9DEE8"/>
  <ellipse cx="48" cy="48" rx="28" ry="34" fill="#1E2430"/>
  <ellipse cx="48" cy="56" rx="20" ry="25" fill="#F7F8F2"/>
  <circle cx="39" cy="35" r="5" fill="#F7F8F2"/>
  <circle cx="57" cy="35" r="3" fill="#F7F8F2"/>
  <circle cx="40" cy="35" r="2" fill="#111827"/>
  <circle cx="56" cy="35" r="2" fill="#111827"/>
  <path d="M43 43 Q48 47 53 43 Q49 55 43 43Z" fill="#F3A23B"/>
  <path d="M26 58 Q14 62 23 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M70 58 Q82 62 73 70" stroke="#1E2430" stroke-width="8" stroke-linecap="round" fill="none"/>
  <ellipse cx="36" cy="84" rx="10" ry="4" fill="#F3A23B"/>
  <ellipse cx="60" cy="84" rx="10" ry="4" fill="#F3A23B"/>
</svg>
```

- [ ] **Step 8: Commit asset pack**

Run:

```bash
git add src/renderer/assets/pingu
git commit -m "feat: add temporary pet asset pack"
```

## Task 6: Main Process Settings Store

**Files:**
- Create: `src/main/settingsStore.ts`
- Create: `src/main/settingsStore.test.ts`

- [ ] **Step 1: Write failing settings store tests**

Create `src/main/settingsStore.test.ts`:

```ts
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createSettingsStore } from "./settingsStore";
import type { DisplayBounds } from "../shared/types";

const display: DisplayBounds = { x: 0, y: 0, width: 1280, height: 720 };
let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("settingsStore", () => {
  it("loads defaults when no settings file exists", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    await expect(store.load()).resolves.toMatchObject({
      windowBounds: { x: 24, y: 24, width: 96, height: 96 },
      alwaysOnTop: true
    });
  });

  it("persists merged settings", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    const store = createSettingsStore(tempDir, () => display);

    await store.save({ alwaysOnTop: false });
    const raw = JSON.parse(await readFile(join(tempDir, "settings.json"), "utf8"));

    expect(raw.alwaysOnTop).toBe(false);
    await expect(store.load()).resolves.toMatchObject({ alwaysOnTop: false });
  });

  it("recovers from invalid json", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pingu-settings-"));
    await writeFile(join(tempDir, "settings.json"), "{bad json", "utf8");
    const store = createSettingsStore(tempDir, () => display);

    await expect(store.load()).resolves.toMatchObject({
      selectedAssetPack: "temporary-pingu"
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- src/main/settingsStore.test.ts
```

Expected: FAIL because `src/main/settingsStore.ts` does not exist.

- [ ] **Step 3: Implement settings store**

Create `src/main/settingsStore.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeSettings } from "../shared/settings";
import type { AppSettings, DisplayBounds } from "../shared/types";

export type SettingsStore = {
  load(): Promise<AppSettings>;
  save(patch: Partial<AppSettings>): Promise<AppSettings>;
};

export function createSettingsStore(userDataPath: string, getPrimaryDisplayBounds: () => DisplayBounds): SettingsStore {
  const filePath = join(userDataPath, "settings.json");

  async function readPersisted(): Promise<Partial<AppSettings> | undefined> {
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as Partial<AppSettings>;
    } catch {
      return undefined;
    }
  }

  async function load(): Promise<AppSettings> {
    return normalizeSettings(await readPersisted(), getPrimaryDisplayBounds());
  }

  async function save(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await load();
    const next = normalizeSettings({ ...current, ...patch }, getPrimaryDisplayBounds());
    await mkdir(userDataPath, { recursive: true });
    await writeFile(filePath, JSON.stringify(next, null, 2), "utf8");
    return next;
  }

  return { load, save };
}
```

- [ ] **Step 4: Run settings store tests**

Run:

```bash
npm run test -- src/main/settingsStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit settings store**

Run:

```bash
git add src/main/settingsStore.ts src/main/settingsStore.test.ts
git commit -m "feat: persist local settings"
```

## Task 7: Electron Window, Tray, and IPC

**Files:**
- Create: `src/main/windowService.ts`
- Create: `src/main/trayService.ts`
- Create: `src/main/main.ts`
- Create: `src/preload/preload.ts`
- Create: `src/renderer/src/global.d.ts`

- [ ] **Step 1: Implement window service**

Create `src/main/windowService.ts`:

```ts
import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import type { AppSettings, DisplayBounds, WindowBounds } from "../shared/types";

export function getPrimaryDisplayBounds(): DisplayBounds {
  return screen.getPrimaryDisplay().workArea;
}

export function createPetWindow(settings: AppSettings): BrowserWindow {
  const window = new BrowserWindow({
    x: settings.windowBounds.x,
    y: settings.windowBounds.y,
    width: settings.windowBounds.width,
    height: settings.windowBounds.height,
    minWidth: 72,
    minHeight: 72,
    maxWidth: 180,
    maxHeight: 180,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    hasShadow: false,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.setAlwaysOnTop(settings.alwaysOnTop, "floating");
  return window;
}

export function getWindowBounds(window: BrowserWindow): WindowBounds {
  const bounds = window.getBounds();
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  };
}
```

- [ ] **Step 2: Implement tray service**

Create `src/main/trayService.ts`:

```ts
import { app, Menu, Tray, nativeImage } from "electron";

export function createTray(onShow: () => void): Tray | undefined {
  if (process.platform === "linux") {
    return undefined;
  }

  const tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("Pingu Desktop Pet");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show Pingu", click: onShow },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() }
    ])
  );
  return tray;
}
```

- [ ] **Step 3: Implement preload API**

Create `src/preload/preload.ts`:

```ts
import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, PinguDesktopApi } from "../shared/types";

const api: PinguDesktopApi = {
  getSettings: () => ipcRenderer.invoke("settings:get") as Promise<AppSettings>,
  updateSettings: (patch) => ipcRenderer.invoke("settings:update", patch) as Promise<AppSettings>,
  resetWindowPosition: () => ipcRenderer.invoke("window:reset-position") as Promise<AppSettings>,
  moveWindowBy: (delta) => ipcRenderer.invoke("window:move-by", delta) as Promise<AppSettings>,
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke("window:set-always-on-top", enabled) as Promise<AppSettings>,
  quit: () => ipcRenderer.invoke("app:quit") as Promise<void>,
  getAppInfo: () => ipcRenderer.invoke("app:info")
};

contextBridge.exposeInMainWorld("pinguDesktop", api);
```

- [ ] **Step 4: Add renderer global typing**

Create `src/renderer/src/global.d.ts`:

```ts
import type { PinguDesktopApi } from "../../shared/types";

declare global {
  interface Window {
    pinguDesktop: PinguDesktopApi;
  }
}

export {};
```

- [ ] **Step 5: Implement main process**

Create `src/main/main.ts`:

```ts
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { createSettingsStore } from "./settingsStore";
import { createPetWindow, getPrimaryDisplayBounds, getWindowBounds } from "./windowService";
import { createTray } from "./trayService";
import type { AppSettings } from "../shared/types";

let petWindow: BrowserWindow | undefined;

const store = createSettingsStore(app.getPath("userData"), getPrimaryDisplayBounds);

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

  if (process.env.ELECTRON_RENDERER_URL) {
    await petWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await petWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("settings:get", () => store.load());

  ipcMain.handle("settings:update", async (_event, patch: Partial<AppSettings>) => {
    const settings = await store.save(patch);
    petWindow?.setAlwaysOnTop(settings.alwaysOnTop, "floating");
    app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
    return settings;
  });

  ipcMain.handle("window:reset-position", async () => {
    const current = await store.load();
    const settings = await store.save({
      windowBounds: {
        ...current.windowBounds,
        x: getPrimaryDisplayBounds().x + 24,
        y: getPrimaryDisplayBounds().y + 24
      }
    });
    petWindow?.setBounds(settings.windowBounds);
    return settings;
  });

  ipcMain.handle("window:move-by", async (_event, delta: { x: number; y: number }) => {
    if (!petWindow || petWindow.isDestroyed()) {
      return store.load();
    }

    const current = petWindow.getBounds();
    petWindow.setPosition(current.x + Math.round(delta.x), current.y + Math.round(delta.y));
    return store.save({ windowBounds: getWindowBounds(petWindow) });
  });

  ipcMain.handle("window:set-always-on-top", async (_event, enabled: boolean) => {
    const settings = await store.save({ alwaysOnTop: enabled });
    petWindow?.setAlwaysOnTop(enabled, "floating");
    return settings;
  });

  ipcMain.handle("app:quit", () => {
    app.quit();
  });

  ipcMain.handle("app:info", () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  }));
}

void app.whenReady().then(async () => {
  registerIpc();
  await createWindow();
  createTray(() => petWindow?.show());
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit Electron shell**

Run:

```bash
git add src/main src/preload src/renderer/src/global.d.ts
git commit -m "feat: add Electron shell services"
```

## Task 8: React Renderer and Pet UI

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/styles.css`

- [ ] **Step 1: Create renderer HTML**

Create `src/renderer/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pingu Desktop Pet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create React entry**

Create `src/renderer/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create app component**

Create `src/renderer/src/App.tsx`:

```tsx
import { useEffect, useMemo, useReducer, useRef, useState, type PointerEvent } from "react";
import manifest from "../assets/pingu/manifest.json";
import { getAssetForMood, validateAssetManifest } from "../../shared/assets";
import { createInitialPetState, reducePetState } from "../../shared/petStateMachine";
import type { AppSettings } from "../../shared/types";
import type { PetAssetManifest, PetEvent } from "../../shared/petTypes";

const petManifest = manifest as PetAssetManifest;

function nowEvent(type: PetEvent["type"]): PetEvent {
  return { type, now: Date.now() } as PetEvent;
}

export function App(): JSX.Element {
  const [petState, dispatchPet] = useReducer(reducePetState, createInitialPetState(Date.now()));
  const [settings, setSettings] = useState<AppSettings | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [message, setMessage] = useState("");
  const dragRef = useRef<{ pointerId: number; screenX: number; screenY: number; moved: boolean } | undefined>();
  const manifestWarnings = useMemo(() => validateAssetManifest(petManifest), []);
  const assetPath = getAssetForMood(petManifest, petState.mood);

  useEffect(() => {
    void window.pinguDesktop.getSettings().then(setSettings);
    dispatchPet(nowEvent("app_started"));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() - petState.lastInteractionAt > 120000 && petState.mood !== "sleepy") {
        dispatchPet(nowEvent("idle_timeout"));
      }
    }, 15000);

    return () => window.clearInterval(timer);
  }, [petState.lastInteractionAt, petState.mood]);

  async function updateAlwaysOnTop(enabled: boolean): Promise<void> {
    try {
      const next = await window.pinguDesktop.setAlwaysOnTop(enabled);
      setSettings(next);
      dispatchPet(nowEvent("settings_changed"));
      setMessage("Saved");
    } catch {
      setMessage("Could not save setting");
    }
  }

  async function updateLaunchAtLogin(enabled: boolean): Promise<void> {
    try {
      const next = await window.pinguDesktop.updateSettings({ launchAtLogin: enabled });
      setSettings(next);
      dispatchPet(nowEvent("settings_changed"));
      setMessage("Saved");
    } catch {
      setMessage("Could not save setting");
    }
  }

  async function resetPosition(): Promise<void> {
    try {
      const next = await window.pinguDesktop.resetWindowPosition();
      setSettings(next);
      dispatchPet(nowEvent("settings_changed"));
      setMessage("Position reset");
    } catch {
      setMessage("Could not reset position");
    }
  }

  function handlePetClick(): void {
    if (dragRef.current?.moved) {
      return;
    }

    setPopoverOpen((value) => !value);
    dispatchPet(nowEvent("user_clicked"));
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    dragRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    dispatchPet(nowEvent("user_drag_started"));
  }

  async function handlePointerMove(event: PointerEvent<HTMLButtonElement>): Promise<void> {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.screenX - drag.screenX;
    const deltaY = event.screenY - drag.screenY;
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      moved: true
    };
    const next = await window.pinguDesktop.moveWindowBy({ x: deltaX, y: deltaY });
    setSettings(next);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>): void {
    if (dragRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dispatchPet(nowEvent("user_drag_ended"));
      window.setTimeout(() => {
        dragRef.current = undefined;
      }, 0);
    }
  }

  return (
    <main className="app-shell">
      <button
        className={`pet-button pet-${petState.mood}`}
        aria-label="Open Pingu settings"
        onClick={handlePetClick}
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => void handlePointerMove(event)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img key={`${petState.mood}-${petState.animationNonce}`} src={assetPath} alt="" draggable={false} />
      </button>

      {popoverOpen && settings ? (
        <section className="popover" aria-label="Pingu settings">
          <div className="popover-title">Pingu</div>
          <label>
            <span>Always on top</span>
            <input
              type="checkbox"
              checked={settings.alwaysOnTop}
              onChange={(event) => void updateAlwaysOnTop(event.currentTarget.checked)}
            />
          </label>
          <label>
            <span>Start at login</span>
            <input
              type="checkbox"
              checked={settings.launchAtLogin}
              onChange={(event) => void updateLaunchAtLogin(event.currentTarget.checked)}
            />
          </label>
          <button type="button" onClick={() => void resetPosition()}>
            Reset position
          </button>
          <button type="button" onClick={() => void window.pinguDesktop.quit()}>
            Quit
          </button>
          {message ? <p className="message">{message}</p> : null}
          {manifestWarnings.length > 0 ? <p className="message">Using fallback asset</p> : null}
        </section>
      ) : null}
    </main>
  );
}
```

- [ ] **Step 4: Create styling**

Create `src/renderer/src/styles.css`:

```css
:root {
  color-scheme: light;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: transparent;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
}

button,
input {
  font: inherit;
}

.app-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background: transparent;
}

.pet-button {
  width: min(100vw, 96px);
  height: min(100vh, 96px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-app-region: no-drag;
  touch-action: none;
}

.pet-button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  animation: breathe 4s ease-in-out infinite;
}

.pet-greet img,
.pet-happy img,
.pet-attention img {
  animation: hop 700ms ease-out 1;
}

.pet-dragging img {
  animation: tilt 500ms ease-in-out infinite alternate;
}

.pet-sleepy img {
  animation: sleepy 5s ease-in-out infinite;
}

.popover {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 168px;
  padding: 10px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
  color: #111827;
  font-size: 12px;
  -webkit-app-region: no-drag;
}

.popover-title {
  margin-bottom: 8px;
  font-weight: 700;
}

.popover label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 8px 0;
}

.popover button {
  display: block;
  width: 100%;
  min-height: 28px;
  margin-top: 8px;
  border: 1px solid rgba(17, 24, 39, 0.16);
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
}

.message {
  margin: 8px 0 0;
  color: #4b5563;
}

@keyframes breathe {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.015);
  }
}

@keyframes hop {
  0% {
    transform: translateY(0);
  }
  45% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes tilt {
  from {
    transform: rotate(-3deg);
  }
  to {
    transform: rotate(3deg);
  }
}

@keyframes sleepy {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.94;
  }
  50% {
    transform: translateY(3px);
    opacity: 0.82;
  }
}
```

- [ ] **Step 5: Run typecheck and build**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands exit with code 0.

- [ ] **Step 6: Commit renderer**

Run:

```bash
git add src/renderer
git commit -m "feat: add floating pet renderer"
```

## Task 9: Manual App Verification

**Files:**
- Modify only if verification exposes a defect.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 2: Start development app**

Run:

```bash
npm run dev
```

Expected: Electron opens a transparent frameless floating pet window.

- [ ] **Step 3: Verify visible behavior**

Check these items manually:

```text
1. A small temporary Pingu appears.
2. The pet window stays above normal windows.
3. Clicking the pet opens the settings popover.
4. Always on top can be toggled.
5. Start at login can be toggled without crashing.
6. Reset position moves the pet near the top-left safe margin.
7. Quit closes the app.
8. The pet animation is subtle and does not resize the window.
```

- [ ] **Step 4: Verify settings persistence**

Run the dev app, move the window, quit, and start it again:

```bash
npm run dev
```

Expected: saved window position and settings are restored.

- [ ] **Step 5: Commit verification fixes**

If Step 3 or Step 4 required changes, commit only those changes:

```bash
git add src package.json package-lock.json electron.vite.config.ts tsconfig.json vitest.config.ts
git commit -m "fix: stabilize desktop pet verification"
```

If no changes were required, do not create an empty commit.

## Task 10: Documentation and Handoff

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

Create `README.md`:

````md
# Pingu Desktop Pet

Pingu Desktop Pet is a minimal floating desktop pet app. The first version focuses on a small, quiet, always-on-top character that can be moved around the desktop and stores local settings.

## IP Notice

This project is designed around a licensed-use assumption for official Pingu IP. Until licensing is confirmed, the app uses placeholder SVG assets and a replaceable asset pack structure.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- macOS or Windows for v1 manual verification

## Commands

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run build
```

## Product Documents

- `docs/research/pingu-character-research-2026-05-15.md`
- `docs/superpowers/specs/2026-05-16-pingu-desktop-pet-design.md`
- `docs/superpowers/plans/2026-05-16-pingu-desktop-pet.md`

## v1 Scope

Included:

- Floating transparent pet window
- Always-on-top setting
- Drag positioning
- Minimal settings popover
- Local settings storage
- Replaceable SVG asset pack

Excluded:

- Timer UI
- Schedule management
- Statistics
- Cloud sync
- Official Pingu sound effects
````

- [ ] **Step 2: Run final checks**

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 3: Commit README**

Run:

```bash
git add README.md
git commit -m "docs: add project handoff"
```

## Self-Review Checklist

- Product design section 1 is covered by Tasks 1, 7, and 8.
- Success criteria in design section 2 are covered by Tasks 7, 8, and 9.
- v1 included scope is covered by Tasks 1 through 10.
- v1 excluded scope is kept out of implementation tasks.
- Character states and reserved timer events are covered by Task 2.
- Asset manifest policy is covered by Tasks 4 and 5.
- Electron main, preload, and renderer boundaries are covered by Tasks 7 and 8.
- Local settings storage is covered by Tasks 3, 6, and 9.
- macOS and Windows manual verification is covered by Task 9.
- No task requires official Pingu assets or official Pingu sound.

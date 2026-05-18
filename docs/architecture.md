# 아키텍처와 기술 스택

이 문서는 현재 코드 기준으로 Pingu Desktop Pet의 기술 스택, 런타임 구조,
데이터 흐름, 주요 타입과 API 경계를 정리합니다.

## 기술 스택

- Electron 42: 데스크탑 창, 트레이, OS 설정, IPC
- React 19: 펫 UI와 별도 설정 창 UI
- TypeScript 5.8: main, preload, renderer, shared 타입
- Vite 6 / electron-vite 3: 개발 서버와 빌드 파이프라인
- Vitest 3: shared 로직과 main helper 단위 테스트
- electron-builder 26: macOS dmg, Windows nsis 패키징 설정

주요 명령은 `package.json`에 정의되어 있습니다.

- `npm run dev`: Electron 개발 실행
- `npm run test`: Vitest 단위 테스트
- `npm run typecheck`: TypeScript 타입 검사
- `npm run build`: typecheck, test, electron-vite build
- `npm run dist:mac`, `npm run dist:win`: 패키징

앱 표시 이름은 `src/shared/appIdentity.ts`의 `APP_DISPLAY_NAME`에서 관리합니다.
macOS 메뉴바와 패키징 metadata의 이름은 `Pingu`로 맞추고, 배포용 아이콘 파일은
`build/icon.icns`, `build/icon.ico`를 사용합니다. 아이콘 제작 기준은 `docs/app-icons.md`에
분리되어 있습니다.

개발 모드에서 실행되는 기본 Electron.app 번들의 OS 표시 이름은 코드의 `app.setName()`만으로
바뀌지 않습니다. `npm run dev`는 `scripts/patch-electron-dev-app.mjs`를 먼저 실행해
로컬 개발용 Electron.app의 `CFBundleName`, `CFBundleDisplayName`, `CFBundleIdentifier`,
`CFBundleIconFile`을 `Pingu` 기준으로 맞춥니다. 패키징 앱은 `package.json`의
electron-builder 설정을 따릅니다.

## 런타임 구조

```mermaid
flowchart LR
  Renderer["Renderer\nReact UI"] --> Preload["Preload\nwindow.pinguDesktop"]
  Preload --> Main["Electron Main\nIPC handlers"]
  Main --> PetWindow["BrowserWindow\ntransparent 96x96 pet"]
  Main --> SettingsWindow["BrowserWindow\nsettings window"]
  Main --> Store["settings.json\nElectron userData"]
  Main --> Tray["Tray menu"]
  Renderer --> Assets["SVG asset pack"]
  Renderer --> Shared["Shared state/types"]
  Main --> Shared
```

### Main process

main process는 OS와 가까운 책임을 가집니다.

- 투명 frameless 96x96 펫 `BrowserWindow` 생성
- 별도 frameless 설정 `BrowserWindow` 생성
- 설정 창 옵션은 `settingsWindowOptions.ts`에서 관리
- always-on-top 설정
- 창 위치 이동, 오른쪽 아래 이동
- `settings.json` 로드/저장
- 트레이/메뉴바 메뉴 생성
- 앱 종료와 macOS activate 처리
- IPC endpoint 등록

설정 저장 위치는 기본적으로 Electron `app.getPath("userData")/settings.json`입니다.
수동 검증 시에는 `PINGU_USER_DATA_DIR` 환경 변수로 저장 위치를 바꿀 수 있습니다.

### Preload

preload는 renderer에 제한된 API만 노출합니다. renderer는 Node API나 Electron IPC에
직접 접근하지 않고 `window.pinguDesktop`만 사용합니다.

### Renderer

renderer는 React로 구성되어 있으며, 다음 책임만 가집니다.

- 현재 route에 따라 펫 창 또는 설정 창 UI 표시
- 펫 창에서 현재 펫 상태에 맞는 SVG 표시
- CSS 기반 저강도 애니메이션
- 펫 클릭 시 `user_clicked` 이벤트로 표정/상태 반응
- pointer event 기반 창 드래그
- 설정 창에서 토글과 command row 처리
- 장시간 미입력 시 `sleepy` 상태 전환

### Shared

shared 모듈은 main과 renderer가 함께 쓰는 순수 TypeScript 코드입니다.

- 설정 타입과 preload API 타입
- 펫 상태, 이벤트, reducer
- 설정 기본값과 bounds 정규화
- asset manifest 검증과 fallback 선택

## 주요 인터페이스

`PinguDesktopApi`는 renderer가 사용할 수 있는 공개 경계입니다.

```ts
type PinguDesktopApi = {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  openSettingsWindow(): Promise<void>;
  showPingu(): Promise<void>;
  moveWindowToBottomRight(): Promise<AppSettings>;
  moveWindowBy(delta: { x: number; y: number }): Promise<AppSettings>;
  setAlwaysOnTop(enabled: boolean): Promise<AppSettings>;
  quit(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
};
```

`AppSettings`는 로컬 저장의 중심 타입입니다.

```ts
type AppSettings = {
  windowBounds: WindowBounds;
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  selectedAssetPack: string;
};
```

`PetEvent`와 `PetMood`는 펫 반응 모델의 중심입니다. v1에서 실제 사용하는 이벤트는
`app_started`, `user_clicked`, `user_drag_started`, `user_drag_ended`,
`idle_timeout`, `settings_changed`입니다. 타이머와 일정 기능을 위해
`timer_started`, `timer_paused`, `timer_completed`, `schedule_due`가 예약되어 있습니다.

`PetAssetManifest`는 asset pack 교체를 위한 고정 인터페이스입니다.

```ts
type PetAssetManifest = {
  id: string;
  displayName: string;
  license: "official-licensed" | "placeholder" | "custom";
  states: Record<PetAssetState, string>;
};
```

## 데이터 흐름

### 설정 로드와 저장

```mermaid
sequenceDiagram
  participant UI as Renderer
  participant API as Preload API
  participant Main as Main IPC
  participant Store as settings.json

  UI->>API: getSettings()
  API->>Main: settings:get
  Main->>Store: load + normalize
  Store-->>Main: AppSettings
  Main-->>API: AppSettings
  API-->>UI: AppSettings
```

설정 파일이 없거나 JSON 파싱에 실패하면 기본값으로 복구합니다. 기본 위치는 현재
디스플레이의 오른쪽 아래 safe margin입니다. 저장된 창 위치가 현재 디스플레이 밖이면
같은 오른쪽 아래 기본 위치로 되돌립니다. 펫 창 크기는 저장된 값과 무관하게 96x96으로
고정합니다.

### 창 이동과 설정 창

드래그 이동은 실제 위치를 저장합니다. 설정은 펫 창을 키워서 열지 않고 트레이/메뉴바에서
별도 설정 창을 여는 방식입니다. `Move to Bottom Right`는 현재 디스플레이 기준으로 펫을
96x96 크기, 24px margin의 오른쪽 아래에 배치하고 저장합니다.

설정 창은 transparent `BrowserWindow`를 host로 사용하고, 실제 배경, 라운드 모서리,
테두리는 renderer의 `.settings-panel`이 담당합니다. 라운드 모서리는 유지하되 macOS/Electron
native rounded border와 CSS border가 겹쳐 모서리 색이 달라지지 않도록, 패널 테두리는
`inset box-shadow`로 그립니다.

```mermaid
flowchart TD
  Drag["사용자 드래그"] --> MoveIPC["window:move-by"]
  MoveIPC --> SetPosition["BrowserWindow.setPosition"]
  SetPosition --> SaveBounds["saveWindowBounds"]

  TrayOpen["트레이 Open Settings"] --> SettingsIPC["settings:open-window"]
  SettingsIPC --> SettingsWindow["settings BrowserWindow 표시"]

  MoveBottomRight["Move to Bottom Right"] --> MoveBRIPC["window:move-to-bottom-right"]
  MoveBRIPC --> DefaultBounds["getDefaultWindowBounds"]
  DefaultBounds --> SaveDefault["saveWindowBounds"]
```

### Asset pack

renderer는 manifest와 상태별 SVG를 import한 뒤 `PetMood`에 맞는 asset을 선택합니다.
상태별 asset이 빠져 있으면 idle asset으로 fallback합니다.

## 개발 모드 주의사항

macOS 개발 모드에서는 `app.setLoginItemSettings`가 로그인 항목 등록 권한 오류를
터미널에 출력할 수 있습니다. 현재 앱은 설정값 저장을 계속 진행하므로 개발 자체에는
문제가 없습니다. 실제 OS 등록 안정화는 패키징된 앱 기준으로 후속 처리합니다.

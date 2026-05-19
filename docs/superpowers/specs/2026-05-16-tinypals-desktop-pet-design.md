# TinyPals Desktop Pet v1 Design

작성일: 2026-05-16

## 1. 제품 정의

TinyPals Desktop Pet은 데스크탑 화면 위에 작게 떠 있는 미니멀한 가상 펫 앱이다. 첫 버전의 목표는 공부 시간 타이머가 아니라, 사용자가 작업 중에도 방해받지 않고 함께 둘 수 있는 작은 캐릭터 존재감을 안정적으로 제공하는 것이다.

기존 초안의 타이머, 통계, CSV, 상세 알림 기능은 v1 범위에서 제외한다. 대신 플로팅 창, 로컬 설정 저장, 방해 최소화, 캐릭터 상태 시스템은 유지한다. 이후 타이머와 일정관리 기능은 TinyPals의 상태 이벤트로 자연스럽게 연결한다.

캐릭터/IP 기준은 [TinyPals IP Safety Notes](../../research/tinypals-ip-safety-2026-05-20.md)를 따른다. 타사 캐릭터 IP의 이름, 외형, 사운드, 세계관은 권리 확인 전에는 제품에 직접 사용하지 않는다. 구현은 교체 가능한 PNG spritesheet asset pack으로 진행한다.

## 2. 사용자와 성공 기준

대상 사용자는 친구/소수 배포 수준의 초기 사용자다. 공개 앱스토어 출시, 계정, 클라우드 동기화, 분석 수집, 마케팅 페이지는 v1의 목표가 아니다.

성공 기준은 다음과 같다.

1. 앱을 실행하면 작은 TinyPals가 데스크탑 위에 안정적으로 떠 있다.
2. TinyPals는 사용자의 작업을 방해하지 않을 만큼 작고 조용하다.
3. 드래그, 클릭, 장시간 미입력 같은 기본 상호작용에 짧고 귀여운 반응을 한다.
4. 앱을 재시작해도 위치, 크기, always-on-top 설정이 유지된다.
5. macOS와 Windows에서 기본 실행, 플로팅, 드래그, 트레이, 설정 저장이 검증된다.
6. 타사 IP 에셋 없이도 custom 캐릭터로 동작하고, 이후 에셋 교체가 쉽다.

## 3. v1 범위

### 포함

- Electron 기반 크로스플랫폼 데스크탑 앱
- 투명하고 프레임 없는 작은 플로팅 창
- 기본 always-on-top 동작과 설정 토글
- 마우스 드래그를 통한 위치 이동
- 클릭 시 캐릭터 반응
- 위치, 크기, always-on-top, 시작 시 실행 설정의 로컬 저장
- 상태별 PNG row spritesheet와 CSS `steps()` 기반 프레임 애니메이션
- custom fallback 에셋
- macOS와 Windows 기본 검증

### 제외

- 카운트다운/스톱워치 타이머 UI
- 학습/작업 시간 통계
- CSV 내보내기
- 일정관리
- 캐릭터 검색, 스킨 마켓, 다중 캐릭터 시스템
- 계정, 클라우드 동기화, 원격 백업
- 자동 업데이트
- 클릭 통과, 전체화면 자동 숨김, 앱별 숨김 규칙
- 타사 IP 사운드 직접 사용

## 4. 사용자 경험

앱 실행 직후 화면에는 약 96x104px 크기의 작은 TinyPals만 보인다. TinyPals는 데스크탑 가장자리를 과하게 차지하지 않고, 기본적으로 작업 영역 위에 조용히 떠 있다.

사용자가 TinyPals를 클릭하면 캐릭터가 짧게 반응한다. 설정은 펫 클릭이 아니라 트레이/메뉴바의 설정 창에서 제공한다.

사용자가 TinyPals를 드래그하면 최초 드래그 방향에 맞춰 `running-left` 또는 `running-right` 애니메이션으로 반응한다. 드래그가 끝나면 새 위치가 저장된다. 장시간 입력이 없으면 TinyPals는 `waiting` 상태로 전환된다.

사운드는 v1에서 기본 제공하지 않는다. 타사 캐릭터 IP의 대표성 있는 소리는 권리와 사용성 리스크가 모두 있으므로, 후속 버전에서 권리와 방해도 설정이 정리된 뒤 선택 기능으로만 검토한다.

## 5. 캐릭터 상태 시스템

캐릭터 상태 시스템은 v1의 핵심 내부 모델이다. 화면은 단순하지만, 향후 타이머와 일정관리 기능이 붙을 때 상태 이벤트를 통해 TinyPals가 자연스럽게 반응할 수 있어야 한다.

### 상태

| 상태 | 트리거 | 표현 |
|---|---|---|
| idle | 기본 상태 | 조용히 서 있음, 눈 깜빡임 |
| running-right | 오른쪽 드래그 중 | 오른쪽으로 이동하는 방향성 있는 동작 |
| running-left | 왼쪽 드래그 중 | 왼쪽으로 이동하는 방향성 있는 동작 |
| waving | 클릭 | 짧은 인사 동작 |
| jumping | 긍정 이벤트 예약 | 작은 점프 |
| failed | 실패 이벤트 예약 | 실패 또는 곤란한 반응 |
| waiting | 장시간 미입력 또는 대기 | 사용자의 입력을 기다리는 자세 |
| running | 작업 이벤트 예약 | 집중해서 처리 중인 동작 |
| review | 일정/검토 이벤트 예약 | 집중해서 살펴보는 동작 |

### 이벤트

v1에서 실제로 사용하는 이벤트는 다음과 같다.

- `app_started`
- `user_clicked`
- `user_drag_started`
- `user_drag_ended`
- `idle_timeout`
- `settings_changed`

후속 기능을 위해 예약하는 이벤트는 다음과 같다.

- `timer_started`
- `timer_paused`
- `timer_completed`
- `schedule_due`

예약 이벤트는 v1 UI에서 노출하지 않지만, 타입과 reducer 구조에는 포함한다. 이렇게 하면 타이머 기능을 추가할 때 캐릭터 모델을 다시 뜯지 않고 이벤트 발행만 연결할 수 있다.

## 6. 에셋 정책

에셋은 hatch-pet 표준 상태별 PNG row spritesheet와 `pet.json` 파일로 관리한다.

```ts
type PetAssetState =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

type PetAssetManifest = {
  id: string;
  displayName: string;
  description: string;
  license: "official-licensed" | "placeholder" | "custom";
  source?: {
    type: "hatch-pet-atlas";
    atlasFile: string;
    cell: { width: number; height: number };
    outputScale: number;
  };
  frame: { width: number; height: number };
  states: Record<
    PetAssetState,
    { file: string; frameCount: number; fps: number; loop: boolean }
  >;
};
```

기본 Dough Penguin asset pack은 hatch-pet 2x 투명 atlas `spritesheet-2x.png`를 원본으로
보관하고, `npm run assets:tinypals`로 384x416 atlas cell을 검증한 뒤 renderer용 상태별 PNG
row spritesheet를 파생한다. 런타임의 논리 frame은 기본 96x104이지만 raster source는 더
높은 해상도를 유지해 Retina 환경에서 흐림을 줄인다. hatch-pet contact sheet는 checkerboard,
라벨, border가 합성된 QA 산출물이므로 투명 배경 추출 원본으로 사용하지 않는다.

기본 asset pack은 `custom`으로 표시한다. 새 에셋을 받으면 동일한 상태 키를 유지한 채 파일과 metadata만 교체한다. 상태 키나 파일이 빠져 있으면 앱은 idle spritesheet로 fallback한다.

임시 에셋은 타사 캐릭터와 혼동될 정도로 유사하게 만들지 않는다. 목적은 화면 동작과 교체 구조 검증이다.

## 7. 기술 구조

기술 스택은 Electron, TypeScript, React, Vite를 기준으로 한다.

### Electron main

main process는 OS와 가까운 책임만 갖는다.

- frameless transparent BrowserWindow 생성
- always-on-top 설정
- 창 위치와 크기 저장/복구
- 모니터 변경 시 화면 밖 위치 복구
- 트레이 메뉴 제공
- 앱 종료와 시작 시 실행 설정 처리
- renderer와의 IPC endpoint 제공

### Preload

preload는 renderer에 제한된 API만 노출한다.

```ts
type TinyPalsDesktopApi = {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
  onSettingsChanged(listener: (settings: AppSettings) => void): () => void;
  openSettingsWindow(): Promise<void>;
  showTinyPals(): Promise<void>;
  moveWindowToBottomRight(): Promise<AppSettings>;
  moveWindowBy(delta: { x: number; y: number }): Promise<AppSettings>;
  resizeWindowTo(size: WindowSize): Promise<AppSettings>;
  setAlwaysOnTop(enabled: boolean): Promise<AppSettings>;
  quit(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
};
```

renderer에서 Node API에 직접 접근하지 않는다.

### Renderer

renderer는 캐릭터 표시와 설정 창 UI만 담당한다.

- `PetRenderer`: 현재 상태에 맞는 PNG row spritesheet와 CSS `steps()` animation 적용
- `PetStateMachine`: 이벤트를 상태로 변환
- `SettingsApp`: 최소 설정 UI
- `useDesktopSettings`: preload API와 설정 상태 연결

## 8. 데이터 저장

v1은 로컬 저장만 사용한다. 저장 데이터는 사용자 기기 밖으로 전송하지 않는다.

```ts
type AppSettings = {
  windowBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  selectedAssetPack: string;
};
```

기본값은 다음과 같다.

- width: 96
- height: 104
- alwaysOnTop: true
- launchAtLogin: false
- selectedAssetPack: `dough-penguin`

저장된 위치가 현재 디스플레이 영역 밖이면 앱 시작 시 기본 위치로 복구한다. 저장 파일이 깨졌거나 누락되면 기본값으로 시작하고, 사용자의 앱 실행을 막지 않는다.

## 9. OS 정책

v1의 검증 대상은 macOS와 Windows다. Linux는 Electron 구조상 가능성을 열어두지만 완료 기준에 포함하지 않는다.

OS별 UX 차이가 생길 수 있는 항목은 main process 내부의 window service로 격리한다.

- always-on-top 동작
- frameless transparent window 처리
- 트레이/메뉴 동작
- launch at login 설정
- 멀티 모니터 위치 복구

OS별 구현이 달라져도 renderer와 상태 시스템은 바뀌지 않아야 한다.

## 10. 에러 처리

- 설정 로드 실패: 기본 설정으로 복구하고 앱은 계속 실행한다.
- 설정 저장 실패: 설정 창에서 짧은 실패 메시지를 보여주고 기존 화면은 유지한다.
- 에셋 로드 실패: idle spritesheet로 fallback한다.
- 창 위치가 화면 밖임: 기본 위치로 이동한다.
- 트레이 생성 실패: 플로팅 창은 유지하고 설정 창의 종료 버튼은 계속 제공한다.

에러 메시지는 사용자를 놀라게 하지 않는 짧은 문장으로 제한한다. 자세한 로그는 개발 모드에서만 콘솔에 남긴다.

## 11. 테스트 계획

### 단위 테스트

- `PetStateMachine` 이벤트별 상태 전환
- `AppSettings` 기본값 병합
- 깨진 설정 파일 복구
- 화면 밖 window bounds 보정
- asset manifest 누락 상태 fallback 처리

### 통합 테스트

- preload API가 renderer에 필요한 함수만 노출하는지 확인
- 설정 변경 후 저장된 값이 재시작 시 복구되는지 확인
- always-on-top 토글이 main process 설정으로 전달되는지 확인

### 수동 QA

- macOS에서 앱 실행, 플로팅 표시, 드래그, 클릭 반응, 위치 저장 확인
- Windows에서 앱 실행, 플로팅 표시, 드래그, 클릭 반응, 위치 저장 확인
- 작은 화면과 멀티 모니터에서 화면 밖 복구 확인
- 기본 애니메이션이 과하게 시선을 끌지 않는지 확인
- 타사 IP 에셋 없이 custom character로 전체 흐름이 동작하는지 확인

## 12. 후속 확장

v2 이후 타이머 기능은 별도 feature module로 추가한다. 타이머 모듈은 캐릭터를 직접 조작하지 않고 `timer_started`, `timer_paused`, `timer_completed` 이벤트만 발행한다.

일정관리도 같은 방식으로 `schedule_due` 이벤트를 발행한다. TinyPals는 기능별 내부 상태를 알 필요 없이 이벤트에 반응한다.

이 구조를 유지하면 앱은 생산성 도구로 확장되더라도 첫 인상은 계속 "작은 데스크탑 펫"으로 남는다.

## 13. 결정 사항

- 첫 버전은 펫 중심이다.
- 타이머는 후속 확장이다.
- 기술 스택은 Electron + TypeScript + React/Vite다.
- 검증 OS는 macOS와 Windows다.
- 캐릭터 에셋은 상태별 PNG row spritesheet와 `pet.json`으로 교체 가능하게 둔다.
- 타사 캐릭터 IP는 권리 확인 전에는 직접 사용하지 않는다.
- v1의 완료 기준은 기능 수가 아니라 실사용 안정성과 캐릭터 완성도다.

# 구현 지도와 현재 상황

이 문서는 나중에 기능을 확인하거나 수정할 때 어디서 시작해야 하는지 정리한 지도입니다.
코드의 현재 구현 상태를 기준으로 작성했습니다.

## 기능별 수정 위치

| 수정하려는 영역 | 먼저 볼 위치 | 메모 |
|---|---|---|
| 앱 이름/패키징 아이콘 | `src/shared/appIdentity.ts`, `package.json`, `scripts/patch-electron-dev-app.mjs`, `build/icon.*`, `docs/app-icons.md` | macOS 메뉴바 이름, 개발용 Electron.app metadata 패치, productName, 배포용 아이콘 |
| 플로팅 펫 창 생성 | `src/main/windowService.ts` | 투명 frameless resizable `BrowserWindow`, always-on-top |
| 앱 lifecycle / IPC | `src/main/main.ts` | IPC 등록, 펫 창 이동, 설정 창 생성, 앱 시작과 종료 |
| 설정 창 BrowserWindow 옵션 | `src/main/settingsWindowOptions.ts` | transparent host, fixed size, rounded border 충돌 방지 |
| 트레이/메뉴바 메뉴 | `src/main/trayService.ts`, `src/main/assets/tray-icon-template.png` | `Open Settings`, `Show TinyPals`, `Quit`, template tray icon |
| 설정 저장 | `src/main/settingsStore.ts` | Electron `userData` 아래 `settings.json` 읽기/쓰기 |
| 설정 기본값/정규화 | `src/shared/settings.ts` | 오른쪽 아래 기본 bounds, 화면 밖 위치 복구, 96:104 비율 resize bounds |
| programmatic bounds event 방지 | `src/main/windowResize.ts` | 코드가 호출한 bounds 변경 이벤트를 저장 이벤트와 구분 |
| preload API | `src/preload/preload.ts` | `window.tinyPalsDesktop` 노출, settings change 구독 |
| API 타입 | `src/shared/types.ts` | `TinyPalsDesktopApi`, `AppSettings` |
| 펫 상태 모델 | `src/shared/petTypes.ts`, `src/shared/petStateMachine.ts` | 상태, 이벤트, reducer |
| renderer UI | `src/renderer/src/App.tsx` | 펫 클릭 반응, 드래그, 설정 창 route, command row 처리 |
| 캐릭터 registry | `src/renderer/src/petAssetRegistry.ts` | 설정 선택지와 정적 asset pack import |
| 스타일/애니메이션 | `src/renderer/src/styles.css` | 펫 애니메이션, Notion 스타일 설정 창, rounded border |
| 설정 창 스타일 회귀 테스트 | `src/renderer/src/settingsStyles.test.ts` | 라운드 유지와 transparent shell 조건 확인 |
| asset pack | `src/renderer/assets/tinypals/*`, `src/renderer/assets/tinypals-test/*` | `pet.json`과 상태별 PNG row spritesheet |
| asset 검증 | `src/shared/assets.ts` | 필수 상태 asset 누락 검증과 fallback |

## 현재 구현 완료

- Electron 기반 데스크탑 앱 scaffold
- macOS 메뉴바/패키징 표시 이름 `TinyPals`
- 임시 앱 아이콘 `build/icon.png`, `build/icon.icns`, `build/icon.ico`
- 개발 모드 Electron.app 이름/아이콘 자동 패치
- 투명 frameless floating pet window
- 펫 창 기본 144x156, 우하단 handle 기반 96:104 비율 유지 resize
- always-on-top 기본값과 토글
- 펫 드래그 위치 이동과 위치 저장
- 펫 클릭 시 `user_clicked` 반응만 처리
- 트레이/메뉴바에서 `Open Settings`, `Show TinyPals`, `Quit` 제공
- 별도 Notion 스타일 설정 창
- `Always on Top`, `Start at Login`, `Pet Character`, `Move to Bottom Right`, `Show TinyPals`, `Quit` UI
- 설정 창 라운드 모서리와 균일한 inset border
- 로컬 `settings.json` 저장과 기본값 복구
- 오른쪽 아래 기본 위치와 화면 밖 window bounds 정규화
- Dough Penguin PNG row spritesheet asset pack과 복사본 테스트 pack
- `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`, `waiting`, `running`, `review` 상태
- 타이머/일정 기능 연결용 reserved event 타입
- 단위 테스트와 build pipeline
- 수동 검증용 `TINYPALS_USER_DATA_DIR` 환경 변수

## 아직 구현하지 않음

- 공부 타이머 UI
- 일정 관리 UI
- 통계, 리포트, CSV export
- 클라우드 동기화
- 자동 업데이트
- 공식 또는 타사 IP asset과 sound
- 패키징된 앱 기준 login item 동작 검증
- macOS/Windows 배포 산출물 검증

## 다음 기능 추가 시작점

### 타이머 기능

시작점은 renderer UI와 shared event입니다.

- `src/shared/petTypes.ts`: 필요하면 timer event payload를 확장
- `src/shared/petStateMachine.ts`: timer event에 따른 mood 유지 또는 추가 반응 조정
- `src/renderer/src/App.tsx`: 타이머 UI는 설정 창과 별도 route 또는 새 창으로 붙일지 먼저 결정
- 새 타이머 로직은 우선 renderer-local 상태로 시작하고, 저장이 필요해지면 `AppSettings` 확장 검토

### 일정 관리

v1에는 schedule 저장소가 없습니다. 일정 기능을 추가할 때는 main process 저장 책임을 먼저
정의하는 편이 안전합니다.

- shared에 일정 타입 추가
- main에 schedule store 추가
- preload API에 schedule CRUD 추가
- renderer에서 due event 발생 시 `schedule_due`를 dispatch

### 에셋 교체

`pet.json`의 상태 키와 frame metadata를 유지하면 교체 범위가 작습니다. 새 캐릭터를
사용자 선택지에 노출하려면 asset 폴더를 추가한 뒤 `petAssetRegistry.ts`에 정적 import로
등록합니다.

- 새 asset 폴더의 `pet.json` `id`, `license`, `displayName`, `description`을 asset pack에 맞게 변경
- hatch-pet 2x 투명 atlas를 새 asset 폴더의 `spritesheet-2x.png`로 배치
- `npm run assets:tinypals`를 실행해 atlas 검증과 상태별 PNG row spritesheet 재생성을 함께 수행
- frame 크기나 frame count가 바뀌면 `pet.json`과 asset 검증 테스트를 함께 갱신
- `src/renderer/src/petAssetRegistry.test.ts`에 새 pack 노출과 manifest 검증을 반영
- QA contact sheet는 배경/라벨/border가 RGB로 합성된 검토 이미지이므로 추출 원본으로 사용하지 않음
- 타사 IP 사용 전 라이선스 확인 문서를 업데이트

### 로그인 실행 안정화

현재 개발 모드에서는 macOS가 login item 등록을 거부하는 로그를 낼 수 있습니다.
후속 작업에서는 패키징 앱 기준으로만 OS 등록을 실행하도록 분리하는 것이 좋습니다.

- `src/main/main.ts`의 `app.setLoginItemSettings` 호출부 확인
- `app.isPackaged` 기준 분기 또는 OS별 helper 도입
- 개발 모드에서는 설정값 저장만 수행

### 설정 창 확장

설정 진입은 펫 클릭이 아니라 트레이/메뉴바입니다. 자주 쓰는 command는
`src/main/trayService.ts`와 `src/renderer/src/App.tsx`의 `SettingsApp`을 함께 확인합니다.
설정 창의 BrowserWindow 속성은 `src/main/settingsWindowOptions.ts`에서 관리하고, 라운드
모서리와 테두리는 `src/renderer/src/styles.css`의 `.settings-panel`에서 관리합니다.

- 새 설정값이 필요하면 `src/shared/types.ts`의 `AppSettings`를 확장
- 저장/정규화는 `src/shared/settings.ts`, `src/main/settingsStore.ts`에서 처리
- 새 command row나 select control은 `SettingsApp`에 추가하고 필요한 IPC는 `src/main/main.ts`, `src/preload/preload.ts`에 연결
- 라운드 모서리 테두리 변경 시 `src/renderer/src/settingsStyles.test.ts`와 실제 Electron 창을 함께 확인

## 검증 기준

문서나 코드 변경 후 최소 확인:

```bash
npm run test
npm run typecheck
npm run build
```

창/OS 동작을 건드렸다면 추가로 확인:

```bash
TINYPALS_USER_DATA_DIR=/private/tmp/tinypals-desktop-pet-user-data npm run dev
```

수동 확인 항목:

- 앱 실행 시 기본 144x156 비율의 작은 펫이 보이고 우하단 handle로 크기가 조절되는가
- 설정 창 `Character`에서 두 asset pack이 보이고 선택 변경이 펫 창에 즉시 반영되는가
- 클릭 시 설정 창이 열리지 않고 표정/상태만 바뀌는가
- 드래그 후 재실행해 위치가 유지되는가
- 트레이/메뉴바의 `Open Settings`로 별도 설정 창이 열리는가
- `Move to Bottom Right` 후 크기는 유지되고 오른쪽 아래 위치가 저장되는가
- `Quit`으로 앱이 종료되는가

## 기존 문서와의 관계

- 캐릭터/IP 기준은 `docs/research/tinypals-ip-safety-2026-05-20.md`를 따른다.
- 현재 구현 기준은 `README.md`, `docs/architecture.md`, 이 문서를 우선한다.
- `docs/superpowers/specs/2026-05-16-tinypals-desktop-pet-design.md`와
  `docs/superpowers/plans/2026-05-16-tinypals-desktop-pet.md`는 과거 결정 기록으로 유지한다.
  현재 문서와 충돌하면 현재 문서를 우선한다.

# 구현 지도와 현재 상황

이 문서는 나중에 기능을 확인하거나 수정할 때 어디서 시작해야 하는지 정리한 지도입니다.
코드의 현재 구현 상태를 기준으로 작성했습니다.

## 기능별 수정 위치

| 수정하려는 영역 | 먼저 볼 위치 | 메모 |
|---|---|---|
| 플로팅 창 생성 | `src/main/windowService.ts` | 투명 frameless `BrowserWindow`, always-on-top, min/max size |
| 앱 lifecycle / IPC | `src/main/main.ts` | IPC 등록, 창 이동/resize/reset, 앱 시작과 종료 |
| 트레이 메뉴 | `src/main/trayService.ts` | Show, Quit 메뉴 |
| 설정 저장 | `src/main/settingsStore.ts` | Electron `userData` 아래 `settings.json` 읽기/쓰기 |
| 설정 기본값/정규화 | `src/shared/settings.ts` | 기본 bounds, 화면 밖 위치 복구, 크기 제한 |
| resize race 방지 | `src/main/windowResize.ts` | settings popover resize queue와 programmatic event suppressor |
| preload API | `src/preload/preload.ts` | `window.pinguDesktop` 노출 |
| API 타입 | `src/shared/types.ts` | `PinguDesktopApi`, `AppSettings`, `ResizeWindowPayload` |
| 펫 상태 모델 | `src/shared/petTypes.ts`, `src/shared/petStateMachine.ts` | 상태, 이벤트, reducer |
| renderer UI | `src/renderer/src/App.tsx` | 펫 클릭, 드래그, 설정 패널, 상태 이벤트 발행 |
| 스타일/애니메이션 | `src/renderer/src/styles.css` | 창 내부 레이아웃, SVG animation, popover |
| asset pack | `src/renderer/assets/pingu/*` | placeholder SVG와 manifest |
| asset 검증 | `src/shared/assets.ts` | 필수 상태 asset 누락 검증과 fallback |

## 현재 구현 완료

- Electron 기반 데스크탑 앱 scaffold
- 투명 frameless floating pet window
- always-on-top 기본값과 토글
- 펫 드래그 위치 이동과 위치 저장
- 클릭 시 settings popover 열기/닫기
- settings popover runtime resize
- `Always on top`, `Start at login`, `Reset position`, `Quit` UI
- 로컬 `settings.json` 저장과 기본값 복구
- 화면 밖 window bounds 정규화
- placeholder Pingu 스타일 SVG asset pack
- `idle`, `greet`, `dragging`, `sleepy`, `happy`, `attention` 상태
- 타이머/일정 기능 연결용 reserved event 타입
- 단위 테스트와 build pipeline
- 수동 검증용 `PINGU_USER_DATA_DIR` 환경 변수

## 아직 구현하지 않음

- 공부 타이머 UI
- 일정 관리 UI
- 통계, 리포트, CSV export
- 클라우드 동기화
- 자동 업데이트
- 공식 Pingu asset과 sound
- 패키징된 앱 기준 login item 동작 검증
- macOS/Windows 배포 산출물 검증

## 다음 기능 추가 시작점

### 타이머 기능

시작점은 renderer UI와 shared event입니다.

- `src/shared/petTypes.ts`: 필요하면 timer event payload를 확장
- `src/shared/petStateMachine.ts`: timer event에 따른 mood 유지 또는 추가 반응 조정
- `src/renderer/src/App.tsx`: 타이머 UI와 event dispatch 연결
- 새 타이머 로직은 우선 renderer-local 상태로 시작하고, 저장이 필요해지면 `AppSettings` 확장 검토

### 일정 관리

v1에는 schedule 저장소가 없습니다. 일정 기능을 추가할 때는 main process 저장 책임을 먼저
정의하는 편이 안전합니다.

- shared에 일정 타입 추가
- main에 schedule store 추가
- preload API에 schedule CRUD 추가
- renderer에서 due event 발생 시 `schedule_due`를 dispatch

### 공식 에셋 교체

placeholder pack의 상태 키를 유지하면 교체 범위가 작습니다.

- `src/renderer/assets/pingu/manifest.json`의 `license`를 `official-licensed`로 변경
- 상태별 SVG 또는 이미지 import를 동일한 mood key에 맞춰 교체
- 공식 IP 사용 전 라이선스 확인 문서를 업데이트

### 로그인 실행 안정화

현재 개발 모드에서는 macOS가 login item 등록을 거부하는 로그를 낼 수 있습니다.
후속 작업에서는 패키징 앱 기준으로만 OS 등록을 실행하도록 분리하는 것이 좋습니다.

- `src/main/main.ts`의 `app.setLoginItemSettings` 호출부 확인
- `app.isPackaged` 기준 분기 또는 OS별 helper 도입
- 개발 모드에서는 설정값 저장만 수행

## 검증 기준

문서나 코드 변경 후 최소 확인:

```bash
npm run test
npm run typecheck
npm run build
```

창/OS 동작을 건드렸다면 추가로 확인:

```bash
PINGU_USER_DATA_DIR=/private/tmp/pingu-desktop-pet-user-data npm run dev
```

수동 확인 항목:

- 앱 실행 시 작은 펫이 보이는가
- 클릭 시 settings popover가 열리는가
- 드래그 후 재실행해 위치가 유지되는가
- 설정 popover를 열고 닫아도 저장된 bounds가 의도치 않게 커지지 않는가
- `Quit`으로 앱이 종료되는가

## 기존 문서와의 관계

- 캐릭터/IP 기준은 `docs/research/pingu-character-research-2026-05-15.md`를 따른다.
- 제품 의도와 v1 범위는 `docs/superpowers/specs/2026-05-16-pingu-desktop-pet-design.md`를 따른다.
- 구현 순서와 과거 결정 기록은 `docs/superpowers/plans/2026-05-16-pingu-desktop-pet.md`에 남긴다.

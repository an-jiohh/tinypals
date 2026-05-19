# TinyPals Desktop Pet

TinyPals Desktop Pet은 데스크탑 위에 작게 떠 있는 미니멀한 가상 펫 앱입니다.
현재 v1은 공부 타이머가 아니라, 추후 타이머와 일정 관리 기능을 붙일 수 있는
플로팅 펫 기반을 먼저 구현한 상태입니다.

## 빠른 실행

요구 사항:

- Node.js 22.12 이상
- npm 10 이상
- macOS 또는 Windows 수동 검증 기준

개발 실행:

```bash
npm install
npm run dev
```

검증:

```bash
npm run test
npm run typecheck
npm run build
```

격리된 설정 파일로 수동 검증하려면 `TINYPALS_USER_DATA_DIR`를 지정합니다.

```bash
TINYPALS_USER_DATA_DIR=/private/tmp/tinypals-desktop-pet-user-data npm run dev
```

## Sentry 오류 수집

배포 후 main process와 renderer 오류를 Sentry로 보낼 수 있습니다.
`.env.example`을 기준으로 로컬 `.env` 또는 CI secret을 설정합니다.

```bash
VITE_SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
SENTRY_ENVIRONMENT=production
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-source-map-upload-token
```

- `VITE_SENTRY_DSN`은 renderer 오류 수집을 켜는 값입니다.
- `SENTRY_DSN`은 Electron main process 오류 수집에 사용합니다.
- `SENTRY_AUTH_TOKEN`은 source map 업로드에만 필요하며 git에 커밋하면 안 됩니다.
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`이 모두 있을 때만 배포 빌드에서
  source map을 만들고 Sentry에 업로드합니다.
- 임시로 비활성화하려면 `SENTRY_DISABLED=true`, `VITE_SENTRY_DISABLED=true`를 설정합니다.

## 현재 구현된 기능

- 작은 custom asset pack 기반 펫을 투명 frameless 창으로 표시
- always-on-top 플로팅 창
- 펫 드래그로 위치 이동
- 펫 클릭 시 짧은 캐릭터 반응
- 트레이/메뉴바에서 설정 창 열기
- `Always on Top`, `Start at Login`, `Pet Character`, `Move to Bottom Right`, `Show TinyPals`, `Quit` 설정 UI
- 로컬 `settings.json` 저장
- 상태별 PNG row spritesheet asset pack 구조
- 추후 타이머/일정 기능 연결을 위한 펫 이벤트 타입 예약

아직 구현하지 않은 기능:

- 공부 타이머 UI
- 일정 관리
- 통계/리포트
- 클라우드 동기화
- 공식 또는 타사 IP 에셋과 사운드

## 문서

- [아키텍처와 기술 스택](docs/architecture.md)
- [구현 지도와 현재 상황](docs/implementation-map.md)
- [TinyPals IP 안전 원칙](docs/research/tinypals-ip-safety-2026-05-20.md)
- [제품 설계 문서](docs/superpowers/specs/2026-05-16-tinypals-desktop-pet-design.md)
- [구현 계획 기록](docs/superpowers/plans/2026-05-16-tinypals-desktop-pet.md)

## 개발 메모

- 개발 모드의 `Start at login`은 macOS에서 실제 로그인 항목 등록이 거부될 수 있습니다.
  이 경우 터미널에 `Unable to set login item: Operation not permitted` 로그가 찍히지만,
  앱 개발과 설정값 저장에는 영향이 없습니다.
- Electron 바이너리가 누락되어 `Electron uninstall`이 나오면 다음 명령으로 복구합니다.

```bash
node node_modules/electron/install.js
```

## IP 주의

TinyPals는 이 프로젝트의 새 제품명입니다. 공개 배포 전에는 기존 캐릭터 IP를 연상시키는
이름, 외형, 사운드, 세계관을 직접 사용하지 않습니다. 캐릭터는 custom asset pack과
교체 가능한 hatch-pet 구조로 관리합니다.

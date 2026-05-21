# TinyPals Desktop Pet

[English README](README.md)

TinyPals Desktop Pet은 Electron, React, 교체 가능한 애니메이션 캐릭터
asset pack으로 만든 작은 플로팅 데스크탑 펫 앱입니다. 현재 v1은 펫 창,
설정, 업데이트, asset pack 기반 구조에 집중합니다. 타이머, 일정, 리포트
기능은 이후 레이어로 추가할 예정입니다.

## 요구 사항

- Node.js 22.12 이상
- npm 10 이상
- 수동 앱 검증 기준 macOS 또는 Windows

## 빠른 시작

```bash
npm install
npm run dev
```

기본 검증:

```bash
npm run test
npm run typecheck
npm run build
```

로컬 패키징:

```bash
npm run dist:mac
npm run dist:win
```

격리된 설정 디렉터리로 수동 테스트:

```bash
TINYPALS_USER_DATA_DIR=/private/tmp/tinypals-desktop-pet-user-data npm run dev
```

## 현재 기능

- 투명 always-on-top 플로팅 펫 창
- 드래그 가능한 펫 위치와 로컬 `settings.json` 저장
- 96:104 frame 비율을 유지하는 펫 창 크기 조절
- 트레이/메뉴바에서 여는 별도 설정 창
- 등록된 asset pack 기반 캐릭터 선택
- hatch-pet 9상태용 PNG row spritesheet 애니메이션
- GitHub Releases 기반 업데이트 확인, 다운로드, 설치 흐름
- 선택적 Sentry crash/error reporting

아직 구현하지 않은 기능:

- 공부 타이머 UI
- 일정 관리
- 통계, 리포트, export
- 클라우드 동기화
- 타사 라이선스 캐릭터, 사운드, 브랜드 asset

## 캐릭터 Asset Pack

TinyPals는 런타임 폴더 탐색 대신 정적 asset-pack registration을 사용합니다.
각 asset pack은 `src/renderer/assets/<asset-id>/` 아래에 위치하며 다음 파일을
포함합니다.

- `pet.json`
- `spritesheet-2x.png`
- `idle`, `running-right`, `running-left`, `waving`, `jumping`, `failed`,
  `waiting`, `running`, `review`용 9개 상태 row PNG

논리 frame 크기는 `96x104`입니다. 현재 renderer row 이미지는 가능한 경우
hatch-pet 원본 atlas cell 해상도를 유지하며, 보통 2x atlas는 `384x416`,
1x atlas는 `192x208`입니다.

현재 등록된 pack:

- `dough-penguin`: 기본 custom generated pet
- `dough-penguin-test`: 캐릭터 선택 검증용 duplicate demo/test pack
- `artist-penguin`: custom generated artist pet
- `cleaner-penguin`: custom generated cleaner pet

새 pack 추가 절차:

1. 파일을 `src/renderer/assets/<asset-id>/`에 export합니다.
2. `src/renderer/src/petAssetRegistry.ts`에 static import와 registry entry를 추가합니다.
3. `src/renderer/src/petAssetRegistry.test.ts`를 업데이트합니다.
4. `npm run test`, `npm run typecheck`, `npm run build`를 실행합니다.

QA contact sheet는 검토용 artifact입니다. 라벨이 포함된 contact sheet를 production
sprite source로 사용하지 마세요.

## TinyPals Hatch Pet Skill

이 저장소는 선택적 개발 도구로 `skills/tinypals-hatch-pet`을 포함합니다.
이 skill은 TinyPals 호환 pet spritesheet를 생성, 검증, export, 등록하기 위한
self-contained Codex workflow입니다.

로컬 Codex skills 디렉터리에 설치:

```bash
npm run skill:tinypals:install
```

repo-local 및 installed skill 검증:

```bash
npm run skill:tinypals:validate
```

앱 런타임에는 이 skill이 필요하지 않습니다. 새 캐릭터 asset을 만들거나 복구하려는
contributor용 도구입니다.

## Sentry

Sentry는 DSN이 없으면 비활성화됩니다. 로컬 `.env` 파일이나 CI secret은
`.env.example`을 기준으로 설정합니다.

```bash
VITE_SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
SENTRY_ENVIRONMENT=production
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-source-map-upload-token
SENTRY_UPLOAD_SOURCEMAPS=false
```

규칙:

- 실제 `.env` 파일이나 secret 값을 커밋하지 않습니다.
- `SENTRY_AUTH_TOKEN`은 source map upload에만 사용합니다.
- source map은 `SENTRY_UPLOAD_SOURCEMAPS=true`, `SENTRY_AUTH_TOKEN`,
  `SENTRY_ORG`, `SENTRY_PROJECT`가 모두 있을 때만 생성 및 업로드됩니다.
- reporting을 강제로 끄려면 `SENTRY_DISABLED=true`,
  `VITE_SENTRY_DISABLED=true`를 설정합니다.
- runtime Sentry config는 `sendDefaultPii: false`를 사용합니다.

## Release

GitHub release publish는 `.github/workflows/release.yml`에 설정되어 있습니다.
`package.json`의 version과 일치하는 `vX.Y.Z` 태그를 push하거나, 로컬에서
`GH_TOKEN`을 설정한 뒤 release script를 실행합니다.

```bash
npm run release:mac
npm run release:win
```

publish 없이 로컬 패키지를 만들려면 `npm run dist:mac`,
`npm run dist:win`을 사용합니다.

## 문서

- [아키텍처](docs/architecture.md)
- [구현 지도](docs/implementation-map.md)
- [UX 규칙](docs/ux-rules.md)
- [Asset pack 가이드](docs/asset-packs.md)
- [앱 아이콘 가이드](docs/app-icons.md)
- [IP와 asset 안전 기준](docs/research/tinypals-ip-safety-2026-05-20.md)
- [보안 정책](SECURITY.md)

## 라이선스와 Asset 고지

이 저장소의 소스 코드는 MIT License로 공개됩니다. 자세한 내용은
[LICENSE](LICENSE)를 확인하세요.

포함된 캐릭터 이미지와 spritesheet는 TinyPals 개발을 위해 추적되는 custom generated
project asset입니다. 이들은 어떤 타사 캐릭터, 브랜드, 프랜차이즈의 공식 asset이
아닙니다. reference 기반 asset을 추가하기 전에는 해당 reference를 의도한 배포 범위에서
사용할 수 있는지 확인하고, 타사 IP 혼동을 만들 수 있는 이름, 실루엣, 사운드, 세계관,
표식을 피해야 합니다.

# Pingu Desktop Pet

Pingu Desktop Pet은 데스크탑 위에 작게 떠 있는 미니멀한 가상 펫 앱입니다.
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

격리된 설정 파일로 수동 검증하려면 `PINGU_USER_DATA_DIR`를 지정합니다.

```bash
PINGU_USER_DATA_DIR=/private/tmp/pingu-desktop-pet-user-data npm run dev
```

## 현재 구현된 기능

- 작은 placeholder Pingu 스타일 펫을 투명 frameless 창으로 표시
- always-on-top 플로팅 창
- 펫 드래그로 위치 이동
- 펫 클릭 시 미니 설정 패널 열기
- `Always on top`, `Start at login`, `Reset position`, `Quit` 설정 UI
- 로컬 `settings.json` 저장
- 상태별 SVG asset pack 구조
- 추후 타이머/일정 기능 연결을 위한 펫 이벤트 타입 예약

아직 구현하지 않은 기능:

- 공부 타이머 UI
- 일정 관리
- 통계/리포트
- 클라우드 동기화
- 공식 Pingu 에셋과 사운드

## 문서

- [아키텍처와 기술 스택](docs/architecture.md)
- [구현 지도와 현재 상황](docs/implementation-map.md)
- [Pingu 캐릭터 리서치](docs/research/pingu-character-research-2026-05-15.md)
- [제품 설계 문서](docs/superpowers/specs/2026-05-16-pingu-desktop-pet-design.md)
- [구현 계획 기록](docs/superpowers/plans/2026-05-16-pingu-desktop-pet.md)

## 개발 메모

- 개발 모드의 `Start at login`은 macOS에서 실제 로그인 항목 등록이 거부될 수 있습니다.
  이 경우 터미널에 `Unable to set login item: Operation not permitted` 로그가 찍히지만,
  앱 개발과 설정값 저장에는 영향이 없습니다.
- Electron 바이너리가 누락되어 `Electron uninstall`이 나오면 다음 명령으로 복구합니다.

```bash
node node_modules/electron/install.js
```

## IP 주의

이 프로젝트는 공식 Pingu IP 라이선스 확보를 전제로 설계되었습니다.
라이선스가 확정되기 전에는 공식 이름, 외형, 사운드, 세계관을 직접 제품에 사용하지 않고,
placeholder SVG와 교체 가능한 asset pack 구조로만 개발합니다.

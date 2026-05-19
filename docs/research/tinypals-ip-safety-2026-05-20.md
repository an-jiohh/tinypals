# TinyPals IP Safety Notes

작성일: 2026-05-20

## 목적

TinyPals는 이 프로젝트의 새 제품명이다. 이 문서는 제품과 코드베이스에서 기존 캐릭터 IP
흔적을 제거하고, 이후 캐릭터 에셋을 만들 때 권리 리스크를 낮추기 위한 기준을 정리한다.

## 원칙

- 제품명, 앱 ID, 공개 API, 문서, 에셋 경로에는 기존 캐릭터 IP 이름을 사용하지 않는다.
- 캐릭터는 `custom` 라이선스의 교체 가능한 hatch-pet asset pack으로 관리한다.
- 공개 배포 전에는 특정 기존 캐릭터의 이름, 실루엣, 대표 사운드, 세계관, 가족/친구 관계를
  직접 차용하지 않는다.
- 타사 IP 요소를 쓰려면 사용 범위와 배포 범위에 맞는 권리 확인을 먼저 끝낸다.
- visual QA에서는 특정 기존 캐릭터와 혼동될 정도로 닮은 외형, 소품, 소리, 문구가 남아
  있지 않은지 확인한다.

## 현재 기본 캐릭터

현재 기본 asset pack은 `Dough Penguin`이다. `pet.json`의 `license`는 `custom`이며,
`src/renderer/assets/tinypals/` 아래 상태별 PNG row spritesheet와 `spritesheet-2x.png`로
관리한다.

이 캐릭터는 제품 동작과 에셋 교체 구조를 검증하기 위한 기본 커스텀 에셋이다. 향후 새
캐릭터를 추가할 때도 동일한 상태 키와 manifest 구조를 유지한다.

## 검증 체크

- legacy IP 이름 검색 결과가 active source, docs, package metadata에서 비어 있어야 한다.
- 새 에셋을 넣은 뒤 `npm run test`, `npm run typecheck`, `npm run build`를 통과해야 한다.
- 캐릭터 변경 시 `docs/app-icons.md`와 `docs/implementation-map.md`의 asset 교체 기준을 함께
  확인한다.

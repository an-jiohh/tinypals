# 릴리스와 자동 업데이트 운영 가이드

이 문서는 TinyPals Desktop Pet을 GitHub Releases로 배포하고, 설치된 앱이
`electron-updater`를 통해 업데이트를 확인하는 운영 절차를 정리합니다.

## 배포 구조

- 배포 원천은 공개 GitHub Releases입니다.
- 앱 안에는 GitHub 토큰을 넣지 않습니다.
- 릴리스 빌드는 `.github/workflows/release.yml`에서 실행됩니다.
- GitHub Flow를 사용합니다. 기능 개발은 `feature/*`, 버그 수정은 `fix/*`,
  긴급 수정은 `hotfix/*` 브랜치에서 진행하고 PR로 `main`에 머지합니다.
- `main`은 항상 배포 가능한 안정 브랜치입니다.
- 태그 이름은 `vX.Y.Z` 형식을 사용하고, `package.json`의 `version`과 반드시
  일치해야 합니다.
- 릴리스 태그는 `main`에 포함된 커밋에서만 생성합니다.
- macOS 산출물은 `dmg`, `zip`, `latest-mac.yml`을 포함해야 합니다.
- Windows 산출물은 NSIS installer와 `latest.yml`을 포함해야 합니다.
- 설치된 앱은 개발 모드가 아닐 때만 GitHub Releases 업데이트 메타데이터를 조회합니다.

## GitHub Flow 규칙

브랜치 운영은 단순하게 유지합니다.

- `main`: 배포 가능한 안정 브랜치
- `feature/*`: 기능 개발
- `fix/*`: 일반 버그 수정
- `hotfix/*`: 배포 이후 긴급 수정

운영 규칙:

- `main`에는 직접 push하지 않고 PR로만 변경을 반영합니다.
- PR은 CI의 `Typecheck`, `Test`, `Build` check가 통과한 뒤 머지합니다.
- 버전 bump와 `vX.Y.Z` 태그 생성은 `main`에서만 수행합니다.
- `feature/*`, `fix/*`, `hotfix/*` 브랜치에서 릴리스 태그를 찍지 않습니다.
- prerelease, beta, nightly 채널은 현재 지원하지 않습니다.

GitHub repository settings에서 `main` branch protection 또는 ruleset을 설정할 때
권장하는 required status checks는 다음과 같습니다.

- `Typecheck`
- `Test`
- `Build`

추가 권장 설정:

- direct push 제한
- force push 금지
- branch deletion 금지
- PR review 요구
- conversation resolution 요구

릴리스 workflow는 태그 커밋이 `origin/main`에 포함되어 있지 않으면 실패합니다. 따라서
실수로 feature 브랜치에서 `vX.Y.Z` 태그를 push해도 GitHub Release 배포로 이어지지
않아야 합니다.

## 릴리스 전 확인

릴리스 전에 로컬에서 기본 검증을 실행합니다.

```bash
npm run test
npm run typecheck
npm run build
```

로컬 패키징만 확인할 때는 publish 없이 빌드합니다.

```bash
npm run dist:mac
npm run dist:win
```

`dist:*` 명령은 GitHub Releases에 업로드하지 않습니다.

## 버전 올리기

패치 릴리스 예시는 다음과 같습니다.

```bash
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "릴리스 X.Y.Z 준비"
```

변경 범위에 따라 `patch` 대신 `minor` 또는 `major`를 사용할 수 있습니다.
커밋 메시지의 `X.Y.Z`는 실제 변경된 버전으로 바꿉니다.

## 태그와 GitHub Actions 배포

`package.json`의 버전이 `0.1.1`이라면 태그는 `v0.1.1`이어야 합니다.
태그는 반드시 최신 `main`에서 생성합니다.

```bash
git switch main
git pull origin main
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

태그가 push되면 GitHub Actions의 `Release` workflow가 실행됩니다.
workflow는 다음을 수행합니다.

1. `npm ci`로 의존성을 설치합니다.
2. 태그 커밋이 `origin/main`에 포함되어 있는지 확인합니다.
3. 태그 버전과 `package.json` 버전이 같은지 확인합니다.
4. macOS에서는 `npm run release:mac`을 실행합니다.
5. Windows에서는 `npm run release:win`을 실행합니다.
6. `GH_TOKEN`으로 GitHub Release에 installer와 업데이트 메타데이터를 업로드합니다.

버전이 일치하지 않으면 workflow는 실패해야 합니다. 이 실패는 정상적인 보호 장치입니다.
태그 커밋이 `main`에 포함되어 있지 않아 실패하는 것도 정상적인 보호 장치입니다.

## GitHub Release 공개 확인

`electron-builder`의 GitHub publish 기본 release type은 `draft`입니다. 따라서 현재
설정에서는 workflow가 완료된 뒤 GitHub Releases 페이지에서 해당 릴리스를 확인하고
수동으로 공개해야 할 수 있습니다.

공개 전에 다음 파일이 함께 올라갔는지 확인합니다.

- macOS: `.dmg`, `.zip`, `latest-mac.yml`
- Windows: `.exe`, `latest.yml`
- 필요 시 각 installer의 `.blockmap`

업데이트 확인은 `latest.yml` 또는 `latest-mac.yml`이 없으면 동작하지 않습니다.

릴리스를 자동으로 바로 공개하고 싶다면 `electron-builder`의 GitHub publish 설정에
`releaseType: "release"`를 명시하도록 패키징 설정과 테스트를 함께 변경합니다.

## 설치된 앱의 업데이트 흐름

앱 런타임은 `src/main/updateService.ts`에서 관리합니다.

- 개발 모드에서는 네트워크 업데이트 확인을 하지 않고 `disabled-development` 상태를 반환합니다.
- 패키징된 앱은 시작 후 약 30초 뒤 조용히 1회 업데이트를 확인합니다.
- 트레이의 `Check for Updates...` 또는 설정 창의 `Check` 버튼으로 수동 확인할 수 있습니다.
- 새 버전이 있으면 상태가 `available`이 됩니다.
- 사용자가 `Download`를 누르면 다운로드를 시작합니다.
- 다운로드가 끝나면 상태가 `downloaded`가 됩니다.
- 사용자가 `Restart`를 누르면 `quitAndInstall()`로 재시작 설치를 수행합니다.

현재 설계는 `autoDownload = false`입니다. 업데이트는 자동 확인만 하고, 다운로드와 설치
재시작은 사용자가 설정 창에서 직접 선택합니다.

## 업데이트 스모크 테스트

실제 업데이트 동작은 두 버전이 필요합니다.

1. `vX.Y.Z`를 GitHub Releases에 공개합니다.
2. 해당 버전의 installer로 앱을 설치하고 실행합니다.
3. `package.json` 버전을 `X.Y.(Z+1)`로 올립니다.
4. 새 태그 `vX.Y.(Z+1)`를 push합니다.
5. GitHub Release가 공개 상태이고 `latest*.yml` 파일이 있는지 확인합니다.
6. 설치된 이전 버전 앱에서 설정 창을 열고 `Check`를 누릅니다.
7. `available` 상태가 표시되는지 확인합니다.
8. `Download` 후 `downloaded` 상태가 되는지 확인합니다.
9. `Restart` 후 앱 버전이 새 버전으로 바뀌는지 확인합니다.

macOS에서는 signing/notarization이 준비되지 않은 빌드가 실제 사용자 환경에서 설치나
업데이트 단계에서 막힐 수 있습니다.

## Signing과 Notarization

운영 배포 전에는 platform별 signing 전략을 정해야 합니다.

macOS:

- Developer ID Application 인증서
- notarization용 Apple 계정 또는 App Store Connect API key
- GitHub Actions secret 구성
- notarization 완료 여부 확인

Windows:

- 코드 서명 인증서
- NSIS installer 서명 여부
- SmartScreen 평판 영향 확인

현재 workflow는 `CSC_IDENTITY_AUTO_DISCOVERY=false`를 사용합니다. signing secret이
준비되기 전에는 릴리스 메타데이터와 UI 흐름까지만 검증하고, macOS 자동 설치 완료를
성공 기준으로 두지 않습니다.

## 문제 해결 체크리스트

- 앱이 업데이트를 찾지 못하면 GitHub Release가 draft가 아닌 공개 상태인지 확인합니다.
- `latest.yml` 또는 `latest-mac.yml`이 릴리스 asset에 있는지 확인합니다.
- 태그 버전과 `package.json` 버전이 일치하는지 확인합니다.
- 앱이 개발 모드로 실행 중이면 업데이트 확인은 비활성화됩니다.
- private repository 또는 private release는 현재 설계의 업데이트 원천으로 사용하지 않습니다.
- macOS 설치가 막히면 signing/notarization 상태를 먼저 확인합니다.

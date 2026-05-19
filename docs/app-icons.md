# 앱 이름과 아이콘 제작 기준

이 문서는 macOS 메뉴바에 표시되는 앱 이름과 배포용 앱 아이콘을 바꾸는 기준입니다.
현재 앱의 표시 이름은 `TinyPals`이며, 타사 캐릭터 IP 에셋은 권리 확인 전까지 사용하지
않습니다.

## 현재 연결된 파일

| 용도 | 파일 | 기준 |
|---|---|---|
| 앱 표시 이름 | `src/shared/appIdentity.ts` | `APP_DISPLAY_NAME = "TinyPals"` |
| 패키징 앱 이름 | `package.json` | `build.productName = "TinyPals"` |
| 개발 모드 앱 metadata 패치 | `scripts/patch-electron-dev-app.mjs` | `npm run dev` 전에 Electron.app 이름/아이콘 패치 |
| macOS 앱 아이콘 | `build/icon.icns` | electron-builder macOS 패키징용 |
| Windows 앱 아이콘 | `build/icon.ico` | electron-builder Windows 패키징용 |
| 원본 아이콘 PNG | `build/icon.png` | 1024x1024, RGBA PNG |
| macOS 메뉴바 아이콘 | `src/main/assets/tray-icon-template.png` | template tray icon |

`build/icon.png`, `build/icon.icns`, `build/icon.ico`는 현재 임시 placeholder입니다.
나중에 실제 아이콘을 만들면 같은 경로의 파일을 교체하면 됩니다.

## 앱 아이콘 제작 기준

원본은 먼저 `build/icon.png`로 만듭니다.

- 크기: 1024x1024 px
- 형식: PNG
- 배경: 투명 또는 단색 배경 가능
- 여백: 아이콘 내용이 가장자리에 붙지 않게 12-18% 정도 확보
- 명도: macOS dock, Finder, dmg 배경에서 모두 식별 가능해야 함
- IP: 타사 캐릭터 외형을 직접 쓰려면 라이선스 확인 후 진행

macOS용 `build/icon.icns`에는 보통 아래 크기들이 들어갑니다.

| iconset 파일명 | 실제 크기 |
|---|---:|
| `icon_16x16.png` | 16x16 |
| `icon_16x16@2x.png` | 32x32 |
| `icon_32x32.png` | 32x32 |
| `icon_32x32@2x.png` | 64x64 |
| `icon_128x128.png` | 128x128 |
| `icon_128x128@2x.png` | 256x256 |
| `icon_256x256.png` | 256x256 |
| `icon_256x256@2x.png` | 512x512 |
| `icon_512x512.png` | 512x512 |
| `icon_512x512@2x.png` | 1024x1024 |

일반적인 생성 흐름은 다음과 같습니다.

```bash
mkdir -p build/TinyPals.iconset
sips -z 16 16 build/icon.png --out build/TinyPals.iconset/icon_16x16.png
sips -z 32 32 build/icon.png --out build/TinyPals.iconset/icon_16x16@2x.png
sips -z 32 32 build/icon.png --out build/TinyPals.iconset/icon_32x32.png
sips -z 64 64 build/icon.png --out build/TinyPals.iconset/icon_32x32@2x.png
sips -z 128 128 build/icon.png --out build/TinyPals.iconset/icon_128x128.png
sips -z 256 256 build/icon.png --out build/TinyPals.iconset/icon_128x128@2x.png
sips -z 256 256 build/icon.png --out build/TinyPals.iconset/icon_256x256.png
sips -z 512 512 build/icon.png --out build/TinyPals.iconset/icon_256x256@2x.png
sips -z 512 512 build/icon.png --out build/TinyPals.iconset/icon_512x512.png
sips -z 1024 1024 build/icon.png --out build/TinyPals.iconset/icon_512x512@2x.png
iconutil -c icns build/TinyPals.iconset -o build/icon.icns
```

Windows용 `build/icon.ico`는 최소 16, 32, 48, 256 px 크기를 포함하는 것이 좋습니다.
가능하면 64, 128 px도 함께 넣습니다.

## 메뉴바/tray 아이콘 제작 기준

macOS 오른쪽 상단 메뉴바에 들어가는 아이콘은 앱 아이콘과 다릅니다.
파일은 `src/main/assets/tray-icon-template.png`입니다.

- 권장 크기: 22x22 px 또는 44x44 px
- 현재 파일: 44x44 px
- 형식: PNG
- 배경: 투명
- 색상: 검정 단색 shape 권장
- 목적: macOS template image로 쓰기 때문에 시스템이 라이트/다크 메뉴바에 맞춰 색을 입힘
- 주의: 세부 묘사가 많으면 메뉴바에서 뭉개지므로 얼굴 실루엣 정도만 남기는 편이 좋음

트레이 아이콘을 더 선명하게 만들려면 44x44 px 캔버스 중앙에 실제 그림을 18-24 px 정도로
배치하고 투명 여백을 남깁니다. 메뉴바에서 잘려 보이면 캔버스 크기를 키우기보다 그림 자체를
작게 배치해야 합니다.

## 교체 후 확인

파일을 교체한 뒤 최소 확인:

```bash
npm run test
npm run build
```

패키징 아이콘까지 확인하려면 다음 명령으로 배포 산출물을 만듭니다.

```bash
npm run dist:mac
```

개발 실행에서 메뉴바 이름을 확인하려면 앱을 실행한 뒤 macOS 왼쪽 상단 앱 메뉴가
`TinyPals`로 표시되는지 확인합니다.

`npm run dev`는 실행 전에 `scripts/patch-electron-dev-app.mjs`를 자동으로 실행합니다.
이 스크립트는 개발용 `node_modules/electron/dist/Electron.app`의 `CFBundleName`,
`CFBundleDisplayName`, `CFBundleIdentifier`, `CFBundleIconFile`만 로컬에서 패치합니다.
`npm install`이나 Electron 재설치 후에는 다음 `npm run dev` 실행 시 다시 적용됩니다.

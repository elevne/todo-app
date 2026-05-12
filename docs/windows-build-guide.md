# 🪟 Windows 빌드 가이드

todo-app (Tauri + React + SQLite)을 **Windows PC에서 직접 빌드/실행**하는 전체 절차입니다.
처음 셋업하시는 분도 따라할 수 있도록 단계별로 작성되었습니다.

---

## 📋 목차
1. [환경 요구사항](#1-환경-요구사항)
2. [사전 설치 도구](#2-사전-설치-도구)
   - 2-1. [Visual Studio Build Tools (MSVC)](#2-1-visual-studio-build-tools-msvc)
   - 2-2. [Rust](#2-2-rust)
   - 2-3. [Node.js](#2-3-nodejs)
   - 2-4. [Git](#2-4-git)
   - 2-5. [WebView2 Runtime](#2-5-webview2-runtime)
3. [설치 검증](#3-설치-검증)
4. [프로젝트 가져오기](#4-프로젝트-가져오기)
5. [의존성 설치](#5-의존성-설치)
6. [아이콘 처리](#6-아이콘-처리)
7. [개발 모드 실행](#7-개발-모드-실행)
8. [배포 빌드](#8-배포-빌드)
9. [자주 발생하는 에러와 해결법](#9-자주-발생하는-에러와-해결법)
10. [개발 워크플로 팁](#10-개발-워크플로-팁)

---

## 1. 환경 요구사항

| 항목 | 최소 | 권장 |
| --- | --- | --- |
| **OS** | Windows 10 (64bit, 1809+) | Windows 11 |
| **CPU** | x64 | x64 |
| **RAM** | 8 GB | 16 GB+ |
| **Disk** | 10 GB 여유 공간 | 20 GB+ |
| **권한** | 일반 사용자 | 관리자 (설치 시) |

> ⚠️ ARM64 Windows는 별도 타겟 설정이 필요합니다. 이 문서는 **x64** 기준입니다.

---

## 2. 사전 설치 도구

순서대로 설치하시면 됩니다. 각 단계 후 **새 PowerShell 창**을 열어야 PATH 변경이 반영됩니다.

### 2-1. Visual Studio Build Tools (MSVC)

Tauri의 Rust 컴파일러가 사용하는 C/C++ 링커(`link.exe`)를 제공합니다.

#### 설치 단계

1. 다운로드 페이지 접속: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. **"Build Tools 다운로드"** 클릭 → `vs_BuildTools.exe` 실행
3. 설치 화면에서 다음 **워크로드 선택**:
   - ✅ **C++ 빌드 도구** (Desktop development with C++)
4. 우측 패널의 "설치 세부 정보"에서 다음 항목 확인:
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 빌드 도구** (필수)
   - ✅ **Windows 11 SDK** 또는 Windows 10 SDK (필수)
   - ⚪ C++ CMake 도구 (선택 — Tauri 자체는 불필요. 보이지 않으면 무시)
5. **설치** 클릭 (약 5~7 GB, 10~20분 소요)
6. 설치 완료 후 **PC 재부팅 권장**

#### 검증
VS Build Tools는 일반 PowerShell의 PATH에 `link.exe`를 등록하지 않습니다. 따라서 일반 PowerShell에서 `where.exe link`는 **빈 결과가 정상**입니다. 아래 두 방법 중 하나로 확인하세요:

```powershell
# 방법 1 — 설치 디렉토리에서 link.exe 실제 파일 확인
Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC" -Recurse -Filter "link.exe" -ErrorAction SilentlyContinue | Select-Object FullName -First 3
# → 경로 몇 개가 출력되면 성공
```

또는 시작 메뉴에서 **"Developer PowerShell for VS 2022"** 를 실행한 뒤 그 창에서:
```powershell
where.exe link
# → ...\VC\Tools\MSVC\...\bin\Hostx64\x64\link.exe 가 출력되면 성공
```

> 💡 Rust의 MSVC 백엔드는 레지스트리를 통해 자동으로 VS Build Tools를 찾으므로,
> `cargo build`/`tauri build`는 일반 PowerShell에서도 정상 동작합니다. PATH 등록 불필요.

> 💡 이미 Visual Studio 2019/2022 Community가 설치되어 있다면 그대로 사용 가능.
> "C++ 워크로드"만 설치되어 있으면 됩니다.

---

### 2-2. Rust

Tauri 백엔드(`src-tauri/`)는 Rust로 작성되어 있습니다.

#### 설치 단계

1. https://rustup.rs 접속
2. **`rustup-init.exe`** 다운로드 후 실행
3. 콘솔 창에 옵션이 표시되면:
   - `1) Proceed with standard installation` 선택 (Enter)
4. 설치 진행 (약 2~5분)
5. **모든 PowerShell 창을 닫고 새로 열기** (PATH 갱신 필수)

#### 검증
```powershell
rustc --version
# → rustc 1.x.x (xxxxxxxxx YYYY-MM-DD)

cargo --version
# → cargo 1.x.x (xxxxxxxxx YYYY-MM-DD)

rustup show
# → 기본 toolchain이 stable-x86_64-pc-windows-msvc 인지 확인
```

> 💡 기본 toolchain이 `gnu`로 나오면 `rustup default stable-x86_64-pc-windows-msvc` 실행.

---

### 2-3. Node.js

React 프론트엔드 빌드/패키지 관리에 필요합니다.

#### 설치 단계

1. https://nodejs.org 접속
2. **LTS 버전** (v20.x 또는 v22.x) `.msi` 다운로드
3. 인스톨러 실행 → 기본 설정으로 설치
   - ✅ "Add to PATH" 체크 (기본값)
   - ✅ "Automatically install the necessary tools..." 체크 안 해도 OK (이미 VS Build Tools 설치됨)
4. 새 PowerShell 창 열기

#### 검증
```powershell
node --version
# → v20.x.x 또는 v22.x.x

npm --version
# → 10.x.x 또는 그 이상
```

> 💡 v18 미만은 Tauri/Vite와 호환 문제 가능. **v20 LTS 이상**을 강력 권장.

---

### 2-4. Git

소스 코드 가져오기/관리에 필요합니다.

#### 설치 단계

1. https://git-scm.com/download/win 접속
2. **64-bit Git for Windows Setup** 다운로드 → 실행
3. 설치 옵션:
   - 기본값 그대로 → Next 연속 → Install
   - 단, "Default editor" 단계에서 익숙한 에디터 선택 (VS Code 추천)
4. 새 PowerShell 창 열기

#### 검증
```powershell
git --version
# → git version 2.x.x.windows.x
```

---

### 2-5. WebView2 Runtime

Tauri 앱의 화면 렌더링 엔진입니다.

| Windows 버전 | 상태 |
| --- | --- |
| Windows 11 | ✅ 이미 내장 — 설치 불필요 |
| Windows 10 1903+ | ⚠️ 기본 내장이지만 옛 버전일 수 있음 → 업데이트 권장 |
| Windows 10 1809 또는 그 이하 | ❌ 수동 설치 필수 |

#### 설치 단계 (필요 시)

1. https://developer.microsoft.com/microsoft-edge/webview2/ 접속
2. **"Evergreen Standalone Installer (x64)"** 다운로드
3. 실행 → 설치 (약 1분)

#### 검증
```powershell
# WebView2 Runtime 버전 확인
Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue | Select-Object pv
# → pv 값이 출력되면 설치됨
```

---

## 3. 설치 검증

모든 도구 설치 후, **새 PowerShell 창**에서 한 번에 검증:

```powershell
Write-Host "=== Tool versions ===" -ForegroundColor Cyan
node --version
npm --version
rustc --version
cargo --version
git --version
where.exe link

Write-Host "=== Rust target ===" -ForegroundColor Cyan
rustup target list --installed
# → x86_64-pc-windows-msvc 가 포함되어 있어야 함
```

모든 명령이 정상 출력되면 다음 단계로 진행합니다.

---

## 4. 프로젝트 가져오기

### 방법 A: Git Clone (권장)

소스를 GitHub/GitLab/사내 Git에 push해뒀다면:

```powershell
# 작업 디렉토리로 이동
cd $env:USERPROFILE\Documents

# Clone
git clone <원격_저장소_URL> todo-app
cd todo-app
```

### 방법 B: 압축 파일 전송

Linux 서버에서 압축한 `todo-app.tar.gz`를 받았다면:

```powershell
cd $env:USERPROFILE\Documents

# tar 명령은 Windows 10/11에 기본 내장
tar -xzf todo-app.tar.gz
cd todo-app
```

또는 7-Zip / WinRAR로 우클릭하여 압축 풀기.

### 방법 C: SMB / 공유 폴더

Linux 서버를 SMB로 마운트했다면 단순 복사:
```powershell
xcopy /E /I \\server-name\share\todo-app C:\Users\YOU\Documents\todo-app
```

### 디렉토리 확인

```powershell
ls
# → src-tauri, src, package.json 등이 보여야 정상
```

---

## 5. 의존성 설치

```powershell
cd $env:USERPROFILE\Documents\todo-app

# JS/TS 의존성 (약 1~2분)
npm install
```

✅ 완료 화면: `added NNN packages in YYs`

> 💡 SSL/인증서 에러가 나면 사내 프록시 환경일 수 있습니다. 그 경우:
> ```powershell
> npm config set registry https://registry.npmjs.org/
> npm config set strict-ssl false  # 마지막 수단
> ```

---

## 6. 아이콘 처리

현재 `src-tauri/tauri.conf.json`이 아이콘 파일들을 참조하지만 실제 파일은 없습니다.
**첫 빌드 전에 둘 중 하나**를 선택하세요.

### 옵션 A: 아이콘 없이 빠르게 시작 (개발용)

`src-tauri\tauri.conf.json`을 메모장이나 VS Code로 열어 아래 부분을:

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
}
```

이렇게 변경:

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": []
}
```

⚠️ 이 상태로는 `tauri:build`(인스톨러 생성) 단계에서 에러가 나므로, 배포용 빌드 전에 옵션 B로 정식 아이콘을 만들어야 합니다.

### 옵션 B: 정식 아이콘 생성 (배포용)

1. **소스 이미지 준비**: 1024×1024 PNG 한 장 (투명 배경 권장)
   - 임시로 사용할 수 있는 도구: [Figma](https://figma.com), [icon-icons.com](https://icon-icons.com), [Flaticon](https://flaticon.com)
   - 파일 위치: `C:\Users\YOU\Pictures\todo-icon.png` 가정

2. **자동 생성 명령**:
   ```powershell
   npx @tauri-apps/cli icon C:\Users\YOU\Pictures\todo-icon.png
   ```

3. 생성 결과 확인:
   ```powershell
   ls src-tauri\icons
   # → 32x32.png, 128x128.png, 128x128@2x.png, icon.ico, icon.icns, Square*.png 등 자동 생성됨
   ```

---

## 7. 개발 모드 실행

```powershell
npm run tauri:dev
```

### 첫 실행 시 일어나는 일

1. Vite가 React 프론트엔드 dev 서버를 `localhost:3000`에서 시작
2. Rust 의존성을 모두 다운로드 (`Updating crates.io index...`)
3. 약 100~200개 crate 컴파일 (**5~15분 소요** — 인내심 필요)
4. Tauri 네이티브 창이 자동으로 열림 → **"Todo"** 제목의 빈 앱 표시

### 정상 작동 확인 항목

- ✅ 우상단 다크/라이트 토글 버튼 동작
- ✅ 카테고리 탭 추가 (`+` 버튼)
- ✅ 섹션 추가, 할 일 추가
- ✅ 더블클릭으로 이름 변경
- ✅ 드래그로 순서 변경
- ✅ 앱 종료 후 재실행해도 데이터 유지 (SQLite 저장 확인)

### 데이터 저장 위치

```
%APPDATA%\com.example.todoapp\todo.db
```

PowerShell에서 확인:
```powershell
ls $env:APPDATA\com.example.todoapp\
```

### 종료 방법

- 데스크톱 창의 **X 버튼** 클릭, 또는
- PowerShell에서 `Ctrl+C`

### 두 번째 실행부터는 빠릅니다

Rust 컴파일 캐시(`src-tauri\target`)가 남아있어 코드 변경분만 컴파일됩니다. 30초~1분 내 실행.

---

## 8. 배포 빌드

### 명령

```powershell
npm run tauri:build
```

### 소요 시간

- 첫 빌드: **10~25분** (모든 crate를 release 모드로 다시 컴파일)
- 이후 빌드: **2~5분**

### 산출물 위치

```
src-tauri\target\release\
├── todo-app.exe                                     # 단독 실행 파일 (~10 MB)
└── bundle\
    ├── msi\
    │   └── todo-app_0.1.0_x64_en-US.msi             # MSI 인스톨러
    └── nsis\
        └── todo-app_0.1.0_x64-setup.exe             # NSIS 인스톨러 (사용자 친화적)
```

### 어떤 걸 배포할까?

| 형태 | 크기 | 특징 |
| --- | --- | --- |
| `todo-app.exe` | ~10 MB | 단독 실행 파일. WebView2 Runtime이 별도 설치되어 있어야 동작 |
| `*.msi` | ~3 MB | 기업 환경(Group Policy)에 적합. 자동 설치/제거 지원 |
| `*-setup.exe` (NSIS) | ~3 MB | 일반 사용자용. WebView2 자동 다운로드 옵션 포함 |

**개인 배포** → NSIS `.exe`
**사내 배포** → MSI

### 인스톨러 한국어화 (선택)

`src-tauri\tauri.conf.json`의 `"bundle"` 섹션에 추가:
```json
"windows": {
  "wix": {
    "language": ["ko-KR"]
  },
  "nsis": {
    "languages": ["Korean"]
  }
}
```

---

## 9. 자주 발생하는 에러와 해결법

### ❌ `link.exe not found` / `error: linker 'link.exe' not found`

**원인**: Visual Studio Build Tools 미설치 또는 C++ 워크로드 누락

**해결**:
1. VS Installer 실행 → "Build Tools 2022" → 수정 → "C++ 빌드 도구" 워크로드 추가
2. PC 재부팅
3. 새 PowerShell 창에서 `where.exe link` 검증

---

### ❌ `cargo not found` (설치 후에도)

**원인**: PATH 갱신 안 됨

**해결**:
1. 모든 PowerShell/CMD 창을 **완전히 닫기**
2. 시작 메뉴에서 PowerShell 다시 실행
3. 그래도 안 되면 시스템 재부팅
4. 그래도 안 되면 환경변수 확인:
   ```powershell
   $env:PATH -split ';' | Select-String "cargo"
   # → C:\Users\YOU\.cargo\bin 이 나와야 함
   ```

---

### ❌ `failed to run custom build command for openssl-sys`

**원인**: OpenSSL 빌드 필요 (드물지만 일부 의존성 추가 시 발생)

**해결** (필요 시):
```powershell
# vcpkg 사용
git clone https://github.com/microsoft/vcpkg.git $env:USERPROFILE\vcpkg
cd $env:USERPROFILE\vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg install openssl:x64-windows-static-md
.\vcpkg integrate install
```

현재 todo-app 의존성에는 openssl이 직접 포함되어 있지 않지만, 향후 플러그인 추가 시 참고.

---

### ❌ 아이콘 관련 에러

```
error: failed to bundle project: failed to load icon
```

**해결**: 위 [6. 아이콘 처리](#6-아이콘-처리) 참고. 빠르게는 `"icon": []`로 비워두기.

---

### ❌ `WebView2Loader.dll not found` (실행 시)

**원인**: WebView2 Runtime 미설치 (구형 Windows 10)

**해결**: [2-5](#2-5-webview2-runtime) 참고하여 Runtime 설치.

---

### ❌ `npm : 이 시스템에서 스크립트를 실행할 수 없으므로 ... npm.ps1 파일을 로드할 수 없습니다`

**원인**: PowerShell 실행 정책이 `Restricted`로 설정되어 `.ps1` 스크립트(`npm.ps1`) 실행 차단

**해결** (관리자 권한 불필요):
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# 확인 프롬프트에 Y 입력
```

이후 새 명령:
```powershell
npm --version
```
정상 출력되면 해결.

**임시 우회**: `npm` 대신 `npm.cmd --version` 으로 호출하면 실행 정책 영향 없음.

---

### ❌ `npm install` 시 SSL/인증서 에러 (사내 프록시 환경)

**해결**:
```powershell
# 사내 npm registry가 있는 경우
npm config set registry <사내_registry_URL>

# 또는 인증서 검증 임시 비활성화 (보안 위험 인지 후)
npm config set strict-ssl false
```

---

### ❌ Rust 컴파일 중 메모리 부족

**원인**: RAM 8GB 환경에서 병렬 컴파일이 메모리 소진

**해결**: 컴파일 병렬 수 제한
```powershell
$env:CARGO_BUILD_JOBS = "2"
npm run tauri:build
```

---

### ❌ `error: linking with 'link.exe' failed: exit code: 1120`

**원인**: 충돌하는 Rust toolchain 여러 개 설치됨

**해결**:
```powershell
rustup toolchain list
# 여러 개면:
rustup default stable-x86_64-pc-windows-msvc
rustup update
```

---

### ❌ Tauri 창은 떴는데 화면이 비어있고 콘솔에 SQLite 에러

**원인**: SQLite DB 경로 또는 마이그레이션 실패

**해결**:
1. 기존 DB 파일 삭제 후 재시도:
   ```powershell
   Remove-Item $env:APPDATA\com.example.todoapp\todo.db -Force
   npm run tauri:dev
   ```
2. 그래도 실패하면 DevTools 열기: 데스크톱 창에서 우클릭 → "Inspect Element" 또는 `Ctrl+Shift+I`

---

## 10. 개발 워크플로 팁

### 10-1. DevTools 활용

개발 모드에서 데스크톱 창 안에서 **우클릭 → Inspect Element** 또는 **`Ctrl+Shift+I`** 로 Chrome DevTools가 열립니다.
- React state 확인 (React DevTools 익스텐션은 이 webview에 자동 적용 안 됨, 콘솔로 확인)
- 네트워크 / 콘솔 / DOM 디버깅 가능

### 10-2. Hot Reload

`src/*.tsx` 파일을 저장하면 React 부분은 즉시 반영됩니다.
`src-tauri/*.rs` 파일을 수정하면 Tauri가 자동 재컴파일·재시작합니다 (10~30초).

### 10-3. SQLite GUI로 데이터 확인

[DB Browser for SQLite](https://sqlitebrowser.org/) 또는 [SQLiteStudio](https://sqlitestudio.pl/) 설치 후:
- `%APPDATA%\com.example.todoapp\todo.db` 파일을 열어서 `categories`, `sections`, `tasks` 테이블 직접 확인/수정 가능

### 10-4. 코드 동기화 (Linux ↔ Windows)

Git 원격 저장소를 사용하는 게 가장 깔끔:

**Linux에서 변경 후**:
```bash
git add . && git commit -m "..." && git push
```

**Windows에서 받기**:
```powershell
git pull
npm install   # package.json 변경이 있었다면
npm run tauri:dev
```

### 10-5. 빌드 캐시 관리

```powershell
# Rust 빌드 캐시 크기 확인 (의외로 큼, 수 GB)
du -sh src-tauri\target  # Git Bash 또는
Get-ChildItem src-tauri\target -Recurse | Measure-Object -Property Length -Sum

# 캐시 청소 (디스크 부족 시)
cd src-tauri
cargo clean
cd ..
```

### 10-6. Release / Debug 모드 차이

| 모드 | 명령 | exe 크기 | 실행 속도 | 빌드 시간 |
| --- | --- | --- | --- | --- |
| Debug (dev) | `npm run tauri:dev` | ~50 MB | 약간 느림 | 매우 빠름 |
| Release | `npm run tauri:build` | ~10 MB | 빠름 | 매우 느림 |

배포는 무조건 Release.

### 10-7. 로그 위치

- **Tauri 콘솔 로그**: PowerShell 창에 직접 출력
- **Frontend 콘솔 로그**: 앱 창의 DevTools (`Ctrl+Shift+I`)
- **앱 데이터**: `%APPDATA%\com.example.todoapp\`

---

## 🎯 빠른 체크리스트

처음 셋업 시 순서대로:

- [ ] Windows 10/11 64bit 확인
- [ ] Visual Studio Build Tools 2022 + C++ 워크로드 설치
- [ ] Rust (rustup-init) 설치
- [ ] Node.js LTS 설치
- [ ] Git 설치
- [ ] WebView2 Runtime 설치 (Win 10이면)
- [ ] 새 PowerShell 창 열고 모든 도구 버전 확인
- [ ] 프로젝트 clone 또는 압축 해제
- [ ] `npm install`
- [ ] 아이콘 처리 (옵션 A 또는 B)
- [ ] `npm run tauri:dev` — 첫 실행은 ~10분
- [ ] 데스크톱 창에서 기능 동작 확인
- [ ] `npm run tauri:build` — 인스톨러 생성
- [ ] `src-tauri\target\release\bundle\` 에서 `.msi` 또는 `.exe` 인스톨러 수령

---

## 📚 참고 자료

- [Tauri 공식 Windows 가이드](https://tauri.app/start/prerequisites/)
- [Rust 공식 설치 페이지](https://rustup.rs)
- [Vite 공식 문서](https://vitejs.dev)
- [@dnd-kit 공식 문서](https://docs.dndkit.com)
- [tauri-plugin-sql README](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/sql)

---

빌드 중 에러가 나거나 막히는 부분이 있다면 PowerShell 출력을 그대로 알려주세요.

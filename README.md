# Todo App (Tauri + React + SQLite)

Windows 데스크톱 투두 앱.

## 핵심 기능
- 📑 **탭 카테고리**: 드래그로 순서 변경, 더블클릭으로 이름 수정
- 📋 **카테고리 내 섹션**: 카테고리 안에서 항목을 그룹핑, 섹션도 reorder 가능
- ✅ **할 일 관리**: 추가 / 체크 / 더블클릭 수정 / 드래그 reorder / 섹션 간 이동
- 🌙 **다크 모드**: 시스템 설정 자동 감지 + 수동 토글
- 💾 **로컬 SQLite**: 앱 데이터 디렉토리에 `todo.db`로 저장 (동기화 없음)

---

## 🪟 Windows 빌드 가이드

> 본 프로젝트의 주 타겟은 Windows입니다. 아래 절차로 셋업하세요.
> 더 자세한 트러블슈팅은 [`docs/windows-build-guide.md`](docs/windows-build-guide.md) 참고.

### 0. 환경 요구사항

| 항목 | 최소 | 권장 |
| --- | --- | --- |
| OS | Windows 10 (64bit, 1809+) | Windows 11 |
| RAM | 8 GB | 16 GB+ |
| Disk | 10 GB 여유 | 20 GB+ |

---

### 1. 사전 설치 도구 — 다운로드 & 설치 방법

각 도구 설치 후 **새 PowerShell 창**을 열어야 PATH 변경이 반영됩니다.

#### 1-1. Visual Studio Build Tools (MSVC)

Tauri의 Rust 컴파일러가 사용하는 C/C++ 링커(`link.exe`) 제공.

**다운로드 & 설치 단계**:

1. **다운로드**: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 우측 **"Build Tools 다운로드"** 클릭 → `vs_BuildTools.exe` 저장
2. 다운받은 `vs_BuildTools.exe` 실행
3. 설치 옵션 화면에서 **"워크로드"** 탭 선택:
   - ✅ **C++을 사용한 데스크톱 개발** (Desktop development with C++) 체크
4. 우측 **"설치 세부 정보"** 패널에서 자동 선택 확인:
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 빌드 도구** (필수)
   - ✅ **Windows 11 SDK** 또는 Windows 10 SDK (필수)
   - ⚪ C++ CMake 도구 (선택, 불필요)
5. 우하단 **"설치"** 클릭 → 약 5~7 GB, 10~20분 소요
6. 설치 완료 후 **PC 재부팅 권장**

**검증**:
```powershell
# 실제 link.exe 파일 존재 확인
Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC" -Recurse -Filter "link.exe" -ErrorAction SilentlyContinue | Select-Object FullName -First 3
```
경로 몇 개가 출력되면 성공. (일반 PowerShell에서 `where.exe link`는 빈 결과가 정상 — Rust가 자동으로 찾아 씁니다.)

---

#### 1-2. Rust (rustup)

Tauri 백엔드 빌드용. 약 500MB.

**다운로드 & 설치 단계**:

1. PowerShell에서 다운로드:
   ```powershell
   Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
   ```
   또는 https://rustup.rs 접속 → **`rustup-init.exe`** 직접 다운로드.

2. 인스톨러 실행:
   ```powershell
   .\rustup-init.exe -y
   ```
   - `-y` 옵션으로 모든 프롬프트 자동 승낙 (기본 설정 사용)
   - 수동 옵션을 보고 싶다면 `-y` 빼고 실행 → `1) Proceed with standard installation` 선택

3. **모든 PowerShell 창을 닫고 새로 열기** (PATH 갱신 필수)

**검증**:
```powershell
rustc --version
cargo --version
rustup show
```
- `rustc 1.x.x`, `cargo 1.x.x` 출력되면 성공
- `rustup show`의 기본 toolchain이 `stable-x86_64-pc-windows-msvc`여야 함
  - 만약 `gnu`로 나오면: `rustup default stable-x86_64-pc-windows-msvc`

---

#### 1-3. Node.js (LTS)

React 프론트엔드 빌드/패키지 관리용.

**다운로드 & 설치 단계**:

1. **다운로드**: https://nodejs.org
   - 페이지 좌측 **"LTS"** 버튼(녹색) 클릭 → 최신 LTS `.msi` 자동 다운로드
   - 또는 명시적으로: https://nodejs.org/en/download/prebuilt-installer → "Windows", "x64", "Installer" 선택
2. 다운받은 `node-vXX.X.X-x64.msi` 실행
3. 설치 옵션 (모두 기본값 OK):
   - ✅ "Add to PATH" 체크 (기본 체크되어 있음)
   - ⚪ "Automatically install the necessary tools..." — 체크 **안 해도 됨** (이미 VS Build Tools 설치됨)
4. **Next** 연속 → **Install** → 완료
5. **새 PowerShell 창** 열기

**검증**:
```powershell
node --version    # → v20.x.x 또는 v22.x.x 이상
npm --version     # → 10.x.x 이상
```

**⚠️ PowerShell 스크립트 실행 차단 에러가 나면**:
```
npm : 이 시스템에서 스크립트를 실행할 수 없으므로 ... npm.ps1 파일을 로드할 수 없습니다.
```
→ 한 번만 실행:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
프롬프트에 **Y** 입력. 이후 `npm` 정상 동작.

---

#### 1-4. Git

소스 코드 가져오기 / 동기화용.

**다운로드 & 설치 단계**:

1. **다운로드**: https://git-scm.com/download/win
   - 페이지 접속 시 자동으로 `Git-X.XX.X-64-bit.exe` 다운로드 시작
2. 인스톨러 실행
3. 설치 옵션:
   - 거의 모두 **기본값**으로 Next 연속
   - "Default editor" 단계만 본인 취향 — VS Code 추천 (없으면 Vim 그대로)
4. **Install** → 완료
5. **새 PowerShell 창** 열기

**검증**:
```powershell
git --version    # → git version 2.x.x.windows.x
```

---

#### 1-5. WebView2 Runtime

Tauri 앱 화면 렌더링 엔진. Windows 11은 기본 내장.

**확인 먼저**:
```powershell
Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue | Select-Object pv
```
- `pv` 값이 출력되면 이미 설치되어 있음 → 다음 단계로 건너뛰기
- 아무것도 안 나오면 아래 설치 필요

**다운로드 & 설치 단계** (필요 시):

1. **다운로드**: https://developer.microsoft.com/microsoft-edge/webview2/
2. "Download" 섹션에서 **"Evergreen Standalone Installer"** → **x64** 다운로드
3. 다운받은 `MicrosoftEdgeWebView2RuntimeInstallerX64.exe` 실행 → 자동 설치 (1분)

---

### 2. 사전 도구 통합 검증

모든 설치 후 새 PowerShell 창에서 한 번에 검증:

```powershell
Write-Host "=== Tool versions ===" -ForegroundColor Cyan
node --version
npm --version
rustc --version
cargo --version
git --version

Write-Host "`n=== Rust target ===" -ForegroundColor Cyan
rustup target list --installed
# → x86_64-pc-windows-msvc 가 포함되어 있어야 함
```

모든 명령이 정상 출력되면 다음 단계로.

---

### 3. 프로젝트 가져오기

```powershell
cd $env:USERPROFILE\Documents
git clone https://github.com/elevne/todo-app.git
cd todo-app
```

---

### 4. 의존성 설치

```powershell
npm install
```
약 1~2분 소요. `added NNN packages` 메시지가 나오면 성공.

> 💡 사내 프록시 환경에서 SSL 에러가 나면:
> ```powershell
> npm config set registry https://registry.npmjs.org/
> ```

---

### 5. 개발 모드 실행

```powershell
npm run tauri:dev
```

**첫 실행 시 일어나는 일**:
1. Vite가 `localhost:3000`에서 React dev 서버 시작
2. Rust 의존성 다운로드 + 컴파일 (**5~15분 소요** — 인내심 필요)
3. **"Todo"** 제목의 네이티브 데스크톱 창 자동 오픈

**두 번째 실행부터는 30초~1분** (Rust 빌드 캐시 재사용)

---

### 6. 배포용 빌드 (인스톨러 생성)

```powershell
npm run tauri:build
```
첫 빌드 10~25분, 이후 2~5분.

**산출물 위치**:
```
src-tauri\target\release\
├── todo-app.exe                                      # 단독 실행파일 (~10MB)
└── bundle\
    ├── msi\todo-app_0.1.0_x64_en-US.msi              # MSI 인스톨러
    └── nsis\todo-app_0.1.0_x64-setup.exe             # NSIS 인스톨러 (일반 사용자용)
```

---

## 📂 디렉토리 구조

```
todo-app/
├── src/                         # React 프론트엔드
│   ├── components/
│   │   ├── TabBar.tsx           # 카테고리 탭 (sortable)
│   │   ├── TabContent.tsx       # 활성 탭의 콘텐츠 + DnD 컨텍스트
│   │   ├── Section.tsx          # 섹션 컨테이너 + 할 일 목록
│   │   ├── TaskItem.tsx         # 개별 할 일
│   │   └── ThemeToggle.tsx
│   ├── db/database.ts           # SQLite CRUD 래퍼
│   ├── store/todoStore.ts       # Zustand 전역 상태
│   ├── hooks/useTheme.ts        # 다크모드
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                   # Rust 백엔드
│   ├── src/
│   │   ├── main.rs              # 엔트리포인트
│   │   └── lib.rs               # SQL 마이그레이션 + 플러그인 등록
│   ├── icons/                   # 앱 아이콘 (placeholder 포함)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
│   └── windows-build-guide.md   # 본 문서 상세판 (트러블슈팅 포함)
└── package.json
```

---

## 💾 데이터 저장 위치

| OS | 경로 |
| --- | --- |
| Windows | `%APPDATA%\com.example.todoapp\todo.db` |
| Linux | `~/.local/share/com.example.todoapp/todo.db` |
| macOS | `~/Library/Application Support/com.example.todoapp/todo.db` |

PowerShell에서 확인:
```powershell
ls $env:APPDATA\com.example.todoapp\
```

GUI로 DB 보고 싶으면 [DB Browser for SQLite](https://sqlitebrowser.org/) 추천.

---

## 🗄️ DB 스키마

```sql
categories(id, name, position, created_at)
sections(id, category_id, name, position, created_at)
tasks(id, category_id, section_id, title, completed, position, created_at)
```
- `category` 삭제 시 하위 `section`/`task` cascade 삭제
- `section` 삭제 시 소속 `task`의 `section_id`는 NULL로 변경 (할 일 자체는 유지)

---

## ⌨️ 단축키 / 사용 팁

| 동작 | 방법 |
| --- | --- |
| 카테고리 / 섹션 / 할 일 이름 변경 | 더블클릭 |
| 할 일 / 섹션 / 탭 reorder | 드래그 |
| 할 일을 다른 섹션으로 이동 | 드래그 → 다른 섹션 영역에 drop |
| 입력 확정 / 취소 | Enter / Esc |
| DevTools (개발 모드) | 앱 창에서 `Ctrl+Shift+I` |

---

## 🩹 자주 발생하는 에러

| 증상 | 빠른 해결 |
| --- | --- |
| `link.exe not found` | VS Build Tools에서 "C++ 워크로드" 추가 후 재부팅 |
| `cargo not found` (설치 후에도) | 모든 PowerShell 창 닫고 새로 열기, 그래도면 PC 재부팅 |
| `npm.ps1 ... 보안 오류` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `icons/icon.ico not found` | `git pull` (placeholder 아이콘 포함된 커밋 받기) |
| WebView2 에러 | https://developer.microsoft.com/microsoft-edge/webview2/ 에서 Runtime 설치 |

전체 트러블슈팅은 [`docs/windows-build-guide.md`](docs/windows-build-guide.md#9-자주-발생하는-에러와-해결법) 참고.

---

## 🚫 알려진 제약
- 다중 선택 / 일괄 작업 미지원
- 태그·필터·검색 미지원
- 첨부파일 미지원
- 데이터 클라우드 동기화 없음 (로컬 only)

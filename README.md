# Todo App (Tauri + React + SQLite)

Windows 데스크톱 투두 앱.

## 핵심 기능
- 📑 **탭 카테고리**: 드래그로 순서 변경, 더블클릭으로 이름 수정
- 📋 **카테고리 내 섹션**: 카테고리 안에서 항목을 그룹핑, 섹션도 reorder 가능
- ✅ **할 일 관리**: 추가 / 체크 / 더블클릭 수정 / 드래그 reorder / 섹션 간 이동
- 🌙 **다크 모드**: 시스템 설정 자동 감지 + 수동 토글
- 💾 **로컬 SQLite**: 앱 데이터 디렉토리에 `todo.db`로 저장 (동기화 없음)

## 시작하기

### 1. 사전 요구사항
- **Node.js** 20+ (이미 설치됨: v24.x)
- **Rust** (Tauri 빌드용) — 미설치 상태:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source $HOME/.cargo/env
  ```
- **Linux 빌드 필수 패키지** (Ubuntu/Debian 기준):
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
                      libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

### 2. 의존성 설치
```bash
cd ~/develop/todo-app
npm install
```

### 3. 개발 모드 실행
```bash
npm run tauri:dev
```
첫 실행 시 Rust 의존성 컴파일로 5~10분 소요됩니다.

### 4. Windows용 빌드
**Linux에서 cross-compile**:
```bash
rustup target add x86_64-pc-windows-gnu
sudo apt install -y mingw-w64
npm run tauri:build -- --target x86_64-pc-windows-gnu
```
또는 **Windows 머신에서 직접 빌드** 시:
```bash
npm install
npm run tauri:build
```
산출물: `src-tauri/target/release/bundle/`

## 디렉토리 구조
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
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## 데이터 저장 위치
- Windows: `%APPDATA%\com.example.todoapp\todo.db`
- Linux:   `~/.local/share/com.example.todoapp/todo.db`
- macOS:   `~/Library/Application Support/com.example.todoapp/todo.db`

## DB 스키마
```sql
categories(id, name, position, created_at)
sections(id, category_id, name, position, created_at)
tasks(id, category_id, section_id, title, completed, position, created_at)
```
- `category` 삭제 시 하위 `section`/`task` cascade 삭제
- `section` 삭제 시 소속 `task`의 `section_id`는 NULL로 변경 (할 일 자체는 유지)

## 단축키 / 사용 팁
| 동작 | 방법 |
| --- | --- |
| 카테고리 / 섹션 / 할 일 이름 변경 | 더블클릭 |
| 할 일 / 섹션 / 탭 reorder | 드래그 |
| 할 일을 다른 섹션으로 이동 | 드래그 → 다른 섹션 영역에 drop |
| 입력 확정 / 취소 | Enter / Esc |

## 알려진 제약
- 다중 선택 / 일괄 작업 미지원 (향후 확장 가능)
- 태그·필터·검색 미지원
- 첨부파일 미지원

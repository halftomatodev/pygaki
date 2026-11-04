# 인수인계 (2026-11-04 로컬 세션 5 → 다음 대화)

새 대화에서 pygaki를 쓰거나 고칠 때 이 문서부터 읽습니다. 맨 위 [CLAUDE.md](../CLAUDE.md)의 규칙도 같이 지킵니다.
새 대화는 "docs/HANDOFF.md 읽고 이어서 하자"로 시작하면 됩니다. 지나온 기록과 주요 결정은 [HISTORY.md](HISTORY.md)에 있습니다.

## 0. 지금 어디까지 (먼저 읽기)

- **최신 판**: showpy 4.20 (`ui_kit` 3.19, `screen_fx` 4.3, `hotkeys` 1.0, `splash` 1.2) + PyKaki 앱. 4.19까지는 `main`에 push됨(`068d9bc`). 4.20이 커밋됐는지는 `git log`로 확인
- **이번 세션(5)에 한 큰 일**: 셰이더 두 자리(인게임, 타이틀, 게임 내 메뉴 따로), "셰이더 고르기" + 세모(▶) + [여기에서부터 적용], 타이틀 배경(검은 화면 기본, 그림/webm), 제목/부제 글자, 글자 효과, 회전 손잡이, ESC 메뉴 투명 배경 (4장)
- **사용자가 확인하는 곳**: `F:\SHOWPY\pygaki-dev-renpy-8.5.3\renpy.exe` (로컬 시험용 묶음. 4.20 템플릿 파일과 새 앱으로 바꿔 넣음). 확인 순서는 3장 "확인용 묶음"
- **다음 대화는 이것부터 물어보기**: 5장 맨 위 4.20 세 줄. 그 아래 4.19, 4.18, 4.17 줄도 아직 사용자 확인 전
- **그다음 할 일**: 사용자가 확인하면 정식 판 v1.1(태그) → 공개용 구글 문서(아직 4.13 기준)를 4.14~4.19로 한 번에 (6장)
- **pykaki_sample에 사용자가 저장한 것**: `game/screen_fx/vhs_crt_layout.rpy`, `game/splash/splash_layout.rpy` (2026-11-04 17:04~05). 시험한 뒤 지우지 말 것. 시험으로 생긴 `*_layout.rpy`만 지움

## 1. pygaki 한눈에

렌파이(Ren'Py)로 게임을 만드는 사람을 위한 도구 묶음입니다. 사용자는 한국어로 대화합니다.

- **PyKaki**: 파이썬을 몰라도 상자와 선으로 렌파이 대본을 쓰는 에디터. 웹 버전과 데스크톱 앱(Electron)
- **showpy**: 렌파이 플러그인. 게임을 켠 채 그림, 대사 위치, 화면 효과를 마우스로 고치는 편집기와 UI 묶음
- **pygaki 묶음**: 렌파이 SDK + showpy 템플릿 + 런처 버튼 + PyKaki 앱을 윈도우용 폴더 하나로

| 무엇 | 자리 |
|---|---|
| 저장소 | https://github.com/halftomatodev/pygaki (`main`) |
| 배포 파일 (묶음, 덧붙임 zip) | https://github.com/halftomatodev/pygaki/releases (v1.0, showpy 4.13) |
| 웹 버전 PyKaki | https://halftomatodev.github.io/pygaki/ (`main`에 push하면 자동 배포) |
| 공개용 사용 안내 (구글 문서, showpy 4.13 기준) | https://docs.google.com/document/d/10kmDFgiQ9JpbgIY6Q7vejf3EjMC06rCJCxjVSeukdes/edit |
| 로컬 저장소 | `F:\SHOWPY\pygaki` (Dropbox 밖) |
| 렌파이 SDK | `F:\SHOWPY\renpy-8.5.3-sdk` |
| PyKaki 앱 빌드 | 로컬 빌드 `pykaki/app/out/win-unpacked` (최신), Actions "PyKaki 앱"의 `PyKaki-win`. `F:\SHOWPY\PyKaki-win`은 v1.0 때 받은 예전 판 |
| 렌파이 프로젝트 폴더 | `F:\Dropbox\1_DEV\RENPY` |
| 시험 프로젝트 (showpy 4.19 들어 있음) | `fx_test_25`, `pykaki_sample` |
| 최신 시험용 묶음 (showpy 4.19 + 새 앱) | `F:\SHOWPY\pygaki-dev-renpy-8.5.3\renpy.exe` (덧붙임은 `pygaki-dev-addon`, 4.15 그대로). v1.0 폴더는 4.13 그대로 |
| 사용자의 진짜 게임 (말할 때만 건드림) | `horror`, `test_plugin` |

예전 `pykaki`, `showpy` 저장소는 "pygaki로 옮겼어요" 안내를 넣고 보관(archive)했습니다. 예전 로컬 폴더는 지웠습니다.

### 저장소 구조

| 폴더 | 내용 | 먼저 읽기 |
|---|---|---|
| `pykaki/` | 웹 버전 (React + Vite, `npm run build` → `pykaki/dist/index.html` 한 파일) | `pykaki/CLAUDE.md`, `pykaki/docs/SPEC.md`, `pykaki/docs/GUIDE.md`(사용 안내, 9-2 앱 showpy 화면) |
| `pykaki/app/` | 데스크톱 앱. 웹 빌드를 복사해서 켬. `main.cjs`가 게임과 실시간 연결, `smoke.cjs`가 확인 시험 | `pykaki/docs/SPEC.md` 9-2 |
| `pykaki/src/Showpy*.tsx`, `showpyLive.ts` | 앱 [showpy] 화면. `ShowpyView`(목록, 가운데, 칸), `ShowpyCustomUI`(커서/대사 소리 전용 칸), `ShowpyMirror`(게임 패널을 통째로 그리는 공통 틀) | |
| `pykaki/src/fx/` | 등장 효과 WebGL 미리보기 | |
| `showpy/game/` | 플러그인 4개: `ui_kit`, `screen_fx`, `hotkeys`, `splash` | `showpy/docs/DEV_RULES.md`, `showpy/docs/SPEC.md`, `showpy/docs/READ_ME_FIRST.md` |
| `showpy/game/ui_kit/editor/editor_live.rpy` | 앱과 실시간 연결(포트, 상태, 명령, 패널 통째로 읽기, "편집 중" 띠) | `docs/LINK.md` 9장 |
| `showpy/game/splash/editor/editor_splash.rpy` | 편집기 "스플래시" 탭 (4.18) | |
| `showpy/game/ui_kit/engine/text_effects.glsl` | 등장 효과 셰이더 **하나뿐**. 렌파이와 PyKaki가 같이 씀 | 파일 맨 위 "적는 법" |
| `docs/LINK.md` | 두 프로그램이 맞추는 형식 (9장 실시간 연결 `showpy_live.json`: state, files, panel, 명령 표) | 형식을 바꿀 때 |
| `docs/HISTORY.md` | 지나온 기록, 주요 결정과 이유 | 왜 이렇게 됐는지 궁금할 때 |
| `bundle/` | `make_bundle.py`(묶기), `launcher/pygaki_launcher.rpy`(런처 버튼) | `bundle/README.md` |
| `.github/workflows/` | `deploy.yml` 웹 배포, `app.yml` 앱 확인 + 윈도우 빌드, `release.yml` 태그 → Releases 초안 | |

## 2. 쓰는 법 (사용자 입장)

- **웹 버전**: 크롬이나 엣지로 웹 주소를 열고 왼쪽 [렌파이 프로젝트 연결] → 프로젝트 폴더를 고르면 `game/script_flow.rpy`를 만들고 연결이 켜집니다. 그다음부터 Ctrl+E로 내보냅니다.
- **묶음**: 묶음 폴더의 `renpy.exe` → 런처 아래쪽
  - [showpy 새 프로젝트]: showpy가 들어간 1280x720 한국어 프로젝트 (VHS 덮개는 처음에 꺼짐)
  - [PyKaki로 대본 쓰기]: 왼쪽에서 고른 프로젝트를 앱으로 열고, 대본은 `프로젝트이름.flow.json`에 자동 저장
- **showpy 편집기**: 게임 실행 중 Shift+M (앱 없이 쓸 때)
- **실시간 미리보기**: PyKaki 글자 효과 칸의 [렌파이에서 보기]
- **앱의 [showpy] 화면** (4.15~4.19): 앱 툴바 [대본 | showpy]. 런처에서 [프로젝트 실행]으로 게임을 개발 모드로 켜 두면 저절로 붙고 초록 점. 게임 창과 나란히 씀
  - 왼쪽 목록: 스플래시, 타이틀 메뉴, 게임 내 메뉴(ESC), 타이틀 셰이더, 인게임 화면 셰이더, 커서/CTC/대사 소리, 대사, 선택지, 그림 배치. 모두 앱 오른쪽 칸에서 고침
  - 타이틀/ESC 메뉴, 커서/대사 소리: 앱에 따로 만든 칸. 나머지: 게임 안 패널을 통째로 옮겨 그린 칸(버튼, 막대, 입력칸, 색·글꼴·그림 고르기 창까지)
  - **편집 중에는 게임이 안 넘어감**: 칸을 고르면 게임 안 편집기가 열리고, 그동안 게임 화면의 클릭과 키는 편집기로 감(끌어서 옮기기용). 게임 화면 위에 "편집 중 … Esc로 닫기" 띠가 보이면 그 상태. 게임 창 Esc나 앱의 [편집기 닫기]로 닫음. 커서/대사 소리 칸과 [대본] 화면에서는 편집기가 닫혀 있음
  - 타이틀에서 대사·그림 칸을 고르면 [게임 시작], 게임 중에 타이틀 셰이더를 고르면 [타이틀로 가기]
  - [저장]은 편집기 Ctrl+S와 같음 (`*_layout.rpy`나 원고)
- **스플래시 편집** (4.18): 페이지 고르기, 바탕색, 바탕·로고 그림, 글자 색·글꼴·크기, 위치, 넘어가는 때, 시간, [이 페이지 보기]. 저장은 `splash/splash_layout.rpy`. 글 내용(제목, 본문 문장)은 `splash_config.rpy`에서
- **게임 메뉴 화면** (4.14): 저장, 환경설정 등에서 ESC 메뉴가 왼쪽에 남고 내용은 오른편

## 3. 고치는 법 (개발)

### 명령

```bash
cd pykaki && npm ci            # 처음 한 번 (node_modules가 없으면 npx tsc가 엉뚱한 패키지를 받음)
cd pykaki && npm run dev       # http://localhost:5173
cd pykaki && npx tsc --noEmit
cd pykaki && npm run build     # pykaki/dist/index.html (dist는 git에 안 올라감)
cd pykaki/app && npm ci && npm start
cd pykaki/app && npm run web && node smoke.cjs   # 앱 확인 시험 (진짜 Electron, 가짜 게임 연결 포함)
```

렌파이 Lint (SDK 안의 파이썬으로):

```bash
cd /f/SHOWPY/renpy-8.5.3-sdk && ./lib/py3-windows-x86_64/python.exe renpy.py <프로젝트 폴더> lint
```

배포 파일은 보통 태그를 올리면(`git tag v1.1 && git push origin v1.1`) Actions "배포 파일"이 만들어 Releases에 초안으로 올림. 손으로는 `python bundle/make_bundle.py --sdk 'F:\SHOWPY\renpy-8.5.3-sdk' --app <앱 폴더> --zip --tag <이름>`. 자세히는 `bundle/README.md`.

### 고칠 때 지킬 순서

- **PyKaki**: 고친 뒤 `npx tsc --noEmit`, `npm run build`. 앱 쪽을 고쳤으면 `npm run web && node smoke.cjs`.
- **showpy**: 고친 뒤 Lint → 시험 프로젝트(`fx_test_25`, `pykaki_sample`)에 바뀐 파일을 복사하고 `.rpyc` 지우기 → Lint.
  - 시험 프로젝트에만 있는 것을 살립니다: 편집기로 만든 `*_layout.rpy`(특히 사용자가 저장한 것, 0장), fx_test_25의 `ui_kit/stage_config.rpy`의 `define stage.bg_tag = [ "bg", "fx_bg" ]`.
  - 버전을 올리면 `showpy/CHANGELOG.md`, `showpy/docs/READ_ME_FIRST.md`, `showpy/docs/SPEC.md`, `showpy/docs/CUSTOM_GUIDE.md` 머리, 플러그인 `README.md`, `ui_kit/engine/ui_kit.rpy`의 `VERSION`(splash는 `splash/engine/splash.rpy`).
  - 플러그인은 따로 넣어도 돌아야 함. 다른 플러그인에 기대는 파일(예: splash 편집 탭)은 ui_kit 없이 Lint도 봄.
- **앱 [showpy] 칸**: 새 편집기 탭은 게임 쪽 탭(`ui_editor.Tab`)만 만들면 앱에 공통 틀로 저절로 나옴. 앱 `ShowpyView.tsx`의 `SECTIONS`에 `tab`, `mirror: true`만 더함. 새 렌파이 위젯 종류를 쓰면 `editor_live.rpy`의 `_mirror`에 읽는 법을 더함.
- **형식을 바꾸면** `docs/LINK.md`와 양쪽 코드를 같은 커밋에서.
- **문서**: 사용 안내가 바뀌면 `pykaki/docs/GUIDE.md`, `showpy/docs/*`. 공개용 구글 문서는 정식 판 때 한 번에.
- **커밋**: 작성자 `halftomato <wwonwan@naver.com>` (`git -c user.name=halftomato -c user.email=wwonwan@naver.com commit ...`). 커밋과 push는 사용자에게 물어본 뒤.
- **작업 방식**: showpy를 고칠 때는 DEV_RULES대로 먼저 할 수 있는지, 짧은 계획, 예상 시간을 말하고 사용자가 "시작"이라고 하면 시작합니다. 답은 한국어 반말.

### 확인용 묶음 (`F:\SHOWPY\pygaki-dev-renpy-8.5.3`)

사용자는 이 묶음의 `renpy.exe`로 최신 내용을 확인합니다. **원본은 저장소이고 묶음은 만든 순간의 사본**이라, 고친 뒤 맞춰 줍니다.

| 고친 것 | 맞출 것 |
|---|---|
| showpy 플러그인 | 시험 프로젝트 두 곳에 복사 + `.rpyc` 지우기 + Lint. 묶음 템플릿 `pygaki-dev-renpy-8.5.3\showpy\game`에도 같은 파일 복사 → 템플릿 Lint → Lint가 남긴 `.rpyc`, `cache`, `saves` 지우기 |
| PyKaki (웹 화면, 앱) | `npm run build` → 앱 빌드 → 묶음의 `pygaki\PyKaki` 폴더를 통째로 바꿔 넣기 (켜져 있는 PyKaki.exe를 먼저 끔) |
| 런처 버튼, 템플릿 설정 | 묶음 다시 만들기 |

```bash
cd pykaki && npm run build
cd pykaki/app && rm -rf out && npx electron-builder --win dir -c.win.signAndEditExecutable=false
# 앱만: out/win-unpacked 를 F:\SHOWPY\pygaki-dev-renpy-8.5.3\pygaki\PyKaki 로 바꿔 넣기
# 묶음 전체(5~10분, 있던 F:\SHOWPY\pygaki-dev-*를 먼저 지움):
python bundle/make_bundle.py --sdk 'F:\SHOWPY\renpy-8.5.3-sdk' --app 'F:\SHOWPY\pygaki\pykaki\app\out\win-unpacked' --out 'F:\SHOWPY' --tag dev
```

- 게임은 프로젝트 폴더 안의 showpy를 읽으므로, 어느 런처로 켜든 그 프로젝트에 넣은 판이 돕니다.
- [showpy 새 프로젝트]로 만든 게임은 만들 때 showpy를 복사해 가서 나중 판이 저절로 들어가지 않습니다.
- 저장소에서 바로 앱을 켜려면 `cd pykaki/app && npm start -- --project "F:\Dropbox\1_DEV\RENPY\pykaki_sample"`.

### 확인 방법 (이번 세션에 쓴 것, 도구는 저장소에 없음)

- **게임 켜고 끄기**: `cd /f/SHOWPY/renpy-8.5.3-sdk && (./lib/py3-windows-x86_64/pythonw.exe renpy.py <프로젝트> run > /dev/null 2>&1 &)`. PowerShell `Start-Process`나 출력을 잡는 방법은 도구가 게임이 끝날 때까지 기다림. 끌 때는 명령줄에 `<프로젝트> run`이 든 pythonw만 찾아서 끔(`Get-CimInstance Win32_Process`). 사용자가 켠 게임은 끄지 않음.
- **실시간 연결 시험 클라이언트**(파이썬): `game/showpy_live.json`의 포트로 붙어 `{"hello": token}`을 보내고, 한 줄 JSON으로 명령(`editor`, `panel`, `goto`, `panel.do`, `custom_ui.set`, `save` …)을 보내며 `state`를 받아 봄. `state.panel`의 나무를 글로 찍어 버튼 `id`를 찾아 `panel.do`로 누름. 저장 → 다시 불러오기는 `showpy_live.json`의 토큰이 바뀔 때까지 기다렸다가 다시 붙음. **앱이 켜져 있으면 3초마다 다시 붙어서 시험 연결을 끊으니 앱을 먼저 끔**.
- **진짜 앱 화면**: Playwright(`pykaki/app/node_modules/playwright`)의 `_electron.launch({ args: [앱 폴더, '--project', 프로젝트] })`로 앱을 켜서 누르고 찍음. 앱보다 게임을 먼저 켜 둠.
- **게임 화면 찍기**: 시험 프로젝트에 임시 `zz_shot.rpy`(always_shown 타이머가 `game/zz_shot_req` 파일을 보면 `renpy.screenshot`)를 넣고, 끝나면 `zz_shot*`를 지움. computer-use로는 게임 창 입력이 안 먹음.
- **효과 등록 비교**, **효과 모양 비교**, **구글 문서 확인**: HISTORY.md와 예전 판 HANDOFF(git 기록)의 방법 그대로.

## 4. 지금까지 한 일

### 2026-11-03 (클라우드 세션)

1. 실시간 미리보기 버그 두 개, 등장 효과를 셰이더 한 파일 + PyKaki WebGL로 (showpy 4.13)
2. 두 저장소를 pygaki 하나로 합침, PyKaki 데스크톱 앱, 런처 버튼 두 개와 묶음 스크립트

### 2026-11-04 (로컬 세션 1~3)

1. showpy 4.13 확인(Lint, 효과 20개 비교), 묶음 시험, 새 프로젝트 템플릿 고침(`a057014`), GitHub Pages, 예전 저장소 보관, 구글 문서를 4.13 기준으로
2. showpy 4.14 (`ui_kit` 3.13): 게임 메뉴 화면에서 ESC 메뉴를 왼쪽에 (`tmenu.game_menu_side` 등)
3. showpy 4.15 (`ui_kit` 3.14) + 앱 [showpy] 화면: `editor_live.rpy`가 127.0.0.1 포트를 열고 `game/showpy_live.json`을 씀, 앱 `main.cjs`가 붙음. 타이틀/ESC 메뉴만 앱 칸
4. 저장소 하나만 유지(`docs/HISTORY.md`), 확인용 묶음 `pygaki-dev-renpy-8.5.3` 만듦

### 2026-11-04 (로컬 세션 4, 이번)

1. 사용자가 4.15 앱 연결, 4.14 게임 메뉴 화면을 확인함 (괜찮음)
2. **showpy 4.16** (`ui_kit` 3.15, `118f09c`): 커서, CTC, 대사 소리를 앱 전용 칸으로
   - 게임: 상태 `custom_ui`, 파일 목록 메시지 `files`, 명령 `custom_ui.set/reset/listen/stop`, `files`
   - 앱: `ShowpyCustomUI.tsx` (텍스트 속도, 대사 소리, CTC/커서 그림 12칸과 고르기, 커서 방식·기준점, 퀵메뉴, 24fps 미리보기). 그림은 앱이 `game/`에서 직접 읽음
   - 고침: 저장 뒤 다시 불러오면 옛 값으로 보이던 것(`custom_ui.runtime`), 앱 화면이 늦게 뜨면 첫 상태를 놓치던 것(`main.cjs`가 마지막 state/files를 기억)
   - 사용자 확인함 (괜찮음)
3. **showpy 4.17** (`ui_kit` 3.16, `2f0ffa5`): 남은 탭(셰이더 두 개, 대사, 선택지, 그림 배치)을 공통 틀로 앱에
   - 게임이 패널 안쪽(`ui_editor_panel_body`, `editor.rpy`에서 뗌)과 고르기 창(`ui_editor_popup`)을 화면 밖(`ui_editor_live_mirror`, x -40000)에 그려 위젯 나무로 보냄(`state.panel`) → 앱 `ShowpyMirror.tsx`가 그대로 그림 → 누르면 `panel.do`(자리 번호 + 버튼 글)
   - 읽기 규칙(`_mirror`): Button(입력칸을 감싼 버튼은 입력칸), Input, Text, Bar(세로=스크롤바는 뺌), Solid(거의 투명한 것, 무지개 띠는 뺌), Image, MultiBox(h/v), Grid/VPGrid(g), Window는 바탕 빼고 안쪽만
   - `goto start` 명령, 일렁임 옛 값 고침(`watermorph.state.saved`)
4. **showpy 4.18** (`splash` 1.2, `ui_kit` 3.17, `8dbff50`): 스플래시 편집 탭을 새로 만듦 + 타이틀 탭 옛 값 고침
   - `splash/editor/editor_splash.rpy` (ui_kit이 있을 때만 등록). 엔진 `merged()` = 엔진 기본 → `splash.default` → 페이지 → `splash.layout` → 편집 중인 값. `check()`도 layout까지 봄
   - 엔진 `check()`가 막는 조합(영상 없이 "영상이 끝날 때", 클릭으로 못 넘기는데 "클릭할 때까지")은 탭에서 미리 막음
   - 타이틀: `tmenu.state.saved`, `cfg()`가 layout/pause_layout/layout_default를 거기서 먼저 읽음
5. **showpy 4.19** (`ui_kit` 3.18, `068d9bc`): 사용자 제보 "PyKaki가 켜져 있으면 게임 화면이 가끔 클릭/입력이 안 먹음"
   - 원인: 앱에서 칸을 고르면 게임 안 편집기가 패널 없이 열리는데, 편집기(`EditorInput`)는 열려 있는 동안 마우스 클릭과 키를 전부 가져감(원래 설계). 게임 창에 표시가 없었음. 고르기 창이 열려 있으면 Esc 말고 전부 막힘
   - 고침: 게임 화면 위 가운데 "편집 중: <탭> (PyKaki 앱) | 클릭과 키는 편집기로 가요 | Esc로 닫기" 띠(글자만이라 입력은 안 막음). 앱은 커서/대사 소리 칸에서 편집기를 열지 않고, [대본] 화면으로 가면 닫고, 편집 중이면 칸 위에 알림 + [편집기 닫기]
6. 단계마다 확인: 시험 클라이언트, 진짜 앱 화면 찍기, smoke(커서 칸, 패널 버튼 추가), Lint(시험 프로젝트 두 곳, 묶음 템플릿, ui_kit 없이 splash만), 확인용 묶음 바꿔 넣기

## 5. 남은 확인 (사람이 눈으로 볼 것)

사용자는 `pygaki-dev` 묶음의 런처에서 `pykaki_sample`을 [프로젝트 실행]하고 [PyKaki로 대본 쓰기] → [showpy]로 확인합니다.

- [ ] showpy 4.20 인게임 화면 셰이더: "셰이더 고르기"에서 1번/2번 고르면 바로 보이는지, 세모(▶)가 게임 줄을 따라가는지, 세모 두 번 누르기, [여기에서부터 적용] → [저장] → 원고에 `$ screen_fx.shaders(…)`, 다시 켜서 그 줄부터 바뀌는지 (원고에 저장은 시험에서 안 해 봄)
- [ ] showpy 4.20 타이틀: 검은 배경, 배경 그림/webm 고르기, 제목/부제 글과 글자 효과, **회전 손잡이를 마우스로 끌기(자동 시험으로는 못 함)**, "└ 타이틀 셰이더"
- [ ] showpy 4.20 ESC 메뉴: 투명 배경, 배경 고르기, "└ 게임 내 메뉴 셰이더"(ESC 메뉴 연 채로)

- [ ] showpy 4.19: 앱에서 칸을 고르면 게임 화면 위에 "편집 중" 띠, Esc나 [편집기 닫기] 뒤 게임이 다시 넘어가는지, 커서 칸이나 [대본] 화면에서는 게임 입력이 되는지
- [ ] showpy 4.18 스플래시 칸: 값 바꾸고 [이 페이지 보기] → 게임 창에 바뀐 모양, 저장 뒤 게임을 다시 켜도 그 모양 (사용자가 warning 페이지 글자 크기를 저장해 봄)
- [ ] showpy 4.17 앱 칸: 타이틀 셰이더(타이틀에서), 인게임 화면 셰이더, 대사, **선택지(선택지가 뜬 화면에서, 자동으로는 아직 못 봄)**, 그림 배치 → 게임에 바로 보이는지, 저장
- [x] showpy 4.16 커서/대사 소리 칸, 4.15 앱 연결, 4.14 게임 메뉴 화면 (2026-11-04 사용자 확인)

예전부터 남은 것:

- [ ] `fx_test_25`를 켜서 4.13 등장 효과를 눈으로 보기, 대사 탭 효과 버튼
- [ ] 런처를 영어로 바꿨을 때 버튼 한글이 보이는지
- [ ] 앱과 게임을 나란히: showpy 편집기에서 그림 넣기 → 앱에 바로 받아 적힘, 앱에서 Ctrl+E → 게임이 다시 불러옴
- [ ] 실시간 미리보기([렌파이에서 보기])를 PyKaki와 렌파이를 같이 켜 놓고
- [ ] 실제 폴더 선택창으로 [렌파이 프로젝트 연결], 크롬에서 F8 전체화면, 소리, 렌파이 대사 탭 저장
- [ ] 구글 문서: 새로 넣은 목록 글머리, 새 표 줄 글꼴

### 2026-11-04 (로컬 세션 5)

사용자 요청 세 가지(타이틀 꾸미기와 셰이더, 게임 내 메뉴 꾸미기와 셰이더, 인게임 셰이더 단순하게) + 회전 손잡이.

1. **`screen_fx` 4.3** (`engine/screen_fx.rpy`, `editor/editor_fx.rpy`, `screen_fx_config.rpy`)
   - 두 자리: 1번 = `current`, 2번 = `cur_overlay`. 2번에 효과 이름이 들어감(`overlay_flag`, `_resolve_overlay`, `_check_overlay`). VHS도 1번에 옴(`resolve`, `base_effect`). `use("vhs_crt")`는 `overlay`를 안 적을 때만 예전처럼 "없음 + VHS"
   - `screen_fx.shaders(a, b)`, `slot_choices()`, `slot_label()`(기본/아스키/VHS/단말기/게임보이), `current_slots()`
   - 타이틀/메뉴: `menu_context()`(스플래시 아님 + `main_menu` → "title", `_menu` → "pause"), `menu_slots()`, 설정 `title_shaders`, `menu_shaders`. `_shown()`이 그 자리를 화면 전체(글자 빼기 없음)에 씌움. 효과의 `scope`, `auto`는 안 봄
   - 편집기: FxTab "셰이더 고르기"(page 이름은 `"lines"` 그대로) = 고르기(`picks`, `preview_slots`) + 줄 목록(세모, `follow`, `mark_click`은 0.6초 안에 두 번) + `apply_here` → `{"slots": (a, b)}` → `$ screen_fx.shaders("a", "b")`. MenuFxTab `title_fx`, `pause_fx`(cedit.edits에 넣고 `screen_fx_layout.rpy`로)
   - 세모는 Neo둥근모(`screen_fx/fonts/neodgm.ttf`)로 그림(기본 글꼴에 없음)
2. **`ui_kit` 3.19** (`engine/title_menu.rpy`, `editor/editor_title.rpy`, `editor/editor.rpy`, `editor/editor_live.rpy`, `title_menu_config.rpy`)
   - `background_disp(menu)`: 타이틀은 고른 것이 없으면 검은 Solid, ESC 메뉴는 None(투명). 그림은 `fit="cover"`, 영상은 `Movie`. 일렁임 `target="background"`면 감쌈. `main_menu_frame`, `pause_dim` 기본 끔
   - `label_items(menu)`: 제목, 부제(`tmenu.labels`, `pause_labels` → `label_layout` → `state.label_edits`). 화면 `tmenu_labels`. 편집 중에는 `tmenu_lbl_N` 버튼, `focused_index()`는 메뉴 항목 수 + N
   - 글자 효과: `with_effect()` = `textshader` + `slow_cps`(`tmenu.effect_cps`). 크기 재는 sizer에는 안 넣음
   - TitleTab: `_entries()` = 항목 + 글자, `set_key()`(앱이 씀), 회전 손잡이(`rot_center`, `rot_handle`, 끌기 토큰 `("rot", i)`, 마우스 위치로 각도, Shift 15도), 배경 고르기 창 `background`
   - 실시간 연결: title에 `kind`, `name`, `effect`, `background`, `effects`. 명령 `title.background`. files에 `movies`. `editor.pending`에 `pending_lines()`도 셈
3. **PyKaki 앱** (`ShowpyView.tsx`, `showpyLive.ts`): 목록 "└ 타이틀 셰이더", "└ 게임 내 메뉴 셰이더", "타이틀 일렁임"(이름 바꿈). 타이틀 칸에 배경 고르기, 글 칸, 글자 효과
4. 확인: Lint(pykaki_sample, fx_test_25, 묶음 템플릿, ui_kit만, screen_fx만). 시험 클라이언트로 타이틀 글자/효과, 타이틀 셰이더 VHS+게임보이, 저장 → 다시 켜도 그대로, 인게임 셰이더 고르기 미리 보기, 줄 고르기, 세모 두 번, ESC 메뉴 투명 + 메뉴 셰이더 아스키, 회전 손잡이 그림. smoke 통과, 진짜 앱 화면 찍기. 시험으로 저장한 것은 지움(`pykaki_sample`의 `title_menu_layout.rpy`는 원래 있던 `start` 한 줄만 남김)
5. 확인용 묶음: 템플릿 `showpy\game`에 4.20 복사(템플릿 `screen_fx.overlay = False` 다시 적용), `pygaki\PyKaki`를 새 앱으로

## 6. 다음에 할 만한 것

- **정식 판 v1.1**: 사용자가 5장 맨 위 세 줄을 확인한 뒤 `git tag v1.1 && git push origin v1.1` → Actions "배포 파일"이 Releases 초안 → 초안 확인 → 공개. 앱은 서명이 없어서 윈도우가 처음에 경고함(읽어주세요에 안내 있음). 덧붙임 zip을 진짜 런처 화면에서 켜 보기도 그때
- **공개용 구글 문서**: 4.13 기준 → 4.14~4.19(게임 메뉴 화면, 앱 [showpy] 화면, 스플래시 편집, "편집 중" 띠)를 한 번에. 고치는 방법과 함정은 7장
- 스플래시 더 하기: 글 내용(제목, 본문 문장, 조작 방법 목록) 고치기, 페이지 더하기/지우기/순서 (지금은 `splash_config.rpy`에서). 글은 번역 문자열 `_()`이라 저장 방식을 먼저 정해야 함
- 앱 창을 게임 창 옆에 저절로 붙이기 (지금은 사용자가 나란히 놓음)
- Actions 경고: Node.js 20 액션(`checkout@v4` 등)이 곧 막힘. 새 판으로 올리기
- 화면 전체 글리치: VHS 덮개 보강, 화면 블록 글리치, 화면 데이터모싱 흉내
- 참고자료 `F:\Dropbox\1_DEV\renpydev\assets\참고자료\uRHAHdq1xFNfW-Wc.mp4` 아직 안 봄
- 시험으로 만든 `F:\Dropbox\1_DEV\RENPY\pygaki_test`(망가짐), `pygaki_test2`는 필요 없으면 사용자가 지움

## 7. 알아 둘 것 (함정)

**렌파이, showpy**

- **실행 중에 store 변수를 바꾸면, 다시 불러올 때 옛 값으로 돌아감**: 렌파이는 다시 불러오기(저장 뒤 저절로, Shift+R) 직전 상태를 "지금 대사가 시작될 때" 모습으로 저장해서, 그 사이에 바꾼 `define` 값은 옛 값으로 돌아오고 새 `*_layout.rpy` 값을 덮음. 편집기가 저장한 값은 store 변수가 아니라 python_object에 둠: `custom_ui.runtime`, `watermorph.state.saved`, `fx.saved`/`cedit.saved`, `tmenu.state.saved`, `splash.state.saved`. 새 탭도 이렇게
- 렌파이 `init python` 안에서 `dict`, `list`, `object`는 되감기용 타입. 다른 스레드에서 쓰거나 json 값과 isinstance로 비교하면 안 됨 → `python_dict`, `python_list`, `python_object`
- 렌파이 글자 안의 `[이름]`은 변수 넣기. `[이 페이지 보기]` 같은 글은 `[[`로 써야 함 (안 그러면 게임이 오류로 멈춤)
- 편집기 글꼴에 가운뎃점(·)이 없어서 네모로 나옴. 게임 화면에 띄우는 글에는 `|` 같은 것을 씀
- 편집기가 열려 있으면 게임 입력이 편집기로 감(`EditorInput`). 앱이 붙어 있으면 "편집 중" 띠로 알림 (4.19)
- `tmenu` 설정 이름과 같은 이름의 함수를 만들면 안 됨 (`cfg()`가 전역 이름으로 찾음). 3.19의 `background`, `labels` 같은 설정 이름도 마찬가지(함수는 `background_disp`, `label_items`)
- 시험 프로젝트처럼 묶음 템플릿에 플러그인을 복사하면 템플릿의 `screen_fx_config.rpy`가 `overlay = True`로 돌아감. 템플릿에서는 `make_bundle.py`의 `TEMPLATE_SETTINGS`대로 다시 `False`로
- 실시간 연결 `panel.do`의 `id`는 패널 안내 줄 수가 바뀌면 같이 바뀜(예: `p.0.5…` ↔ `p.0.6…`). 시험 클라이언트는 누르기 전에 나무를 다시 읽음
- 앱 공통 틀(4.17)은 게임 화면 밖(x -40000)에 패널을 하나 더 그림. 화면 밖이라 눌리지 않음(렌파이 `modal`은 자기 영역 안에서만 막음)
- 템플릿 프로젝트를 Lint하면 `.rpyc`, `game/cache`, `game/saves`가 생김. 묶음 템플릿에서는 지움
- 렌파이 SDK의 `gui/game`은 그대로 템플릿으로 쓰면 안 됨(그림 없이 첫 실행 때 만들다 실패)
- 런처 파일은 런처의 `new_template_project`, `interface.input`, `project.current`, `config.overlay_screens`를 씀(렌파이 8.5.3). 렌파이를 올리면 이 이름들과 `generate_gui`, `gui_images` 명령을 봄
- 기본 SDK 런처(`renpy-8.5.3-sdk`)에는 pygaki 버튼이 없음(묶음 사본에만). 원본 SDK는 묶음 재료라 손대지 않음

**앱, 도구**

- 앱(`main.cjs`)은 게임에서 마지막으로 받은 `state`, `files`를 기억했다가 화면이 `liveStatus`를 부르면 넘겨줌. 게임은 바뀔 때만 상태를 보내기 때문
- 붙는 앱은 하나뿐. 새로 붙으면 앞의 연결이 끊김 (시험 클라이언트와 앱이 서로 끊음)
- 앱은 Electron 33. 로컬 `npm run dist`는 `winCodeSign` 심볼릭 링크 권한 오류 → 시험용은 `npx electron-builder --win dir -c.win.signAndEditExecutable=false`(아이콘, 버전 정보만 빠짐). 공식 빌드는 Actions
- Actions "PyKaki 앱"은 `pykaki/**`나 `text_effects.glsl`이 바뀌면 돎
- 긴 셸 명령(여러 줄 파이썬을 heredoc으로)은 도구가 가끔 잘라서 실패함. 그럴 때는 스크립트를 파일로 써서 돌림
- Dropbox 안 폴더는 지울 때 "사용 중"으로 일부만 지워질 수 있음. 바꾼 뒤 폴더 모양을 다시 봄
- 크롬 확장으로 구글 문서를 고칠 때: 단축키 창이 열린 것을 화면으로 확인한 뒤 침. 한글이 가끔 깨지고 따옴표가 둥근 따옴표로 바뀜. 끝나면 export로 받아 diff. 제목 스타일은 툴바의 스타일 목록으로. 내장 브라우저는 구글에 로그인 안 됨, 사용자의 크롬은 됨

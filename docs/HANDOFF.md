# 인수인계 (2026-11-04 로컬 세션 4 → 다음 대화)

새 대화에서 pygaki를 쓰거나 고칠 때 이 문서부터 읽습니다. 맨 위 [CLAUDE.md](../CLAUDE.md)의 규칙도 같이 지킵니다.
새 대화는 "docs/HANDOFF.md 읽고 이어서 하자"로 시작하면 됩니다. 지나온 기록과 주요 결정은 [HISTORY.md](HISTORY.md)에 있습니다.

## 0. 지금 어디까지 (먼저 읽기)

- **최신 판**: showpy 4.17 (`ui_kit` 3.16). PyKaki 앱 [showpy] 화면에서 모든 편집기 탭을 고침(타이틀/ESC/커서는 앱 전용 칸, 나머지는 게임 안 패널을 통째로 옮겨 그림). 4.16까지 `main`에 push됨. 4.17이 올라갔는지는 `git log`로 확인
- **사용자가 확인하는 곳**: `F:\SHOWPY\pygaki-dev-renpy-8.5.3\renpy.exe` (로컬에서 만든 시험용 묶음. 4.17 템플릿 ui_kit/screen_fx 파일과 새 앱으로 바꿔 넣음). 확인 순서는 3장 "확인용 묶음"
- **사용자가 아직 직접 안 본 것**: 5장 맨 위 줄 (4.17 셰이더, 대사, 선택지, 그림 칸). 4.16 커서/대사 소리 칸, 4.15 앱 연결, 4.14 게임 메뉴 화면은 2026-11-04에 사용자가 확인함(괜찮음)
- **다음 큰 일**: 스플래시 편집 탭 새로 만들기(6장 맨 위, 만들면 앱에도 저절로 나옴), 타이틀 탭 "다시 불러오면 옛 값" 고치기 (7장)
- **미뤄 둔 것**: 공개용 구글 문서(아직 4.13 기준)는 앱 칸을 몇 개 더 옮긴 뒤 한 번에. 정식 판(v1.1 태그)도 사용자가 4.15를 확인한 뒤

## 1. pygaki 한눈에

렌파이(Ren'Py)로 게임을 만드는 사람을 위한 도구 묶음입니다. 사용자는 한국어로 대화합니다.

- **PyKaki**: 파이썬을 몰라도 상자와 선으로 렌파이 대본을 쓰는 에디터. 웹 버전과 데스크톱 앱(Electron)
- **showpy**: 렌파이 플러그인. 게임을 켠 채 그림, 대사 위치, 화면 효과를 마우스로 고치는 편집기와 UI 묶음
- **pygaki 묶음**: 렌파이 SDK + showpy 템플릿 + 런처 버튼 + PyKaki 앱을 윈도우용 폴더 하나로

| 무엇 | 자리 |
|---|---|
| 저장소 | https://github.com/halftomatodev/pygaki (`main`) |
| 배포 파일 (묶음, 덧붙임 zip) | https://github.com/halftomatodev/pygaki/releases (v1.0) |
| 웹 버전 PyKaki | https://halftomatodev.github.io/pygaki/ (`main`에 push하면 자동 배포) |
| 공개용 사용 안내 (구글 문서, showpy 4.13 기준) | https://docs.google.com/document/d/10kmDFgiQ9JpbgIY6Q7vejf3EjMC06rCJCxjVSeukdes/edit |
| 로컬 저장소 | `F:\SHOWPY\pygaki` (Dropbox 밖) |
| 렌파이 SDK | `F:\SHOWPY\renpy-8.5.3-sdk` |
| PyKaki 앱 빌드(받아 둔 것) | `F:\SHOWPY\PyKaki-win` (v1.0 때 받은 예전 판. 최신은 Actions "PyKaki 앱"의 `PyKaki-win`이나 로컬 빌드 `pykaki/app/out/win-unpacked`) |
| 렌파이 프로젝트 폴더 | `F:\Dropbox\1_DEV\RENPY` |
| 시험 프로젝트 (showpy 4.17 들어 있음) | `fx_test_25`, `pykaki_sample` |
| 최신 시험용 묶음 (2026-11-04, showpy 4.17 + 새 앱) | `F:\SHOWPY\pygaki-dev-renpy-8.5.3\renpy.exe` (덧붙임은 `pygaki-dev-addon`). v1.0 폴더는 4.13 그대로 |
| 사용자의 진짜 게임 (말할 때만 건드림) | `horror`, `test_plugin` |

예전 `pykaki`, `showpy` 저장소는 "pygaki로 옮겼어요" 안내를 넣고 보관(archive)했습니다(두 저장소의 기록은 모두 이 저장소에 있음). 예전 로컬 폴더 `F:\SHOWPY\pykaki`, `F:\SHOWPY\showpy`는 2026-11-04에 지웠습니다. 지나온 기록과 주요 결정은 [HISTORY.md](HISTORY.md)에 있습니다.

### 저장소 구조

| 폴더 | 내용 | 먼저 읽기 |
|---|---|---|
| `pykaki/` | 웹 버전 (React + Vite, `npm run build` → `pykaki/dist/index.html` 한 파일) | `pykaki/CLAUDE.md`, `pykaki/docs/SPEC.md`, `pykaki/docs/GUIDE.md`(사용 안내) |
| `pykaki/app/` | 데스크톱 앱. 웹 빌드를 복사해서 켬. `pykaki/src/desktop.ts`가 앱 파일 기능을 브라우저 폴더 손잡이 모양으로 감쌈 | `pykaki/docs/SPEC.md` 9-2 |
| `pykaki/src/fx/` | 등장 효과 WebGL 미리보기. 렌파이 내장 효과는 `renpy_textshaders.glsl`(MIT) | |
| `showpy/game/` | 플러그인 4개: `ui_kit`, `screen_fx`, `hotkeys`, `splash` | `showpy/docs/DEV_RULES.md`, `showpy/docs/SPEC.md`, `showpy/docs/READ_ME_FIRST.md` |
| `showpy/game/ui_kit/engine/text_effects.glsl` | 등장 효과 셰이더 **하나뿐**. 렌파이와 PyKaki가 같이 씀 | 파일 맨 위 "적는 법" |
| `docs/LINK.md` | 두 프로그램이 맞추는 형식 (내보낸 .rpy 표시, `showpy_inbox.json`, `stage_layout.rpy`, `pykaki_preview.json`, 셰이더, 9장 실시간 연결 `showpy_live.json`) | 형식을 바꿀 때 |
| `docs/HISTORY.md` | 지나온 기록, 주요 결정과 이유, 버전 대응 | 왜 이렇게 됐는지 궁금할 때 |
| `bundle/` | `make_bundle.py`(묶기), `launcher/pygaki_launcher.rpy`(런처 버튼) | `bundle/README.md` |
| `.github/workflows/` | `deploy.yml` 웹 Pages 배포, `app.yml` 앱 확인(리눅스 Electron) + 윈도우 `PyKaki.exe` 빌드, `release.yml` 태그를 올리면 묶음·덧붙임 zip을 Releases 초안으로 | |

## 2. 쓰는 법 (사용자 입장)

- **웹 버전**: 크롬이나 엣지로 웹 주소를 열고 왼쪽 [렌파이 프로젝트 연결] → 프로젝트 폴더를 고르면 `game/script_flow.rpy`를 만들고 연결이 켜집니다. 그다음부터 Ctrl+E로 내보냅니다. `script.rpy`는 지우지 않아도 됩니다(내보낸 파일의 `config.label_overrides["start"] = "prologue"`).
- **묶음**: 묶음 폴더의 `renpy.exe` → 런처 아래쪽
  - [showpy 새 프로젝트]: showpy가 들어간 1280x720 한국어 프로젝트를 만듦 (VHS 덮개는 처음에 꺼짐)
  - [PyKaki로 대본 쓰기]: 왼쪽에서 고른 프로젝트를 앱으로 열고, 대본은 `프로젝트이름.flow.json`에 자동 저장
- **showpy 편집기**: 게임 실행 중 Shift+M. 대사 위치와 줄마다 화면 효과는 여기 대사 탭에서, 글과 글자 모양·속도·등장 효과는 PyKaki 글자 효과 칸에서 고칩니다.
- **실시간 미리보기**: PyKaki 글자 효과 칸의 [렌파이에서 보기]를 켜고 게임을 개발 모드로 켜 두면 지금 쓰는 줄이 게임 위에 진짜 효과로 나옵니다.
- **앱의 [showpy] 화면 (4.15)**: 앱 툴바 [대본 | showpy]. 런처에서 [프로젝트 실행]으로 게임을 켜 두면 저절로 붙고 초록 점. 게임 창과 나란히 씀. 가운데는 지금 화면과 원고 줄, 왼쪽은 고칠 것 목록, 오른쪽은 칸. 타이틀/ESC 메뉴만 앱 칸이 있고 나머지는 "게임 안" 표시(누르면 게임 안 패널이 그 탭으로 열림). 자세히는 `pykaki/docs/GUIDE.md` 9-2
- **게임 메뉴 화면 (4.14)**: 저장, 환경설정 등에서 ESC 메뉴가 왼쪽에 남고 제목과 내용은 오른편. 예전 모양은 `tmenu.game_menu_side = False`

## 3. 고치는 법 (개발)

### 명령

```bash
cd pykaki && npm ci            # 처음 한 번 (node_modules가 없으면 npx tsc가 엉뚱한 패키지를 받음)
cd pykaki && npm run dev       # http://localhost:5173
cd pykaki && npx tsc --noEmit
cd pykaki && npm run build     # pykaki/dist/index.html (dist는 git에 안 올라감)
cd pykaki/app && npm ci && npm start
```

렌파이 Lint (SDK 안의 파이썬으로):

```bash
cd /f/SHOWPY/renpy-8.5.3-sdk && ./lib/py3-windows-x86_64/python.exe renpy.py <프로젝트 폴더> lint
```

배포 파일 만들기 (2분쯤, `bundle/out/`은 git에 안 올라감. 다시 만들 때는 그 폴더를 먼저 지움). 묶음(SDK 포함)과 덧붙임(SDK 폴더에 넣기만) 두 가지가 생김:

```bash
python bundle/make_bundle.py --sdk 'F:\SHOWPY\renpy-8.5.3-sdk' --app 'F:\SHOWPY\PyKaki-win' --zip --tag v1.0
```

보통은 태그를 올리면(`git tag v1.0 && git push origin v1.0`) Actions "배포 파일"이 만들어 Releases에 초안으로 올림. 자세히는 `bundle/README.md`.

### 고칠 때 지킬 순서

- **PyKaki**: 고친 뒤 `npx tsc --noEmit`, `npm run build`. 화면 확인은 dev 서버로.
- **showpy**: 고친 뒤 Lint → 시험 프로젝트(`fx_test_25`, `pykaki_sample`)의 플러그인 폴더를 바꿔 넣고 `.rpyc` 지우기 → Lint.
  - 바꿔 넣을 때 시험 프로젝트에만 있는 것을 살립니다: 편집기로 만든 `*_layout.rpy`, fx_test_25의 `ui_kit/stage_config.rpy`의 `define stage.bg_tag = [ "bg", "fx_bg" ]` (시험용 설정).
  - 버전을 올리면 `showpy/CHANGELOG.md`, `showpy/docs/READ_ME_FIRST.md`, `ui_kit/engine/ui_kit.rpy`의 `VERSION`도.
- **등장 효과 추가/수정**: `text_effects.glsl`에만 적습니다(사본 없음). 렌파이는 init에서 읽어 등록하고, PyKaki는 빌드할 때 가져갑니다. 형식은 `docs/LINK.md` 8장. 고친 뒤 Lint, 웹 빌드, 가능하면 렌파이 화면과 PyKaki 미리보기를 나란히 봅니다.
- **형식을 바꾸면** `docs/LINK.md`와 양쪽 코드를 같은 커밋에서.
- **묶음/런처**: `bundle/make_bundle.py`의 `PLUGINS`(넣을 플러그인), `SIZE`, `LANGUAGE`, `TEMPLATE_SETTINGS`(템플릿에서만 바꾸는 설정). 런처 버튼 자리는 `pygaki_launcher.rpy`의 `ypos 506`.
- **문서**: 사용 안내가 바뀌면 `pykaki/docs/GUIDE.md`, `showpy/docs/*`를 고치고, 공개용 구글 문서에도 반영합니다.
- **커밋**: 작성자 `halftomato <wwonwan@naver.com>` (`git -c user.name=halftomato -c user.email=wwonwan@naver.com commit ...`). 커밋과 push는 사용자에게 물어본 뒤.
- **작업 방식**: showpy를 고칠 때는 DEV_RULES대로 먼저 할 수 있는지, 짧은 계획, 예상 시간을 말하고 사용자가 "시작"이라고 하면 시작합니다. 답은 한국어 반말.

### 확인용 묶음 (`F:\SHOWPY\pygaki-dev-renpy-8.5.3`)

사용자는 이 묶음의 `renpy.exe`로 최신 내용을 확인합니다. **원본은 저장소이고 묶음은 만든 순간의 사본**이라, 고친 뒤 아래를 맞춰 줍니다.

| 고친 것 | 맞출 것 |
|---|---|
| showpy 플러그인 | 시험 프로젝트(`pykaki_sample`, `fx_test_25`)에 복사 + `.rpyc` 지우기 + Lint. 새 프로젝트 템플릿까지 바꿀 때는 묶음도 다시 |
| PyKaki (웹 화면, 앱) | `npm run build` → 앱 빌드 → 묶음 다시 (또는 묶음의 `pygaki\PyKaki` 폴더만 바꿔 넣기) |
| 런처 버튼, 템플릿 설정 | 묶음 다시 |

묶음 다시 만들기 (5~10분. 있던 `F:\SHOWPY\pygaki-dev-*`를 먼저 지움. 켜져 있는 런처와 앱을 먼저 끔):

```bash
cd pykaki && npm run build
cd pykaki/app && rm -rf out && npx electron-builder --win dir -c.win.signAndEditExecutable=false
python bundle/make_bundle.py --sdk 'F:\SHOWPY\renpy-8.5.3-sdk' --app 'F:\SHOWPY\pygaki\pykaki\app\out\win-unpacked' --out 'F:\SHOWPY' --tag dev
```

그 뒤 템플릿 Lint(`renpy.py F:\SHOWPY\pygaki-dev-renpy-8.5.3\showpy lint`)를 하고, Lint가 남긴 `showpy/game`의 `.rpyc`, `cache`, `saves`를 지웁니다.

- 게임은 프로젝트 폴더 안의 showpy를 읽으므로, 어느 런처로 켜든 그 프로젝트에 넣은 판이 돕니다.
- [showpy 새 프로젝트]로 만든 게임은 만들 때 showpy를 복사해 가서 나중 판이 저절로 들어가지 않습니다. 사용자의 진짜 게임에는 말할 때만 넣습니다.
- 저장소에서 바로 앱을 켜려면 `cd pykaki/app && npm start -- --project "F:\Dropbox\1_DEV\RENPY\pykaki_sample"`.

### 확인 방법 (이번에 쓴 것)

- **효과 등록이 예전과 같은지**: 시험 프로젝트 복사본 두 개(예전/새 플러그인)에 `init -999`에서 `renpy.register_textshader`를 감싸 인자를 JSON으로 적는 `zz_dump.rpy`를 넣고 Lint를 돌린 뒤 비교. 셰이더 코드는 공백을 빼고, `adjust_function`은 가짜 객체에 불러서 결과값으로 비교합니다.
- **런처/앱 화면**: 묶음의 `renpy.exe`를 켜고 컴퓨터 사용(computer-use)으로 확인. 앱 창은 `PyKaki.exe`, 게임 창은 묶음의 `pythonw.exe`로 접근을 따로 받아야 보입니다. 게임 창은 다른 창 뒤에 숨기 쉬워서, 실행 확인은 프로젝트의 `log.txt`, `traceback.txt`로 했습니다.
- **효과 모양 비교**(다시 할 때): 시험용 페이지에 `SayBox`를 1280x720, 글자 40, 30글자/초, 문장 "효과 미리보기 Sample 글자"로 띄우고 Playwright `page.clock`으로 1/15초씩 대사창 자리(880x90, 왼쪽 230 위 578)를 찍어, 견본 webm(ffmpeg로 프레임 풀기, 앞에 프레임 4장쯤 더 있음)과 나란히 봅니다. 이 도구는 저장소에 없습니다.
- **구글 문서 확인**: `.../export?format=txt`, `format=html`로 받아 고치기 전과 diff, 링크 주소 목록 확인.

## 4. 지금까지 한 일

### 2026-11-03 (클라우드 세션)

1. 실시간 미리보기 버그 두 개 (showpy `editor_preview.rpy` 첫 파일 무시, PyKaki 권한 없을 때 [권한 허용] 안내)
2. 등장 효과를 셰이더 한 파일 + PyKaki WebGL로 (showpy 4.13, ui_kit 3.12). 견본 영상 27개와 프레임 비교로 맞춤
3. 두 저장소를 pygaki 하나로 합침 (기록 그대로)
4. PyKaki 데스크톱 앱 (`PyKaki.exe --project "폴더"`, 자동 저장, showpy 기록 바로 받아 적기, 프로젝트 밖 쓰기 막기)
5. 런처 버튼 두 개와 묶음 스크립트

### 2026-11-04 (로컬 세션)

1. showpy 4.13 Lint 통과. 렌파이에 등록되는 효과 20개가 4.12와 같은지 비교(셰이더 코드, 값, adjust 결과 모두 같음)
2. 묶음 시험: 런처 버튼 자리 OK(한국어 런처), [PyKaki로 대본 쓰기]로 앱 열림·자동 저장 OK
3. **고침**: [showpy 새 프로젝트]로 만든 프로젝트가 처음 켤 때 GUI 그림 만들기에서 오류 → `make_bundle.py`가 런처처럼 `generate_gui --start` + `gui_images`(휴대폰용, 보통 두 번)로 그림까지 만든 기본 프로젝트를 템플릿으로 쓰게 함 (커밋 `a057014`). 새 프로젝트 만들기, 실행, Lint 통과
4. GitHub Pages 켜고 배포 성공
5. 문서와 화면(`Sidebar.tsx`)의 예전 주소를 pygaki로 (커밋 `9277865`)
6. 예전 두 저장소에 안내 넣고 보관
7. 시험 프로젝트 두 곳에 showpy 4.13 넣음 (Lint 깨끗). 바꾸기 전 폴더 백업은 임시 폴더에 있었음(세션이 끝나면 없어질 수 있음)
8. 구글 문서를 4.13 기준으로 고침 (1장 표와 바뀐 점, 2장 글자 효과 칸·F8·데스크톱 앱 절, 3장 준비 순서, 4장 cps, 링크 전부). 원안은 `F:\SHOWPY\구글문서_수정안.md`

### 2026-11-04 (로컬 세션 4)

0. (뒤에) showpy 4.17 (`ui_kit` 3.16): 남은 탭을 공통 틀로 앱에 (사용자가 4.16 확인 뒤 "전부 앱 안으로")
   - 탭마다 앱 화면을 만들지 않고, 게임이 패널 안쪽(`ui_editor_panel_body`, `editor.rpy`에서 뗌)과 고르기 창(`ui_editor_popup`)을 화면 밖(`ui_editor_live_mirror`, x -40000)에 그려 그 위젯을 읽어 보냄 → 앱 `src/ShowpyMirror.tsx`가 그대로 그림. 누르면 `panel.do`(자리 번호 + 버튼 글). 형식은 `docs/LINK.md` 9장
   - 읽기 규칙(`editor_live.rpy`의 `_mirror`): Button(입력칸을 감싼 버튼은 입력칸), Input, Text, Bar(세로 막대=스크롤바는 뺌), Solid(거의 투명한 것, 무지개 띠는 뺌), Image, MultiBox(h/v), Grid/VPGrid(g), Window는 바탕 빼고 child만
   - `goto start` 명령, 앱에 [게임 시작]/[타이틀로 가기]
   - 고침: 타이틀 일렁임 옛 값 문제(`watermorph.state.saved`). 화면 효과는 원래 `fx.saved`, `cedit.saved`(python_object)라 괜찮았음
   - 확인: 시험 클라이언트로 화면 효과(누르기, 막대), 일렁임 저장 → 다시 불러오기, 대사 탭, 그림 탭 + 그림 고르기 창 나무 찍기. 진짜 앱 + pykaki_sample로 화면 효과, 색 고르기 창, 그림 배치, 그림 고르기 창, 줄 번호 입력 찍기. 로컬 smoke(패널 버튼 추가) 통과. Lint 깨끗(시험 프로젝트 두 곳, 묶음 템플릿). 선택지 탭은 화면에 선택지가 떠야 해서 아직 앱으로 안 봄
1. 사용자가 4.15 앱 연결, 4.14 게임 메뉴 화면을 확인함 (괜찮음)
2. showpy 4.16 (`ui_kit` 3.15): 커서, CTC, 대사 소리를 앱 칸으로 (앱 칸 옮기기 1번)
   - 게임: `editor_live.rpy`에 상태 `custom_ui`, 파일 목록 메시지 `files`, 명령 `custom_ui.set/reset/listen/stop`, `files`. 형식은 `docs/LINK.md` 9장
   - 앱: `src/ShowpyCustomUI.tsx` (텍스트 속도, 대사 소리, CTC/커서 그림 12칸과 고르기, 커서 방식·기준점, 퀵메뉴, 24fps 미리보기). 그림은 앱이 `game/`에서 직접 읽음. 게임 폴더에 없는 그림은 빨갛게 표시
   - 고침: 저장 뒤 저절로 다시 불러오면 옛 값으로 보이던 것 (`custom_ui.runtime`). 앱 화면이 늦게 뜨면 첫 상태를 놓치던 것 (`main.cjs`가 마지막 state/files를 기억해 `liveStatus`로 넘김)
   - 확인: 파이썬 시험 클라이언트로 명령 전부와 저장 → 다시 불러오기(새 파일, 있던 파일, 두 번 저장), 로컬 smoke(커서/대사 소리 칸 추가) 통과, 진짜 앱 + pykaki_sample로 화면 찍기. Lint 깨끗(시험 프로젝트 두 곳, 묶음 템플릿)
   - 시험하다 pykaki_sample의 환경설정 글자 속도(persistent)가 40글자/초로 바뀌었을 수 있음. 시험으로 생긴 `custom_ui_layout.rpy`는 지움

### 2026-11-04 (로컬 세션 2, 3)

1. showpy 4.14 (`ui_kit` 3.13): 게임 메뉴 화면(대사록, 저장, 불러오기, 환경설정 등)에서 ESC 메뉴를 왼쪽에 그대로 두고 제목과 내용을 오른편에. `title_menu.rpy`가 `game_menu` 스크린을 대신 정의함. 설정 `tmenu.game_menu_side`, `game_menu_content_x`, `game_menu_gap`, `game_menu_line`. 시험 프로젝트 두 곳에 넣고 Lint, pykaki_sample을 켜서 화면을 찍어 확인(게임 중, 타이틀에서, `game_menu_side = False`)
   - 화면 찍기 방법: 시험 프로젝트에 `config.always_shown_screens`에 타이머 스크린을 넣어 `renpy.run(ShowMenu(...))`, `renpy.screenshot(...)`을 차례로 부르는 임시 파일(끝나면 지움). `config.overlay_screens`는 메인 메뉴에서 안 보여서 안 됨. splash는 클릭을 기다리니 `splash.enabled = False`
   - `tmenu` 설정 이름과 같은 이름의 함수를 만들면 안 됨 (`cfg()`가 전역 이름으로 찾음)
2. showpy 4.15 (`ui_kit` 3.14) + PyKaki 앱 [showpy] 화면: 게임 안 편집기를 앱에서 조종 (1~2단계)
   - 게임: `editor/editor_live.rpy`가 개발 모드에서 127.0.0.1 포트를 열고 `game/showpy_live.json`(포트, 토큰)을 씀. 0.1초마다 받은 명령 처리 + 바뀐 상태 보냄. 앱이 붙어 있으면 게임 안 패널 숨김
   - 앱: `app/main.cjs`가 그 파일을 보고 붙음(지켜보기 + 3초마다). 화면은 `src/ShowpyView.tsx`, `src/showpyLive.ts`. 형식은 `docs/LINK.md` 9장
   - 앱 칸이 있는 것은 타이틀 메뉴, ESC 메뉴뿐. 나머지(스플래시, 셰이더, 커서/CTC, 대사, 선택지, 그림)는 앱에서 골라 게임 안 패널로 엶 → **다음 단계: 탭을 하나씩 앱 칸으로 옮기기** (스플래시는 게임 안 탭도 없어서 새로 만들어야 함)
   - 확인: 파이썬 시험 클라이언트로 명령 전부, 진짜 앱 + pykaki_sample을 나란히 켜서 연결, 위치/원고 보기, 타이틀로 가기, 편집 시작, 숫자 바꾸기 → 게임 반영, 저장(`title_menu_layout.rpy`). `app/smoke.cjs`에 가짜 게임 연결 시험 추가(로컬 통과)
   - 함정: 렌파이 `init python` 안에서 `dict`, `list`, `object`는 되감기용 타입이라 다른 스레드에서 쓰거나 json 값과 isinstance로 비교하면 안 됨 → `python_dict`, `python_list`, `python_object`
   - 함정: computer-use의 `open_application("Python")`은 게임 창이 아니라 새 파이썬 콘솔을 켬. 창 자리는 PowerShell `SetWindowPos`로 잡음. 게임 창에 보내는 끌기, 휠, 키 입력은 자동 입력으로는 안 먹었음(사람이 확인)
3. 저장소 하나만 유지: GitHub의 예전 `pykaki`, `showpy`는 보관 상태 그대로, 예전 로컬 폴더 두 개는 지움(바뀐 것, 안 올린 커밋 없음 확인). `docs/HISTORY.md` 씀 (커밋 `f7d153c`)
4. 확인용 묶음 `F:\SHOWPY\pygaki-dev-renpy-8.5.3` 만듦 (showpy 4.15 템플릿 + 새 앱 + 런처 버튼). 런처 버튼 보임, [PyKaki로 대본 쓰기]로 새 앱([대본 | showpy] 있음)이 열리는 것까지 확인

## 5. 남은 확인 (사람이 눈으로 볼 것)

사용자는 `pygaki-dev` 묶음의 런처에서 `pykaki_sample`을 [프로젝트 실행]하고 [PyKaki로 대본 쓰기] → [showpy]로 확인합니다.

- [ ] showpy 4.17 앱 칸: 타이틀 셰이더(타이틀에서), 인게임 화면 셰이더, 대사, 선택지(선택지가 뜬 화면에서), 그림 배치를 앱에서 고르고 누르기/막대/색·글꼴·그림 고르기 창 → 게임에 바로 보이는지, 저장
- [x] showpy 4.16 커서/대사 소리 칸, 4.15 앱 연결, 4.14 게임 메뉴 화면 (2026-11-04 사용자 확인)

- [ ] `fx_test_25`를 켜서 4.13 등장 효과를 눈으로 보기, 대사 탭 효과 버튼(이제 glsl에서 이름을 읽음)
- [ ] 런처를 영어로 바꿨을 때 버튼 한글이 보이는지
- [ ] 앱과 게임을 나란히: showpy 편집기에서 그림 넣기 → 앱에 바로 받아 적힘, 앱에서 Ctrl+E → 게임이 다시 불러옴
- [ ] 실시간 미리보기([렌파이에서 보기])를 PyKaki와 렌파이를 같이 켜 놓고
- [ ] 예전부터 남은 것: 실제 폴더 선택창으로 [렌파이 프로젝트 연결], 크롬에서 F8 전체화면, 소리, 렌파이 대사 탭 저장
- [ ] 구글 문서: 새로 넣은 목록이 "●" 글머리, 새 표 줄의 글꼴이 주변과 조금 다를 수 있음. 4.5~4.12는 한 절로 줄여 넣음

## 6. 다음에 할 만한 것

- **앱 칸 옮기기 (3단계)**: 지금 "게임 안" 칸을 하나씩 앱 칸으로. 하나 옮길 때마다 게임 쪽 상태/명령(`editor_live.rpy`의 `live_state`, `_live_cmd`), `docs/LINK.md` 9장 표, 앱 칸(`ShowpyView.tsx`의 `SECTIONS`에서 `app: true`), smoke 시험을 같은 커밋에서. 추천 순서:
  1. ~~커서, CTC, 대사 소리~~ (4.16에서 함, 앱 전용 칸)
  2. ~~셰이더 두 탭, 대사, 선택지, 그림 배치~~ (4.17에서 공통 틀로. 게임 탭을 고치면 앱도 저절로)
  3. **스플래시**: 게임 안 탭이 없어서 편집 탭(`ui_editor.Tab`)부터 새로 만듦. 페이지 목록, 바탕(색/그림/영상), 글, 시간, 넘어가기, `splash_layout.rpy` 저장, 미리 보기. 탭만 만들면 앱에는 공통 틀로 저절로 나옴(앱 `SECTIONS`에서 `tab: 'splash', mirror: true`)
  4. 타이틀 탭(`tm.layout`, `pause_layout`) 옛 값 문제 고치기
  - 게임 안 패널은 앱이 없을 때 쓰는 예비로 남김
- 앱 창을 게임 창 옆에 저절로 붙이기(지금은 사용자가 나란히 놓음)
- 공개용 구글 문서에 4.14, 4.15 반영 (앱 칸을 몇 개 더 옮긴 뒤 한 번에)
- 정식 판 v1.1: 사용자가 4.15를 확인한 뒤 `git tag v1.1 && git push origin v1.1` → Releases 초안 확인 → 공개
- 배포: `release.yml`을 손으로 돌려 성공함(2026-11-04, 템플릿 그림 만들기·Lint 통과, Artifacts `pygaki-dev`에 두 zip). v1.0을 Releases에 공개함(2026-11-04). 다음 판은 태그만 올리고 초안을 보고 공개. 앱은 서명이 없어서 윈도우가 처음에 경고함(읽어주세요에 [추가 정보] → [실행] 안내)
- Actions 경고: Node.js 20 액션(`checkout@v4` 등)이 곧 막힘. 새 판으로 올리기
- 덧붙임 zip을 진짜 런처 화면에서 켜 보기(로컬에서는 SDK 복사본에 풀어 런처 Lint, 템플릿 프로젝트 Lint까지만 함)
- 화면 전체 글리치: VHS 덮개 보강, 화면 블록 글리치, 화면 데이터모싱 흉내
- 참고자료 `F:\Dropbox\1_DEV\renpydev\assets\참고자료\uRHAHdq1xFNfW-Wc.mp4` 아직 안 봄
- 렌파이 견본 영상(`pykaki/public/effects/*.webm`)은 그대로 둠. 다시 만들 때 `pykaki/tools/record_effect_clips.py`
- 시험으로 만든 `F:\Dropbox\1_DEV\RENPY\pygaki_test`(고치기 전 버전, 망가짐), `pygaki_test2`는 필요 없으면 사용자가 지움

## 7. 알아 둘 것 (함정)

- 런처 파일은 런처의 `new_template_project`, `interface.input`, `project.current`, `config.overlay_screens`를 씁니다(렌파이 8.5.3). 렌파이를 올리면 이 이름들과 `generate_gui`, `gui_images` 명령이 그대로인지 봅니다.
- 렌파이 SDK의 `gui/game`은 그대로 템플릿으로 쓰면 안 됩니다(그림 없이 `guisupport.rpy`가 첫 실행 때 만들다 실패).
- Dropbox 안 폴더는 지울 때 "사용 중"으로 일부만 지워질 수 있습니다. 통째로 바꾼 뒤 폴더 모양을 꼭 다시 봅니다.
- 앱은 Electron 33, electron-builder `--win dir`. Actions "PyKaki 앱"은 `pykaki/**`나 `text_effects.glsl`이 바뀌면 돕니다.
- 크롬 확장(Claude in Chrome)으로 구글 문서를 고칠 때: 단축키 창(Ctrl+H, Ctrl+F)이 안 열렸는데 글을 치면 본문에 들어갑니다. 창이 열린 것을 화면으로 확인한 뒤 칩니다. 한글이 가끔 깨지고("둬도"→"둠도"), 따옴표가 둥근 따옴표로 바뀝니다. 끝나면 export로 받아 diff로 확인합니다. Ctrl+Alt+숫자(제목 스타일)는 안 먹어서 툴바의 스타일 목록을 씁니다.
- 내장 브라우저는 구글에 로그인되어 있지 않습니다. 사용자의 크롬은 로그인되어 있습니다.
- 로컬에서 `npm run dist`(앱 빌드)를 하면 electron-builder가 `winCodeSign`을 풀다 심볼릭 링크 권한 오류가 남. 시험용은 `npx electron-builder --win dir -c.win.signAndEditExecutable=false`로 빌드(실행 파일 아이콘, 버전 정보만 빠짐). 공식 빌드는 Actions가 함
- 템플릿 프로젝트를 Lint하면 `.rpyc`, `game/cache`, `game/saves`가 생김. 묶음 템플릿에서는 지움
- **실행 중에 store 변수를 바꾸면, 다시 불러올 때 옛 값으로 돌아감**: 렌파이는 다시 불러오기(저장 뒤 저절로, Shift+R) 직전 상태를 "지금 대사가 시작될 때" 모습으로 저장해. 그래서 그 사이에 바꾼 `define` 값(예: `tm.layout`)은 옛 값으로 돌아오고, 새로 쓴 `*_layout.rpy` 값을 덮음. custom_ui는 4.16에서 `custom_ui.runtime`, 일렁임은 4.17에서 `watermorph.state.saved`(보통 파이썬 객체)로 고침. 화면 효과는 원래 `fx.saved`, `cedit.saved`라 괜찮음. 타이틀(`tm.layout`, `pause_layout`)만 아직 같은 방식이라, 원고 저장처럼 다시 불러오는 저장과 같이 하면 그 세션에서 옛 값으로 보일 수 있음(파일은 맞음)
- 앱 공통 틀(4.17)은 게임 화면 밖(x -40000)에 패널을 하나 더 그림. 패널 스크린 구조를 바꿔도 앱은 그대로 따라옴. 새 위젯 종류(예: 다른 렌파이 displayable)를 쓰면 `editor_live.rpy`의 `_mirror`에 읽는 법을 더함
- 시험할 때 게임을 켜는 법: `(./lib/py3-windows-x86_64/pythonw.exe renpy.py <프로젝트> run > /dev/null 2>&1 &)`. PowerShell `Start-Process`나 출력을 잡는 방법은 도구가 게임이 끝날 때까지 기다림. 끌 때는 그 프로젝트 `run` 명령줄을 가진 pythonw만 찾아서 끔
- 앱(`main.cjs`)은 게임에서 마지막으로 받은 `state`, `files`를 기억했다가 화면이 `liveStatus`를 부르면 넘겨줌. 게임은 바뀔 때만 상태를 보내기 때문
- 기본 SDK 런처(`renpy-8.5.3-sdk`)에는 pygaki 버튼이 없음(묶음 사본에만 넣음). 원본 SDK는 묶음 재료라 손대지 않음

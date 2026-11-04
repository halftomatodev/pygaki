# 인수인계 (2026-11-04 로컬 세션 6 → 다음 대화, 세션 7부터)

새 대화에서 pygaki를 쓰거나 고칠 때 이 문서부터 읽습니다. 맨 위 [CLAUDE.md](../CLAUDE.md)의 규칙도 같이 지킵니다.
새 대화는 "docs/HANDOFF.md 읽고 이어서 하자"로 시작하면 됩니다. 지나온 기록, 판마다 고친 코드, 주요 결정은 [HISTORY.md](HISTORY.md)에 있습니다.

## 0. 지금 어디까지 (먼저 읽기)

- **최신 판**: showpy 4.22 (`ui_kit` 3.21, `screen_fx` 4.5, `hotkeys` 1.0, `splash` 1.2) + **pygaki 앱**(예전 이름 PyKaki). 모두 `main`에 push됨(마지막 코드 커밋 `876db68`)
- **이름**: 묶음과 데스크톱 앱은 **pygaki**, 대본 편집기(웹 버전, 앱의 [대본 편집] 화면)는 **PyKaki**라고 부름. 앱 위쪽은 [대본 편집] / [GUI 편집]
- **사용자가 확인하는 곳**: `F:\SHOWPY\pygaki-dev-renpy-8.5.3\renpy.exe` (로컬 시험용 묶음, 4.22 템플릿·런처 버튼·새 앱 `pygaki\app\pygaki.exe`를 그 자리에서 바꿔 넣음). 런처를 껐다 켜야 새 버튼 이름이 나옴
- **새 시험 프로젝트**: `F:\Dropbox\1_DEV\RENPY\pygaki_sample` (묶음 템플릿 그대로 + 커서·CTC 샘플 + 시험용 짧은 `script.rpy`). 사용자가 "예전 것이 얽혀 있으니 새 샘플로"라고 함. 시험은 여기서
- **다음 대화는 이것부터 물어보기**: 5장 맨 위 4.22 줄과 4.21 줄. 그 아래 4.20~4.17도 아직 사용자 확인 전
- **공개용 구글 문서**: 4.22 기준으로 고침(세션 6 끝, 수정안 `F:\SHOWPY\구글문서_수정안.md`). 고치는 방법은 6장
- **정식 판 v1.1 공개함** (2026-11-04, https://github.com/halftomatodev/pygaki/releases/tag/v1.1 = showpy 4.22 + pygaki 앱). 묶음 zip을 받아 구성과 안의 앱 켜기는 확인함. 런처 버튼 눌러 보기와 덧붙임 zip은 사람이 확인할 것(5장 맨 위)
- **pykaki_sample에 사용자가 저장한 것**: `game/screen_fx/vhs_crt_layout.rpy`, `game/splash/splash_layout.rpy`. 지우지 말 것

## 1. pygaki 한눈에

렌파이(Ren'Py)로 게임을 만드는 사람을 위한 도구 묶음입니다. 사용자는 한국어로 대화합니다.

- **PyKaki**: 파이썬을 몰라도 상자와 선으로 렌파이 대본을 쓰는 에디터. 웹 버전과, 앱의 [대본 편집] 화면
- **showpy**: 렌파이 플러그인. 게임을 켠 채 그림, 대사 위치, 셰이더를 마우스로 고치는 편집기(Shift+M)와 UI 묶음
- **pygaki 앱**: [대본 편집](PyKaki) + [GUI 편집](실행 중인 게임과 이어져서 showpy 편집기를 앱에서 조종). Electron
- **pygaki 묶음**: 렌파이 SDK + showpy 템플릿 + 런처 버튼 + pygaki 앱을 윈도우용 폴더 하나로

| 무엇 | 자리 |
|---|---|
| 저장소 | https://github.com/halftomatodev/pygaki (`main`) |
| 배포 파일 (묶음, 덧붙임 zip) | https://github.com/halftomatodev/pygaki/releases (최신 v1.1 = showpy 4.22, v1.0 = 4.13) |
| 웹 버전 PyKaki | https://halftomatodev.github.io/pygaki/ (`main`에 push하면 자동 배포) |
| 공개용 사용 안내 (구글 문서, showpy 4.22 기준) | https://docs.google.com/document/d/10kmDFgiQ9JpbgIY6Q7vejf3EjMC06rCJCxjVSeukdes/edit |
| 구글 문서 수정안 | `F:\SHOWPY\구글문서_수정안.md` (4.22, 반영함), `구글문서_수정안_4.13_반영함.md` (지난번) |
| 로컬 저장소 | `F:\SHOWPY\pygaki` (Dropbox 밖) |
| 렌파이 SDK | `F:\SHOWPY\renpy-8.5.3-sdk` (묶음 재료, 손대지 않음) |
| pygaki 앱 빌드 | 로컬 `pykaki/app/out/win-unpacked` (`pygaki.exe`), Actions "pygaki 앱"의 `pygaki-win`. `F:\SHOWPY\PyKaki-win`은 v1.0 때 받은 예전 판 |
| 렌파이 프로젝트 폴더 | `F:\Dropbox\1_DEV\RENPY` |
| 시험 프로젝트 (showpy 4.22) | `pygaki_sample`(새), `pykaki_sample`(PyKaki 원고, 단 `.flow.json`은 상자 1개뿐), `fx_test_25` |
| PyKaki 원고 시험 재료 | `showpy/examples/pykaki_sample` (원고 + 대본 `pykaki/sample.flow.json`). 임시 폴더에 복사해서 씀 |
| 확인용 묶음 | `F:\SHOWPY\pygaki-dev-renpy-8.5.3` (덧붙임 `pygaki-dev-addon`은 4.15 그대로). v1.0 폴더는 4.13 그대로 |
| 사용자의 진짜 게임 (말할 때만 건드림) | `horror`, `test_plugin` |

### 저장소 구조

| 폴더 | 내용 | 먼저 읽기 |
|---|---|---|
| `pykaki/` | 웹 버전 (React + Vite, `npm run build` → `pykaki/dist/index.html` 한 파일) | `pykaki/CLAUDE.md`, `pykaki/docs/SPEC.md`, `pykaki/docs/GUIDE.md`(사용 안내, 9-2 앱) |
| `pykaki/app/` | 데스크톱 앱. 웹 빌드를 복사해서 켬. `main.cjs`가 게임과 실시간 연결, `smoke.cjs`가 확인 시험 | `pykaki/docs/SPEC.md` 9-2 |
| `pykaki/src/Showpy*.tsx`, `showpyLive.ts` | 앱 [GUI 편집]. `ShowpyView`(목록, 원고 칸, 칸), `ShowpyCustomUI`(커서/대사 소리 칸, 커서와 셰이더), `ShowpyMirror`(게임 패널을 통째로 그리는 공통 틀) | |
| `pykaki/src/inbox.ts` | showpy가 넣은 줄 받아 적기 (`insert`, `replace`, `remove`, `say_pos`, `say_fx`) | `docs/LINK.md` 3장 |
| `showpy/game/` | 플러그인 4개: `ui_kit`, `screen_fx`, `hotkeys`, `splash` | `showpy/docs/DEV_RULES.md`, `showpy/docs/SPEC.md`, `showpy/docs/READ_ME_FIRST.md` |
| `showpy/game/ui_kit/editor/editor_live.rpy` | 앱과 실시간 연결(상태, 명령, 패널 통째로, "편집 중" 띠, `goto_line`) | `docs/LINK.md` 9장 |
| `showpy/game/ui_kit/engine/script_edit.rpy` | 원고 쓰기 도구 (줄 괄호, 줄 넣기, PyKaki 원고 규칙 `_pk_prepare`) | |
| `showpy/game/screen_fx/editor/editor_fx.rpy` | 셰이더 칸(두 자리, 세부 속성, 줄 목록, 셰이더가 바뀌는 줄), 커서와 셰이더 | |
| `showpy/game/ui_kit/engine/text_effects.glsl` | 등장 효과 셰이더 **하나뿐**. 렌파이와 PyKaki가 같이 씀 | 파일 맨 위 "적는 법" |
| `showpy/samples/gui/` | 커서, CTC 샘플 그림 (묶음이 새 프로젝트 `game/gui`에 넣음) | |
| `docs/LINK.md` | 두 프로그램이 맞추는 형식 | 형식을 바꿀 때 |
| `docs/HISTORY.md` | 지나온 기록, 판마다 고친 코드, 결정과 이유 | |
| `bundle/` | `make_bundle.py`(묶기), `launcher/pygaki_launcher.rpy`(런처 버튼) | `bundle/README.md` |
| `.github/workflows/` | `deploy.yml` 웹 배포, `app.yml` 앱 확인 + 윈도우 빌드(`pygaki-win`), `release.yml` 태그 → Releases 초안 | |

## 2. 쓰는 법 (사용자 입장, 4.22)

- **묶음**: `renpy.exe` → 런처 아래쪽 [pygaki로 새 프로젝트](showpy와 커서·CTC 샘플이 든 1280x720 한국어 프로젝트, VHS 덮개는 처음에 꺼짐), [pygaki로 편집](고른 프로젝트를 앱으로, 대본은 `프로젝트이름.flow.json`에 자동 저장)
- **웹 버전**: 크롬이나 엣지로 웹 주소 → [렌파이 프로젝트 연결] → Ctrl+E로 내보내기
- **showpy 편집기**: 게임 실행 중 Shift+M (앱 없이 쓸 때. 남겨 두기로 함)
- **앱 [GUI 편집]**: 런처 [Launch Project]로 게임을 켜 두면 저절로 붙고 초록 점. 게임 창과 나란히
  - 왼쪽 목록: 스플래시, 타이틀 메뉴(└ 타이틀 셰이더), 게임 내 메뉴(└ 게임 내 메뉴 셰이더), 타이틀 일렁임, 인게임 화면 셰이더, 커서·CTC·대사 소리, 대사(위치, 스타일), 선택지, 그림 배치
  - 가운데 원고 칸: 파일 전체 스크롤, 게임 줄을 따라감(직접 스크롤하면 멈춤, [지금 줄로]). **줄을 누르면 게임도 그 줄로**(지나온 줄이면 되감기, 처음 가는 줄이면 warp)
  - 칸을 고르면 게임 안 편집기가 열려서 게임 입력이 편집기로 감("편집 중" 띠, Esc나 [편집기 닫기]). 커서 칸과 [대본 편집]에서는 닫힘
  - [저장] = 편집기 Ctrl+S
- **셰이더**: 1번, 2번(기본/아스키/VHS/단말기/게임보이)을 고르면 바로 보이고, 고른 효과의 세부 속성이 그 아래. 줄을 고르고 "적용할 때 전환" → [여기에서부터 적용] → [저장]하면 원고에 `$ screen_fx.shaders("a", "b", transition=…)`. **두 자리는 늘 같이 바뀜**. "셰이더가 바뀌는 줄"에서 줄마다 전환, 예전 한 자리 줄은 [두 자리로 바꾸기]. 맨 아래 [처음 상태]. 타이틀과 ESC 메뉴는 "└" 칸에서 따로 두 자리
- **커서와 셰이더**: 커서 칸에서 [1번·2번 다 받음 / 2번만 받음 / 셰이더 안 받음] → 줄 고르기 → [여기에서부터 적용] → `$ screen_fx.set_cursor("top")`. 그림 폴더: 커서 `game/gui/cursor/`, CTC `game/gui/ctc/`
- **대사 탭**: 위치와 스타일만. 글자 등장 효과는 PyKaki에서. 원고에 이미 적힌 괄호(`fx=` 등)는 그대로 돌아감
- **타이틀/ESC 메뉴 꾸미기** (4.20): 배경(타이틀 기본 검은 화면, ESC 기본 투명), 제목·부제, 글자 효과, 게임 창에서 분홍 네모 끌어 회전
- **스플래시 편집** (4.18): 바탕, 로고, 글자, 위치, 넘어가는 때, [이 페이지 보기]. 글 내용은 `splash_config.rpy`에서

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

배포 파일은 태그를 올리면(`git tag v1.1 && git push origin v1.1`) Actions "배포 파일"이 Releases 초안으로. 손으로는 `python bundle/make_bundle.py --sdk 'F:\SHOWPY\renpy-8.5.3-sdk' --app <앱 폴더> --zip --tag <이름>`. 자세히는 `bundle/README.md`.

### 고칠 때 지킬 순서

- **작업 방식**: showpy를 고칠 때는 DEV_RULES대로 먼저 할 수 있는지(문제나 오류가 있으면 짚기), 짧은 계획, 예상 시간을 말하고 사용자가 "시작"이라고 하면 시작. 답은 한국어 반말
- **PyKaki**: 고친 뒤 `npx tsc --noEmit`, `npm run build`. 앱 쪽을 고쳤으면 `npm run web && node smoke.cjs`
- **showpy**: 고친 뒤 시험 프로젝트(`pygaki_sample`, `pykaki_sample`, `fx_test_25`)에 복사하고 `.rpyc` 지우기 → Lint. 플러그인은 따로 넣어도 돌아야 함(ui_kit 없이 screen_fx만, screen_fx 없이 ui_kit만 Lint)
  - 시험 프로젝트에만 있는 것을 살림: 사용자가 저장한 `*_layout.rpy`(0장), fx_test_25의 `ui_kit/stage_config.rpy`, `pygaki_sample`의 `screen_fx.overlay = False`
  - 버전을 올리면 `showpy/CHANGELOG.md`, `showpy/docs/READ_ME_FIRST.md`, `SPEC.md`, `CUSTOM_GUIDE.md` 머리, 플러그인 `README.md`, `ui_kit/engine/ui_kit.rpy`·`screen_fx/engine/screen_fx.rpy`의 `VERSION`
- **앱 [GUI 편집] 칸**: 새 편집기 탭은 게임 쪽 탭(`ui_editor.Tab`)만 만들면 공통 틀로 앱에 저절로 나옴. `ShowpyView.tsx`의 `SECTIONS`에 `tab`, `mirror: true`만 더함
- **원고에 새 종류의 줄을 넣으면**: PyKaki 원고에서는 `script_edit._pk_prepare`가 허용한 것만 써짐. 길을 더하고 PyKaki `inbox.ts`도 맞춤
- **형식을 바꾸면** `docs/LINK.md`와 양쪽 코드를 같은 커밋에서
- **문서**: `pykaki/docs/GUIDE.md`, `showpy/docs/*`, 공개용 구글 문서(6장)
- **커밋**: 작성자 `halftomato <wwonwan@naver.com>` (`git -c user.name=halftomato -c user.email=wwonwan@naver.com commit ...`). 커밋과 push는 사용자에게 물어본 뒤

### 확인용 묶음 (`F:\SHOWPY\pygaki-dev-renpy-8.5.3`)

사용자는 이 묶음의 `renpy.exe`로 최신 내용을 확인합니다. **원본은 저장소이고 묶음은 사본**이라 고친 뒤 맞춰 줍니다.

| 고친 것 | 맞출 것 |
|---|---|
| showpy 플러그인 | 묶음 템플릿 `showpy\game`에 복사 → `screen_fx.overlay = False` 다시 → 템플릿 Lint → `.rpyc`, `cache`, `saves` 지우기. 샘플 그림은 `showpy\game\gui` |
| 앱 (웹 화면, 앱) | `npm run build` → 앱 빌드 → 묶음의 `pygaki\app` 폴더를 통째로 바꿔 넣기 (켜져 있는 pygaki.exe를 먼저 끔) |
| 런처 버튼 | `bundle/launcher/pygaki_launcher.rpy`를 묶음 `launcher\game`에 복사, `.rpyc` 지움, 런처 껐다 켜기 |
| 읽어주세요 | `make_bundle.py`의 `README`로 `pygaki\읽어주세요.txt` 다시 쓰기 |
| 전부 | 묶음 다시 만들기(5~10분, 있던 `F:\SHOWPY\pygaki-dev-*`를 먼저 지움. **런처가 켜져 있으면 못 함**) |

```bash
cd pykaki && npm run build
cd pykaki/app && rm -rf out && npx electron-builder --win dir -c.win.signAndEditExecutable=false
python bundle/make_bundle.py --sdk 'F:\SHOWPY\renpy-8.5.3-sdk' --app 'F:\SHOWPY\pygaki\pykaki\app\out\win-unpacked' --out 'F:\SHOWPY' --tag dev
```

- 게임은 프로젝트 폴더 안의 showpy를 읽으므로, 어느 런처로 켜든 그 프로젝트에 넣은 판이 돕니다
- [pygaki로 새 프로젝트]로 만든 게임은 만들 때 showpy를 복사해 가서 나중 판이 저절로 들어가지 않습니다
- 저장소에서 바로 앱을 켜려면 `cd pykaki/app && npm start -- --project "F:\Dropbox\1_DEV\RENPY\pygaki_sample"`

### 확인 방법 (도구는 저장소에 없음. 새 세션에서 짧게 다시 만듦)

- **플러그인 복사 스크립트**(파이썬): `showpy/game`의 4개 폴더를 프로젝트 `game/`에 복사. `.rpyc`, `*_layout.rpy`는 복사 안 함, fx_test_25의 `ui_kit/stage_config.rpy`는 덮지 않음, `pygaki_sample`은 `screen_fx.overlay = False` 다시. 복사 뒤 `.rpyc` 지움. 게임이 켜져 있으면 먼저 끔
- **게임 켜고 끄기**: `cd /f/SHOWPY/renpy-8.5.3-sdk && (./lib/py3-windows-x86_64/pythonw.exe renpy.py <프로젝트> run > /dev/null 2>&1 &)`. 끌 때는 명령줄에 `<프로젝트> run`이 든 pythonw만 찾아서 끔(`Get-CimInstance Win32_Process`). 사용자가 켠 게임과 런처는 끄지 않음
- **시험 훅** `zz_shot.rpy`(시험 프로젝트에 임시로): `config.always_shown_screens`의 스크린이 0.2초마다 `game/zz_req`를 보면 그 파이썬을 실행하고 결과(`_zz_r`)를 `game/zz_out`에. 화면 찍기는 `renpy.screenshot(경로)`. Dropbox가 파일을 잡고 있으면 읽기/지우기가 실패하니 try로 감쌈. 끝나면 `zz_*` 지움
- **실시간 연결 시험 클라이언트**(파이썬): `game/showpy_live.json`의 포트로 붙어 `{"hello": token}`, 한 줄 JSON 명령(`editor`, `panel`, `goto`, `panel.do`, `custom_ui.cursor`, `save` …), `state`를 받음. `state.panel.body`에서 `k: "b"` 버튼의 `id`, `t`를 찾아 `panel.do`(누르기 전에 나무를 다시 읽음). 스플래시를 건너뛰려면 `goto` `where: "line"`(warp). 출력은 `PYTHONIOENCODING=utf-8`. **앱이 켜져 있으면 시험 연결을 끊으니 앱을 먼저 끔**
- **진짜 앱 화면**: 스크립트를 `pykaki/app` 안에 두고 `require('playwright')`의 `_electron.launch({ args: ['--no-sandbox', __dirname, '--project', 프로젝트] })`(밖에 두면 창이 안 뜸). 툴바 버튼은 `/^GUI 편집/`. 게임을 먼저 켜 둠. 타이틀에서는 "대사" 칸을 골라야 [게임 시작]
- **PyKaki 원고 한 바퀴**: `pykaki_sample`을 임시 폴더에 복사하고 원고와 대본을 `showpy/examples/pykaki_sample`의 것으로 바꿈(`game/script_flow.rpy`, `<폴더이름>.flow.json`) → 게임에서 적용·저장 → `showpy_inbox.json` 확인 → 앱을 켜서 받아 적기 → Ctrl+E로 내보낸 원고 비교
- computer-use로는 게임 창 입력이 안 먹음(마우스 끌기, 회전 손잡이는 자동 시험 못 함)

## 4. 지금까지 한 일 (짧게, 자세한 것은 HISTORY.md 2장)

- 2026-11-03: 등장 효과 셰이더 한 파일(4.13), 두 저장소를 pygaki로, 데스크톱 앱, 런처 버튼, 묶음
- 2026-11-04 세션 1~3: 4.13 확인, 묶음 템플릿 고침, GitHub Pages, 예전 저장소 보관, 구글 문서 4.13, Releases v1.0. 4.14 게임 메뉴 화면, 4.15 앱 연결
- 세션 4: 4.16 커서 칸, 4.17 게임 패널을 통째로 앱에, 4.18 스플래시 탭, 4.19 "편집 중" 띠
- 세션 5: 4.20 셰이더 두 자리, 타이틀/메뉴 셰이더, 타이틀·메뉴 꾸미기, 회전 손잡이
- 세션 6: 4.21 세부 속성을 1번/2번 아래로, 줄로 게임 옮기기(`fe5e067`). 4.22 이름 pygaki, 원고 칸 스크롤, 셰이더가 바뀌는 줄과 줄마다 전환, 두 자리 같이, 커서와 셰이더, 대사 탭 정리, **PyKaki 원고에 셰이더 줄이 저장되지 않던 것 고침**, 커서·CTC 샘플, 새 시험 프로젝트(`876db68`). 공개용 구글 문서를 4.22 기준으로

## 5. 남은 확인 (사람이 눈으로 볼 것)

사용자는 `pygaki-dev` 묶음의 런처에서 프로젝트를 [Launch Project]로 켜고 [pygaki로 편집] → [GUI 편집]으로 확인합니다.

- [ ] **v1.1 배포 파일**: Releases의 묶음 zip을 탐색기로 풀고 런처 [pygaki로 새 프로젝트] → [pygaki로 편집], 덧붙임 zip을 렌파이 SDK에 넣어 보기
- [ ] **4.22**: 런처 [pygaki로 편집] [pygaki로 새 프로젝트](런처 껐다 켜기), 앱 제목 pygaki와 [대본 편집] [GUI 편집], 예전 PyKaki의 최근 파일·설정이 그대로인지, 원고 칸 스크롤과 [지금 줄로], 셰이더가 바뀌는 줄의 전환 고르기와 [두 자리로 바꾸기] → 저장, 커서 칸 "커서와 셰이더"(소프트웨어 커서를 켜고 셰이더가 있는 장면에서 세 가지 차이), 커서·CTC 샘플 그림과 바둑판 칸, 대사 탭 안내 줄, **PyKaki 원고에서 [여기에서부터 적용] → 저장 → 대본에 받아 적힘**
- [ ] **4.21**: 셰이더 칸 1번/2번 아래 세부 속성, 막대가 바로 화면에, 줄을 누르면 게임이 그 줄로(되감기/warp), warp 뒤 편집기 다시 열림, 타이틀 셰이더 칸 세부 속성, 세부 속성 바꾸고 [저장] → `ascii_layout.rpy` 같은 파일 (저장은 시험에서 안 해 봄)
- [ ] **4.20**: 타이틀 검은 배경, 배경 그림/webm, 제목/부제와 글자 효과, **회전 손잡이를 마우스로 끌기(자동 시험으로는 못 함)**, ESC 메뉴 투명 배경, "└" 셰이더 두 칸
- [ ] **4.19**: "편집 중" 띠, Esc나 [편집기 닫기] 뒤 게임이 다시 넘어가는지
- [ ] **4.18**: 스플래시 값 바꾸고 [이 페이지 보기], 저장 뒤 다시 켜도 그 모양
- [ ] **4.17**: 선택지 칸(선택지가 뜬 화면에서, 자동으로는 아직 못 봄), 그림 배치 → 저장
- [x] 4.16 커서/대사 소리 칸, 4.15 앱 연결, 4.14 게임 메뉴 화면 (사용자 확인)

예전부터 남은 것: `fx_test_25`에서 4.13 등장 효과 눈으로 보기, 런처를 영어로 바꿨을 때 버튼 한글, 앱과 게임을 나란히 그림 넣기 → 받아 적기 → Ctrl+E, 실시간 미리보기([렌파이에서 보기]), 실제 폴더 선택창으로 [렌파이 프로젝트 연결], 구글 문서 새 목록 글머리·표 글꼴.

## 6. 다음에 할 만한 것

- **공개용 구글 문서**: 판이 바뀌면 수정안 파일을 만들고 반영 (4.22까지 반영함)
  - 문서는 공개 보기라 `https://docs.google.com/document/d/10kmDFgiQ9JpbgIY6Q7vejf3EjMC06rCJCxjVSeukdes/export?format=md`를 `curl`로 받아 읽음(로그인 없이). 고치기 전과 뒤에 받아서 `diff`
  - 고치기는 사용자 크롬(Claude in Chrome 확장, 로그인됨). 한 문장은 찾기 및 바꾸기(Ctrl+H, 칸을 세 번 눌러 고르고 입력 → [모두 바꾸기]). 여러 줄 절은 Ctrl+F로 찾고 Esc(찾은 글이 골라진 채) → Home/End/Enter로 자리를 만든 뒤, 페이지 JS로 `.docs-texteventtarget-iframe` 안의 편집 칸에 `ClipboardEvent('paste', {clipboardData})`(text/html)를 보냄. 제목이 굵게 들어오면 줄을 고르고 Ctrl+\ (서식 지우기). 끝에 생긴 빈 줄은 BackSpace
- **다음 정식 판(v1.2 등)**: v1.1처럼. `git tag v1.2 && git push origin v1.2` → Actions "배포 파일"이 Releases 초안(앱 `pygaki-win`, 묶음 안 `pygaki\app\pygaki.exe`) → `gh release download`로 묶음 zip을 받아 구성 확인, 묶음 안 `pygaki.exe`를 Playwright `executablePath`로 켜 보기 → 안내 글에 "바뀐 점" 더하기(`gh release edit --notes-file`) → 사용자에게 물은 뒤 `gh release edit v1.2 --draft=false --latest`. 앱은 서명이 없어 윈도우가 처음에 경고함
- v1.1에서 남은 것: Actions가 만든 템플릿의 `script.rpy`가 렌파이 영어 기본 대본(`scene bg room`, `show eileen happy`, Lint 경고 2줄, 게임은 빈 자리 그림으로 돎, v1.0도 같음). 로컬에서 만든 묶음은 한국어 대본. 고치려면 `make_bundle.py`가 템플릿 `script.rpy`를 직접 써 넣게
- 다듬을 것(사용자가 말하면): 셰이더가 바뀌는 줄의 두 자리는 파일을 위에서부터 읽은 대강의 값(분기, jump, 다른 파일은 안 봄). warp는 그 사이 변수(선택지 결과 등)를 따라 하지 않음(셰이더, 커서는 맞춤). 앱 미러에서 세모 없는 줄의 왼쪽 칸이 비어 조금 어긋남, 세부 속성 들여쓰기가 안 보임. 게임보이처럼 층마다 씌우는 효과는 VHS보다 먼저 그려짐
- 스플래시 글 내용(제목, 본문, 조작 방법) 고치기, 페이지 더하기/지우기 (번역 문자열이라 저장 방식을 먼저 정해야 함)
- 앱 창을 게임 창 옆에 저절로 붙이기
- Actions 경고: Node.js 20 액션(`checkout@v4` 등)이 곧 막힘. 새 판으로
- 화면 전체 글리치: VHS 보강, 화면 블록 글리치, 화면 데이터모싱 흉내
- 참고자료 `F:\Dropbox\1_DEV\renpydev\assets\참고자료\uRHAHdq1xFNfW-Wc.mp4` 아직 안 봄
- 시험으로 만든 `F:\Dropbox\1_DEV\RENPY\pygaki_test`(망가짐), `pygaki_test2`는 필요 없으면 사용자가 지움

## 7. 알아 둘 것 (함정)

**렌파이, showpy**

- **실행 중에 store 변수를 바꾸면, 다시 불러올 때 옛 값으로 돌아감**: 편집기가 저장한 값은 store 변수가 아니라 python_object에 둠(`custom_ui.runtime`, `watermorph.state.saved`, `fx.saved`/`cedit.saved`, `tmenu.state.saved`, `splash.state.saved`). 새 탭도 이렇게
- 렌파이 `init python` 안에서 `dict`, `list`, `object`는 되감기용 타입 → 다른 스레드나 json 값 비교에는 `python_dict`, `python_list`, `python_object`
- 렌파이 글자 안의 `[이름]`은 변수 넣기. `[여기에서부터 적용]` 같은 글은 `[[`로 써야 함
- 편집기 글꼴에 가운뎃점(·)이 없어서 네모로 나옴. 세모(▶)는 Neo둥근모 글꼴로
- 편집기가 열려 있으면 게임 입력이 편집기로 감(`EditorInput`). 앱이 붙어 있으면 "편집 중" 띠
- `tmenu` 설정 이름과 같은 이름의 함수를 만들면 안 됨 (`cfg()`가 전역 이름으로 찾음)
- **PyKaki가 만든 원고**(`# PyKaki가 만든 파일이에요.`)는 원고 쓰기 도구가 허용한 줄만 씀. 화면 효과 줄은 4.22부터 됨. 나머지는 이유를 알리고 저장 안 함
- **렌파이 warp**는 그 줄까지 `scene`/`show`만 따라 하고 `$` 줄은 실행하지 않음. `live.after_warp`로 셰이더·커서만 맞춤
- 되감기 예외(RollbackException)는 BaseException이라 `except Exception`에 안 걸림
- 묶음 템플릿이나 `pygaki_sample`에 플러그인을 복사하면 `screen_fx_config.rpy`가 `overlay = True`로 돌아감 → 다시 `False`
- 실시간 연결 `panel.do`의 `id`는 패널 안내 줄 수가 바뀌면 같이 바뀜
- 앱 공통 틀은 게임 화면 밖(x -40000)에 패널을 하나 더 그림. 화면 밖이라 눌리지 않음
- 템플릿 프로젝트를 Lint하면 `.rpyc`, `game/cache`, `game/saves`가 생김. 묶음 템플릿에서는 지움. 저장소의 `showpy/`는 완전한 프로젝트가 아니라 Lint가 안 됨(시험 프로젝트에서)
- 렌파이 SDK의 `gui/game`은 그대로 템플릿으로 쓰면 안 됨
- 런처 파일은 런처의 `new_template_project`, `interface.input`, `project.current`, `config.overlay_screens`를 씀(렌파이 8.5.3)

**앱, 도구**

- 앱 설정·자동 저장은 `%APPDATA%\PyKaki`(이름을 pygaki로 바꿔도 `main.cjs`의 `app.setPath('userData', …)`로 그대로). appId도 그대로
- 앱(`main.cjs`)은 게임에서 마지막으로 받은 `state`, `files`를 기억했다가 넘겨줌. 붙는 앱은 하나뿐(시험 클라이언트와 앱이 서로 끊음)
- 앱은 Electron 33. 로컬 `npm run dist`는 `winCodeSign` 권한 오류 → `npx electron-builder --win dir -c.win.signAndEditExecutable=false`. 공식 빌드는 Actions("pygaki 앱"은 `pykaki/**`나 `text_effects.glsl`이 바뀌면 돎)
- 긴 셸 명령(여러 줄 파이썬 heredoc)은 가끔 잘리거나 `\` 이스케이프가 꼬임 → 스크립트를 파일로 써서 돌림(경로는 raw 문자열)
- Dropbox 안 폴더는 지울 때 일부만 지워질 수 있음
- 구글 문서를 크롬 확장으로 고칠 때: 단축키 창이 열린 것을 화면으로 확인한 뒤 침. 한글이 가끔 깨지고 따옴표가 둥근 따옴표로 바뀜. 끝나면 export로 받아 비교. 제목 스타일은 툴바의 스타일 목록으로. 내장 브라우저는 구글에 로그인 안 됨

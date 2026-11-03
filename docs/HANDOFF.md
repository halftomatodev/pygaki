# 인수인계 (2026-11-04 로컬 세션 → 다음 대화)

새 대화에서 pygaki를 쓰거나 고칠 때 이 문서부터 읽습니다. 맨 위 [CLAUDE.md](../CLAUDE.md)의 규칙도 같이 지킵니다.
새 대화는 "docs/HANDOFF.md 읽고 이어서 하자"로 시작하면 됩니다.

## 1. pygaki 한눈에

렌파이(Ren'Py)로 게임을 만드는 사람을 위한 도구 묶음입니다. 사용자는 한국어로 대화합니다.

- **PyKaki**: 파이썬을 몰라도 상자와 선으로 렌파이 대본을 쓰는 에디터. 웹 버전과 데스크톱 앱(Electron)
- **showpy**: 렌파이 플러그인. 게임을 켠 채 그림, 대사 위치, 화면 효과를 마우스로 고치는 편집기와 UI 묶음
- **pygaki 묶음**: 렌파이 SDK + showpy 템플릿 + 런처 버튼 + PyKaki 앱을 윈도우용 폴더 하나로

| 무엇 | 자리 |
|---|---|
| 저장소 | https://github.com/halftomatodev/pygaki (`main`) |
| 웹 버전 PyKaki | https://halftomatodev.github.io/pygaki/ (`main`에 push하면 자동 배포) |
| 공개용 사용 안내 (구글 문서, showpy 4.13 기준) | https://docs.google.com/document/d/10kmDFgiQ9JpbgIY6Q7vejf3EjMC06rCJCxjVSeukdes/edit |
| 로컬 저장소 | `F:\SHOWPY\pygaki` (Dropbox 밖) |
| 렌파이 SDK | `F:\SHOWPY\renpy-8.5.3-sdk` |
| PyKaki 앱 빌드(받아 둔 것) | `F:\SHOWPY\PyKaki-win` (Actions "PyKaki 앱"의 `PyKaki-win`) |
| 렌파이 프로젝트 폴더 | `F:\Dropbox\1_DEV\RENPY` |
| 시험 프로젝트 (showpy 4.13 들어 있음) | `fx_test_25`, `pykaki_sample` |
| 사용자의 진짜 게임 (말할 때만 건드림) | `horror`, `test_plugin` |

예전 `pykaki`, `showpy` 저장소는 "pygaki로 옮겼어요" 안내를 넣고 보관(archive)했습니다. 예전 로컬 폴더 `F:\SHOWPY\pykaki`, `F:\SHOWPY\showpy`는 더 이상 고치지 않습니다.

### 저장소 구조

| 폴더 | 내용 | 먼저 읽기 |
|---|---|---|
| `pykaki/` | 웹 버전 (React + Vite, `npm run build` → `pykaki/dist/index.html` 한 파일) | `pykaki/CLAUDE.md`, `pykaki/docs/SPEC.md`, `pykaki/docs/GUIDE.md`(사용 안내) |
| `pykaki/app/` | 데스크톱 앱. 웹 빌드를 복사해서 켬. `pykaki/src/desktop.ts`가 앱 파일 기능을 브라우저 폴더 손잡이 모양으로 감쌈 | `pykaki/docs/SPEC.md` 9-2 |
| `pykaki/src/fx/` | 등장 효과 WebGL 미리보기. 렌파이 내장 효과는 `renpy_textshaders.glsl`(MIT) | |
| `showpy/game/` | 플러그인 4개: `ui_kit`, `screen_fx`, `hotkeys`, `splash` | `showpy/docs/DEV_RULES.md`, `showpy/docs/SPEC.md`, `showpy/docs/READ_ME_FIRST.md` |
| `showpy/game/ui_kit/engine/text_effects.glsl` | 등장 효과 셰이더 **하나뿐**. 렌파이와 PyKaki가 같이 씀 | 파일 맨 위 "적는 법" |
| `docs/LINK.md` | 두 프로그램이 맞추는 형식 (내보낸 .rpy 표시, `showpy_inbox.json`, `stage_layout.rpy`, `pykaki_preview.json`, 셰이더) | 형식을 바꿀 때 |
| `bundle/` | `make_bundle.py`(묶기), `launcher/pygaki_launcher.rpy`(런처 버튼) | `bundle/README.md` |
| `.github/workflows/` | `deploy.yml` 웹 Pages 배포, `app.yml` 앱 확인(리눅스 Electron) + 윈도우 `PyKaki.exe` 빌드, `release.yml` 태그를 올리면 묶음·덧붙임 zip을 Releases 초안으로 | |

## 2. 쓰는 법 (사용자 입장)

- **웹 버전**: 크롬이나 엣지로 웹 주소를 열고 왼쪽 [렌파이 프로젝트 연결] → 프로젝트 폴더를 고르면 `game/script_flow.rpy`를 만들고 연결이 켜집니다. 그다음부터 Ctrl+E로 내보냅니다. `script.rpy`는 지우지 않아도 됩니다(내보낸 파일의 `config.label_overrides["start"] = "prologue"`).
- **묶음**: 묶음 폴더의 `renpy.exe` → 런처 아래쪽
  - [showpy 새 프로젝트]: showpy가 들어간 1280x720 한국어 프로젝트를 만듦 (VHS 덮개는 처음에 꺼짐)
  - [PyKaki로 대본 쓰기]: 왼쪽에서 고른 프로젝트를 앱으로 열고, 대본은 `프로젝트이름.flow.json`에 자동 저장
- **showpy 편집기**: 게임 실행 중 Shift+M. 대사 위치와 줄마다 화면 효과는 여기 대사 탭에서, 글과 글자 모양·속도·등장 효과는 PyKaki 글자 효과 칸에서 고칩니다.
- **실시간 미리보기**: PyKaki 글자 효과 칸의 [렌파이에서 보기]를 켜고 게임을 개발 모드로 켜 두면 지금 쓰는 줄이 게임 위에 진짜 효과로 나옵니다.

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

## 5. 남은 확인 (사람이 눈으로 볼 것)

- [ ] `fx_test_25`를 켜서 4.13 등장 효과를 눈으로 보기, 대사 탭 효과 버튼(이제 glsl에서 이름을 읽음)
- [ ] 런처를 영어로 바꿨을 때 버튼 한글이 보이는지
- [ ] 앱과 게임을 나란히: showpy 편집기에서 그림 넣기 → 앱에 바로 받아 적힘, 앱에서 Ctrl+E → 게임이 다시 불러옴
- [ ] 실시간 미리보기([렌파이에서 보기])를 PyKaki와 렌파이를 같이 켜 놓고
- [ ] 예전부터 남은 것: 실제 폴더 선택창으로 [렌파이 프로젝트 연결], 크롬에서 F8 전체화면, 소리, 렌파이 대사 탭 저장
- [ ] 구글 문서: 새로 넣은 목록이 "●" 글머리, 새 표 줄의 글꼴이 주변과 조금 다를 수 있음. 4.5~4.12는 한 절로 줄여 넣음

## 6. 다음에 할 만한 것

- 배포: `release.yml`을 손으로 돌려 성공함(2026-11-04, 템플릿 그림 만들기·Lint 통과, Artifacts `pygaki-dev`에 두 zip). 아직 태그를 올려 Releases에 낸 적은 없음. 앱은 서명이 없어서 윈도우가 처음에 경고함(읽어주세요에 [추가 정보] → [실행] 안내)
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

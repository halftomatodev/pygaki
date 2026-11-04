# 작업 기록

pygaki가 어떻게 지금 모양이 되었는지 정리한 문서입니다. 지금 이어서 할 일은 [HANDOFF.md](HANDOFF.md)에 있고, 여기는 지나온 기록만 둡니다.
커밋 하나하나는 `git log`로, showpy 버전별 자세한 내용은 [showpy/CHANGELOG.md](../showpy/CHANGELOG.md)와 폴더별 `README.md`의 "N에서 바뀐 점"에서 봅니다.

## 1. 한눈에

| 날짜 | 단계 | 결과 |
|---|---|---|
| ~2026-10-24 | showpy 이전 | 렌파이 플러그인 여러 개를 `ui_kit`, `screen_fx`로 합침 (4.2까지) |
| 2026-10-28 | PyKaki 시작 | 상자와 선으로 대본을 쓰는 웹 에디터 첫 버전 |
| 2026-10-30 | PyKaki 다듬기 | 집중 모드, 테마, 글꼴, 웹앱 설치(PWA) |
| 2026-10-31 | 두 프로그램 연결 | showpy 4.3 첫 공개, PyKaki와 주고받는 형식, 대사 편집을 PyKaki로 (4.3~4.5) |
| 2026-11-03 | 등장 효과 | 등장 효과 20개 (4.6~4.11), 실시간 미리보기 (4.12), 셰이더 한 파일 + WebGL 미리보기 (4.13) |
| 2026-11-03 | pygaki로 합치기 | 두 저장소를 기록째 하나로, PyKaki 데스크톱 앱, showpy 템플릿, 런처 버튼, 배포 묶음 |
| 2026-11-04 | 배포 | 묶음 템플릿 고침, 예전 저장소 보관, 구글 문서, Releases v1.0 공개 |
| 2026-11-04 | 화면 정리, 앱 연결 | 게임 메뉴 화면을 ESC 메뉴 옆으로 (4.14), 앱에서 게임 안 편집기 조종 (4.15) |
| 2026-11-04 | 저장소 하나만 | 예전 로컬 폴더 지움. 이 문서를 씀 |
| 2026-11-04 | 앱에서 모든 탭 | 커서 칸 (4.16), 게임 패널을 통째로 앱에 (4.17), 스플래시 탭 (4.18), "편집 중" 띠 (4.19) |
| 2026-11-04 | 셰이더 두 자리 | 인게임/타이틀/ESC 메뉴 셰이더 두 자리, 타이틀·메뉴 꾸미기 (4.20) |
| 2026-11-04 | 줄로 옮기기, 이름 pygaki | 세부 속성을 1번/2번 아래로, 줄을 누르면 게임도 그 줄로 (4.21). 앱 이름 pygaki, 셰이더가 바뀌는 줄, 커서와 셰이더, PyKaki 원고에 셰이더 줄 (4.22) |

## 2. 단계별

### 2-1. showpy 이전 (~2026-10-24)

렌파이 기본 템플릿의 `screens.rpy`를 고치지 않고, 폴더를 `game/`에 넣기만 해서 화면을 바꾸는 플러그인들로 시작했습니다. 처음 이름은 "렌파이 UI 플러그인 묶음"이었습니다.

- `title_menu`, `choice_menu`, `custom_ui`, `say_style`를 `ui_kit` 하나로 합침
- `watermorph`(타이틀 일렁임), `vhs_crt`(VHS 덮개)를 `screen_fx` 하나로 합침
- 게임을 켠 채 마우스로 고치는 편집기(개발 모드 Shift+M)
- 4.2(10-24): ESC 메뉴를 타이틀 메뉴 모양으로(`ui_kit` 3.1), 마우스 커서도 화면 효과 안에(`screen_fx` 4.2)

4.2 이전 기록은 폴더별 `README.md`에 있습니다(이 저장소에는 4.3부터 커밋이 있음).

### 2-2. PyKaki 시작 (2026-10-28 ~ 10-30)

"Ren'Py Flow Editor"라는 이름으로 시작해 첫날 PyKaki로 바꿨습니다. 저장 형식 이름 `"format": "renpy-flow"`, `.flow.json`, IndexedDB `renpy-flow-editor`는 그때 이름이 그대로 남아 있고, 예전 파일을 읽으려고 바꾸지 않습니다.

- 10-28: 상자 안에서 바로 편집, 연출 줄(배경, 보이기, 숨기기, 음악, 효과음)을 칸 채우기로, 줄 끌어서 순서 바꾸기. 명세서(`SPEC.md`)와 사용 안내(`GUIDE.md`)
- 10-30: MIT 라이선스, 집중 모드와 밑줄 커서, 단축키와 화면 색 설정, 웹앱 설치, 렌파이 아이콘, 1비트 테마, label 경계, 다음 흐름 카드(Alt+Enter), 사과 스타일 테마(처음 값), Pretendard 글꼴, 상자 색

### 2-3. 두 프로그램 연결 (2026-10-31)

- showpy 4.3 첫 공개. 이름을 showpy로 정하고 PyKaki와 연결
  - 원본은 PyKaki의 JSON, `.rpy`는 결과물(한 방향). showpy에서 넣은 그림, 소리 줄만 `showpy_inbox.json`으로 PyKaki가 받아 적음
  - 그림 위치는 원고 대신 `stage_layout.rpy`
- 4.4: 대사 편집을 PyKaki로 모음, 글자/초 속도
- 4.5: 줄마다 바꾸는 화면 효과는 렌파이 편집기로
- PyKaki: 대사 설정 카드, 게임처럼 보이는 전체화면 플레이, 렌파이 프로젝트 연결을 버튼 하나로, 글자 효과 칸을 오른쪽 편집 탭으로

### 2-4. 등장 효과 (2026-11-03)

- 4.6~4.11: 글자마다 움직이는 등장 효과를 20개까지. 매번 showpy에 먼저 넣고 PyKaki 미리보기와 플레이 화면에 같은 효과를 따라 넣음
- 4.12: PyKaki 실시간 미리보기. PyKaki가 `pykaki_preview.json`을 쓰면 게임 화면 위에 그 줄을 진짜 효과로
- 견본 영상: 렌파이 효과를 녹화한 webm(`pykaki/public/effects/`)
- 4.13: 효과를 두 번 쓰는 일을 없앰. 셰이더 코드를 `text_effects.glsl` 한 파일로 모으고, 렌파이는 읽어서 등록하고 PyKaki는 같은 코드로 WebGL 미리보기를 그림. 견본 영상 27개와 프레임마다 비교해서 맞춤

### 2-5. pygaki로 합치기 (2026-11-03)

두 저장소가 서로의 형식과 셰이더 사본을 갖고 있어서 한쪽을 고치면 다른 쪽을 잊기 쉬웠습니다. 그래서 하나로 합쳤습니다.

- PyKaki 파일을 `pykaki/`로 옮긴 뒤, showpy 저장소를 기록째 `showpy/`로 합침(두 저장소의 커밋이 모두 이 저장소 기록에 있음)
- 겹치던 것 정리: 형식 문서는 `docs/LINK.md` 하나, 셰이더 사본 없앰
- PyKaki 데스크톱 앱(Electron, `pykaki/app/`): 렌파이 프로젝트 하나를 열고, 대본을 `프로젝트이름.flow.json`에 자동 저장, showpy 기록을 바로 받아 적음, 프로젝트 밖 쓰기 막음
- showpy 템플릿, 렌파이 런처 버튼 두 개([showpy 새 프로젝트], [PyKaki로 대본 쓰기]), 렌파이 SDK와 묶은 윈도우 배포 묶음(`bundle/`)

### 2-6. 배포 (2026-11-04)

- 런처로 만든 새 프로젝트가 처음 켤 때 GUI 그림 만들기에서 오류 → 런처처럼 그림까지 만든 기본 프로젝트를 템플릿으로
- 문서와 화면의 예전 주소를 pygaki로, 예전 저장소에 안내를 넣고 보관
- 공개용 구글 문서를 4.13 기준으로
- 태그를 올리면 Actions가 묶음과 덧붙임 zip을 Releases 초안으로. v1.0 공개

### 2-7. 화면 정리와 앱 연결 (2026-11-04)

- 4.14: 저장, 환경설정 같은 화면이 렌파이 기본 틀이라 ESC 메뉴와 따로 놀던 것. `game_menu`를 대신 그려 왼쪽에 ESC 메뉴를 그대로 두고 제목과 내용은 그 오른편에
- 4.15: 게임 안 편집기 패널이 고치는 화면을 가리고, 렌파이 스크린으로는 UI를 자유롭게 만들기 어려워서 패널을 PyKaki 앱으로 꺼내기 시작
  - 게임이 개발 모드에서 127.0.0.1 포트를 열고 `showpy_live.json`에 적으면 앱이 붙음(형식은 `docs/LINK.md` 9장)
  - 게임 창은 그대로 두고 앱과 나란히. 게임 화면에는 끌기 표시만, 숫자와 목록과 원고 줄은 앱에서
  - 1~2단계: 연결, 지금 위치와 원고, 타이틀 메뉴와 ESC 메뉴 칸. 나머지 칸은 다음 단계

### 2-8. 저장소 하나만 (2026-11-04)

- GitHub의 예전 `halftomatodev/pykaki`, `halftomatodev/showpy`는 보관(archive) 상태로 둠. 돈이 들지 않고, 예전 주소로 온 사람에게 안내가 보임. 두 저장소의 마지막 커밋(`7660885`, `a4587f5`)이 이 저장소 기록에 들어 있는 것을 확인함
- 예전 로컬 폴더 `F:\SHOWPY\pykaki`, `F:\SHOWPY\showpy`는 바뀐 파일, 안 올린 커밋, stash, git 밖 파일(`node_modules`, `dist` 빼고)이 없는 것을 확인하고 지움

### 2-9. 앱에서 모든 탭 (2026-11-04 세션 4, 4.16 ~ 4.19)

1. **4.16** (`ui_kit` 3.15, `118f09c`): 커서, CTC, 대사 소리를 앱 전용 칸으로
   - 게임: 상태 `custom_ui`, 파일 목록 메시지 `files`, 명령 `custom_ui.set/reset/listen/stop`, `files`
   - 앱: `ShowpyCustomUI.tsx` (텍스트 속도, 대사 소리, CTC/커서 그림 12칸과 고르기, 커서 방식·기준점, 퀵메뉴, 24fps 미리보기). 그림은 앱이 `game/`에서 직접 읽음
   - 고침: 저장 뒤 다시 불러오면 옛 값으로 보이던 것(`custom_ui.runtime`), 앱 화면이 늦게 뜨면 첫 상태를 놓치던 것(`main.cjs`가 마지막 state/files를 기억)
2. **4.17** (`ui_kit` 3.16, `2f0ffa5`): 남은 탭을 공통 틀로 앱에
   - 게임이 패널 안쪽(`ui_editor_panel_body`)과 고르기 창(`ui_editor_popup`)을 화면 밖(`ui_editor_live_mirror`, x -40000)에 그려 위젯 나무로 보냄(`state.panel`) → 앱 `ShowpyMirror.tsx`가 그대로 그림 → 누르면 `panel.do`(자리 번호 + 버튼 글)
   - 읽기 규칙(`_mirror`): Button(입력칸을 감싼 버튼은 입력칸), Input, Text, Bar(세로=스크롤바는 뺌), Solid(거의 투명한 것, 무지개 띠는 뺌), Image, MultiBox(h/v), Grid/VPGrid(g), Window는 바탕 빼고 안쪽만
3. **4.18** (`splash` 1.2, `ui_kit` 3.17, `8dbff50`): 스플래시 편집 탭(`splash/editor/editor_splash.rpy`, ui_kit이 있을 때만). 엔진 `merged()` = 엔진 기본 → `splash.default` → 페이지 → `splash.layout` → 편집 중인 값. 타이틀 탭 옛 값 고침(`tmenu.state.saved`)
4. **4.19** (`ui_kit` 3.18, `068d9bc`): 사용자 제보 "PyKaki가 켜져 있으면 게임 화면이 가끔 클릭/입력이 안 먹음". 원인은 앱에서 칸을 고르면 편집기(`EditorInput`)가 패널 없이 열려 입력을 다 가져가는 것. 게임 화면 위 "편집 중 | Esc로 닫기" 띠, 앱은 커서 칸과 [대본] 화면에서 편집기를 닫음

### 2-10. 셰이더 두 자리, 타이틀·메뉴 꾸미기 (2026-11-04 세션 5, 4.20)

1. **`screen_fx` 4.3**: 1번 = `current`, 2번 = `cur_overlay`(효과 이름이 들어감). `screen_fx.shaders(a, b)`, `slot_choices()`, `slot_label()`, `current_slots()`. 타이틀/메뉴: `menu_context()`, `menu_slots()`, 설정 `title_shaders`, `menu_shaders`(화면 전체, 글자 빼기 없음). 편집기 "셰이더 고르기" + 줄 목록(세모 ▶는 Neo둥근모 글꼴로 그림) + `apply_here`. MenuFxTab `title_fx`, `pause_fx`
2. **`ui_kit` 3.19**: 타이틀 배경(`background_disp`, 기본 검은 화면, ESC 메뉴는 투명), 제목·부제(`label_items`, `tmenu.labels`), 글자 효과(`with_effect`), 회전 손잡이(TitleTab `rot_handle`, Shift 15도), 배경 고르기 창. 실시간 연결 title에 `kind`, `background`, `effects`, 명령 `title.background`
3. 앱 목록 "└ 타이틀 셰이더", "└ 게임 내 메뉴 셰이더", "타이틀 일렁임"

### 2-11. 줄로 옮기기, 이름 pygaki (2026-11-04 세션 6, 4.21 ~ 4.22)

**4.21** (`screen_fx` 4.4, `ui_kit` 3.20, `fe5e067`). 사용자 요청: 인게임 셰이더도 두 개만, 세부 속성은 1번/2번 아래에, 줄을 고르면 게임도 그곳으로, 앱 원고 칸도.

- `FxView(tab, page)`: 부를 때만 탭의 `page`를 잠시 그 효과(또는 `"tv"`)로 바꿔 원래 값 함수를 그대로 씀. 함수는 `functools.partial`로 캐시(화면의 Function이 매번 같은 것으로 보이게). 탭의 `page`는 늘 `"lines"`. 막대 `FxBarValue(..., page)`, 색 고르기 키는 `"효과:값"`
- `Effect.editing()`: 화면 효과 탭이나 MENU_TABS를 쓰는 동안 모든 효과가 편집 값으로
- `ui_editor.goto_line(fn, line)`: 지나온 줄이면 되감기(`_rollback_steps`: 그 줄이 든 가장 최근 기록 뒤의 저장 지점 수, 지금 기록이 저장 지점이 아니면 +1, 지금 대사 안이면 그대로), 아니면 `renpy.warp_to_line`(full_restart, 편집기는 `state.reopen`으로 다시 엶). 빈 줄/주석이면 그 뒤 첫 문장. 실시간 명령 `goto` `where: "line"`. RollbackException은 BaseException이라 live_tick을 그대로 지나감

**4.22** (`screen_fx` 4.5, `ui_kit` 3.21, `876db68`). 사용자 요청: Shift+M은 남김, 커서와 셰이더는 '여기에서부터', 글자 등장 효과는 대사 탭에서 빼고 "대사 효과는 PyKaki에서", 원고 칸 스크롤, 전환은 셰이더가 바뀌는 줄에서만 고르게, 이름 pygaki, [대본 편집] [GUI 편집]을 눈에 띄게, "1번, 2번이 같이 바뀌는 룰", 커서·CTC 샘플과 폴더 안내.

- 이름: `package.json` productName/executableName `pygaki`, `main.cjs`가 `app.setPath('userData', …\PyKaki)`(단일 실행 잠금보다 먼저), appId 그대로. 런처 `pygaki/app/pygaki.exe`, Actions 산출물 `pygaki-win`
- 셰이더 줄: `SHADER_HEADS`, `CURSOR_HEADS`. 줄 편집 값 `slots`(None = 지움), `transition`, `cursor_mode`(None = 지움). `gen_lines(e, key)`는 고치지 않은 쪽 줄을 원고에 있던 그대로 다시 씀. `change_rows(fn)`는 파일을 위에서부터 읽어 두 자리를 셈(ast로 `$ screen_fx.…(…)`, 대사 괄호), `set_row_tr`, `make_both`(대사 괄호는 대사 탭 `line_edits`에 `REMOVE`)
- PyKaki 원고(`script_edit._fx_insert`): 4.20~4.21에서는 PyKaki 원고에 셰이더 줄이 저장되지 않았음(그림·소리 줄만 허용). 이제 `$ screen_fx.` 줄은 고른 줄 위의 (표시, 줄) 짝을 찾아 `replace`, 남는 것은 `remove`(받는 기록에 새로 더함), 새 것은 `insert`
- `_insert`의 `replace`가 사이 빈 줄을 넘어 찾음(전에는 예전 줄이 남고 새 줄이 하나 더 생김)
- 커서와 셰이더: `cursor_pick`(엔진 `rt.cursor_preview`로 미리 보기), `cursor_apply/remove/rows/state`, 화면 `ui_editor_fx_line_list`(공용), `ui_editor_fx_cursor_panel`(UI Kit 커서 탭이 `use expression`으로). 실시간 `custom_ui.cursor_lines`, 명령 `custom_ui.cursor`
- warp 뒤: `live.after_warp` → `fx.warp_restore`(그 앞 마지막 셰이더·커서 줄대로). `_follow()`는 고른 줄이 다른 파일이면 다시 따라감
- 샘플 `showpy/samples/gui/cursor`, `ctc`(64x64 6장씩, CTC는 흰색) → 템플릿 `game/gui`. 앱 그림 칸은 바둑판 바탕
- 새 시험 프로젝트 `F:\Dropbox\1_DEV\RENPY\pygaki_sample`

## 3. 주요 결정과 이유

| 결정 | 이유 |
|---|---|
| 원본은 PyKaki JSON, `.rpy`는 결과물 (한 방향) | `.rpy`를 되읽어 합치면 사람이 쓴 것과 툴이 쓴 것이 섞여 깨지기 쉬움. 렌파이에서 고친 그림, 소리 줄만 `showpy_inbox.json`으로 받음 |
| 그림 위치는 원고 대신 `stage_layout.rpy` | PyKaki가 다시 내보내도 렌파이에서 잡은 위치가 지워지지 않게 |
| 대사 글은 PyKaki에서, 위치와 화면 효과는 렌파이에서 | 글은 흐름을 보며 쓰고, 보이는 모양은 진짜 화면에서 맞추는 게 빠름 |
| 등장 효과 셰이더는 `text_effects.glsl` 하나 | 두 곳에 같은 효과를 손으로 옮기다 모양이 어긋남. 렌파이와 PyKaki가 같은 코드를 읽음 |
| 저장소 하나 (pygaki) | 형식이 바뀌면 `docs/LINK.md`와 양쪽 코드를 한 커밋에서 고칠 수 있음 |
| 저장 형식 이름은 예전 그대로 | 이미 쓴 대본 파일과 브라우저 자동 저장을 계속 읽으려고 |
| 앱 연결은 게임이 포트를 열고 파일로 알림 | 앱이 이미 `game` 폴더를 지켜보고 있어서 찾기가 쉬움. 렌파이 게임 창은 앱 안에 넣을 수 없어서 나란히 놓음 |
| 앱 연결에서도 값과 저장은 게임이 가짐 | 게임 안 편집기의 저장 코드(`*_layout.rpy`, 원고 쓰기)를 그대로 쓰고, 앱은 보여주고 바꾸라고 보내기만 함 |
| 남은 탭은 게임 패널을 통째로 앱에 그림 (4.17) | 탭마다 앱 화면을 따로 만들지 않아도, 게임 쪽 탭을 고치면 앱도 저절로 바뀜 |
| 셰이더는 두 자리, 늘 같이 바꿈 (4.20, 4.22) | "기본 효과 + 덮개"는 고르기 어려웠음. 한 자리만 바꾸면 앞 줄에 따라 결과가 달라져 헷갈림 |
| Shift+M 게임 안 편집기는 남김 (4.22) | 앱 없이 쓰는 사람(덧붙임, 웹 버전)도 고칠 수 있게. 끌어 옮기기도 게임 쪽 편집기가 받음 |
| 앱 이름은 pygaki, 대본 편집기 이름은 PyKaki (4.22) | 묶음과 앱이 한 이름. 설정 폴더(`%APPDATA%\PyKaki`)와 저장 형식은 그대로 둬서 예전 것을 그대로 읽음 |

## 4. 버전 대응

| showpy | ui_kit | 날짜 | 주요 내용 |
|---|---|---|---|
| 4.2 | 3.1 | 10-24 | ESC 메뉴를 타이틀 모양으로 |
| 4.3 | 3.2 | 10-31 | 첫 공개, PyKaki 연결 |
| 4.4~4.5 | | 10-31 | 대사 편집을 PyKaki로, 줄마다 화면 효과는 렌파이로 |
| 4.6~4.11 | 3.5~3.10 | 11-03 | 등장 효과 20개 |
| 4.12 | 3.11 | 11-03 | PyKaki 실시간 미리보기 |
| 4.13 | 3.12 | 11-03 | 셰이더 한 파일 |
| 4.14 | 3.13 | 11-04 | 게임 메뉴 화면을 ESC 메뉴 옆으로 |
| 4.15 | 3.14 | 11-04 | PyKaki 앱에서 편집기 조종 |
| 4.16 | 3.15 | 11-04 | 커서/대사 소리 앱 칸 |
| 4.17 | 3.16 | 11-04 | 게임 패널을 통째로 앱에 |
| 4.18 | 3.17 (splash 1.2) | 11-04 | 스플래시 편집 탭 |
| 4.19 | 3.18 | 11-04 | "편집 중" 띠 |
| 4.20 | 3.19 (screen_fx 4.3) | 11-04 | 셰이더 두 자리, 타이틀·메뉴 꾸미기 |
| 4.21 | 3.20 (screen_fx 4.4) | 11-04 | 세부 속성을 1번/2번 아래로, 줄로 게임 옮기기 |
| 4.22 | 3.21 (screen_fx 4.5) | 11-04 | 앱 이름 pygaki, 셰이더가 바뀌는 줄, 커서와 셰이더 |

배포 묶음: v1.0 (2026-11-04, 렌파이 8.5.3, showpy 4.13).

## 5. 함정 모음

자세한 것은 [HANDOFF.md](HANDOFF.md) 7장. 여기에는 다시 밟기 쉬운 것만 짧게 둡니다.

- 렌파이 `init python` 안의 `dict`, `list`, `object`는 되감기용 타입. 다른 스레드에서 쓰거나 json 값과 `isinstance`로 비교하면 안 되고 `python_dict`, `python_list`, `python_object`를 씀
- `tmenu` 설정 이름과 같은 이름의 함수를 만들면 안 됨(`cfg()`가 전역 이름으로 찾음)
- 렌파이 SDK의 `gui/game`은 그대로 템플릿으로 쓰면 첫 실행 때 그림 만들기에서 실패
- 플러그인을 바꾼 뒤 시험 프로젝트의 `.rpyc`를 지우지 않으면 지운 코드가 계속 실행됨
- Dropbox 안 폴더는 지울 때 일부만 지워질 수 있음
- 화면에 보이는 글자에 `·`, `≡`를 쓰면 렌파이 기본 한글 글꼴에서 네모로 나옴
- PyKaki가 만든 원고(`# PyKaki가 만든 파일이에요.`)는 원고 쓰기 도구가 허용한 줄만 씀. 새 종류의 줄을 넣으려면 `script_edit._pk_prepare`에 길을 더하고 PyKaki 받는 기록(`inbox.ts`)도 맞춤
- 렌파이 warp는 그 줄까지 `scene`/`show`만 따라 하고 `$` 줄은 실행하지 않음

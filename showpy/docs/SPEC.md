# showpy 명세서

코드를 고치는 사람과 AI가 읽는 문서입니다. 사용법은 [CUSTOM_GUIDE.md](CUSTOM_GUIDE.md)에 있습니다.

- 묶음 버전 5.0 (`ui_kit` 4.0, `screen_fx` 5.1, `hotkeys` 1.0, `splash` 2.0) = pygaki v1.3 (2026-11-09)
- 만드는 중: `screen_fx` 5.2 줄기표 (9장)
- 5.0에 들어간 것: `screen_fx` 5.1 (새 화면 효과 일곱), `ui_kit` 3.23 (GUI 편집기 이름, UI 글 탭, 폴더 열기, F9), `ui_kit` 4.0 (글자 효과 11개, 글 상자 `bubble` `pill`)
- 렌파이 8.5.3 기준
- 작업 규칙: [DEV_RULES.md](DEV_RULES.md)
- PyKaki 연결 형식: [LINK.md](../../docs/LINK.md)
- PyKaki 명세: https://github.com/halftomatodev/pygaki/blob/main/pykaki/docs/SPEC.md

## 1. 목적

렌파이를 쓸 때 코드와 툴 사용법을 먼저 배워야 하는 부담을 낮춥니다. 글은 PyKaki에서 쓰고, 화면에 보이는 것은 게임을 실행한 채 showpy 편집기에서 마우스로 고칩니다.

원칙:
- 폴더를 `game/`에 넣는 것만으로 동작합니다. 렌파이 기본 파일(`screens.rpy` 등)은 고치지 않습니다.
- PyKaki 없이도 전부 동작합니다. PyKaki 원고일 때만 저장 방식이 바뀝니다.
- 폴더 4개는 서로 없어도 동작합니다. 다른 폴더 기능은 `getattr(store, "screen_fx", None)`처럼 있는지 확인하고 씁니다.
- 사용자가 고치는 파일은 `*_config.rpy`뿐입니다. `*_layout.rpy`는 편집기가 만들고 설정보다 우선합니다.

## 2. 폴더

| 폴더 | 버전 | 하는 일 |
|---|---|---|
| `game/ui_kit` | 4.2 | 타이틀 메뉴(배경, 제목, 부제, 글자 효과), ESC 메뉴, 선택지, 커서, 클릭 대기 표시, 대사 소리, 대사 스타일, 글 상자(`text_box`), 그림과 영상 배치(`stage`), 확인 창 글과 버튼 글자(`ui_text`), GUI 편집기(개발 모드 Shift+M, 화면 이름 "GUI 편집기"), 원고 쓰기 도구(`script_edit`) |
| `game/screen_fx` | 5.3 | 셰이더 두 자리(기본, 아스키, VHS, 단말기, 게임보이, 글리치, 지글거림, 망점, 홀로그램, 나이트비전, 포토 콜라주, 파편 흩날림 중 둘), 타이틀과 게임 내 메뉴 셰이더(따로 두 자리), TV 전환, 글자 빼기, 커서 자리, 타이틀 일렁임, 이미지 하나에 거는 효과, 셰이더 전환 틀 |
| `game/hotkeys` | 1.0 | 단축키, 조작방법 화면 |
| `game/splash` | 2.0 | 타이틀 전 로고, 경고, 조작 방법 페이지, 편집기 "스플래시" 탭(ui_kit이 있을 때, 화면에서 끌고 돌리고 글 고치기, 페이지 더하기) |

기능마다 자세한 값은 폴더 안 `README.md`에 있습니다.

## 3. 렌파이에서 차지하는 것

다른 코드와 겹칠 수 있는 곳입니다.

| 종류 | 내용 |
|---|---|
| 스크린 교체 | `choice`, `main_menu`, `navigation`, `game_menu`, `keyboard_help` |
| 새 스크린 | `tmenu_pause`, `title_menu`, `cmenu_choice`, `splash_page`, `ui_editor_*` (`ui_editor_pk_watch`, `ui_editor_pk_preview`: PyKaki 실시간 미리보기) |
| 층 | `sfx_say`, `sfx_choice` (screens 아래), `ui_editor` (top_layers) |
| config | `say_arguments_callback`(`screen_fx` → `say_style` 순서로 이어짐), `layer_transforms`, `say_layer`, `choice_layer`, `nvl_layer`, `nvl_choice_layer`, `context_clear_layers`, `mouse`, `mouse_displayable`, `always_shown_screens`, `top_layers`, `label_overrides["splashscreen"]`, `end_splash_transition`, `all_character_callbacks`, `start_callbacks`, `after_load_callbacks`, `after_default_callbacks`, `default_text_cps`, `keymap`, `underlay`, `language_callbacks`, `lint_hooks`, `show`, `hide`, `scene`, `with_callback`, `start_interact_callbacks`, `label_callbacks` |
| 그 밖 | `_game_menu_screen`, `gui.main_menu_background` |
| 세이브 값 | `screen_fx.current`, `cur_overlay`, `cur_target`, `cur_cursor`, `overrides`, `changes`, `stage.cur_box` |
| persistent | `splash_seen`, `splash_hidden`, `screen_fx_off`, `vhs_crt_off`, `ascii_off`, `retro_term_off`, `gameboy_off`, `_ui_kit_text_cps` |
| 프로젝트 폴더 | `ui_kit_backup/` (원고 백업), `game/showpy_inbox.json` (PyKaki 전달, 배포판 제외), `game/pykaki_preview.json` (PyKaki 실시간 미리보기, 배포판 제외) |

## 4. 스크립트 문법

PyKaki가 내보내는 문법이기도 합니다.

### 4-1. 대사 괄호

`e "글" (x=520, fx="ascii")`

| 이름 | 값 | 뜻 |
|---|---|---|
| `fx` | `"ascii"` `"retro_term"` `"gameboy"` `"none"` `"default"` | 이 대사부터 화면 효과. `"default"`는 선택취소 |
| `fx_transition` | `"tv"` `"fade"` `None` | 이 줄의 전환 |
| `fx_overlay` | `True` `False` | VHS 덮개 |
| `fx_warp` | 숫자 0~5, `"default"` | 덮개 휘어짐 |
| `fx_cursor` | `"effect"` `"overlay"` `"top"` `"default"` | 커서 자리 |
| `fx_exclude` | `()` `("say",)` `("say", "choice", "screens")` | 효과에서 뺄 글자 |
| `x` `y` `pos` | 숫자 | 대사 위치 |
| `size` `font` `color` `outline` `spacing` `bold` `italic` `kerning` `width` `align` | | 글자 모양 |
| `speed` | 배율 | 나오는 속도. 플레이어 설정에 곱함 (설정이 "즉시"면 효과 없음) |
| `cps` | 숫자 | 나오는 속도, 1초에 나오는 글자 수. 플레이어 설정과 상관없음 |
| `effect` | `"dissolve"` `"typewriter"` `"slowalpha"` `"flip"` `"zoom"` `"jitter"` `"wave"`, showpy가 등록한 `"scatter"` `"drop"` `"spin"` `"shuffle"` `"flash"` `"slam"` `"typecursor"` `"echo"` `"glitch"` `"glow"` `"blurin"` `"wipe"` `"blockglitch"` `"melt"` `"mosh"` `"liquid"` `"vhs"` `"rise"` `"lean"` `"stretch"` (셰이더는 `ui_kit/engine/text_effects.glsl`, `text_effects.rpy`가 init에서 읽어 등록. PyKaki도 같은 파일의 사본으로 미리보기를 그림. `echo`는 `outlines`가 없으면 `say_style`이 파일의 `@outline` 겹을 넣음) | 등장 효과 |
| `name_x` `name_y` `name_font` `name_size` `name_color` | | 이름 |

`screen_fx` 값은 다시 바꿀 때까지 유지되고 세이브에 저장됩니다. 플러그인을 빼면 이 괄호에서 오류가 납니다.

### 4-2. 명령 줄

```renpy
$ screen_fx.shaders("ascii", "vhs_crt")     # 4.3: 1번, 2번 (편집기 [여기에서부터 적용]이 넣는 줄)
$ screen_fx.shaders("none", "none")         # 전부 셰이더 적용 취소
$ screen_fx.use("ascii", overlay=False, transition="fade", cursor="overlay")
$ screen_fx.clear()
$ screen_fx.set_overlay(True)
$ screen_fx.set_warp(3)
$ screen_fx.set_cursor("top")
```

1번 = `current`(기본 효과 자리), 2번 = `cur_overlay`(덮개 자리). `overlay=`에는 True(VHS), False, 효과 이름을 씁니다. 타이틀(`main_menu`)과 메뉴(`_menu`) 안에서는 이 값 대신 `screen_fx.title_shaders`, `screen_fx.menu_shaders`를 화면 전체에 씌웁니다(`menu_context()`). `use()`, `clear()`는 부를 때마다 덮개를 설정대로 다시 정합니다. 커서 자리는 `cursor=`를 적을 때만 바뀝니다.

### 4-3. 선택지 괄호

`"문을 연다" (x=300, y=350, size=25, color="#aa0000", rotate=-4):`. 메뉴 전체는 `menu (font=..., size=28):`. 값 목록은 `ui_kit/README.md` 6장.

### 4-4. 그림

```renpy
show ghost at stage.pos(420, 720)          # 그림의 아래 가운데를 화면 (420, 720)에
show ghost with stage.move("inleft", 0.8)
hide ghost with stage.ease("outright", 1.2)
```

## 5. 편집기가 저장하는 곳

| 편집기 탭 | 일반 원고 | PyKaki 원고 |
|---|---|---|
| 타이틀 메뉴(배경, 제목, 부제 포함), 커서/대사 소리, 화면 효과 값, 타이틀/게임 내 메뉴 셰이더, 타이틀 일렁임 | `*_layout.rpy` | 같음 |
| 이미지/영상의 위치 | 원고의 그 줄 `at` | `ui_kit/stage_layout.rpy` |
| 이미지/영상의 전환, 그림 바꾸기, 줄 넣기, 소리 넣기 | 원고 | 원고 + `showpy_inbox.json` |
| 대사의 위치(대사, 이름)와 화면 효과 | 원고 | 원고 + `showpy_inbox.json` |
| 대사 글자 모양, 속도, 등장 효과, 선택지, 화면 효과 줄에 넣기 | 원고 | **저장 안 함.** 대사 탭은 칸을 숨기고, 나머지는 이유를 보여 줌 |

## 6. PyKaki 원고 처리 (3.11)

- 알아보기: `script_edit.is_pykaki(filename)`. 파일 앞 5줄의 표시 문구.
- 저장: `script_edit.apply`가 파일을 읽은 뒤 `_pk_prepare`로 거릅니다.
  - `show`, `hide`, `scene` 줄 고치기: 쓴 뒤 `replace` 기록을 남깁니다.
  - 줄 넣기: 줄이 모두 `show`, `scene`, `hide`, `play`, `stop`이면 줄 앞에 `# @l:새id`를 함께 쓰고 `insert` 기록을 남깁니다. 앞에 넣을 때는 기준 줄의 표시 위에 넣어서 표시와 줄이 떨어지지 않게 합니다.
  - 대사의 위치와 화면 효과: `SayTab.script_edits`가 `e.pk_pos`, `e.pk_fx`를 붙이면 괄호에 쓴 뒤 `say_pos`, `say_fx` 기록을 남깁니다.
  - 나머지: `e.reason`에 이유를 담아 실패로 돌려줍니다.
- 위치: `StageTab`이 `pk_pos_edits`를 모아 `layout_file`로 `stage_layout.rpy`를 씁니다. 저장 범위는 `pos_scope` ("box" 이 상자에서만, "all" 어디서나).
- 지금 상자: `stage._label_reached`가 `config.label_callbacks`에서 label 끝부분을 `stage.cur_box`(세이브에 저장됨)에 넣습니다.
- 위치 적용: `stage._show`. 원고에 `at`이 없고 ATL이 없고 배경이 아니면 `stage.placed_expr(cur_box, tag)`를 `at_list`로 넣습니다.

알아 둘 제약:
- 같은 상자에서 같은 태그를 두 자리에 띄우면 구분되지 않습니다. PyKaki 직접 명령에 `show ghost at stage.pos(420, 720)`을 적습니다.
- 상자를 지우면 그 값은 쓰이지 않고 파일에 남습니다. 해는 없습니다.
- PyKaki 저장본으로 되돌려도 위치는 되돌아가지 않습니다.
- 편집기에 줄 지우기 기능은 없습니다. 넣은 줄을 지우려면 받아 적은 뒤 PyKaki에서 지웁니다.

## 7. 시험

렌파이 SDK로 Lint를 돌립니다. (경로는 자기 컴퓨터에 맞춥니다)

```bash
renpy.exe <프로젝트> lint
```

`examples/pykaki_sample`이 시험장입니다. 사용법은 그 폴더의 `README.md`에 있습니다.

## 8. 큰 판: pygaki 2.0 계획 → v1.3으로 냄 (2026-11-09)

2026-11-09 사용자와 정한 것. 스플래시를 화면에서 고치기, 새 화면 효과 여덟 가지(파편 흩날림, 지글거림 포함), 새 글자 효과와 글자 꾸미기를 한 판에 넣습니다. 만들기 전에 이 장을 먼저 읽고, 만든 것은 각 플러그인 README와 위쪽 장으로 옮깁니다.

### 8-1. 판 번호

| 무엇 | 지금 | 다음 |
|---|---|---|
| pygaki 묶음·앱 (Releases 태그) | v1.2 (2026-11-09) | **v1.3** (계획은 v2.0) |
| showpy 묶음 | 4.23 | **5.0** |
| `ui_kit` | 3.22 | **4.0** (글자 효과, 글 상자 꾸미기, 편집기 입력·회전 틀) |
| `screen_fx` | 5.1 (새 효과 일곱 만듦, 트레이싱지는 뺌) | **5.1** |
| `splash` | 2.0 (화면에서 고치기, 페이지 더하기, 만듦) | 2.0 |
| `hotkeys` | 1.0 | 1.0 |

- 2026-11-09 사용자와 정해서 이 장의 것을 다 모아 **v1.3**(showpy 5.0)으로 냄(이름만 v2.0 대신 v1.3).
- 2026-11-09 사용자가 확인하려고 중간 판 **v1.2**(showpy 4.23)를 냄: 태그 상자, 웹에서 쓰고 앱에서 이어 쓰기, splash 2.0, screen_fx 5.0 바탕. 새 화면 효과·글자 효과는 v2.0에.
- 한 번에 다 만들지 않고 8-7의 순서대로 나눠 커밋합니다. 단계마다 Lint, 시험 프로젝트 복사, `.rpyc` 지우기, PyKaki 빌드를 지킵니다.

### 8-2. 스플래시를 화면에서 고치기 (`splash` 2.0) — 만듦 (2026-11-09)

만든 방법: 엔진의 vbox 대신 `splash.SplashLayout`(그림·제목·본문·표를 직접 쌓고 `*_offset`, `*_rotate`를 적용, 그린 자리를 `rects`/`cells`에 남김)이 그립니다. 편집기의 `SplashEditView`가 이것을 이어받아 테두리와 손잡이를 그리고, 끌기·글 입력은 그 자리 값을 씁니다. 편집기 공통 틀(`EditorInput`)은 글 입력 칸이 켜져 있으면 Esc(입력 취소)와 Ctrl+S(입력 끝내고 저장)만 하고 다른 단축키를 끕니다. 예전에 말한 묶음 가운데에 붙기는 화면 가운데 줄과 묶음 가운데 줄 둘 다에 붙습니다. 앱 패널 글 칸은 줄바꿈을 `
` 두 글자로 보여 주고 고칩니다(LINK.md는 안 바뀜). 설정 파일에 있는 페이지 이름은 바꾸지 않고, 새 페이지도 저장한 뒤에는 이름을 바꾸지 못합니다(복제로 새 이름).

**지금(1.2)**: 스플래시 탭은 `overlay_screen = None`이라 가운데에 뒤의 게임 화면이 그대로 보이고, 페이지는 [이 페이지 보기]로만 봅니다. 글은 번역 때문에 `splash_config.rpy`에서 고치게 해 두었습니다.

**되는지 확인한 것**

| 할 일 | 되는지 | 근거 |
|---|---|---|
| 가운데에 페이지 그리기 | 됨 | 탭의 `overlay_screen`이 게임 화면 위에 그려짐(타이틀 탭과 같음) |
| 끌기, 회전, 늘리기 | 됨 | 편집기 공통 `drag_begin`/`drag_move`/`drag_end`. 회전 손잡이는 타이틀 탭(3.19)에 이미 있음 |
| 화면 위에서 글 입력 | 됨 | 렌파이 `input`을 편집기 입력층(`EditorInput`)보다 위에 두면 글자 키(`KEYDOWN`의 글자, `TEXTINPUT`)를 입력 칸이 먼저 먹음(`renpy/display/behavior.py` `Input.event`). 단축키와 안 겹침. 한글 입력기 됨. 여러 줄은 `multiline True` + Shift+Enter |
| 설정 파일 대신 저장해도 번역 | 됨 | 렌파이는 번역할 글을 모든 `.rpy`에서 `_("…")`로 찾음(`renpy/translation/scanstrings.py`) |
| 페이지 더하기·지우기·순서 | 됨 | 페이지 목록을 `splash_layout.rpy`에 따로 적고 엔진이 그 순서를 먼저 봄 |
| 앱 패널 글 칸 | 됨 | 패널 입력칸(`in`)은 이미 앱으로 옮겨짐(LINK.md 9장) |

**가운데 화면**

- 스플래시 탭을 열면 고른 페이지를 화면 전체에 다 나타난 모습 그대로 계속 그립니다. 나타나기·사라지기, 시간, 깜빡임 없이, 클릭해도 넘어가지 않습니다. 영상은 반복해서 돕니다.
- 엔진의 `splash_page`를 그리는 부분(`splash_page_body(run, edit=False)`)과 시간·클릭 부분으로 나눕니다. 편집기는 그리는 부분만 써서 진짜와 똑같이 보입니다.
- 페이지 단추를 누르면 바로 그 페이지로. [이 페이지 보기], [처음부터 보기]는 진짜 시간대로 보기로 남깁니다.

**고르기, 끌기, 회전, 늘리기**

| 대상 | 끌기 | 회전 | 모서리 늘리기 |
|---|---|---|---|
| 묶음 전체 (빈 곳을 끌기) | `xalign`, `yalign` | 없음 | 없음 |
| 로고 | `image_offset` (`image_pos`를 적은 페이지는 `image_pos`) | `image_rotate` | `image_zoom` (영상에 `image_size`를 적었으면 `image_size`) |
| 제목 | `title_offset` | `title_rotate` | `title_size` |
| 본문 | `body_offset` | `body_rotate` | `body_size` (`body_line_spacing`도 같은 비율) |
| 조작 방법 표 | `keys_offset` | `keys_rotate` | `key_size`와 `desc_size`, `key_width`를 같은 비율 |
| 안내 글 | `prompt_xalign`, `prompt_yalign` | `prompt_rotate` | `prompt_size` |
| 보지 않기 버튼 | `option_xalign`, `option_yalign` | 없음 | `option_size` |

- `*_offset`은 `(x, y)` 픽셀입니다. 묶음 안 자리는 두고 그만큼 비켜 그립니다(`xoffset`, `yoffset`). 하나를 끌어도 나머지가 튀지 않고, 묶음을 끌면 같이 따라갑니다.
- `*_rotate`는 도(°). 자기 가운데를 축으로 돕니다(`Transform(rotate=…, rotate_pad=False)`, 묶음 안 자리는 그대로).
- 고른 것에 테두리, 이름, 네 모서리 손잡이, 위쪽 회전 손잡이(타이틀 탭과 같은 분홍 네모)를 그립니다. 모서리를 끌면 가운데 기준으로 늘고 줄어듭니다. Shift+회전은 15°씩.
- 방향키 1픽셀, Shift+방향키 10픽셀. 휠은 크기(모서리 손잡이와 같은 값). Shift+끌기는 가로나 세로로만.
- 묶음 가운데나 화면 가운데 줄에서 8픽셀 안이면 붙고, Alt를 누르고 끌면 붙지 않습니다.
- 패널 [자리 되돌리기]: 고른 것의 자리·회전·크기 값만 지움.

**화면에서 글 고치기**

- 대상: 제목, 본문, 표의 키 칸과 설명 칸 하나하나, 안내 글, 보지 않기 버튼 글.
- 더블클릭하거나 고른 뒤 Enter → 그 자리에 같은 글꼴·크기·색의 입력 칸. Enter로 끝, Esc로 취소, Shift+Enter로 줄바꿈. Ctrl+S는 입력을 끝내고 저장. 입력 중에는 편집기 단축키가 꺼집니다(`EditorInput`이 `renpy.get_editable_input_value()`를 보고 넘김, `ui_kit` 공통 틀).
- 회전한 글은 고치는 동안만 바로 세워서 보여 줍니다.
- 입력 칸에는 적힌 글 그대로(태그 `{b}`, 치환 `[이름]` 포함). 대괄호를 글자로 쓰려면 `[[`.
- 빈 글로 끝내면 그 글을 없앰(표는 키와 설명이 둘 다 비면 그 줄을 지움).
- 패널 [제목 넣기] [본문 넣기] [안내 넣기] [보지 않기 넣기]: 임시 글을 넣고 바로 입력 칸을 엶.
- 표: 패널에 [줄 더하기] [줄 지우기] [위로] [아래로].
- `"keys": "auto"` 표는 보이지만 못 고침. 더블클릭하면 안내와 [직접 적기로 바꾸기](지금 목록을 복사).

**페이지 더하기·지우기·순서**

- 패널 페이지 줄 끝에 [+ 새 페이지] [복제] [지우기] [◀] [▶].
- 새 페이지: id는 `page2`, `page3`…(패널에서 이름 바꾸기 가능, 영문·숫자·`_`만, 겹치면 안 됨). 처음 값은 바탕 검정, 제목 "새 페이지", 클릭할 때까지.
- `splash_layout.rpy`에 `define splash.page_order = ["logo", "page2", "warning", "controls"]`를 적습니다. 엔진은 이 목록이 있으면 그 순서로 보여 주고, 목록에 없는 설정 파일 페이지는 보여 주지 않습니다(지운 페이지). 새 페이지의 값은 `splash.layout["page2"]`에 전부 들어갑니다.
- 설정 파일에 있는 페이지를 지우면 설정 파일 글은 남고 순서에서만 빠집니다. 패널에 "숨긴 페이지 1개 [되살리기]".
- Lint: 순서에 있는데 어디에도 없는 id, 같은 id 두 번을 알림.

**저장**

- 지금처럼 `splash/splash_layout.rpy`에 바꾼 값만. 우선 순서: 엔진 기본 → `splash.default` → 페이지 → `splash_layout.rpy`.
- 글은 `_("…")`로 감싸 적고, 표는 `"keys": [ (_("키"), _("설명")), … ]`, 줄바꿈은 `\n`.
  ```renpy
  define splash.page_order = [ "logo", "warning", "page2", "controls" ]
  define splash.layout = {
      "warning": {
          "body": _("이 게임에는 깜빡이는 화면이 있습니다.\n주의해 주세요."),
          "title": _("주의"),
          "title_offset": (0, -12),
          "title_rotate": -3.0,
      },
      "page2": { "title": _("새 페이지"), "color": "#000000" },
  }
  ```
- 엔진에 새 값 이름(`*_offset`, `*_rotate`, `page_order`)을 더하고 Lint가 알아보게 합니다.
- 설정 파일 원래 글은 남고 편집기 글이 이깁니다. 패널에서 그 글 옆에 "편집기 글"과 [설정 파일 글로 되돌리기]. `splash_config.rpy` 머리 주석에 "편집기로 고친 값은 splash_layout.rpy에 있고 그쪽이 이깁니다".
- 이미 만든 번역(`game/tl`)은 원문이 바뀌면 맞지 않게 됩니다(렌파이 원래 동작). 안내에만 적습니다.

**앱**: 끌기·회전·늘리기·화면에서 고치기는 게임 창에서. 앱 패널에는 글 칸(제목, 본문, 안내, 보지 않기, 표 줄마다)과 페이지 단추. 본문 같은 여러 줄 글을 앱 `in` 칸이 못 받으면 `in`에 여러 줄 표시(`m`)를 더하고 `docs/LINK.md` 9장과 앱 코드를 같은 커밋에서 고칩니다.

### 8-3. 새 화면 효과 (`screen_fx` 5.0)

참고한 모양 (참고 그림·영상은 저장소에 두지 않음): 트레이싱지(흐림 + 우윳빛 막 + 종이 결), 색 망점 포스터, 홀로그램(가로줄 가림막 + 옆으로 번진 복사본 두 장 + 한 색으로 통일 + 빛 번짐), 나이트비전, 크기가 다른 네모 칸으로 갈라져 칸마다 조금 어긋나거나 다른 그림이 보이는 화면, 어두운 화면에 붉은 작은 파편이 흩날리는 화면, 손그림 애니메이션의 보일링(그림 테두리가 1/12초마다 1~2픽셀씩 떨리고 인쇄물 같은 고운 알갱이가 매번 바뀜).

모두 지금 효과(아스키, VHS, 게임보이)와 같은 방식, 화면 층에 거는 셰이더로 됩니다(`config.layer_transforms`, `screen_fx.register`). 파편도 셰이더 안에서 그려서(그림 없이, 칸마다 해시로 조각 하나) 다른 효과처럼 자리에 넣습니다.

| 이름 | 한글 이름 | 하는 일 | 주요 값 | 되는지 |
|---|---|---|---|---|
| `tracepaper` | 트레이싱지 | 화면을 흐리게(가우시안), 우윳빛 막을 덮고, 종이 결 노이즈와 살짝 바랜 색 | `blur`(픽셀), `veil`(막 진하기), `veil_color`, `grain`, `fade`(바램) | 됨. 흐림은 렌파이 `blur`(8.1+)처럼 두 번 나눠 그리기(가로, 세로) |
| `halftone` | 망점 | 화면을 망점으로. 흑백 한 색 또는 CMYK 네 색 겹침, 점·선 모양 | `mode`(`"mono"`, `"cmyk"`), `cell`(점 간격), `shape`(`"dot"`, `"line"`), `angle`, `ink`, `paper` | 됨. 한 번 그리기 셰이더 |
| `glitch` | 무작위 글리치 | 평소에는 깨끗하다가 가끔 무작위로 화면이 가로 띠로 찢기고, 블록이 밀리고, 색이 갈라짐 | `rate`(초당 횟수), `length`(한 번 길이), `strength`, `blocks`, `rgb_split` | 됨. 시간으로 정하는 무작위(`u_time` 칸 해시). 글자 효과 `blockglitch`, VHS 코드를 같이 씀 |
| `hologram` | 홀로그램 | 한 색(기본 하늘색)으로 통일 + 가로 주사선 가림막 + 옆으로 번진 복사본(두 겹) + 빛 번짐 + 살짝 떨림 | `color`, `lines`(줄 간격), `line_dark`, `smear`(번짐 거리 두 개), `glow`, `flicker` | 됨. 화면 전체에도, 이미지 하나에도(`show ghost at screen_fx.image_fx("hologram")`) |
| `nightvision` | 나이트비전 | 밝기만 남겨 초록 한 색, 어두운 곳 노이즈, 가장자리 어둡게, 살짝 번짐 + 화면 글(「Standard NVG」, 「40° FOV」, 녹화 시간, [ZOOM]) | `color`, `gain`, `noise`, `vignette`, `hud`(켬/끔), `hud_text`(왼쪽 위 글 목록), `timer`(켬/끔) | 됨. 화면 글은 셰이더가 아니라 효과가 켜질 때 함께 띄우는 스크린(`screen_fx_hud`), 시간은 게임 시간으로 셈 |
| `shards` | 파편 흩날림 | 화면 위로 작은 뾰족한 조각이 바람에 날리듯 흩날림. 깊이 세 겹(먼 조각은 작고 흐리고 느림), 조각마다 돌고 깜빡임. 화면은 그대로 보이고 그 위에 조각만 얹힘 | `count`(양, 0~400개 정도), `colors`(색 1~3개, 조각마다 무작위), `size`(크기 범위 두 개), `speed`, `direction`(도), `spread`, `spin`, `twinkle`, `depth_blur` | 됨. 칸 나눔 + 해시로 칸마다 조각 하나를 움직여 그림(그림·스프라이트 없이 셰이더 한 번). `count`는 칸 밀도로 바꿈 |
| `boil` | 지글거림 | 화면 전체가 손그림 애니메이션처럼 계속 지글거림: 테두리가 조금씩 떨리고 고운 알갱이가 매번 바뀜. 떨림은 뚝뚝 끊겨서(초당 `fps`번) 손그림 느낌 | `amount`(떨림 픽셀, 기본 1.5), `fps`(기본 12), `scale`(떨림 무늬 크기), `grain`, `grain_size`, `soft`(살짝 번짐) | 됨. 시간을 `fps`로 끊은 노이즈만큼 화면을 밀고, 알갱이를 덧씌우는 셰이더 한 번 |
| `tiles` (5.3에서 `collage`로 바꿈, 아래) | 조각 어긋남 | 화면을 크기가 다른 네모 칸(격자에 맞춘 1×1~3×2 칸)으로 나누고, 칸마다 조금 밀리거나 확대되거나 색이 바뀜. 칸 나눔은 `shuffle`초마다 새로. 칸 테두리에 가는 선 | `grid`(기본 칸 크기), `offset`(최대 밀림), `zoom`(칸 안 확대), `tint`, `tint_amount`, `lines`, `shuffle`(초, 0이면 고정) | 됨. 칸 나눔은 격자 칸마다 해시로 정해서 셰이더 한 번에 그림 |

- **`collage` 포토 콜라주 (screen_fx 5.3, 2026-11-10)**: `tiles`(격자 칸으로 나눠 서로 붙은 칸이 어긋남)를 없애고 바꿈. 화면 가운데 `area` 비율 안에 네모 조각 `count`장(1~10)을 해시로 놓고, 셰이더가 0~9번을 차례로 그려 마지막에 덮은 조각이 보임(겹침). 조각 크기는 가운데 범위에 대한 비율(`size_min`~`size_max`), `strips` 확률로 가는 띠. 자리는 해시 둘의 평균이라 가운데에 몰림. 조각 안은 조각 가운데를 기준으로 `zoom` 확대, `offset` 밀림(같은 장면을 다시 찍은 사진처럼), `shade` 밝기 차이, `tint_amount` 확률로 `tint` 물들이기. 조각 안쪽 가장자리에 `line_width` 선(`line_color`, 기본 하양), 조각 밖 오른쪽 아래로 `shadow` 그림자. 조각마다 바꾸기 간격(`shuffle`×0.7~1.6)과 시작 때가 달라 몇 장씩 바뀜. 예전 이름은 `screen_fx.ALIASES`(`"tiles"` → `"collage"`)와 `screen_fx.alias()`로 `shaders`, `use`, `set_overlay`, `set_values`, `image_fx`, `norm_slots`, `resolve`, 지금 덮개에서 바꿔 읽음. `TileSwap` 전환은 `collage.rpy`에 그대로(셰이더 이름 `collage.swap`, 유니폼 `u_collage_swap_*`).
- `tiles`는 장면 전환으로도 씁니다: `scene bg2 with screen_fx.TileSwap(1.0)` → 칸마다 다른 때에 옛 장면에서 새 장면으로 바뀜(영상의 앞부분). 렌파이 `Dissolve`처럼 옛 장면·새 장면 두 장을 받아 셰이더로 그리는 전환이라 됩니다.
- 이미지 하나에 거는 효과: `hologram`, `halftone`, `tiles`, `nightvision`, `tracepaper`는 이미지 `at`로도 씁니다(`screen_fx.image_fx(이름, **값)`). 편집기 이미지/영상 탭에 [효과] 칸을 더해 고른 이미지에 겁니다(원고에 `at` 적기, PyKaki 원고는 `stage_layout.rpy`).

**셰이더 자리는 지금처럼 두 개** (2026-11-09 사용자와 정함): 1번(기본 효과)과 2번(덮개) 두 자리를 그대로 두고, 효과 종류만 늘립니다. 한때 3번 자리를 만들었다가 뺐습니다. 더 겹치고 싶으면 이미지 하나에 거는 효과(`image_fx`)를 같이 씁니다.

2단계에서 만든 것 (2026-11-09): `screen_fx.image_fx()`, `screen_fx.set_values()`, `screen_fx.ShaderSwap` 전환 틀(`TileSwap`은 `tiles` 효과와 같이 3단계에서).

3단계에서 만든 것 (2026-11-09, `screen_fx` 5.1): `glitch`, `boil`, `halftone`, `hologram`, `nightvision`(+화면 글 스크린 `nightvision_hud`), `tiles`(+`screen_fx.TileSwap`). **`tracepaper`(트레이싱지)는 만들었다가 2026-11-09 사용자와 정해서 뺌** (위 표의 줄은 기록으로 남김). 위 표와 다른 점:
- `glitch`의 세기 값 이름은 `amount`(`strength`는 모든 효과의 전체 세기라서). 편집기에서 모양을 보며 고르게 `always`(늘 망가짐)를 더함. 코드는 VHS·글자 효과와 나누지 않고 `glitch.rpy` 안에 따로 씀(플러그인을 따로 넣어도 돌게)
- `hologram`의 번짐 거리는 `smear`, `smear2` 두 값. 이미지에 걸 때 쓰는 `opacity`를 더함
- `nightvision`의 화면 글은 `hud_text`(줄바꿈 `
`), `zoom_text`, 글꼴은 `nightvision.hud_font`, `hud_size`. 동그란 테두리 `scope`를 더함
- `tiles`의 다른 그림 칸 비율은 `swap`, 선 두께·색 `line_width`, `line_color`를 더함
- 새 효과는 모두 `with_overlay = False`(쓰는 동안 VHS 덮개를 기본으로 켜지 않음)
- 셰이더 함수(`fragment_functions`)에서는 효과 유니폼을 바로 못 읽음 → 인자로 넘김. 전환 셰이더(`ShaderSwap`)에서는 `u_lod_bias`도 못 읽음. GLSL에서 `gl_`로 시작하는 이름은 못 씀

**파편을 쓰는 예** (4단계에서 만듦, 2026-11-09)

```renpy
$ screen_fx.shaders("shards", "vhs_crt")
$ screen_fx.set_values("shards", count=80, colors=2, color="#d22", color2="#811", size_min=3, size_max=9, direction=200)
```

- 만든 것이 위 계획과 다른 점: 색은 목록 대신 `colors`(색 수 1~3) + `color`, `color2`, `color3`(편집기 색 칸이 값 하나씩이라), 크기는 `size_min`, `size_max`. 더한 값: `thin`(가늘기), `opacity`, `dim`(바탕 어둡게). 조각은 한쪽이 더 뾰족한 길쭉한 마름모, 돌기와 함께 판처럼 뒤집히며 빛이 바뀜. 칸의 1/4은 비워서 고르게 보이지 않게. 프리셋 `embers`, `ash`, `storm`, `dread`. `order` 59.
- 편집기 화면 효과 탭에서 고르면 양·색(세 칸)·크기·속도·방향 막대가 나옵니다. 값은 다른 효과처럼 `shards_config.rpy`에 적고, 편집기로 바꾸면 `shards_layout.rpy`에 저장됩니다.
- `screen_fx.set_values(이름, …)`는 새로 만드는 함수입니다. 게임 중에 효과 값을 바꾸고(세이브·되감기에 저장), `screen_fx.set_values(이름)`처럼 값 없이 부르면 설정대로 돌아갑니다. 모든 효과에 씁니다.
- 파편과 지글거림은 대사창 빼기(`exclude`)도 다른 효과와 같게 됩니다.

**PyKaki**: 대사 줄 화면 효과 고르기(`pykaki/src/stage.ts`의 `FX_BASE`)에 새 이름 여덟 개를 더합니다. 플레이 미리보기는 지금처럼 이름만 보여 주고 효과는 그리지 않습니다. 효과 이름만 늘어서 내보내는 줄 모양(`fx=`, `screen_fx.shaders(…)`)은 그대로입니다.

### 8-4. 새 글자 효과 (`text_effects.glsl`, `ui_kit` 4.0)

**되는지 확인한 것**: 렌파이 글자 셰이더는 글자 하나를 "글자 폭 × 줄 높이" 네모 하나로 그리고(`renpy/text/text.py`, 줄의 글자 네모가 빈틈없이 이어짐), 외곽선 겹은 `u_text_main`(본 글자 1, 외곽선 0), `u_text_depth`로 가릴 수 있습니다. 그래서 글자마다 움직이기, 글자마다 네모 칠하기, 외곽선만 먼저 보이고 속은 나중에 채우기가 셰이더 하나로 됩니다. 모두 `text_effects.glsl`에 적으면 PyKaki 미리보기에도 그대로 나옵니다.

| 이름 | 한글 이름 | 하는 일 | 주요 값 |
|---|---|---|---|
| `slidein` | 미끄러져 들어와 멈춤 | 한쪽에서 빠르게 미끄러져 들어와 관성으로 살짝 지나쳤다가 돌아와 멈춤. 글자마다 조금씩 늦게(`u__stagger`) 또는 줄 통째로(`u__stagger=0`) | `u__dir`(도, 기본 0 = 오른쪽에서), `u__distance`, `u__overshoot`, `u__duration`, `u__stagger` |
| `shake` | 살짝 흔들림 | 다 나온 뒤에도 글자마다 조금씩 떨림. 다른 효과와 같이 쓰기 좋음(`effect="slidein,shake"`) | `u__amount`(픽셀), `u__speed`, `u__rotate`(도) |
| `inkfill` | 외곽선에 색 채우기 | 처음에는 외곽선만 다 보이고, 속은 글자가 나오는 차례(cps)대로 색이 차오름. 아래에서 위로 차오르기 / 한 번에 켜지기 | `u__mode`(0 한 번에, 1 아래에서 위로), `u__duration`. 외곽선이 없으면 `@outline 2 #ffffff 0 0` |
| `glyphbox` | 글자마다 상자 | 글자 하나하나 뒤에 네모 상자. 상자가 먼저 나오고 글자가 찍힘, 상자마다 살짝 다른 크기·기울기 가능 | `u__box`(색), `u__ink`(글자 색, 비우면 원래 색), `u__pad`, `u__round`(모서리), `u__jitter`, `u__pop` |
| `stamp` | 도장 | 크게·살짝 기운 채 찍히며 줄어들고, 잉크 번진 결이 남음 | `u__color`, `u__rotate`, `u__grain` |
| `punch` | 튀어나오는 줌 | 화면 깊은 곳에서 커지며 튀어나오고 뒤로 잔상이 끌림 | `u__zoom`, `u__trail` |
| `squash` | 찌그러졌다 튕김 | 납작하게 눌렸다가 고무처럼 튕기며 원래 모양 | `u__amount`, `u__bounce` |
| `extrude` | 입체 글자 | 같은 글자를 비스듬히 여러 겹 깔아 두께를 만듦, 나올 때 두께가 자라남 | `u__depth`, `u__angle`, `u__shade` |
| `flip` | 뒤집으며 나오기 | 글자가 판처럼 위아래로 뒤집히며 자리 잡음 | `u__axis`(가로/세로), `u__duration` |
| `led` | LED 전광판 | 글자를 점으로 된 전광판 글자로, 꺼진 점도 흐리게 보임 | `u__cell`, `u__off`(꺼진 점 밝기) |
| `split` | 위아래로 갈라지며 맞물림 | 글자 위 절반과 아래 절반이 양쪽에서 와서 맞물림 | `u__distance`, `u__gap` |

- 5단계 1차에서 만든 것 (2026-11-09): `slidein`, `shake`, `inkfill`, `glyphbox`. 겹치기 문법은 쉼표가 아니라 `|`(`effect="slidein|shake"`, 렌파이 `parse_textshader`). `glyphbox`는 줄 끝 빈 칸(가짜 글자 `a_text_pseudo_glyph`)은 빼고, 띄어쓰기에는 상자가 생김. `inkfill`의 외곽선 겹은 굵어진 글자에서 원래 모양을 빼서(8방향 erode, `u__line`) 테두리만 남김. 글자 자리는 `a_text_pos_rect`(x, y, 폭, 높이). 렌파이에 같은 이름 `flip` 효과가 있어서 뒤집기는 `flipin`으로.
- 5단계 2차에서 만든 것 (2026-11-09): `stamp`, `punch`, `squash`, `extrude`, `flipin`(표의 `flip`), `led`, `split`. 공용 조각 `ROTATE`가 `l__p`를 쓰므로 효과 안에서 같은 이름을 쓰지 않음. `led`는 줄 전체에 꺼진 점판이 깔림(아직 안 나온 글자 자리 포함).
- 여러 효과 겹치기(`effect="slidein|shake"`)는 렌파이 글자 셰이더가 원래 됩니다. PyKaki 미리보기도 이미 겹친 효과를 그립니다.
- `glyphbox`는 띄어쓰기에도 상자가 생깁니다(글자 네모가 띄어쓰기 폭만큼 있음). 만들 때 확인해서, 띄어쓰기 칸을 알아낼 수 없으면 "띄어쓰기에도 상자" 그대로 두고 안내에 적습니다.
- PyKaki 미리보기(`pykaki/src/fx/`)가 `u_text_main`, `u_text_depth`, 외곽선 겹(`@outline`)을 렌파이와 같게 그리는지 확인합니다. `inkfill`, `glyphbox`, `extrude`가 이것에 기댑니다.
- 글자 움직임 참고 그림 중 고르지 않은 것: 글자 띠·3D 터널·원기둥·소용돌이·숫자 굴림·제목 바꾸기는 대사 한 줄 효과가 아니라서 이번에는 뺍니다. 그중 띠(12 사선 띠, 14 전광판 흐름, 16 출입 금지 테이프)는 공포 게임에 잘 맞아서 다음 판 "글자 띠 장식"으로 남깁니다.

**글 상자 꾸미기 (대사 스타일, 셰이더 아님)**

| 이름 | 하는 일 | 값 |
|---|---|---|
| `bubble` | 만화 말풍선 같은 흰 상자가 글을 둘러싸고 따라다님. 꼬리는 말하는 사람 쪽(이름 칸 자리나 `tail=(x, y)`). 글이 미끄러지거나 흔들리면 상자도 같이 | `bubble_color`, `bubble_border`(선 굵기, 색), `bubble_radius`, `bubble_padding`, `bubble_tail`, `bubble_pop`(튀어나오며 나타남) |
| `pill` | 글 둘레에 둥근 테두리. 속을 채울 수도, 선만 둘 수도, 살짝 기울일 수도 | `pill_line`(굵기, 색), `pill_fill`, `pill_padding`, `pill_rotate` |

- 대사 괄호 `(box="bubble")`, `(box="pill", box_rotate=-4)`. 편집기 대사 탭에 "상자" 칸.
- 상자 크기는 글 전체 크기에 맞춥니다(글이 다 나오기 전에도 상자는 다 큰 크기로 나타남). 둥근 네모는 그림 없이 셰이더로 그립니다(모서리 둥글기, 선, 꼬리).
- 참고 영상처럼 낱말마다 다른 자리의 상자는 대사 여러 줄을 각자 자리에 띄우는 것으로 합니다(대사 탭 위치 + `box`). 낱말마다 자동으로 나누기는 이번에는 안 합니다.
- PyKaki 미리보기: 상자는 CSS로 비슷하게 그립니다. 형식이 바뀌므로(`box=` 괄호 값) `docs/LINK.md` 2장과 `pykaki/src/types.ts`를 같은 커밋에서 고칩니다.
- 6단계에서 만든 것 (2026-11-09, `ui_kit/engine/text_box.rpy`): 렌파이 글(`Text`)은 background 스타일을 쓰지 않아서, 대사 괄호의 상자 값을 `what_background`의 `TextBox`로 넣고 `Text.render`를 감싸 그 값이 있을 때만 글 둘레에 상자를 깝니다(글 크기는 그대로라 배치가 안 바뀜). 상자는 `ui_kit.textbox` 셰이더(둥근 네모와 꼬리 세모의 거리 함수). 기울기는 상자와 글을 같이 돌림. 꼬리는 말하는 사람을 저절로 찾지 않고 방향이나 `(x, y)`로(글 그림은 화면 자리를 모름). 글자마다 움직이는 효과는 상자가 따라가지 않음. 값 이름은 `bubble_color`, `bubble_border`, `pill_line`, `pill_fill` 등 위 표 그대로, 더해서 `tail`, `box_rotate`, `*_tail_pos`, `*_tail_size`, `*_tail_width`, `*_text_color`. 기본 모양은 `say_style.box_styles`. 편집기 대사 탭 "상자" 칸(없음/말풍선/둥근 테두리, 꼬리, 기울기). PyKaki 원고 줄에서는 칸을 숨김(7단계에서 PyKaki와 같이).

### 8-5. 편집기와 앱

- 화면 효과 탭: 새 효과 여덟 개의 값 칸(막대, 색).
- 대사 탭: 등장 효과 목록에 새 효과, 효과 겹치기(두 개까지), 상자 칸.
- 이미지/영상 탭: 고른 이미지에 걸 [효과] 칸.
- 앱은 패널을 통째로 옮겨 받으므로(LINK.md 9장) 새 칸이 저절로 나옵니다. 따로 고칠 것은 위에 적은 여러 줄 `in`뿐입니다.

### 8-6. 성능과 조건

- 렌파이 8.5.3, gl2 렌더러 기준. 흐림(`tracepaper`)과 파편(`shards`) 많이는 1280×720에서 60fps를 목표로 하고, 시험 프로젝트에서 재 봅니다. 느리면 흐림은 절반 크기로 그린 뒤 키우고, 파편은 `count`를 줄입니다.
- 두 자리와 이미지 효과를 다 켜면 무거울 수 있어 편집기에 "지금 그리는 효과 수"를 보여 줍니다.
- 웹(렌파이 웹 빌드)·모바일은 지금처럼 확인하지 않습니다.

### 8-7. 만드는 순서

1. `splash` 2.0: 가운데 화면, 끌기·회전·늘리기, 화면에서 글 고치기, 페이지 더하기·지우기·순서, 저장.
2. `screen_fx` 5.0 바탕: 이미지에 거는 효과, 값 바꾸기, 셰이더 전환 틀 (만듦).
3. 화면 효과: `glitch`, `boil`, `halftone`, `hologram`, `nightvision`(+화면 글), `tiles` (만듦, `screen_fx` 5.1). `tracepaper`는 뺌.
4. 파편 흩날림(`shards`) (만듦, 2026-11-09).
5. 글자 효과: `slidein`, `shake`, `inkfill`, `glyphbox`, 그다음 `stamp`, `punch`, `squash`, `extrude`, `flip`, `led`, `split`.
6. 글 상자 `bubble`, `pill` (만듦, `ui_kit` 4.0).
7. PyKaki 목록·미리보기·LINK.md, 편집기 칸, README, `CUSTOM_GUIDE.md`, 공개용 구글 문서 수정안. (2026-11-09: PyKaki 상자 칸·효과 겹치기·`FX_BASE`·LINK.md 2장·`FEATURE` 3, 이미지 탭 [효과] 칸 만듦)
8. 묶음 태그: 사용자와 정해서 **v1.3**으로 (2026-11-09).

### 8-8. 사람이 볼 것

한글 입력기로 스플래시 제목 고치기, 회전한 글 고치기, 새 페이지가 게임을 껐다 켜도 순서대로 나오는지, 번역 만들기에 고친 글이 잡히는지, 효과마다 참고 그림과 비슷한지(특히 망점 CMYK, 홀로그램, 조각 어긋남), 두 자리와 이미지 효과를 다 켠 속도, 지글거림이 참고 영상처럼 손그림 느낌인지, 말풍선 꼬리 방향, PyKaki 미리보기와 게임이 같은지.

## 9. 줄기표 (`screen_fx` 5.2, 2026-11-09)

파일: `screen_fx/editor/editor_flow.rpy` (`FlowTreeMixin`, `FlowTreeView`, 스크린 `ui_editor_fx_tree_overlay`, `ui_editor_fx_tree_panel`). `FxTab`이 `FlowTreeMixin`을 먼저 이어받음(편집기 `Tab`의 `drag_begin`, `wheel`보다 앞서게).

- **원고 읽기**: `renpy.game.script.namemap`에서 이 파일의 `Label`을 줄 순서로 돌며 블록을 걸음. `Menu`는 선택지마다, `If`는 조건마다, `While`은 한 가지. 가지 머리 줄(선택지 글, `elif`, `else`)은 블록 첫 줄보다 덜 들여쓴 바로 위 줄. 행마다 `path`(지나온 (가지 노드 id, 몇 번째)), `guides`(세로선 깊이). 원고 글은 렌파이가 원고를 읽은 때 한 번만 읽어 둠(캐시 키: script, namemap).
- **덮인 셰이더**: 행을 걸으며 두 자리를 셈. `$ screen_fx.shaders/use/clear/set_overlay` 줄(`call_slots`), 대사 괄호 `fx=`(`say_slots`), 저장 안 한 `line_edits`의 `slots`(그 대상 줄 위의 셰이더 줄은 무시). 가지는 갈라진 곳의 값으로 시작하고, `jump`/`return`으로 끝나지 않는 가지들의 값이 모두 같으면 합쳐진 뒤 그 값(아니면 갈라지기 전 값). 행마다 `point`(전환 점: target, slots, tr, both, kind).
- **입력**: 편집기 입력층(`EditorInput`)이 `drag_begin/drag_move/drag_end`, 휠은 `panel_wheel` → `tab.wheel`. 서랍 오른쪽 `TREE_DOT` 폭은 전환 점 고르기. 움직이지 않고 떼면 `pick_line`.
- **[이 구간에 적용]** (`tree_range_plan`, `tree_apply_range`): 시작 = 구간 첫 행부터 처음 나오는 넣을 수 있는 문장. 끝 = 구간 안 마지막 문장. 되돌리기 자리 = 끝 노드의 `.next`(우리 셰이더 줄과 `Label` 머리는 건너뜀)가 이 파일의 label 안 줄이면 그 줄. 끝이 시작과 다른 가지면 바깥쪽 가지 노드의 `.next`(합쳐지는 곳)를 고를 수 있음. 되돌리는 값 = 시작 줄 위 셰이더 줄 앞의 두 자리. 되돌리기 자리에 이미 셰이더 줄(저장 전 포함)이 있으면 넣지 않음. 결과는 FxTab의 `line_edits`(줄에 넣기와 같은 길, `script_edit.INSERT`)라 PyKaki 원고에도 그대로 저장됨.
- 앱 (ui_kit 4.1): `editor_live.rpy`가 `state.flow`에 `FxTab.flow_state()`를 싣고, `flow` 명령을 `FxTab.flow_cmd()`로 넘김(LINK.md 9장). 행 글과 색은 게임 서랍과 같은 `tree_row_text`. 앱(`pykaki/src/ShowpyFlow.tsx`)이 원고 칸 옆에 그림. 앱이 패널을 가져가 있으면(`live_panel_hidden`) 게임 창 서랍은 그리지 않음. 패널 칸(적용, 전환)은 공통 틀로 앱에 나옴.
- **지우기** (`tree_delete`, Delete 키, `flow` `delete`): 구간이면 구간 행 안의 점 + 대상이 구간 안 문장인 점(바로 위 셰이더 줄) + 되돌리기 자리(`tree_range_plan`의 `restore`)의 점, 그리고 고른 전환 점. 원고에 있는 셰이더 줄은 `line_edits`의 `slots = None`(저장할 때 지움), 저장 전 적용은 그 편집을 버림, 대사 괄호는 대사 탭 `line_edits`에 `fx`, `fx_overlay`, `fx_transition` = `REMOVE`(덮인 셰이더 계산도 이것을 봄). 앞에서 이어진 값은 그대로(사용자와 정함, 기본 줄을 새로 넣지 않음).
- 캐시 키: (파일, 렌파이가 읽은 줄 번호 목록, 원고 파일 수정 시간). script 객체 id는 다시 불러온 뒤 같은 값이 다시 쓰여서 못 씀.
- 저장 뒤 `FxTab.after_script_save`는 `Edit.key`(처음 고른 줄)로 편집을 지움. PyKaki 원고는 `_pk_prepare`가 `linenumber`를 표시 줄로 옮기기 때문. 원고가 바뀐 파일의 남은 편집도 버림.
- PyKaki 원고는 `# @l:` 표시가 바로 위에 있는 줄 앞에만 넣음(`_tree_can_insert`).
- 렌파이 8.5의 대사는 `TranslateSay` 노드. `call` 뒤 같은 줄의 `Pass`는 건너뜀.
- 세션: `tree_open`만 기억(저장 → 다시 불러오기 뒤에도 펴진 채). 구간과 고른 전환 점은 저장하면 지움.
- 한계: 다른 파일로 가는 `jump`/`call`은 따라가지 않음. `while` 안은 한 번 도는 것으로 봄.

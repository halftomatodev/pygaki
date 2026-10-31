# showpy 명세서

코드를 고치는 사람과 AI가 읽는 문서입니다. 사용법은 [CUSTOM_GUIDE.md](CUSTOM_GUIDE.md)에 있습니다.

- 묶음 버전 4.3 (`ui_kit` 3.2, `screen_fx` 4.2, `hotkeys` 1.0, `splash` 1.1)
- 렌파이 8.5.3 기준
- 작업 규칙: [DEV_RULES.md](DEV_RULES.md)
- PyKaki 연결 형식: [LINK.md](LINK.md)
- PyKaki 명세: https://github.com/halftomatodev/pykaki/blob/main/docs/SPEC.md

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
| `game/ui_kit` | 3.2 | 타이틀 메뉴, ESC 메뉴, 선택지, 커서, 클릭 대기 표시, 대사 소리, 대사 스타일, 그림과 영상 배치(`stage`), 편집기(개발 모드 Shift+M), 원고 쓰기 도구(`script_edit`) |
| `game/screen_fx` | 4.2 | 기본 효과(없음, ASCII, 레트로 터미널, 게임보이) + VHS 덮개, TV 전환, 글자 빼기, 커서 자리, 타이틀 일렁임 |
| `game/hotkeys` | 1.0 | 단축키, 조작방법 화면 |
| `game/splash` | 1.1 | 타이틀 전 로고, 경고, 조작 방법 페이지 |

기능마다 자세한 값은 폴더 안 `README.md`에 있습니다.

## 3. 렌파이에서 차지하는 것

다른 코드와 겹칠 수 있는 곳입니다.

| 종류 | 내용 |
|---|---|
| 스크린 교체 | `choice`, `main_menu`, `navigation`, `keyboard_help` |
| 새 스크린 | `tmenu_pause`, `title_menu`, `cmenu_choice`, `splash_page`, `ui_editor_*` |
| 층 | `sfx_say`, `sfx_choice` (screens 아래), `ui_editor` (top_layers) |
| config | `say_arguments_callback`(`screen_fx` → `say_style` 순서로 이어짐), `layer_transforms`, `say_layer`, `choice_layer`, `nvl_layer`, `nvl_choice_layer`, `context_clear_layers`, `mouse`, `mouse_displayable`, `always_shown_screens`, `top_layers`, `label_overrides["splashscreen"]`, `end_splash_transition`, `all_character_callbacks`, `start_callbacks`, `after_load_callbacks`, `after_default_callbacks`, `default_text_cps`, `keymap`, `underlay`, `language_callbacks`, `lint_hooks`, `show`, `hide`, `scene`, `with_callback`, `start_interact_callbacks`, `label_callbacks` |
| 그 밖 | `_game_menu_screen`, `gui.main_menu_background` |
| 세이브 값 | `screen_fx.current`, `cur_overlay`, `cur_target`, `cur_cursor`, `overrides`, `changes`, `stage.cur_box` |
| persistent | `splash_seen`, `splash_hidden`, `screen_fx_off`, `vhs_crt_off`, `ascii_off`, `retro_term_off`, `gameboy_off`, `_ui_kit_text_cps` |
| 프로젝트 폴더 | `ui_kit_backup/` (원고 백업), `game/showpy_inbox.json` (PyKaki 전달, 배포판 제외) |

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
| `speed` | 배율 | 나오는 속도 |
| `effect` | `"dissolve"` `"typewriter"` `"slowalpha"` `"flip"` `"zoom"` `"jitter"` `"wave"` | 등장 효과 |
| `name_x` `name_y` `name_font` `name_size` `name_color` | | 이름 |

`screen_fx` 값은 다시 바꿀 때까지 유지되고 세이브에 저장됩니다. 플러그인을 빼면 이 괄호에서 오류가 납니다.

### 4-2. 명령 줄

```renpy
$ screen_fx.use("ascii", overlay=False, transition="fade", cursor="overlay")
$ screen_fx.clear()
$ screen_fx.set_overlay(True)
$ screen_fx.set_warp(3)
$ screen_fx.set_cursor("top")
```

`use()`, `clear()`는 부를 때마다 덮개를 설정대로 다시 정합니다. 커서 자리는 `cursor=`를 적을 때만 바뀝니다.

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
| 타이틀 메뉴, 커서/대사 소리, 화면 효과 값, 타이틀 일렁임 | `*_layout.rpy` | 같음 |
| 이미지/영상의 위치 | 원고의 그 줄 `at` | `ui_kit/stage_layout.rpy` |
| 이미지/영상의 전환, 그림 바꾸기, 줄 넣기, 소리 넣기 | 원고 | 원고 + `showpy_inbox.json` |
| 대사, 선택지, 화면 효과 줄에 넣기 | 원고 | **저장 안 함.** 이유를 보여 줌. 대사 복사(Ctrl+C)는 됨 |

## 6. PyKaki 원고 처리 (3.2)

- 알아보기: `script_edit.is_pykaki(filename)`. 파일 앞 5줄의 표시 문구.
- 저장: `script_edit.apply`가 파일을 읽은 뒤 `_pk_prepare`로 거릅니다.
  - `show`, `hide`, `scene` 줄 고치기: 쓴 뒤 `replace` 기록을 남깁니다.
  - 줄 넣기: 줄이 모두 `show`, `scene`, `hide`, `play`, `stop`이면 줄 앞에 `# @l:새id`를 함께 쓰고 `insert` 기록을 남깁니다. 앞에 넣을 때는 기준 줄의 표시 위에 넣어서 표시와 줄이 떨어지지 않게 합니다.
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

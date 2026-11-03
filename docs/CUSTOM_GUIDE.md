# showpy 커스텀 가이드 (4.6)

2026-10-31 · 버전 4.6 (4.6에서 바뀐 것: 글자마다 움직이는 등장 효과 7개)

## 이 문서 보는 법

showpy 4.6을 받은 사람이 **어떤 파일의 어떤 값을 고치면 무엇이 바뀌는지** 찾아보는 문서입니다. 설정 이름의 전체 설명은 각 폴더의 `README.md`에 있고, 이 문서는 "하고 싶은 일"에서 출발합니다. 글을 PyKaki에서 쓰려면 "PyKaki와 함께 쓰기"부터 보세요.

| 폴더 | 하는 일 | 고치는 파일 |
| --- | --- | --- |
| `ui_kit` | 타이틀 메뉴, 선택지, 커서·클릭 대기 표시·대사 소리·텍스트 속도·퀵메뉴, 대사 한 줄 스타일·이름 위치·속도·등장 효과, 이미지·영상 배치(movies/ 영상 자동 등록, bg 맨 뒤, show·hide 줄의 위치와 전환. 2.8에서 추가) + 편집기 | `title_menu_config.rpy`, `choice_menu_config.rpy`, `custom_ui_config.rpy`, `say_style_config.rpy`, `stage_config.rpy` |
| `screen_fx` | 화면 전체 효과. **기본 효과**(없음, ASCII, 레트로 터미널, 게임보이) 위에 **VHS 덮개**(켬/끔, 왜곡 정도)를 겹침 (4.0), 장면마다 효과 바꾸기와 TV 꺼짐·켜짐 전환, 글자 빼기(대사·선택지·메뉴를 골라서 효과에서 빼기), 타이틀 화면 일렁임 | `screen_fx_config.rpy`, `vhs_crt_config.rpy`, `ascii_config.rpy`, `retro_term_config.rpy`, `gameboy_config.rpy`, `watermorph_config.rpy` |
| `hotkeys` | 단축키 추가·해제, 조작방법 화면 설명 | `hotkeys_config.rpy` |
| `splash` | 타이틀 전에 나오는 로고·경고·조작 방법 페이지 (2.3에서 추가) | `splash_config.rpy` |

규칙은 세 가지입니다.

1. **이름이 `_config.rpy`로 끝나는 파일만 고칩니다.** `engine/`, `editor/` 폴더와 `hotkeys.rpy`는 고치지 않습니다.
2. 이미지·소리·영상·글꼴 경로는 모두 **`game` 폴더 기준**입니다. (`"gui/cursor/cursor1.png"` = `game/gui/cursor/cursor1.png`)
3. 고친 뒤 게임 실행 중 **Shift+R**을 누르면 다시 불러와서 바로 보입니다. 다 고치면 런처에서 Lint를 실행합니다.

편집기(개발 모드에서 Shift+M)에서 **대사·선택지는 그 줄만** 고치고, Ctrl+S를 누르면 **원고(.rpy)의 그 줄 괄호에 바로 저장**됩니다. 고치기 전 원본은 프로젝트 폴더의 `ui_kit_backup/`에 남습니다. 모두에 적용할 기본값은 설정 파일에서 고칩니다. 그 밖의 탭(타이틀 메뉴, 커서/대사 소리, 화면 효과)에서 저장한 값은 각 플러그인 폴더에 `*_layout.rpy`로 생기고, 설정 파일의 같은 값보다 우선합니다. 설정 파일을 고쳤는데 안 바뀌면 먼저 그 파일을 확인하세요.

## 한눈에 찾기

바꾸고 싶은 것을 찾아 오른쪽 파일의 값을 고치면 됩니다. "편집기" 칸에 표시된 것은 Shift+M 편집기로도 고칠 수 있습니다.

| 바꾸고 싶은 것 | 파일 | 값 | 편집기 |
| --- | --- | --- | --- |
| 타이틀 전 로고·경고·조작 방법 페이지 | `splash/splash_config.rpy` | `splash.pages` |  |
| 그 페이지들의 공통 글꼴·색·나타나는 시간 | `splash/splash_config.rpy` | `splash.default` |  |
| 타이틀에서 조작 방법 다시 보기 | `ui_kit/title_menu_config.rpy` | 항목의 `"action": splash.ShowPage("controls")` |  |
| 타이틀 메뉴 항목 글자·동작 | `ui_kit/title_menu_config.rpy` | `tmenu.items`의 `"text"`, `"action"` |  |
| 타이틀 메뉴 항목 위치·회전·크기 | `ui_kit/title_menu_config.rpy` | 항목의 `"x"`, `"y"`, `"rotate"`, `"skew"`, `"zoom"`, `"size"` | 타이틀 메뉴 탭 |
| 타이틀 메뉴 전체 글꼴·색 | `ui_kit/title_menu_config.rpy` | `tmenu.default`의 `"font"`, `"color"`, `"hover_color"` | 타이틀 메뉴 탭, 3번 "모든 항목 공통" |
| 선택을 옮길 때 밀려나는 거리·속도 | `ui_kit/title_menu_config.rpy` | `tmenu.push_before`, `push_after`, `move_time`, `move_warper` |  |
| 타이틀 배경 영상 | `ui_kit/title_menu_config.rpy` | `tmenu.background_movie` |  |
| 타이틀 게임 제목 위치·색, 버전 표시 | `ui_kit/title_menu_config.rpy` | `style main_menu_vbox`, `style main_menu_title`, `tmenu.show_version` |  |
| 게임 메뉴(저장·불러오기 화면) 왼쪽 목록 | `ui_kit/title_menu_config.rpy` | `tmenu.game_menu`, `style navigation_button_text` |  |
| 게임 중 ESC 메뉴 (타이틀 메뉴 모양) | `ui_kit/title_menu_config.rpy` | `tmenu.pause`(켜기), `tmenu.pause_dim`(뒤 화면 어둡게), `tmenu.pause_background`, `tmenu.pause_items` (3.1) | ESC 메뉴를 연 채로 타이틀 메뉴 탭 → Ctrl+S |
| 선택지 하나의 위치·글꼴·색 | 스크립트 (`script.rpy` 등) | 선택지 뒤 괄호 `(x=…, y=…, font=…, color=…)` | 선택지 탭 → Ctrl+S (원고에 바로) |
| 모든 선택지의 글꼴·크기·색·배경 | `ui_kit/choice_menu_config.rpy` | `cmenu.default` |  |
| 세로 목록 선택지 위치 | `ui_kit/choice_menu_config.rpy` | `cmenu.list_pos` |  |
| 선택지 등장 연출 | `ui_kit/choice_menu_config.rpy` | `cmenu.appear`, `appear_time`, `appear_stagger` |  |
| 마우스 커서 | `ui_kit/custom_ui_config.rpy` | `custom_ui.cursor`, `cursor_frames`, `cursor_hold`(1/2프레임마다), `cursor_mode`, `cursor_hotspot` (3.0) | 커서/대사 소리 탭 (칸 12개) |
| 클릭 대기 표시(ctc) | `ui_kit/custom_ui_config.rpy` | `custom_ui.ctc`, `ctc_frames`, `ctc_hold`(1/2프레임마다), `ctc_position` (3.0) | 커서/대사 소리 탭 (칸 12개) |
| 대사 나올 때 소리 | `ui_kit/custom_ui_config.rpy` | `custom_ui.typing_sound`, `typing_volume` | 커서/대사 소리 탭 |
| 텍스트 속도 기본값 | `ui_kit/custom_ui_config.rpy` | `custom_ui.text_cps` | 커서/대사 소리 탭 |
| 퀵메뉴 처음부터 보이기 | `ui_kit/custom_ui_config.rpy` | `custom_ui.quick_menu` | 커서/대사 소리 탭 |
| 대사 한 줄의 위치·크기·색 | 스크립트 | 대사 뒤 괄호 `(x=…, y=…, size=…, color=…)` | 대사 탭 → Ctrl+S (원고에 바로) |
| 대사 한 줄의 이름 위치·크기·색 | 스크립트 | 대사 뒤 괄호 `(name_x=…, name_y=…, name_size=…, name_color=…)` | 대사 탭, Tab으로 "이름" → Ctrl+S |
| 대사 한 줄의 나오는 속도·등장 효과 | 스크립트 | 대사 뒤 괄호 `(cps=20, effect="jitter")` (`cps`는 1초에 나오는 글자 수), 또는 배율 `(speed=0.5)` | 대사 탭, 속도·효과 버튼 → Ctrl+S |
| 그림·영상의 위치와 등장·퇴장 전환 (show / hide / scene 줄) | 스크립트 | `show eileen at stage.pos(420, 720) with dissolve`, `hide eileen with moveoutright` | 이미지/영상 탭 → Ctrl+S (원고에 바로) |
| show / scene 줄의 그림을 다른 파일로, 새 show / scene 줄 넣기 | 스크립트 | `scene fx_bg` → `scene room`, 아래에 `show hand` (3.0) | 이미지/영상 탭 "그림/영상 고르기" → Ctrl+S |
| 영상을 이름만으로 쓰기, 투명 영상 | `game/movies/` 폴더 + `ui_kit/stage_config.rpy` | `movies/rain.webm` → `show rain`, `movies/mask_ghost.webm` → `show ghost`(투명), `stage.movie_once` |  |
| bg 그림을 늘 맨 뒤에 | `ui_kit/stage_config.rpy` | `stage.bg_tag`, `stage.bg_zorder` |  |
| 배경으로 볼 태그 더하기 (맨 뒤 + 편집기에서 위치 고정) | `ui_kit/stage_config.rpy` | `stage.bg_tag = [ "bg", "fx_bg" ]` (3.0) |  |
| 편집 중에도 화면 효과 보기 / 끄기 | `screen_fx/screen_fx_config.rpy` | `screen_fx.editor_preview = True` / `False` (3.0) | 편집 중 V 키 |
| 편집기 패널이 화면을 가릴 때 | (키) | 제목 끌기, X 접기, Space 누르는 동안 숨기기, B 자동 비키기, P 구석 바꾸기 |  |
| 편집기 패널 아래쪽이 잘릴 때 | (마우스) | 패널 위에서 휠, 또는 오른쪽 분홍 스크롤바 끌기 (2.9) |  |
| 이 대사부터 화면 효과 바꾸기 (선택취소할 때까지 유지) | 스크립트 | 대사 뒤 괄호 `(fx="ascii")`, 선택취소 `(fx="default")`, 전환 `(fx_transition="fade")` | 대사 탭 "화면 효과" 줄, 또는 화면 효과 탭 "이 대사부터 이 효과" → Ctrl+S (원고에 바로) |
| 대사가 아닌 줄(scene, show, with, $ 줄)부터 화면 효과 바꾸기 | 스크립트 | 그 줄 바로 위에 `$ screen_fx.use("ascii", overlay=False, transition="fade")`, `$ screen_fx.clear()`, `$ screen_fx.set_overlay(True)`, `$ screen_fx.set_warp(3)` (4.1) | 화면 효과 탭 "줄에 넣기", 또는 "이 줄부터 이 효과" → Ctrl+S (원고에 바로) |
| 이 대사부터 VHS 덮개 켜기/끄기, 휘어짐 | 스크립트 | 대사 뒤 괄호 `(fx_overlay=False)`, `(fx_overlay=True)`, `(fx_warp=3.0)`, `(fx_warp="default")` (4.0) | 대사 탭 "덮개(VHS)", "덮개 휘어짐" 줄 → Ctrl+S |
| 마우스 커서가 화면 효과를 받을지 (구간마다) | `screen_fx/screen_fx_config.rpy` + 스크립트 | `screen_fx.cursor = "effect"` / `"overlay"` / `"top"`, `$ screen_fx.set_cursor("top")`, 대사 괄호 `(fx_cursor="overlay")` (4.2) | 대사 탭 "커서" 줄, 줄에 넣기 "커서" 줄 → Ctrl+S |
| 이 대사부터 글자 빼기 | 스크립트 | 대사 뒤 괄호 `(fx="gameboy", fx_exclude=("say",))` | 대사 탭 "글자 빼기" 줄 → Ctrl+S |
| 캐릭터의 대사 기본 위치·글꼴 | `ui_kit/say_style_config.rpy` | `define t = Character(what_xpos=…, what_font=…)` |  |
| 장면에서 화면 효과 바꾸기·선택취소 | 스크립트 | `$ screen_fx.use("ascii")`, `$ screen_fx.use("ascii", overlay=False)`, `$ screen_fx.clear()` |  |
| 평소 화면 효과 (기본 효과) | `screen_fx/screen_fx_config.rpy` | `screen_fx.base` (`"none"`, `"ascii"`, `"retro_term"`, `"gameboy"`) | 화면 효과 탭 → 기본 효과, 전환 |
| 효과를 바꿀 때 전환 (TV 꺼짐·켜짐 / 서서히 / 바로) | `screen_fx/screen_fx_config.rpy` | `screen_fx.transition`, `screen_fx.tv`, `screen_fx.fade_time` | 화면 효과 탭 → 기본 효과, 전환, "미리 보기" |
| ASCII 글자 칸 크기·비율·선명하게, 글자 목록, 색 | `screen_fx/ascii_config.rpy` | `ascii.settings`의 `"cell"`, `"aspect"`, `"crisp"`, `"chars"`, `"color_mode"`, `ascii.presets` | 화면 효과 탭 → ASCII |
| ASCII 글꼴 | `screen_fx/ascii_config.rpy` | `ascii.font` (`None` = 들어 있는 Neo둥근모) |  |
| VHS 덮개 켜기/끄기 (기본은 켬) | `screen_fx/screen_fx_config.rpy` | `screen_fx.overlay` (`True` / `False`) | 화면 효과 탭 → 기본 효과, 전환 "덮개(VHS)" |
| 효과마다 덮개 켤지 (레트로 터미널은 기본 끔) | 각 효과 설정 파일 | `ascii.overlay`, `retro_term.overlay`, `gameboy.overlay` (`True` / `False`) | 화면 효과 탭 → 효과 버튼 → "덮개(VHS)" |
| 덮개 왜곡 정도 (휘어짐, 밀림, 색 번짐) | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.settings`의 `warp_amount`, `distort_intensity`, `aberration`. 게임 중 `$ screen_fx.set_warp(3.0)`, `$ vhs_crt.set(…)` | 화면 효과 탭 → VHS 덮개 막대, 대사 탭 "덮개 휘어짐" |
| 효과에서 대사·선택지·메뉴 빼기 (글자 빼기) | 각 효과 설정 파일 | `vhs_crt.exclude`, `ascii.exclude`, `retro_term.exclude`, `gameboy.exclude` (`"say"`, `"choice"`, `"screens"` 중 고르기) | 화면 효과 탭 → 효과 버튼 → "글자 빼기" |
| 레트로 터미널 색(형광체·바탕), 곡면 CRT, 자체 VHS | `screen_fx/retro_term_config.rpy` | `retro_term.settings`의 `"phosphor"`, `"background"`, `"crt"`, `"vhs"`, `retro_term.presets` | 화면 효과 탭 → 레트로 터미널 |
| 게임보이 디더링/픽셀화, 점 크기, 4가지 색, LCD 느낌 | `screen_fx/gameboy_config.rpy` | `gameboy.settings`의 `"mode"`, `"pixel_size"`, `"color1"`~`"color4"`, `"grid"`, `"shadow"`, `gameboy.presets` | 화면 효과 탭 → 게임보이 |
| 스크린에 넣은 그림에도 장면 효과 | 그 스크린 | `add "map.png" at screen_fx.scene` |  |
| 타이틀 일렁임 세기·대상 | `screen_fx/watermorph_config.rpy` | `watermorph.amount`, `target`, `shine` | 타이틀 일렁임 탭 |
| VHS 덮개 세기·범위 | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.settings`, `vhs_crt.scope` | 화면 효과 탭 → VHS 덮개 |
| VHS 프리셋 (게임 중 바꿀 묶음) | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.presets` | 화면 효과 탭 → VHS 덮개, "고칠 대상"에서 프리셋 고르기 |
| 단축키 추가·해제 | `hotkeys/hotkeys_config.rpy` | `hotkeys.bindings`, `hotkeys.unbind` |  |
| 조작방법 화면 설명 | `hotkeys/hotkeys_config.rpy` | `hotkeys.keyboard_help` |  |
| 기능 하나를 통째로 끄기 | 각 설정 파일 맨 위 | `tmenu.enabled`, `cmenu.enabled`, `custom_ui.enabled`, `say_style.enabled`, `watermorph.enabled`, `vhs_crt.enabled`, `ascii.enabled`, `retro_term.enabled`, `gameboy.enabled`, `splash.enabled` |  |

## PyKaki와 함께 쓰기

[PyKaki](https://halftomatodev.github.io/pykaki/)는 상자와 선으로 대본을 쓰는 웹 에디터입니다. 두 프로그램을 함께 쓰면 **글은 PyKaki에서, 화면은 렌파이에서** 맞춥니다. 렌파이 코드를 몰라도 됩니다.

| 하고 싶은 것 | 어디서 |
|---|---|
| 대사, 선택지, 이야기 흐름 쓰기 | PyKaki |
| 대사 글자 크기, 글꼴, 색, 속도, 등장 효과 | PyKaki (오른쪽 편집 탭의 글자 효과 칸) |
| 대사와 이름의 위치 | **렌파이 편집기** 대사 탭에서 끌기. 좌표는 PyKaki에 받아 적혀 보입니다 |
| 줄마다 화면 효과 바꾸기 | **렌파이 편집기** 대사 탭. PyKaki에 받아 적혀서 다시 내보내도 남습니다 |
| 그림, webm 영상, 음악, 효과음 넣기 | **렌파이 편집기** (PyKaki에서도 칸으로 넣을 수 있음) |
| 그림 위치 옮기기 | **렌파이 편집기만** |
| 타이틀 메뉴, 커서 등 게임 전체 모양 | 렌파이 편집기 |

### 처음 한 번만 하는 준비

1. 렌파이로 프로젝트를 만들고 showpy 폴더들을 `game`에 넣습니다.
2. 크롬이나 엣지로 PyKaki를 엽니다. (폴더 연결은 이 두 브라우저에서만 됩니다)
3. 왼쪽 **[렌파이 프로젝트 연결]**을 누르고 프로젝트 폴더를 고른 뒤, 권한을 허용합니다.

이것으로 끝입니다. PyKaki가 `game` 폴더를 찾고, showpy가 있으면 연결을 켜고, `game/script_flow.rpy`를 만듭니다. 렌파이에서 실행하면 PyKaki의 첫 상자부터 시작합니다.

`script.rpy`는 그대로 둬도 됩니다. 내보낸 파일에 아래 줄이 들어 있어서 게임 시작이 첫 상자로 이어지고, `script.rpy`의 `label start:`는 실행되지 않습니다.

```renpy
init python:
    config.label_overrides["start"] = "prologue"
```

PyKaki 새 대본의 첫 label 이름은 `prologue`입니다. 다른 이름으로 바꾸거나 시작 상자를 옮기면 내보낼 때 그 값을 따라갑니다.

알아 둘 것:
- 캐릭터 id를 `e`로 쓰면 `script.rpy`의 `define e`와 겹칩니다. Lint에 경고가 나오고 어느 쪽 이름이 쓰일지 보장되지 않으니, 다른 id를 쓰거나 `script.rpy`를 지우세요.
- 대본에 이름이 `start`인 label을 직접 만들면 `script.rpy`의 `label start:`와 겹쳐서 렌파이가 오류를 냅니다. 이 경우에만 그 파일의 `label start:`를 지웁니다.

브라우저를 다시 열면 PyKaki가 폴더를 기억하지만, 권한은 다시 물어봅니다. Ctrl+E나 [다시 읽기]를 누를 때 허용하면 됩니다.

### 평소 작업 순서

```
① PyKaki에서 글을 쓰고 Ctrl+E
② 렌파이에서 게임 실행, Shift+R 한 번 (창 제목에 autoreload가 뜸)
   → 이제 PyKaki에서 Ctrl+E를 누를 때마다 렌파이가 바로 다시 불러옵니다
③ 그림을 넣을 대사에서 Shift+M → T로 "이미지/영상" 탭
④ [그림/영상/소리 고르기] → 파일을 고르고 → [지금 대사 앞에: show] → Ctrl+S
⑤ 화면의 그림을 끌어서 위치를 맞추고 Ctrl+S
⑥ PyKaki 창으로 돌아오면 넣은 줄이 대본에 나타납니다
```

### 그림, 영상, 소리 넣기

[그림/영상/소리 고르기] 창에는 `game/images`, `game/movies`, `game/audio`의 파일이 나옵니다.

| 고른 것 | 버튼 | 원고에 들어가는 줄 |
|---|---|---|
| `images/bg hall.png` | scene | `scene bg hall` |
| `images/mina scared.png` | show | `show mina scared` |
| `images/ghost.png` | show | `show ghost` |
| `movies/rain.webm` | show | `show rain` |
| `movies/mask_ghost.webm` | show | `show ghost` (투명 영상) |
| `audio/hum.wav` | 음악 | `play music "audio/hum.wav"` |
| `audio/knock.wav` | 효과음 | `play sound "audio/knock.wav"` |

- 이름이 `bg `로 시작하는 그림은 배경입니다.
- 이름의 첫 낱말이 캐릭터 id와 같으면 그 캐릭터의 표정입니다. PyKaki에서 캐릭터 `mina`를 등록해 두세요.
- 파일 이름은 영어, 숫자, `_`로 지으세요. 그래야 어디서나 탈이 없습니다.

PyKaki에서 넣어도 됩니다. 연출 줄(배경, 보이기, 음악, 효과음)을 고르면, 폴더를 연결했을 때 칸에 파일 이름이 추천 목록으로 나옵니다.

### 위치 저장 범위

이미지/영상 탭의 **위치 저장** 버튼으로 고릅니다.

| 버튼 | 뜻 | `ui_kit/stage_layout.rpy`에 적히는 것 |
|---|---|---|
| 이 상자에서만 | 지금 PyKaki 상자에서만 이 자리 | `("n4", "ghost"): "stage.pos(420, 720)"` |
| 어디서나 | 이 그림은 어느 상자에서나 이 자리 | `"ghost": "stage.pos(900, 720)"` |

위치는 PyKaki로 넘어가지 않고 이 파일에만 저장되므로, PyKaki에서 다시 내보내도 지워지지 않습니다. 같은 상자에서 같은 그림을 두 자리에 띄우려면 PyKaki의 "직접 명령" 줄에 적습니다.

```renpy
show ghost at stage.pos(420, 720)
```

### 렌파이 편집기에서 저장되지 않는 것

PyKaki가 만든 원고는 다시 내보내면 덮어써지므로, 대사 탭에서는 위치와 화면 효과만 저장되고, 선택지 탭과 화면 효과의 "줄에 넣기"는 저장되지 않고 이유가 나옵니다. **글과 글자 모양, 속도, 등장 효과는 PyKaki에서 고치세요.** 타이틀 메뉴, 커서처럼 게임 전체에 쓰는 값(`*_layout.rpy`)과 그림 줄의 전환, 그림 바꾸기는 그대로 저장됩니다.

### 되돌리기

PyKaki의 **[버전 목록]**에서 되돌린 뒤 **Ctrl+E**를 누르면 렌파이도 따라갑니다.

- 저장본은 바뀐 것이 있을 때 5분마다, 내보낼 때, 받아 적기 전에 자동으로 남습니다. 자동 저장본은 최근 30개만 둡니다.
- 저장본은 브라우저 안에만 있습니다. 중요한 시점에는 **Ctrl+S**로 `.flow.json` 파일을 저장하세요.
- 그림 위치는 저장본으로 되돌아가지 않습니다.

### 문제가 생겼을 때

| 증상 | 이유와 해결 |
|---|---|
| `The label start is defined twice` | 대본에 이름이 `start`인 label이 있고 다른 `.rpy`에도 `label start:`가 있습니다. 대본의 label 이름을 바꾸거나 그 파일의 `label start:`를 지웁니다 |
| `ValueError: unsupported format character` | 대사의 `%` 때문입니다. PyKaki 설정의 **% 를 글자 그대로**를 켭니다. 새 프로젝트는 켜져 있습니다 |
| 렌파이에서 넣은 그림이 PyKaki에 안 나타남 | PyKaki에서 **[다시 읽기]**를 누르거나 Ctrl+E를 누르세요. 권한을 다시 묻는 경우가 있습니다 |
| 렌파이에서 넣은 그림이 사라짐 | 폴더를 연결하지 않고 내보냈을 수 있습니다. `showpy_inbox.json`에 남아 있으니 폴더를 연결하고 Ctrl+E를 누르면 돌아옵니다 |
| "이 줄의 표시가 없습니다" | PyKaki에서 showpy 연결을 켜고 다시 내보내세요 |
| 캐릭터 id 오류 | `stage`, `ascii`, `t`, `n1` 등은 showpy가 쓰는 이름입니다. 다른 id로 바꾸세요 |

## 에셋 바꾸기

파일을 `game` 폴더 아래 아무 곳에 넣고, 아래 값에 그 경로를 적습니다. 배포용 기본 설정은 표의 "기본 경로"를 쓰므로, 같은 이름으로 덮어쓰면 설정을 안 고쳐도 됩니다.

| 에셋 | 기본 경로 | 형식·조건 | 고칠 값 |
| --- | --- | --- | --- |
| 글꼴 | `game/fonts/` 아무 이름 | .ttf / .otf / .ttc, 한글이 들어 있는 글꼴. 파일 이름 대소문자를 코드와 똑같이 (맥·안드로이드·웹은 구분함) | 타이틀: `tmenu.default["font"]` · 선택지: `cmenu.default["font"]` · 대사: `Character(what_font=…)` · 게임 전체: `gui.rpy`의 `gui.text_font` 등 |
| 커서 프레임 | `gui/cursor/cursor1.png` ~ `cursor6.png` | PNG, 편집기 칸은 12장 (순서대로 재생). 예: 64×64 | `custom_ui.cursor_frames`, `cursor_hold`(1/2프레임마다, 24fps), `cursor_hotspot`(클릭 기준점) |
| 클릭 대기 표시 프레임 | `gui/ctc/ctc1.png` ~ `ctc6.png` | PNG, 편집기 칸은 12장 | `custom_ui.ctc_frames`, `ctc_hold`(1/2프레임마다, 24fps) |
| 대사 소리 | 없음 (`None`) | .ogg 권장. 짧은 소리면 글자가 나오는 동안 반복됨 | `custom_ui.typing_sound` · 캐릭터마다: `Character(cb_typing_sound=…)` |
| 선택지 hover 영상 | 없음 (`None`) | WebM(VP9), 투명하게 하려면 side_mask 형식 (파일 가로 = 표시 가로 × 2) | `cmenu.default["hover_movie"]`, `hover_movie_size`, `hover_movie_zoom` · 선택지 하나만: 괄호 `hover_movie=…` |
| 타이틀 메뉴 hover 영상 | 없음 | WebM(VP9), side_mask. 글자 뒤에 깔림 | 항목의 `"hover_movie"`, `"hover_movie_pos"`, `"hover_movie_size"` |
| 타이틀 메뉴 글자 대신 영상 | 없음 | WebM(VP9), side_mask | 항목의 `"hover_label_movie"` |
| 타이틀 배경 영상 | 없음 | WebM(VP9). 투명이 아니면 그대로, 같이 도는 다른 영상과 프레임레이트 맞추기 | `tmenu.background_movie`, `tmenu.background_side_mask` |
| 타이틀 배경 그림 | `gui/main_menu.png` | 게임 해상도 크기 PNG | 파일 덮어쓰기 (또는 `gui.rpy`의 `gui.main_menu_background`) |
| 메뉴 뒤 반투명 판 | `gui/overlay/main_menu.png` | PNG. 완전 투명으로 바꾸면 판이 사라짐 | 파일 덮어쓰기, 또는 `tmenu.main_menu_frame = False` |
| 선택지 버튼 배경 | `gui/button/choice_idle_background.png`, `choice_hover_background.png` | PNG (9분할 테두리 `gui.choice_button_borders`) | 파일 덮어쓰기, 또는 `cmenu.default["button_background"]`, `["button_hover_background"]` |
| 효과음 (메뉴 이동·결정) | 없음 | .ogg | `tmenu.hover_sound`, `activate_sound` · `cmenu.hover_sound`, `activate_sound` |
| 이름 배경 | `gui/namebox.png` | PNG (9분할 테두리 `gui.namebox_borders`). 대사 괄호의 `name_x`, `name_y`로 옮기면 같이 따라감 | 파일 덮어쓰기 |
| 스플래시 바탕 영상·그림 | 없음 (권장: `movies/`, `gui/splash/`) | WebM(VP9) 또는 PNG, 게임 해상도 크기. 영상은 화면 크기에 맞춰 재생 | 페이지의 `"background"`. 영상이 끝나면 넘기기: `"duration": "movie"` |
| 스플래시 로고 영상·그림 | 없음 | 투명 영상은 side_mask 형식 (투명하지 않으면 `"image_side_mask": False`) | 페이지의 `"image"`, `"image_pos"`, `"image_zoom"` |
| 스플래시 효과음·음악 | 없음 | .ogg. 음악을 타이틀까지 이으려면 `config.main_menu_music`과 같은 파일 | 페이지의 `"sound"`, `"music"` |
| TV 꺼짐·켜짐 소리 | 없음 (`None`) | .ogg. 꺼지기 시작할 때, 켜지기 시작할 때 한 번씩. 효과음 음량을 따름 | `screen_fx.tv`의 `"off_sound"`, `"on_sound"`, `"volume"` |

투명 영상(side_mask) 만드는 법: 애프터 이펙트 등에서 투명 배경 ProRes 4444 `.mov`로 뽑은 뒤 ffmpeg로 바꿉니다. 명령은 `ui_kit/README.md`의 "영상 준비"에 있습니다.

## 타이틀 전 화면 — `splash/splash_config.rpy`

게임을 켰을 때 타이틀보다 먼저 나오는 페이지를 `splash.pages`에 순서대로 적습니다. 페이지에 적지 않은 값은 `splash.default`를 따르고, 글자 모양은 앞말(`title_`, `body_`, `key_`, `desc_`, `prompt_`, `option_`) + 렌파이 글자 스타일 속성으로 적습니다.

**코드를 처음 본다면** 아래 표부터 보세요. 설정 파일의 모든 줄이 이 모양들로 되어 있습니다.

| 쓰는 모양 | 뜻 |
| --- | --- |
| `# …` | 그 뒤는 설명(주석)이라 게임이 읽지 않음. 설정 파일에서 `##`은 설명, `# "…": …`처럼 `#` 뒤에 코드가 있으면 꺼 둔 코드. 켜려면 맨 앞의 `# `만 지우기 (VS Code: 줄 선택 → Ctrl+/) |
| `define splash.이름 = 값` | 설정 하나를 정함. `splash.`은 이 플러그인의 설정이라는 뜻 |
| `"글자"` | 따옴표 안은 글자(문자열). 파일 경로, 색 코드, 이름 등 |
| `_("글자")` | 화면에 보이는 문장. 나중에 번역할 수 있게 표시하는 것이고, 감싸지 않아도 똑같이 보임 |
| `2.0`, `1.5` | 숫자. 시간은 초, 위치·크기는 픽셀 |
| `True` / `False` | 켬 / 끔 (첫 글자 대문자) |
| `None` | "없음" 또는 "정하지 않음" |
| `"#d23c3c"` | 색 코드 (`#` 뒤에 빨강·초록·파랑 두 자리씩). `"#ffffffaa"`처럼 두 자리를 더 붙이면 투명도 |
| `(640, 200)` | 숫자 두 개 = (가로, 세로) 또는 (x, y) |
| `{ "이름": 값, … }` | 이름과 값을 짝지은 묶음. 페이지 하나가 이 모양 |
| `[ 값, 값, … ]` | 순서가 있는 목록. 페이지들, 조작 방법 표의 줄들 |
| `,` (쉼표) | 값과 값 사이에 꼭. 마지막 값 뒤에 있어도 괜찮음. 빼먹으면 게임이 켜지지 않고 오류 화면이 나옴 |
| `\n` | 글자 안의 줄바꿈 |

파일 경로는 `game` 폴더 기준입니다. `"movies/logo.webm"` = `프로젝트/game/movies/logo.webm`. 대소문자를 파일 이름과 똑같이 적으세요.

### 기본 페이지 3개 (값마다 고를 수 있는 경우와 설명)

`splash_config.rpy`에 들어 있는 그대로입니다. 앞에 `#`이 없는 줄은 지금 켜져 있는 값, `#`이 있는 줄은 그림·영상·소리 파일이 있어야 해서 꺼 둔 값이라 파일을 넣은 뒤 `#`만 지우면 켜집니다. 모든 페이지에 공통으로 쓰는 `splash.default`의 값들도 설정 파일 2장에 같은 방식으로 설명되어 있습니다.

```py
define splash.pages = [

    ## ── 기본 1. 로고 ──────────────────────────────────────────────────────
    ## 지금은 글자만 나오는 로고입니다. 그림이나 영상으로 바꾸려면 아래 # 줄을 켜세요.
    {
        "id": "logo",

        ## 바탕 ─ 넷 중 하나를 적습니다. 안 적으면 "color" 색만 보입니다.
        ##   "background": "#202020",               색으로 채움
        ##   "background": "gui/splash/bg.png",     그림 (게임 해상도 크기로 만들기)
        ##   "background": "black",                 렌파이 이미지 이름 (image 문으로 만든 것)
        ##   "background": "movies/bg.webm",        영상. 화면 크기에 맞춰 늘어나고 기본으로 반복 재생
        # "background": "movies/logo.webm",

        ## 바탕 영상을 반복할지 (바탕이 영상일 때만 씀)
        ##   "background_loop": True,               끝나면 처음부터 다시 (기본)
        ##   "background_loop": False,              한 번만 재생하고 끝나면 사라짐 (그 뒤에는 color 색이 보임)
        ##   "duration"이 "movie"면 따로 안 적어도 한 번만 재생됩니다.
        # "background_loop": False,

        ## 바탕 영상이 투명 영상(side_mask 형식)인지 (보통은 안 적음)
        ##   "background_side_mask": False,         그냥 영상 (기본)
        ##   "background_side_mask": True,          왼쪽 절반 색 + 오른쪽 절반 투명도로 만든 영상
        # "background_side_mask": False,

        ## 가운데 그림·영상 (로고) ─ 제목 위에 놓입니다.
        ##   "image": "gui/splash/logo.png",        투명 배경 PNG 그림
        ##   "image": "movies/logo_alpha.webm",     투명 영상 (side_mask 형식. 만드는 법은 ui_kit/README.md "영상 준비")
        # "image": "gui/splash/logo.png",

        ## 그림을 제목과 따로 원하는 자리에 놓기 (안 적으면 제목 바로 위)
        ##   "image_pos": (640, 200),               화면 가로 640, 세로 200 자리에 그림의 가운데가 오게
        # "image_pos": (640, 200),

        ## 그림 크기 배율
        ##   "image_zoom": 1.0,                     원래 크기 (기본)
        ##   "image_zoom": 0.5,                     절반
        ##   "image_zoom": 2.0,                     두 배
        # "image_zoom": 1.0,

        ## 로고 자리 영상의 표시 크기 (영상일 때만, 안 적으면 영상 크기 그대로)
        ##   "image_size": (400, 200),              가로 400, 세로 200 픽셀로
        # "image_size": (400, 200),

        ## 로고 자리 영상이 투명 영상(side_mask 형식)인지
        ##   "image_side_mask": True,               투명 영상 (기본)
        ##   "image_side_mask": False,              그냥 영상 (사각형 그대로 보임)
        # "image_side_mask": True,

        ## 로고 자리 영상을 반복할지
        ##   "image_loop": True,                    반복 (기본)
        ##   "image_loop": False,                   한 번만
        # "image_loop": True,

        ## 제목 ─ 화면에 보이는 글자는 _( ) 로 감쌉니다.
        "title": _("만든 사람 이름"),
        "title_size": 56,                          # 이 페이지만 제목을 크게 (나머지는 splash.default의 44)

        ## 넘어가는 때 ─ 2초 보여 주고 저절로. 영상 로고면 "movie"로 바꾸면 영상이 끝날 때 넘어감
        "duration": 2.0,
        "fade_in": 0.6,
        "fade_out": 0.6,

        ## 효과음 ─ 페이지가 나타날 때 한 번 재생 (.ogg 권장)
        ##   "sound": "audio/logo.ogg",
        # "sound": "audio/logo.ogg",

        ## 음악 ─ 음악 채널에서 반복 재생.
        ##   다음 페이지에도 같은 파일을 적으면 끊기지 않고 이어짐.
        ##   options.rpy의 config.main_menu_music과 같은 파일이면 타이틀까지 이어짐.
        ##   다르면 마지막 페이지 뒤에 서서히 꺼짐 (4장 splash.music_fadeout)
        # "music": "audio/title.ogg",
    },

    ## ── 기본 2. 경고 ──────────────────────────────────────────────────────
    {
        "id": "warning",

        ## 경고 글 뒤에 반복되는 영상을 깔고 싶으면
        # "background": "movies/noise_loop.webm",
        # "background_loop": True,

        "title": _("경고"),
        "title_color": "#d23c3c",                  # 이 페이지만 제목을 빨갛게

        ## 본문 ─ \n 은 줄바꿈입니다. 줄이 길면 "width" 폭에서 저절로도 줄바꿈됩니다.
        "body": _("이 게임에는 공포 연출과 갑작스러운 소리, 깜빡이는 화면이 포함되어 있습니다.\n빛에 민감하신 분은 플레이에 주의해 주세요."),

        ## 본문 줄 정렬을 바꾸고 싶으면
        ##   "body_text_align": 0.5,                가운데 (기본)
        ##   "body_text_align": 0.0,                왼쪽 정렬
        # "body_text_align": 0.0,

        ## 넘길 수 있게 되면 아래에 깜빡이는 안내. 안 적으면 안내 없음
        "prompt": _("클릭하면 계속합니다"),

        "duration": None,                          # 클릭할 때까지 기다림
        "min_time": 1.5,                           # 다 나타난 뒤 1.5초는 클릭해도 안 넘어감 (꼭 읽게)
        "skippable": True,

        ## "다음부터 보지 않기" 체크 버튼 ─ 오른쪽 아래에 나옵니다.
        ##   플레이어가 체크하고 넘기면 다음 실행부터 이 페이지를 건너뜁니다.
        ##   필요 없으면 이 줄을 지우세요.
        "dont_show_again": _("다음부터 보지 않기"),

        ## 처음 한 번만 보여 줄지
        ##   "once": False,                         게임을 켤 때마다 (기본)
        ##   "once": True,                          처음 실행할 때 한 번만
        "once": False,

        ## 보일 조건 ─ 따옴표 안의 조건이 참일 때만 나옵니다.
        ##   "show_if": None,                       항상 (기본)
        ##   "show_if": "not persistent.cleared",   persistent.cleared가 True가 된 뒤로는 안 나옴
        ##                                          (스크립트 엔딩에서 $ persistent.cleared = True 를 해 둔 경우)
        "show_if": None,
    },

    ## ── 기본 3. 조작 방법 ─────────────────────────────────────────────────
    {
        "id": "controls",

        "title": _("조작 방법"),

        ## 조작 방법 표 ─ (키, 설명) 한 쌍이 한 줄입니다.
        ##   줄을 늘리려면 ( _("키"), _("설명") ), 한 줄을 복사해 붙이고 글자만 바꾸세요.
        ##   키가 영어 한 글자뿐이면 _( ) 없이 "H"처럼 적어도 됩니다.
        ## 이렇게 적는 대신 "keys": "auto", 로 적으면
        ##   게임 메뉴의 조작방법 화면과 같은 목록이 나옵니다.
        ##   (hotkeys 플러그인이 있으면 hotkeys_config.rpy의 hotkeys.keyboard_help, 없으면 렌파이 기본 설명)
        "keys": [
            (_("클릭 / 엔터 / 스페이스"), _("대사 넘기기, 선택하기")),
            (_("마우스 휠 위 / Page Up"), _("이전 대사 다시 보기")),
            (_("오른쪽 클릭 / Esc"), _("메뉴 열기 (저장, 불러오기, 환경설정)")),
            (_("Ctrl (누르고 있기)"), _("대사 빨리 넘기기")),
            ("H", _("대사창 숨기기")),
        ],

        ## 표 모양 (설명은 2장 splash.default)
        "key_width": 300,
        "key_color": "#ffffff",
        "desc_color": "#bbbbbb",

        "prompt": _("클릭하면 타이틀로 넘어갑니다"),

        ## 처음 실행할 때 한 번만. 타이틀에서 다시 보게 하려면 5장의 splash.ShowPage
        "once": True,

        ## 줄이 많아서 아래 안내와 겹치면 yalign을 줄이세요 (0.45 → 0.35)
        "xalign": 0.5,
        "yalign": 0.45,
        "width": 960,
    },
]
```

### 상황별 예시

그대로 복사해서 `splash.pages` 목록 안, 원하는 순서 자리에 붙이면 됩니다. 설정 파일 3장 끝에도 같은 예시가 `#`으로 꺼진 채 들어 있어서 거기서 `#`만 지워도 됩니다. 모든 예시는 실제로 실행해서 확인했습니다.

**A. 로고 영상이 끝나면 저절로 넘어가기**

- 필요한 파일: `game/movies/logo.webm` (게임 해상도, WebM VP9)

```py
{
    "id": "ex_movie_logo",
    "background": "movies/logo.webm",       # 화면 가득 재생
    "duration": "movie",                    # 영상이 끝나면 다음 페이지로 (반복은 저절로 꺼짐)
    "fade_in": 0.3,
    "fade_out": 0.5,
},
```

**B. 그림 로고 + 바탕색, 2초 뒤 저절로**

- 필요한 파일: `game/gui/splash/logo.png` (투명 배경 PNG)

```py
{
    "id": "ex_png_logo",
    "color": "#101018",                     # 아주 어두운 남색 바탕
    "image": "gui/splash/logo.png",
    "image_zoom": 1.0,
    "duration": 2.0,
    "sound": "audio/logo.ogg",              # 나타날 때 효과음 (파일이 없으면 이 줄만 지우기)
},
```

**C. 투명 로고 영상을 바탕색 위에, 영상이 끝나면 넘어가기**

- 필요한 파일: `game/movies/logo_alpha.webm` (side_mask 형식: 왼쪽 절반 색, 오른쪽 절반 투명도)

```py
{
    "id": "ex_alpha_logo",
    "color": "#203040",
    "image": "movies/logo_alpha.webm",
    "image_side_mask": True,                # 투명 영상이라 True (기본값이라 생략해도 됨)
    "image_size": (400, 200),               # 표시 크기
    "title": _("스튜디오 이름"),             # 로고 아래에 글자도 함께
    "duration": "movie",                    # 로고 영상이 끝나면 넘어감
},
```

**D. 반복되는 영상 위에 경고 글, 꼭 3초는 읽게**

- 필요한 파일: `game/movies/noise_loop.webm` (짧게 반복되는 영상)

```py
{
    "id": "ex_warning_movie",
    "background": "movies/noise_loop.webm",
    "background_loop": True,                # 클릭할 때까지 계속 반복
    "title": _("주의"),
    "title_color": "#ff5050",
    "body": _("이 이야기는 허구이며\n실제 인물이나 단체와 관계가 없습니다."),
    "prompt": _("클릭하면 계속합니다"),
    "duration": None,
    "min_time": 3.0,                        # 다 나타난 뒤 3초는 클릭해도 안 넘어감
},
```

**E. 처음 한 번만 나오는 조작 방법 (조작방법 화면과 같은 목록)**

- 필요한 파일: 없음

```py
{
    "id": "ex_controls_auto",
    "title": _("조작 방법"),
    "keys": "auto",                         # hotkeys 설정(없으면 렌파이 기본)과 같은 목록
    "key_size": 20,                         # 줄이 많아서 조금 작게
    "desc_size": 20,
    "keys_spacing": 8,
    "yalign": 0.35,                         # 아래 안내와 겹치지 않게 조금 위로
    "prompt": _("클릭하면 타이틀로 넘어갑니다"),
    "once": True,
},
```

**F. 엔딩을 본 뒤에는 안 나오는 페이지**

- 필요한 파일: 없음
- 스크립트의 엔딩 부분에 이 한 줄을 넣어 두세요: `$ persistent.cleared = True`

```py
{
    "id": "ex_before_ending",
    "body": _("이 게임은 헤드폰을 권장합니다."),
    "show_if": "not persistent.cleared",    # 엔딩을 보기 전까지만 나옴
    "duration": 2.5,
},
```

**G. 클릭으로 넘길 수 없는 페이지 (정해진 시간만큼 보여 줌)**

- 필요한 파일: 없음

```py
{
    "id": "ex_no_skip",
    "body": _("……"),
    "body_size": 40,
    "skippable": False,                     # 클릭해도 안 넘어감
    "duration": 3.0,                        # 그래서 시간을 꼭 정함 (안 정하면 Lint가 알려줌)
    "fade_in": 1.5,
    "fade_out": 1.5,
},
```

**H. 음악을 스플래시부터 타이틀까지 끊김 없이**

- 필요한 파일: `game/audio/title.ogg`
- options.rpy에서 타이틀 음악도 같은 파일로: `define config.main_menu_music = "audio/title.ogg"`
- 이 덩어리를 맨 앞 페이지로 옮기고, 뒤 페이지들에도 같은 `"music"` 줄을 넣으면 계속 이어집니다.

```py
{
    "id": "ex_music",
    "title": _("만든 사람 이름"),
    "music": "audio/title.ogg",             # 여기서 시작해서 타이틀까지 이어짐
    "duration": 2.0,
},
```

**I. 글자 모양 꾸미기 (글꼴, 외곽선, 자간, 굵게)**

- 필요한 파일: `game/fonts/MyFont.ttf` (한글이 들어 있는 글꼴. 이름은 가진 파일에 맞게 바꾸기)

```py
{
    "id": "ex_text_style",
    "color": "#e8e0d0",                     # 밝은 종이색 바탕
    "title": _("제 1 장"),
    "title_font": "fonts/MyFont.ttf",
    "title_size": 64,
    "title_color": "#222222",
    "title_kerning": 8,                     # 글자 사이를 넓게
    "title_outlines": [ (2, "#ffffff", 0, 0), (2, "#00000055", 4, 4) ],   # 흰 테두리 + 옅은 그림자
    "body": _("그날 밤, 학교에는 아무도 없었다."),
    "body_color": "#444444",
    "body_bold": True,
    "duration": 3.0,
},
```

**J. 글자를 왼쪽 위에, 본문 왼쪽 정렬**

- 필요한 파일: 없음

```py
{
    "id": "ex_left_top",
    "xalign": 0.08,                         # 덩어리를 왼쪽으로
    "yalign": 0.15,                         # 위쪽으로
    "width": 700,
    "title": _("기록 #001"),
    "title_xalign": 0.0,                    # 제목도 덩어리 안에서 왼쪽
    "body": _("2026년 10월 23일\n오후 11시 47분\n녹화 시작"),
    "body_xalign": 0.0,
    "body_text_align": 0.0,                 # 줄도 왼쪽 정렬
    "prompt": _("클릭하면 재생합니다"),
    "prompt_xalign": 0.08,                  # 안내도 왼쪽 아래로
},
```

### 값 한눈에 보기

| 하고 싶은 일 | 페이지에 적는 값 |
| --- | --- |
| 바탕 | `"background"`: 색 `"#202020"`, 그림 `"gui/splash/bg.png"`, 영상 `"movies/bg.webm"` (반복 재생). 그 아래 색은 `"color"` |
| 가운데 로고 | `"image"` (그림이나 side_mask 영상), 따로 놓으려면 `"image_pos": (640, 200)`, 크기 `"image_zoom"` |
| 글자 | `"title"`, `"body"`(`\n`으로 줄바꿈), 조작 방법 표 `"keys": [ (키, 설명), … ]` 또는 `"auto"`(조작방법 화면과 같은 목록) |
| 넘어가는 때 | `"duration"`: 초 / `None`(클릭할 때까지) / `"movie"`(영상이 끝날 때까지) |
| 실수로 넘기지 않게 | `"min_time"`(다 나타난 뒤 이 시간은 클릭 무시), 못 넘기게 `"skippable": False`와 `"duration"`을 함께 |
| 나타나고 사라지는 시간 | `"fade_in"`, `"fade_out"` (페이지 사이는 검은 화면) |
| 처음 한 번만 | `"once": True` |
| 플레이어가 끌 수 있게 | `"dont_show_again": _("다음부터 보지 않기")` (오른쪽 아래 체크 버튼) |
| 조건부로 | `"show_if": "not persistent.cleared"` |
| 소리 | `"sound"`(한 번), `"music"`(반복. 타이틀 음악과 같은 파일이면 이어짐) |
| 글자 묶음 위치 | `"xalign"`, `"yalign"`, 최대 폭 `"width"`, 간격 `"spacing"` |
| 글자 모양 | `"title_font"`, `"title_size"`, `"body_color"`, `"body_text_align"`, `"prompt_yalign"` … |

| 전체 설정 | 뜻 |
| --- | --- |
| `splash.enabled` | 끄면 바로 타이틀 |
| `splash.movie_wait` | 영상이 이 시간(초) 안에 시작되지 않으면 다음 페이지로 (기본 5.0) |
| `splash.developer_skip` | `True`면 개발 모드에서는 건너뜀 (배포판에서는 항상 나옴) |
| `splash.start_delay`, `splash.gap` | 첫 페이지 전, 페이지 사이 검은 화면(초) |
| `splash.end_transition` | 마지막 페이지 뒤 타이틀이 나타나는 전환 (기본 `Dissolve(0.6)`) |
| `splash.min_time_once` | `min_time`은 처음 볼 때만 |
| `splash.music_fadeout` | 스플래시 음악이 타이틀 음악과 다를 때 서서히 끄는 시간 |

- 타이틀 메뉴에서 다시 보기: 항목의 `"action": splash.ShowPage("controls")`. 본 기록·보지 않기를 지우는 버튼은 `splash.Reset()`.
- 스크립트에 이미 `label splashscreen:`이 있으면 그 안에 `call splash_play`를 넣습니다.
- 스플래시는 게임을 처음 켤 때만 나오고 **Shift+R로는 다시 나오지 않습니다.** 껐다 켜거나 콘솔(Shift+O)에서 `splash.preview()`.
- 설정 오류(없는 파일, 파일 이름 대소문자, 틀린 이름)는 Lint에서 `splash:`로 시작하는 줄로 알려줍니다.

## 타이틀 메뉴 — `ui_kit/title_menu_config.rpy`

메뉴 항목은 `tmenu.items` 목록에 하나씩 적고, 적지 않은 값은 `tmenu.default`를 따릅니다. 이름 앞에 `hover_`를 붙이면 "선택됐을 때" 값입니다.

```py
define tmenu.default = {
    "font": "fonts/NeoDGMpro.ttf",
    "size": 35,
    "color": "#fff6f6",
    "hover_color": "#ffffff",
}

define tmenu.items = [
    {
        "id": "start",                 # 편집기 저장에 쓰는 이름 (바꾸지 않기)
        "text": _("시작한다"),
        "action": Start(),
        "x": 639, "y": 375,           # 정수 = 픽셀, 소수 = 화면 비율
        "rotate": -5,
        "hover_text": "START",         # 선택됐을 때 글자 교체
        "hover_movie": "movies/menu_start.webm",
    },
]
```

| 하고 싶은 일 | 값 |
| --- | --- |
| 항목 추가·삭제·순서 바꾸기 | `tmenu.items`에 `{ … },` 덩어리를 넣거나 빼거나 옮김. 목록 순서 = 키보드 이동 순서 |
| 누르면 할 일 | `"action"`: `Start()`, `ShowMenu("load")`, `ShowMenu("preferences")`, `ShowMenu("about")`, `Quit(confirm=False)`, `Jump("레이블")` |
| 조건부로 보이기 | `"show_if": "persistent.cleared"` |
| 위치·기준점 | `"x"`, `"y"` (또는 `"xalign"`, `"yalign"`), `"anchor"` (기본은 글자 한가운데) |
| 모양 | `"rotate"`(도), `"skew"`(도), `"zoom"`, `"alpha"` · 선택됐을 때: `"hover_rotate"`, `"hover_zoom"`, `"hover_offset": (20, 0)` |
| 글자 스타일 | 렌파이 텍스트 스타일 속성 모두: `"font"`, `"size"`, `"color"`, `"outlines"`, `"kerning"`, `"bold"` … (`hover_` 붙이면 선택됐을 때) |
| 외곽선 | `"outlines": [ (4, "#000000", 0, 0), (2, "#e0245e", 6, 6) ]` (두께, 색, x, y) |
| 선택하면 다른 항목이 밀리는 정도 | `tmenu.push_before`, `tmenu.push_after`(방향·픽셀), `tmenu.push_falloff`, 항목별 `"push": False` / `"push_scale"` |
| 움직임 속도 | `tmenu.move_time`(초), `tmenu.move_warper`(`"ease"`, `"easeout_back"` …), `tmenu.fade_time` |
| 처음 나타나는 연출 | `tmenu.intro`(켜기), `intro_delay`, `intro_time`, `intro_offset` |
| 처음 선택돼 있는 항목 | `tmenu.start_index` (`None`이면 아무것도 선택 안 됨) |
| 클릭 영역 넓히기 | `tmenu.hit_padding` 또는 항목의 `"hit_padding"` |
| 게임 제목 위치·색 | `style main_menu_vbox:` `xalign` / `yalign`, `style main_menu_title:` `color` |
| 버전 번호 숨기기 | `tmenu.show_version = False` |
| 메뉴 뒤 반투명 판 없애기 | `tmenu.main_menu_frame = False` |
| 타이틀에서 연 환경설정 화면의 왼쪽 목록 숨기기 | `tmenu.title_game_menu_navigation = False` |
| 게임 메뉴 왼쪽 목록 바꾸기 | `tmenu.game_menu = [ (_("대사록"), ShowMenu("history"), "not main_menu"), … ]` |
| 게임 메뉴 버튼 글자 | `style navigation_button_text:` `size`, `color`, `hover_color`, `hover_strikethrough` |

오타가 있으면 타이틀 화면이 나올 때 어느 항목의 어떤 이름이 틀렸는지 오류 화면으로 알려줍니다.

### 게임 중 ESC 메뉴 (3.1)

게임 중에 ESC나 오른쪽 클릭을 누르면 게임 화면이 어둡게 깔리고, 타이틀 메뉴와 같은 모양의 메뉴가 뜹니다. 글꼴, 크기, 색, 선택됐을 때 모양(`tmenu.default`), 등장 연출, 소리는 타이틀 메뉴 설정을 같이 쓰고, 항목과 자리만 따로입니다.

| 하고 싶은 일 | 값 (`title_menu_config.rpy`) |
| --- | --- |
| 끄기 (렌파이 기본: ESC → 저장 화면) | `define tmenu.pause = False` |
| 뒤 화면 어둡게 하는 정도 | `define tmenu.pause_dim = "#000000b3"` (마지막 두 자리 = 진하기: `66` 옅게, `ff` 새까맣게, `None` 안 어둡게) |
| 어둡게 하는 대신 그림 | `define tmenu.pause_background = "gui/game_menu.png"` |
| 항목 바꾸기 | `define tmenu.pause_items = [ { "id": "return", "text": _("계속하기"), "action": Return(), "xalign": 0.08, "yalign": 0.35 }, … ]` |
| 항목 자리 | ESC 메뉴를 연 채로 Shift+M → "타이틀 메뉴" 탭에서 끌고 Ctrl+S (`tmenu.pause_layout`으로 저장) |

기본 항목은 돌아가기(`Return()`), 저장하기(`ShowMenu("save")`), 불러오기(`ShowMenu("load")`), 환경설정(`ShowMenu("preferences")`), 대사록(`ShowMenu("history")`), 메인 메뉴(`MainMenu()`), 종료하기(`Quit()`)입니다. 저장 화면 안의 "돌아가기"는 렌파이 기본처럼 게임으로 돌아갑니다.

## 선택지 — 스크립트 괄호 + `ui_kit/choice_menu_config.rpy`

선택지 하나만 바꿀 때는 **스크립트**의 선택지 뒤 괄호에, 모든 선택지를 바꿀 때는 **설정 파일**의 `cmenu.default`에 적습니다. 괄호에 `x`나 `y`를 하나라도 적으면 그 선택지는 세로 목록에서 빠져 그 자리에 놓입니다.

```py
menu:
    "꺼져, 듣고 싶지 않으니까!" (x=300, y=350, font="fonts/ChosunGu.TTF", size=25, color="#aa0000", hover_color="#ff4444", rotate=-4):
        jump angry
    "그냥 세로 목록에 나오는 선택지":
        jump normal

## 메뉴 전체에 공통 값 (선택지 괄호가 우선)
menu (font="fonts/KBLJump_c.ttf", size=28, appear="slide"):
    "첫 번째":
        pass
```

| 하고 싶은 일 | 괄호(선택지 하나) | 설정 파일(모든 선택지) |
| --- | --- | --- |
| 위치 | `x=300, y=350` (또는 `xalign`, `yalign`), `anchor=(0.0, 0.5)` | 세로 목록 위치: `define cmenu.list_pos = (640, 270)` |
| 글꼴·크기·색 | `font=`, `size=`, `color=`, `hover_color=` | `cmenu.default`의 `"font"`, `"size"`, `"color"`, `"hover_color"` |
| 자간·줄 간격·외곽선 | `kerning=2`, `line_spacing=-10`, `outlines=[…]` | 같은 이름을 `cmenu.default`에 |
| 줄바꿈 폭 | `width=400` (`None`이면 줄바꿈 안 함) | `"width"` |
| 회전·기울기·확대 | `rotate=`, `skew=`, `zoom=`, 올렸을 때 `hover_rotate=`, `hover_zoom=`, `hover_offset=(8, 0)` | 같은 이름 |
| 등장 연출 | `appear="pop"` / `"fade"` / `"slide"` / `None`, `delay=0.5` | `cmenu.appear`, `appear_time`, `appear_stagger`, `appear_offset` |
| 올렸을 때 뒤에 영상 | `hover_movie="movies/red.webm"` (`None`이면 끔) | `"hover_movie"`, `"hover_movie_size"`, `"hover_movie_zoom"`, `"hover_movie_offset"` |
| 버튼 배경·여백·폭 | `button_background=…`, `button_padding=(30, 8)`, `button_xsize=500` | `"button_background"`, `"button_hover_background"`, `"button_padding"`, `"button_xsize"` |
| 고를 수 없는 선택지 색 | `insensitive_color="#555"` | `"insensitive_color"` |
| 효과음 | `hover_sound=`, `activate_sound=` | `cmenu.hover_sound`, `cmenu.activate_sound` |
| 올렸을 때 반응 속도 |  | `cmenu.hover_time`, `cmenu.hover_warper` |
| 세로 목록 간격 |  | `style choice_vbox:` `spacing 30` |

위치를 적은 선택지끼리는 서로 피하지 않으니 겹치지 않게 배치하세요.

## 커서·클릭 대기 표시·대사 소리·텍스트 속도·퀵메뉴 — `ui_kit/custom_ui_config.rpy`

배포용 기본 설정은 모두 꺼져 있어서 렌파이 기본과 같습니다. 쓰려는 기능만 `True`로 바꾸고 경로를 적습니다.

| 하고 싶은 일 | 값 | 참고 |
| --- | --- | --- |
| 커서 애니메이션 켜기 | `custom_ui.cursor = True` |  |
| 커서 그림 바꾸기 | `custom_ui.cursor_frames = [ "gui/cursor/cursor1.png", … ]` | 순서대로 재생. 편집기 칸은 12개 |
| 커서 속도 | `custom_ui.cursor_hold = 2` | 초당 24프레임 고정(3.0). `1` 한 장을 1프레임(초당 24장), `2` 2프레임(초당 12장) |
| 커서 방식 | `custom_ui.cursor_mode = "software"` | `"software"` 렌파이가 그림(24fps 정확, 기본) / `"hardware"` 운영체제 커서(반응이 가장 빠름, 최대 20fps) |
| 커서가 화면 효과(ASCII, VHS 등)를 받을지 | `screen_fx.cursor = "effect"` (screen_fx_config.rpy) | `"effect"` 효과까지(기본) / `"overlay"` 덮개 밑 / `"top"` 효과 안 받음. 소프트웨어 커서일 때만. 아래 "커서 자리" |
| 커서 클릭 기준점 | `custom_ui.cursor_hotspot = (0, 0)` | 그림 왼쪽 위에서 x, y 픽셀. 화살표 끝이 가운데면 그 좌표 |
| 클릭 대기 표시 켜기 | `custom_ui.ctc = True` |  |
| 클릭 대기 표시 그림·속도 | `custom_ui.ctc_frames = [ … ]`, `custom_ui.ctc_hold = 2` | 커서와 같이 24fps, `1` / `2` 프레임마다 (3.0) |
| 클릭 대기 표시 자리 | `custom_ui.ctc_position = "nestled"` | `"nestled"` 글자 바로 뒤, `"fixed"` say 스크린에서 정한 자리 |
| 특정 캐릭터만 다른 표시 | `Character("이름", ctc="다른이미지")` | 그 값이 우선 |
| 대사 소리 켜기·바꾸기 | `custom_ui.typing_sound = "audio/type.ogg"` | `None`이면 끔 |
| 대사 소리 음량·반복 | `custom_ui.typing_volume = 1.0`, `custom_ui.typing_loop = True` | 환경설정의 "효과음 음량"도 같이 따름 |
| 캐릭터마다 다른 소리·끄기 | `Character("이름", cb_typing_sound="audio/beep.ogg")`, `cb_typing_sound=None` | 내레이션: `define narrator = Character(None, cb_typing_sound=None)` |
| 텍스트 속도 기본값 | `custom_ui.text_cps = 20` | 1초에 나오는 글자 수, 0 = 한 번에, `None` = options.rpy 값 |
| 퀵메뉴를 처음부터 숨기기 | `custom_ui.quick_menu = False` | 게임 중 `$ quick_menu = True`로 켜기 |

텍스트 속도는 **처음 실행할 때와 이 값을 바꿨을 때만** 적용되고, 그 뒤로는 플레이어가 환경설정에서 고른 값이 유지됩니다.

```py
## custom_ui_config.rpy: 커서와 클릭 대기 표시 (3.0, 초당 24프레임 고정)
define custom_ui.cursor = True
define custom_ui.cursor_frames = [
    "gui/cursor/cursor1.png", "gui/cursor/cursor2.png", "gui/cursor/cursor3.png",
    "gui/cursor/cursor4.png", "gui/cursor/cursor5.png", "gui/cursor/cursor6.png",
]
define custom_ui.cursor_hold = 2            # 2프레임마다 → 6장이면 0.5초에 한 바퀴
define custom_ui.cursor_mode = "software"   # "hardware"로 바꾸면 예전 방식 (최대 20fps)
define custom_ui.cursor_hotspot = (0, 0)

define custom_ui.ctc = True
define custom_ui.ctc_frames = [ "gui/ctc/ctc1.png", "gui/ctc/ctc2.png", "gui/ctc/ctc3.png" ]
define custom_ui.ctc_hold = 1               # 1프레임마다 → 3장이면 1/8초에 한 바퀴
```

| 장수 | 1프레임마다 (`_hold = 1`) | 2프레임마다 (`_hold = 2`) |
| --- | --- | --- |
| 6장 | 0.25초에 한 바퀴 | 0.5초에 한 바퀴 |
| 12장 | 0.5초에 한 바퀴 (1초에 두 바퀴) | 1초에 한 바퀴 |

편집기 "커서/대사 소리" 탭에서는 **칸 12개**를 눌러 그림을 하나씩 고릅니다(고르면 다음 칸으로). "이 폴더 통째로 넣기"는 폴더의 그림을 이름 순으로 12장까지 넣고, "이 칸 비우기"로 뺍니다. 빈 칸은 건너뜁니다.

## 대사 스타일 — 스크립트 괄호 + `ui_kit/say_style_config.rpy`

대사 한 줄만 바꿀 때는 대사 뒤 괄호에 짧은 이름을 적고, 캐릭터의 기본 모양은 설정 파일의 캐릭터 정의에서 바꿉니다.

```py
## 스크립트: 이 한 줄만
t "글쎄, 난 봤다니까요." (x=520, y=300, size=30, color="#aa0000")
e "어디 갔었어?" (name_x=820, name_y=-60, name_size=34, speed=0.5, effect="jitter")

## say_style_config.rpy: 캐릭터 기본값
define t = Character(None,
    window_yalign=0.0, window_ysize=720,     # 대사 창을 화면 전체로
    what_font=gui.text_font,                  # 기본 글꼴
    what_size=22,                             # 기본 크기
    what_xpos=400, what_ypos=157)             # 기본 위치

define n2 = Character(kind=t, what_xpos=400, what_ypos=210)   # 위치 프리셋
```

| 괄호에 쓰는 짧은 이름 | 캐릭터 정의에서 같은 값 | 뜻 |
| --- | --- | --- |
| `x`, `y`, `pos` | `what_xpos`, `what_ypos`, `what_pos` | 위치 (대사 창 왼쪽 위 기준. `t`는 대사 창이 화면 전체라서 화면 기준) |
| `font` | `what_font` | 글꼴 |
| `size` | `what_size` | 글자 크기 |
| `color` | `what_color` | 글자 색 |
| `outline` | `what_outlines` | 외곽선 `[(두께, 색, x, y)]` |
| `spacing` | `what_line_spacing` | 줄 간격 |
| `bold`, `italic` | `what_bold`, `what_italic` | 굵게, 기울임 |
| `kerning` | `what_kerning` | 자간 |
| `width` | `what_xmaximum` | 한 줄 최대 너비 |
| `align` | `what_text_align` | 줄 정렬 0.0 ~ 1.0 |
| `speed` | `what_slow_cps_multiplier` | 나오는 속도 배율 (플레이어 텍스트 속도에 곱함. 0.5 = 절반) |
| `effect` | `what_textshader` | 등장 효과: `"dissolve"` 서서히, `"typewriter"` 타자기, `"slowalpha"` 흐리게 대기, `"flip"` 뒤집히며, `"zoom"` 커지며, `"jitter"` 떨림, `"wave"` 물결. showpy 효과: `"scatter"` 흩어졌다 모이기, `"drop"` 떨어지기, `"spin"` 회전하며, `"shuffle"` 무작위 순서, `"flash"` 색 번쩍, `"slam"` 크게 찍히기, `"typecursor"` 커서 타자기 |
| `name_x`, `name_y` | `namebox_xpos`, `namebox_ypos` | 이름 상자 위치 (대사 창 왼쪽 위 기준, 이름 배경째 움직임) |
| `name_font`, `name_size`, `name_color` | `who_font`, `who_size`, `who_color` | 이름 글꼴, 크기, 색 |

- 새 짧은 이름이 필요하면 설정 파일의 `say_style.alias`에 `"alpha": "what_alpha",`처럼 추가합니다.
- 보통 캐릭터는 대사 창이 화면 아래에 있어서, 이름을 창 위로 올리면 `name_y`가 음수가 됩니다. 편집기 패널에는 화면 기준 위치도 같이 나옵니다.
- 텍스트 속도가 "즉시"(렌파이 새 프로젝트 기본값)면 `speed`와 서서히·타자기 같은 효과가 안 보입니다. 물결·떨림은 보입니다. `custom_ui.text_cps`를 정하거나 환경설정에서 속도를 낮추세요.
- 한 줄 안에서 일부 글자만 바꿀 때는 텍스트 태그: `"그건 {color=#a00}거짓말{/color}이야"`.
- 스크립트에서 이미 `n1`~`n3`이나 `t`를 정의했다면 설정 파일 쪽 정의를 지우세요. 같은 이름이 두 번 정의됩니다.

## 편집기로 고치기 (Shift+M)

런처에서 게임을 실행한 상태(개발 모드)에서 **Shift+M**을 누르면 편집기가 열립니다. 배포판에서는 열리지 않습니다. 편집기가 열려 있는 동안 클릭·키보드는 게임으로 가지 않습니다.

| 탭 | 여는 곳 | 고칠 수 있는 것 | Ctrl+S 하면 |
| --- | --- | --- | --- |
| 타이틀 메뉴 | 타이틀 화면, 게임 중 ESC 메뉴(3.1) | 항목 위치·회전·기울기·확대·글자 크기·글꼴·색, 선택됐을 때 값. ESC 메뉴를 연 채로 열면 ESC 메뉴를 고침 | `ui_kit/title_menu_layout.rpy` (`tmenu.layout`, ESC 메뉴는 `tmenu.pause_layout`) |
| 선택지 | 선택지가 떠 있을 때 | 선택지 하나의 위치·모양·글꼴·색, 올렸을 때 값 | **원고의 그 선택지 줄** |
| 대사 | 대사가 떠 있을 때 | 대사 한 줄의 위치·글자 크기·글꼴·색, 이름 위치·크기·글꼴·색, 나오는 속도·등장 효과, **이 대사부터 켤 화면 효과·선택취소·전환, 덮개, 커서 자리** | **원고의 그 대사 줄** |
| 커서/대사 소리 | 어디서나 | 텍스트 속도, 대사 소리·음량, 클릭 대기 표시·커서(켜기, **칸 12개에 그림 고르기**, 1/2프레임마다, 커서 방식), 퀵메뉴 | `ui_kit/custom_ui_layout.rpy` |
| 타이틀 일렁임 | 타이틀 화면 (`screen_fx`가 있을 때) | 켜기, 적용 대상, 세기·물결 크기·속도·소용돌이·반사광, 품질 | `screen_fx/watermorph_layout.rpy` |
| 화면 효과 | 어디서나 (`screen_fx`가 있을 때) | 위쪽 버튼으로 VHS 덮개 / ASCII / 레트로 터미널 / 게임보이 / 기본 효과, 전환을 고름. 효과마다 켜기, 덮개 켬/끔, 값 막대, 프리셋, **"이 대사부터 이 효과"**, **"이 줄부터 이 효과"**. 기본 효과, 덮개 켬/끔, TV 시간, 섬광, 소리 음량과 미리 보기. (이 페이지들은 설정값을 고치는 곳이라, 저장해도 지금 장면의 효과는 안 바뀜) | `screen_fx/<효과 이름>_layout.rpy`, `screen_fx_layout.rpy` |
| 화면 효과 → 줄에 넣기 (4.1) | 게임 중 | 원고의 줄 하나(대사가 아니어도 됨)를 고르고 화면 효과, 덮개, 덮개 휘어짐, 전환을 고름 | **원고의 그 줄 바로 위**에 `$ screen_fx.use(…)` 같은 줄 |

순서대로 하면 됩니다.

1. 고칠 화면까지 가서 Shift+M. 그 화면에 맞는 탭이 열립니다. (T로 탭 바꾸기)
2. 항목을 마우스로 끌어 옮기고, 휠로 회전(Shift+휠은 글자 크기. 휠은 패널 밖에서 굴려야 함, 패널 위에서는 패널 스크롤). 키보드: 방향키 이동, Q/E 회전, Z/C 기울기, A/D 확대, S/W 글자 크기, Tab 다음 항목.
3. 2번을 누르면 "선택됐을(올렸을) 때" 값, 1번은 평소 값을 고칩니다. H는 선택됐을 때 모양 미리보기.
4. 타이틀 메뉴 탭에서는 3번으로 "이 항목만" ↔ "모든 항목 공통"을 바꿉니다. 대사 탭에서는 Tab으로 "대사" ↔ "이름"을 바꾸고, 속도·효과 버튼을 누르면 그 줄을 다시 보여줍니다(R로도 다시 보기).
5. 글꼴과 색은 패널의 버튼으로 고릅니다. 글꼴 목록은 `game` 폴더의 글꼴 파일을 모두 보여주고, 색은 막대·색 코드·자주 쓰는 색으로 고릅니다.
6. **Ctrl+S로 저장**, Esc로 닫기. 실수했으면 Backspace(지금 고르는 것만 되돌리기).

선택지와 대사는 **Ctrl+S를 누르면 원고(.rpy)의 그 줄 괄호에 바로 저장**되고, 게임이 다시 불러와져 같은 장면으로 돌아옵니다. 원래 적혀 있던 값과 줄 뒤의 `with dissolve` 등은 그대로 두고 바꾼 값만 고칩니다. 고치기 전 원본은 프로젝트 폴더의 `ui_kit_backup/`에 남습니다.

여러 줄에 걸친 대사처럼 자동으로 고칠 수 없는 줄이거나, 편집 중에 다른 편집기에서 원고를 고쳐 줄이 달라졌으면 원고를 건드리지 않고 이유를 알려줍니다. 그때는 **Ctrl+C로 복사해서 그 줄 괄호에 붙여넣으세요.** VS Code 등에 원고를 열어 둔 채 저장하지 않은 변경이 있으면, 편집기로 저장하기 전에 그쪽을 먼저 저장하세요.

저장한 `*_layout.rpy` 값을 설정 파일로 옮기고 싶으면 Ctrl+C로 설정 코드를 복사해 붙여넣고, `*_layout.rpy`를 지우면 됩니다. 커서 설정과 클릭 대기 표시 켜기·끄기는 저장하면 게임이 자동으로 다시 불러와진 뒤 적용됩니다.

## 이미지·영상 배치 — 스크립트 + `ui_kit/stage_config.rpy` (2.8)

**영상 자동 등록**: `game/movies/` 폴더(안쪽 폴더 포함)에 넣은 `.webm`은 파일 이름으로 바로 씁니다. 그림은 렌파이가 원래 `images/`를 자동 등록합니다.

| 파일 | 스크립트에서 | 읽는 방법 |
| --- | --- | --- |
| `movies/rain.webm` | `show rain`, `scene rain` | 보통 영상 |
| `movies/mask_ghost.webm` | `show ghost` | 투명 영상 (side_mask: 왼쪽 절반 색, 오른쪽 절반 투명도). 이름 앞 `mask_`는 빼고 씀 |
| `movies/bg rain.webm` | `scene bg rain` | 보통 영상. bg 태그라 늘 맨 뒤 |

**bg는 늘 맨 뒤**: `bg` 태그의 그림·영상은 `zorder`를 적어도 항상 다른 그림 뒤에 그립니다.

```py
## stage_config.rpy
define stage.enabled = True            # False면 영상 등록, bg 고정, 이미지/영상 탭이 모두 꺼짐
define stage.movies_dir = "movies"     # 영상 폴더 (game 기준)
define stage.mask_prefix = "mask_"     # 이 글자로 시작하는 영상 = 투명 영상
define stage.movie_once = [ ]          # 한 번만 재생할 영상 이름. 예: [ "door_open" ]
define stage.bg_tag = [ "bg" ]         # 배경 태그 목록: 늘 맨 뒤에 그리고, 편집기에서 위치를 옮기지 않음
# define stage.bg_tag = [ "bg", "fx_bg" ]   # fx_bg 도 배경으로 (3.0)

## 스크립트 (편집기가 적는 것과 같고, 직접 써도 됨)
show eileen happy at stage.pos(420, 720)          # 그림의 아래 가운데를 화면 (420, 720)에
show eileen with stage.move("inleft", 0.8)        # 왼쪽에서 들어오기, 0.8초
hide eileen with stage.ease("outright", 1.2)      # 오른쪽으로 부드럽게 나가기, 1.2초
show ghost with Dissolve(1.0)                     # 서서히 1초
```

**편집기 "이미지/영상" 탭** (게임 진행 중 Shift+M → T): 원고의 show·hide·scene 줄 하나를 골라서 고칩니다.

| 고칠 것 | 방법 |
| --- | --- |
| 고를 줄 | 화면의 그림·영상 누르기, Tab, `[` `]`, 줄 목록, 줄 번호 입력 |
| 위치 | 그림 끌기, 방향키, 위치 버튼(기본·왼쪽·가운데·오른쪽·정중앙·화면 밖). **배경(bg)은 고정**(3.0): 원고에 위치가 적혀 있으면 "기본 위치로 되돌리기"만 나옴 |
| 전환 | 없음, 서서히, 검게 페이드, 픽셀, 이동, 부드럽게 이동, 닦아내기, 미끄러지기, 밀어내기, 확대/축소, 흔들기 + 방향 + 시간 |
| 그림 바꾸기, 새 줄 (3.0) | "그림/영상 고르기" → `game/images`, `game/movies`의 파일을 고르고 [이 줄의 그림 바꾸기] 또는 [아래에 show 넣기] / [아래에 scene 넣기] |
| 저장 | Ctrl+S → 그 줄의 at·with 부분(그림을 바꿨으면 이름도)만 원고에 적힘, 새 줄은 그 줄 아래에 (고치기 전 원본은 `ui_kit_backup/`) |

```renpy
## 저장 전                ## [room] → 이 줄의 그림 바꾸기, [hand] → 아래에 show 넣기 → Ctrl+S
    scene fx_bg                scene room
                               show hand
```

- 그림 이름은 파일 이름에서 확장자를 빼고 소문자로 바꾼 것입니다(렌파이 자동 등록). `images/Room.PNG` → `room`, `images/bg/bg hall.png` → `bg hall`. 이름에 `-` 같은 글자가 있으면 원고에 쓸 수 없어서 흐리게 나옵니다.
- 새로 넣은 줄의 위치와 전환은 저장한 뒤 그 줄을 골라서 고칩니다.
- 패널 위에 "script.rpy 9번째 줄"처럼 지금 줄이 나오고, 같은 파일의 show·hide·scene 줄이 번호와 함께 목록으로 나옵니다. "그 줄로 가기"는 렌파이의 줄 이동(warp)이라 그 앞의 변수 값은 비어 있을 수 있습니다.
- `onlayer`, `as`, `zorder`, ATL 블록, 주석은 건드리지 않습니다. 이미지 이름은 "이 줄의 그림 바꾸기"를 눌렀을 때만 바꿉니다.

**패널이 화면을 가릴 때** (모든 탭): 제목(= UI 편집기)을 끌어서 옮기기, **X** 한 줄로 접기, **Space** 누르는 동안 숨기기, **B** 자동 비키기(고른 것이 패널 아래에 있으면 다른 구석으로), **P** 구석 바꾸기, **L** 줄 목록 접기(이미지/영상 탭), **F1** 안내 접기. 패널이 화면보다 길면 패널 위에서 **휠**이나 오른쪽 **스크롤바**로 아래쪽을 봅니다(2.9).

**편집 중 화면 효과** (모든 탭, `screen_fx` 3.4 이상): 편집기를 열어도 화면 효과가 켜진 채로 보이고, 패널은 그 위에 깨끗하게 보입니다. **V**로 켜고 끕니다. 휘는 효과(VHS·CRT 등)는 가장자리에서 보이는 자리와 눌리는 자리가 조금 어긋나니, 정확히 끌어 놓을 때는 V로 잠깐 끄세요. 처음부터 끄려면 `define screen_fx.editor_preview = False`.

자세한 설명은 `ui_kit/README.md` 4-6, 4-7, 13장.

## 단축키 — `hotkeys/hotkeys_config.rpy`

새 단축키는 `hotkeys.bindings`에, 렌파이 기본 단축키에서 뺄 키는 `hotkeys.unbind`에, 조작방법 화면 설명은 `hotkeys.keyboard_help`에 적습니다. 배포용 기본 설정은 셋 다 비어 있어서 렌파이 기본과 같습니다.

```py
define hotkeys.bindings = [
    { "keys": [ "K_v" ], "action": ShowMenu("preferences") },   # V: 환경설정
    { "keys": [ "K_F5" ], "action": QuickSave() },               # F5: 퀵세이브
]

define hotkeys.unbind = {
    "self_voicing": [ "K_v" ],      # V의 '대사 읽어주기'를 빼고 Alt+V로만
}

define hotkeys.keyboard_help = [
    (_("엔터(Enter)"), _("대사 진행 및 UI (선택지 포함) 선택.")),
    ("V", _("볼륨 설정 열기.")),
]
```

| 알아 둘 것 | 내용 |
| --- | --- |
| 키 이름 | `K_v`(V), `shift_K_s`(Shift+S), `ctrl_K_l`(Ctrl+L), `alt_K_v`(Alt+V), `K_F5`, `K_SPACE` |
| 자주 빼는 기본 단축키 이름 | `screenshot`(S), `toggle_fullscreen`(F), `hide_windows`(H), `self_voicing`(V), `accessibility`(Shift+A), `skip`(Ctrl), `toggle_skip`(Tab), `rollback`(Page Up) |
| 겹칠 때 | 새 키가 기본 단축키와 겹치면 둘 다 실행되므로 `unbind`로 기본 쪽에서 뺍니다 |
| 설명 화면 | `keyboard_help`가 `None`이면 렌파이 기본 설명. 단축키를 바꿨다면 설명도 같이 고칩니다 |
| 편집기 키와 겹침 | UI Kit 편집기는 Shift+M을 씁니다. 바꾸려면 `define ui_kit.editor_key = "shift_K_e"` |

## 화면 효과 바꾸기 — `screen_fx/screen_fx_config.rpy`

화면은 **셰이더 두 개를 겹쳐** 그립니다 (4.0).

```
[게임 화면] → 기본 효과 (없음 / ASCII / 레트로 터미널 / 게임보이) → 덮개 (VHS, 켬 / 끔) → 눈에 보이는 화면
```

평소에는 **기본 효과 없음 + VHS 덮개 켬**(= 화면 전체에 VHS)입니다. 스크립트의 원하는 곳에서 다른 효과로 바꾸면 **선택취소(`clear`)할 때까지** 그 효과가 유지되고, 바꿀 때 **TV가 꺼졌다 켜지는 전환**이 들어갑니다. 지금 켜진 효과, 덮개, 덮개 휘어짐은 세이브·되감기에 같이 저장됩니다. 새 게임을 시작하거나 타이틀로 돌아가면 설정대로 돌아갑니다.

| 기본 효과 이름 | 뜻 | 설정 파일 |
| --- | --- | --- |
| `"none"` | 효과 없음 (배포 설정의 기본 효과. 덮개는 설정대로) |  |
| `"ascii"` | 화면을 글자로 다시 그림. 글자 하나 = 픽셀 하나 (기본은 장면에만. 대사는 그대로 읽힘) | `ascii_config.rpy` |
| `"retro_term"` | 레트로 터미널: 형광체 단색 모니터, 자체 곡면 CRT·VHS. **쓰는 동안 덮개는 기본으로 꺼짐** | `retro_term_config.rpy` |
| `"gameboy"` | 게임보이: 큰 점과 4색 LCD 화면, 디더링 / 픽셀화 | `gameboy_config.rpy` |
| `"default"` | 기본 효과로 돌아가기 (= 선택취소) | `screen_fx_config.rpy`의 `screen_fx.base` |
| (덮개) | VHS. 켬 / 끔만 고르고 모양은 `vhs_crt.settings` | `vhs_crt_config.rpy` |

> 4.0에서 흑백(`mono`)은 지웠습니다. 예전 이름 `"vhs_crt"`를 기본 효과로 쓰면 "없음 + 덮개 켬"으로 읽습니다.

### 스크립트에서

```py
label start:
    scene bg room
    e "평소 화면 (효과 없음 + VHS 덮개)."

    ## ASCII로. TV가 꺼졌다 켜진 뒤에 다음 대사가 나옵니다.
    $ screen_fx.use("ascii")
    e "세계가 글자로 무너진다."
    e "다음 줄에서도 계속 ASCII."

    ## 선택취소: 기본 효과와 덮개를 설정대로
    $ screen_fx.clear()
    e "현재로 돌아왔다."

    ## 전환 고르기 (적지 않으면 screen_fx.transition 설정을 따름)
    $ screen_fx.use("gameboy", transition="tv")      # TV 꺼짐·켜짐 (기본)
    $ screen_fx.use("gameboy", transition="fade")    # 앞 효과가 서서히 빠지고 새 효과가 서서히 들어옴
    $ screen_fx.use("gameboy", transition=None)      # 바로

    ## 그 밖의 값
    $ screen_fx.use("ascii", duration=2.0)         # 전환 전체를 2초로 (TV는 꺼짐·검은 화면·켜짐 비율 그대로)
    $ screen_fx.use("ascii", wait=False)           # 전환을 기다리지 않고 바로 다음 줄로
    $ screen_fx.use("none", overlay=False)         # 아무 효과 없는 깨끗한 화면
    $ screen_fx.clear(transition="fade", duration=2.0)   # 2초 동안 서서히 기본으로

    ## 덮개(VHS) 켜고 끄기
    $ screen_fx.use("ascii", overlay=False)        # ASCII만 (덮개 끔)
    $ screen_fx.use("retro_term", overlay=True)    # 레트로 터미널인데 덮개도 켬 (기본은 끔)
    $ screen_fx.set_overlay(False)                 # 효과는 그대로, 덮개만 끔
    $ screen_fx.set_overlay(True)                  # 효과는 그대로, 덮개만 켬

    ## 덮개 왜곡 정도
    $ screen_fx.set_warp(3.0)                      # 가장자리 휘어짐 3 (0 평평, 1 기본, 5 크게)
    $ screen_fx.set_warp(0.0, duration=2.0)        # 2초 동안 서서히 평평하게
    $ screen_fx.set_warp("default")                # 설정 파일 값으로
    $ vhs_crt.set(distort_intensity=0.15, aberration=0.2, duration=1.0)   # 화면 밀림, 색 번짐도 같이

    ## 글자 빼기: 이번만 바꾸기 (적지 않으면 그 효과 설정 파일의 exclude)
    ##   "say" 대사·이름 / "choice" 선택지 / "screens" 메뉴·화면(퀵메뉴, 저장 화면 등)
    $ screen_fx.use("ascii", exclude=())                               # 아무것도 안 뺌: 대사창까지 전부 글자로
    $ screen_fx.use("gameboy", exclude=("say",))                       # 대사·이름만 원래 색 (하나일 때도 쉼표)
    $ screen_fx.use("gameboy", exclude=("say", "choice", "screens"))   # 글자는 전부 원래 색, 배경·캐릭터만

    ## 게임보이 값 바꾸기
    $ gameboy.set(mode="pixel")                  # 픽셀화로 (무늬 없이 딱 끊김)

    ## 지금 켜진 효과로 나눠 쓰기
    if screen_fx.current_effect() == "ascii":      # 지금 기본 효과 (없으면 "none")
        e "아직 글자 화면이야."
    if screen_fx.is_default():                      # use()로 바꾸지 않았거나 clear()로 돌아온 상태
        e "평소 화면이야."
    if screen_fx.overlay_on():                      # 지금 덮개(VHS)가 켜져 있는지
        e "VHS가 덮여 있어."
    if "say" in screen_fx.current_exclude():        # 지금 효과에서 뺀 글자 묶음 (튜플)
        e "대사창은 멀쩡해."
```

### 대사 줄 괄호로 (편집기 대사 탭에서 고르면 이렇게 저장됨)

```py
e "평소 화면."
e "어? 화면이…" (fx="ascii")                              # 이 대사가 나오기 전에 ASCII로, 그 뒤로 유지
e "아직 ASCII야."                                          # 앞에서 이어짐
e "돌아왔다." (fx="default")                               # 선택취소 → 기본
e "서서히 바뀐다." (fx="gameboy", fx_transition="fade")     # 이 줄만 서서히
e "번쩍." (fx="none", fx_overlay=False, fx_transition=None)  # 바로 깨끗한 화면으로
e "크고 빨갛게." (size=40, color="#aa0000", fx="gameboy")  # 대사 스타일 값과 같이 써도 됨
e "덮개 없이." (fx="ascii", fx_overlay=False)              # ASCII만
e "덮개만 다시 켜자." (fx_overlay=True)                     # 효과는 그대로, 덮개만 켬
e "화면이 크게 휜다." (fx_warp=3.0)                         # 덮개 휘어짐 3
e "원래대로 휨." (fx_warp="default")                        # 휘어짐을 설정값으로
e "전부 글자로." (fx="ascii", fx_exclude=())               # 이번만 아무것도 안 뺌
e "대사만 또렷하게." (fx="gameboy", fx_exclude=("say",))    # 이번만 대사·이름 빼기
e "접속 중…" (fx="retro_term")                             # 레트로 터미널 (덮개는 기본으로 꺼짐)
```

- `fx=`를 쓴 대사는 TV가 다시 켜진 뒤에 글자가 나오기 시작합니다.
- TV 전환 중에 클릭하면 바로 새 효과로 바뀝니다. 그 클릭으로 다음 대사가 넘어가지는 않습니다.
- **전환 없이 바로 바뀌는 때**: 되감기·앞으로 감기, 세이브 불러오기, 건너뛰기(Ctrl·Tab), 편집기를 열어 둔 동안, 플레이어가 `screen_fx.Toggle()`로 효과를 끈 동안.
- `screen_fx` 폴더를 지우면 `fx=`, `fx_overlay=`, `fx_warp=`를 적은 대사에서 오류가 나니 그 괄호도 같이 지우세요.
- 편집기 대사 탭에서 고치고 Ctrl+S 하면 원고를 다시 불러옵니다. 렌파이는 고친 줄을 같은 줄로 알아보지 못해서 **그 앞 대사부터** 다시 나옵니다. 한 번 넘기면 고친 줄이 보입니다.
- 편집기 "화면 효과" 탭의 효과 페이지는 효과의 **설정값**을 고치는 곳이라, 거기서 저장해도 지금 장면의 효과는 바뀌지 않습니다. 지금 장면에 쓰려면 그 페이지의 **"이 대사부터 이 효과"**(대사 괄호에, 대사 탭으로 넘겨줌) 또는 **"이 줄부터 이 효과"**(고른 줄 위에 `$ screen_fx.use(…)`, "줄에 넣기" 페이지로 넘겨줌, 4.1) → Ctrl+S.

### 대사가 아닌 줄에서 바꾸기 (편집기 "줄에 넣기", 4.1)

Shift+M → "화면 효과" 탭 → "효과:"에서 **[줄에 넣기]**. 줄을 고르고(`[` `]` 한 줄씩, 줄 번호 입력, [지금 줄로], L 목록) 효과를 고른 뒤 Ctrl+S 하면 그 줄 **바로 위**에 이런 줄이 들어갑니다. 같은 줄에 다시 저장하면 앞에 넣은 줄을 바꿔 쓰고, [이 줄 위의 효과 줄 지우기] → Ctrl+S로 지웁니다.

```renpy
label start:
    $ screen_fx.use("ascii", overlay=False, transition="fade")   # ← 편집기가 넣은 줄
    scene fx_bg
    with dissolve

    $ screen_fx.clear()            # [선택취소 → 효과 없음]
    $ screen_fx.set_overlay(True)  # 효과는 그대로, 덮개만 [켬]
    $ screen_fx.set_warp(3)        # 덮개 휘어짐 [3]
    $ screen_fx.set_warp("default")  # 덮개 휘어짐 [설정값]
```

### 설정 파일 (`screen_fx_config.rpy`)

```py
## 기본 효과: use()로 바꾸지 않았을 때, clear()로 돌아올 때의 효과
##   "none"        없음 (배포 설정. 덮개가 켜져 있으면 VHS만 보임)
##   "ascii"       ASCII (게임 전체가 글자 화면)
##   "retro_term"  레트로 터미널
##   "gameboy"     게임보이
define screen_fx.base = "none"

## 덮개(VHS): 기본 효과 위에 한 번 더 씌움. 켬 / 끔만
##   True   켬 (배포 설정). 단, 효과마다 <이름>.overlay가 False면 그 효과를 쓰는 동안은 끔
##   False  끔. use(…, overlay=True)나 fx_overlay=True로 켤 때만
define screen_fx.overlay = True

## 효과를 바꿀 때 기본 전환
##   "tv"    TV가 꺼졌다 켜지는 것처럼 (아래 screen_fx.tv 값)
##   "fade"  앞 효과가 서서히 빠지고 새 효과가 서서히 들어옴
##   None    바로 바꿈 (전환 연출 없음)
define screen_fx.transition = "tv"

define screen_fx.fade_time = 1.0      # "fade" 전환 전체 시간(초)
define screen_fx.wait = True          # True: 전환이 끝난 뒤 다음 줄로 / False: 전환을 시작하고 바로 다음 줄로
define screen_fx.skippable = True     # True: 클릭하면 전환 건너뛰기 / False: 끝날 때까지 클릭을 안 받음
define screen_fx.editor_preview = True   # 편집기를 연 동안에도 효과 보이기 (편집 중 V로 켜고 끔)

## TV 꺼짐·켜짐
##   꺼짐: 화면이 위아래로 눌려 밝은 가로선 → 가로선이 가운데 점으로
##   검은 화면 (이때 효과가 바뀜)
##   켜짐: 점 → 가로선 → 화면이 펴짐 (지직거림이 서서히 빠짐)
define screen_fx.tv = {
    "off_time": 0.35,       # 꺼지는 시간(초)
    "black_time": 0.25,     # 꺼진 채 검은 화면(초)
    "on_time": 0.45,        # 켜지는 시간(초)
    "line": 3,              # 가로선·점 두께(픽셀)
    "flash": 0.8,           # 꺼질 때 하얗게 빛나는 정도 (0 = 안 빛남, 1 = 새하얗게)
    "noise": 0.5,           # 켜질 때 지직거림 (0 = 없음, 1 = 화면이 노이즈로 가득)
    "off_sound": None,      # 예: "audio/tv_off.ogg" (꺼지기 시작할 때. None = 소리 없음)
    "on_sound": None,       # 예: "audio/tv_on.ogg"  (켜지기 시작할 때)
    "volume": 1.0,          # 두 소리의 음량 (0~1). 환경설정의 효과음 음량도 같이 따름
}
```

| 하고 싶은 일 | 값 |
| --- | --- |
| 평소에는 깨끗하고 특정 장면에서만 효과 | `define screen_fx.overlay = False` (기본 효과는 `"none"` 그대로) |
| 게임 전체를 게임보이 화면으로 | `define screen_fx.base = "gameboy"` |
| 게임보이를 쓰는 동안 평평한 LCD만 (덮개 끔) | `gameboy_config.rpy`에 `define gameboy.overlay = False` |
| 덮개를 덜 휘게 / 평평하게 | `vhs_crt_config.rpy`의 `vhs_crt.settings`에서 `"warp_amount": 0.5` / `0.0` |
| 전환 연출 없이 늘 바로 바꾸기 | `define screen_fx.transition = None` |
| 기본 전환을 서서히로 | `define screen_fx.transition = "fade"`, `define screen_fx.fade_time = 1.5` |
| 느리고 묵직한 TV | `define screen_fx.tv = { "off_time": 0.8, "black_time": 0.6, "on_time": 1.0, "flash": 1.0, "noise": 0.8 }` |
| 깜빡임을 적게 (빛에 민감한 플레이어) | `define screen_fx.tv = { "flash": 0.0, "noise": 0.1 }` |
| 화면 버튼으로 바꾸기 | `textbutton "ASCII" action screen_fx.Use("ascii")`, `textbutton "원래대로" action screen_fx.Clear()` |
| 화면 버튼으로 덮개만 | `textbutton "VHS 덮기" action screen_fx.SetOverlay(True)`, `textbutton "덮개 걷기" action screen_fx.SetOverlay(False)` |
| 플레이어가 모든 화면 효과를 끄게 | 환경설정 화면에 `textbutton _("화면 효과") action screen_fx.Toggle()` (TV 전환 연출도 꺼짐. 게임을 껏다 켜도 유지) |

### 커서 자리 — `screen_fx/screen_fx_config.rpy` + 스크립트 (4.2)

UI Kit의 소프트웨어 커서(`custom_ui.cursor = True`)를 화면 효과의 어디에 그릴지, 셰이더처럼 원고의 구간마다 고릅니다. 다시 바꿀 때까지 유지되고 세이브·되감기에 저장됩니다.

```renpy
## screen_fx_config.rpy: 평소 값
define screen_fx.cursor = "effect"       # 효과까지: ASCII면 커서도 글자, 게임보이면 4색 점, VHS 색 번짐과 휘어짐도
# define screen_fx.cursor = "overlay"    # 덮개(VHS) 밑: 기본 효과는 안 받음
# define screen_fx.cursor = "top"        # 효과 안 받음: 맨 위에 깨끗하게 (4.1까지와 같음)

## 스크립트
$ screen_fx.set_cursor("top")                    # 이 줄부터 효과 안 받음
$ screen_fx.set_cursor("default")                # 설정값으로
$ screen_fx.use("ascii", cursor="overlay")       # 효과를 바꾸면서 같이
e "커서가 깨끗해졌다." (fx_cursor="top")          # 대사 괄호
```

- 편집기: 대사 탭 "커서" 줄(`fx_cursor=`), 화면 효과 탭 "줄에 넣기"의 "커서" 줄(`$ screen_fx.set_cursor(…)`).
- 편집기(Shift+M)를 연 동안, 운영체제 커서(`cursor_mode = "hardware"`)일 때는 늘 맨 위입니다.

### VHS 덮개 — `screen_fx/vhs_crt_config.rpy` (4.0)

덮개는 켬 / 끔만 고르고, 모양은 `vhs_crt.settings` 값으로 정합니다. 왜곡에 관계된 값:

```py
define vhs_crt.settings = {
    "warp_amount": 1.0,              # 가장자리 휘어짐 (0 = 평평, 1 = 기본, 3 이상 = 크게 휨. 0~5)
    "distort_intensity": 0.05,       # 띠가 지나갈 때 화면이 옆으로 밀리는 정도 (0~0.2)
    "aberration": 0.03,              # 색 번짐 (빨강·초록 어긋남)
    "roll": True,                    # 위아래로 흐르는 띠
    "noise_opacity": 0.4,            # 띠를 따라 생기는 지직거림 (0~1)
    "vignette_opacity": 0.5,         # 가장자리 어둡기 (0~1)
    "strength": 1.0,                 # 덮개 전체 세기 (0이면 안 보임)
    # … 전체 값은 vhs_crt_config.rpy와 screen_fx/README.md 11-2
}

## 효과마다 덮개를 기본으로 켤지 (각 효과 설정 파일)
define ascii.overlay = True         # 켬 (배포 설정)
define gameboy.overlay = True       # 켬 (배포 설정). False면 평평한 LCD만
define retro_term.overlay = False   # 끔 (배포 설정). 자체 곡면 CRT와 두 번 휘지 않게
```

```py
## 게임 중에 (세이브·되감기에 저장)
$ screen_fx.set_warp(3.0, duration=1.0)                  # 휘어짐만 1초 동안 3으로
$ vhs_crt.set(warp_amount=0.0, distort_intensity=0.0)    # 여러 값을 한 번에
$ vhs_crt.preset("broken", duration=0.5)                 # 고장 난 화면으로
$ vhs_crt.reset(duration=1.0)                            # set()으로 바꾼 값을 전부 설정 값으로
e "화면이 휜다." (fx_warp=3.0)                            # 대사 괄호로
```

- 편집기: "화면 효과" 탭 → **"VHS 덮개"** 의 막대(가장자리 휘어짐 등)로 평소 값을, 대사 탭의 **"덮개 휘어짐"** 줄로 그 대사부터의 값을 고릅니다.
- 휘어짐이 크면 화면 가장자리 버튼의 보이는 위치와 클릭되는 위치가 어긋납니다.

### 덮개와 글자 빼기

**글자 빼기**는 효과를 씌우지 않을 글자를 고르는 것입니다. **기본은 글자까지 전부 씌웁니다**(ASCII만 글자 전부 빼기가 기본). 뺀 글자는 원래 모습 그대로 또렷하게 남습니다.

| 이름 | 빼는 것 |
| --- | --- |
| `"say"` | 대사·이름 (대사창, NVL 화면) |
| `"choice"` | 선택지 |
| `"screens"` | 메뉴·화면 (퀵메뉴, 저장·불러오기·환경설정 화면, `show screen`으로 띄운 화면) |

`scene`·`show`로 띄운 배경·캐릭터는 늘 효과를 받습니다. 그래서 대사창은 `sfx_say`, 선택지는 `sfx_choice` 층에 뜹니다. 렌파이 기본처럼 두려면 `define screen_fx.split_text_layers = False`(그러면 글자는 전부 빼거나 안 빼거나만 됨).

```py
## 각 효과 설정 파일에서 기본 글자 빼기 정하기
define vhs_crt.exclude = ()                            # vhs_crt_config.rpy (덮개. 배포 설정: 안 뺌)
define ascii.exclude = ("say", "choice", "screens")    # ascii_config.rpy (배포 설정: 글자 전부 뺌)
define retro_term.exclude = ()                         # retro_term_config.rpy (배포 설정: 안 뺌)
define gameboy.exclude = ()                            # gameboy_config.rpy (배포 설정: 안 뺌. 빼지 않은 글자는 색만 바뀜)
define gameboy.exclude = ("say",)                      # 예: 대사·이름만 원래 색 (하나일 때도 쉼표)

## use()는 부를 때마다 덮개를 새로 정함 (안 적으면 설정대로)
$ screen_fx.use("ascii", overlay=False)
$ screen_fx.use("gameboy")                       # ← 덮개는 설정대로 (gameboy.overlay = True면 다시 켜짐)
$ screen_fx.use("gameboy", overlay=False)        # ← 끈 채로 이어 가려면 다시 적기

## "screens"(메뉴·화면)를 뺐을 때, 스크린에 add한 그림도 효과를 받으려면 이렇게
screen map_view():
    add "images/map.png" at screen_fx.scene     # 지도 그림에도 ASCII
    textbutton "닫기" action Hide("map_view")     # 버튼 글자는 그대로
```

- 타이틀 화면의 배경 그림(배경 영상 포함)과 스플래시의 배경·로고에는 장면 효과가 **자동으로** 씌워집니다. 글자(메뉴·제목·본문)는 그대로입니다.
- 덮개의 글자 빼기: 기본 효과가 "없음"이면 `vhs_crt.exclude`를 따르고, 기본 효과가 있으면 그 효과가 아무것도 안 뺄 때 덮개도 아무것도 안 뺍니다(덮개가 늘 위에 오도록).
- 게임보이는 아무것도 안 빼도 층마다 씌워서, 장면은 점으로 바꾸고 글자 층(대사·선택지·메뉴)은 4색만 입힙니다(`"text_pixel": False`). 그래서 작은 대사도 읽힙니다.
- 하나라도 빼면 층마다 따로 씌웁니다. 휘어짐(VHS·레트로 터미널의 곡면)이 뺀 글자에는 걸리지 않아 대사창만 반듯하게 떠 보입니다.
- 덮개는 화면을 한 번 더 그리므로 아주 느린 PC에서는 조금 무거워질 수 있습니다.
- 편집기: "화면 효과" 탭의 효과 버튼마다 "덮개(VHS)" 켬/끔, "글자 빼기" 줄(대사와 이름 / 선택지 / 메뉴와 화면 / 안 뺌 / 전부 뺌. 켜진 것 = 뺌), "기본 효과, 전환"에 "덮개(VHS)" 줄, 대사 탭에 "덮개(VHS)", "덮개 휘어짐", "글자 빼기" 줄.

### ASCII — `screen_fx/ascii_config.rpy` (2.5)

화면을 **글자 칸**으로 나누고, 칸마다 밝기에 맞는 글자로 다시 그립니다. 글자 하나가 픽셀 하나 역할을 합니다(옛날 텍스트 화면·던전 크롤 콘솔). 글자 그림은 글자 목록과 글꼴로 게임 중에 직접 만들어서 이미지를 따로 준비할 필요가 없습니다. 기본 글꼴은 플러그인에 들어 있는 **Neo둥근모**(`screen_fx/fonts/neodgm.ttf`, SIL OFL 1.1)입니다.

```py
define ascii.enabled = True
define ascii.exclude = ("say", "choice", "screens")   # 글자 빼기 (기본: 글자 전부 뺌). () 이면 대사까지 글자로
define ascii.font = None           # None = Neo둥근모. 다른 글꼴: "fonts/DungGeunMo.ttf"

define ascii.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면, 1 = 완전히 글자로)
    "cell": 16,             # 글자 칸 높이(픽셀). 8 아주 촘촘, 16 기본, 32 큼직, 48 이상은 그림이 무너짐
    "aspect": 0.5,          # 칸 가로 ÷ 세로. 0.5 = 반각 글자(8×16), 1.0 = 정사각 타일
    "crisp": True,          # True: 칸 높이를 8의 배수로. 16·32·48에서 가장 또렷
    "chars": " .:-=+*#%@",  # 글자 목록 (어두운 칸 → 밝은 칸). 던전풍 " .,:;ox%#@", 블록 " ░▒▓█", "01"
    "color_mode": "color",  # "mono" 한 가지 색(fg) / "color" 원래 색 / "palette16" 옛날 PC 16색
    "fg": "#c8c8c8",        # "mono"일 때 글자 색. "#33ff66" 녹색 단말기, "#ffb000" 호박색
    "bg": "#000000",        # 바탕색 (글자 사이 빈 곳)
    "color_boost": 1.3,     # 원래 색을 밝게 하는 배율
    "bg_tint": 0.0,         # 바탕에 원래 그림 비치기. 0.15~0.3이면 어두워지지 않음 (VHS를 덮을 때 추천)
    "brightness": 1.0,      # 크면 @·# 같은 꽉 찬 글자가 많아짐
    "contrast": 1.0,
    "invert": False,        # 밝기 뒤집기
}
## 들어 있는 프리셋: "terminal" 녹색 단말기, "amber" 호박색, "dungeon" 16색+던전풍, "blocks" 블록, "big" 큰 글자, "glow" VHS 덮개용

## 게임 중에 (VHS와 같은 방법)
$ screen_fx.use("ascii")                     # ASCII로 바꾸고 유지
$ ascii.preset("dungeon", duration=0.5)      # 로그라이크 콘솔 느낌으로
$ ascii.set(cell=48, duration=2.0)           # 2초 동안 글자가 커지며 그림이 무너짐
$ ascii.reset(duration=1.0)                  # 설정 파일 값으로
```

| 하고 싶은 일 | 값 |
| --- | --- |
| 그림이 더 잘 보이게 | `"cell"`을 8~12로 (글자는 잘 안 읽힘) |
| 글자가 크게 보이게 | `"cell": 32` 또는 `ascii.preset("big")` |
| 정사각 타일 (로그라이크 지도) | `"aspect": 1.0` |
| 어중간한 크기(12, 20 등) 그대로 | `"crisp": False` (글자가 조금 흐려짐) |
| 녹색 단색 모니터 | `ascii.preset("terminal")` |
| ASCII + VHS 덮개가 너무 어두움 | `ascii.preset("glow")` 또는 `"bg_tint": 0.2`, `"color_boost": 1.6` |
| 대사창까지 전부 글자로 (연출) | `$ screen_fx.use("ascii", exclude=())` |
| 한글·기호로 글자 목록 | `"chars": " .·:∴※#"` (글꼴에 있는 글자만. 없으면 네모) |

편집기 "화면 효과" 탭 → "ASCII" 버튼에서 칸 크기·비율·선명하게는 막대와 버튼으로, 글자 목록·색 입히기는 버튼으로 고릅니다. 자세한 값 설명은 `screen_fx/README.md` 6장.

### 레트로 터미널 — `screen_fx/retro_term_config.rpy` (2.6)

옛날 단색 모니터(형광체 화면)로 보는 것처럼 바꿉니다. 화면의 **밝기를 형광체 색으로 칠해서**, 녹색 형광체 + 검은 바탕이면 흰 글자가 녹색으로 빛납니다. **곡면 CRT**(휘어짐·가장자리 어둡게·둥근 화면 테두리)와 **VHS**(흐르는 띠·수평 흔들림)를 이 효과 안에서 따로 켜고 끕니다. VHS_CRT 효과(덮개)와는 따로 노는 값이라, 덮개를 꺼도 이 효과만으로 브라운관 모양이 나옵니다. 참고: cool-retro-term (코드는 가져오지 않고 새로 씀).

```py
define retro_term.exclude = ()     # 글자 빼기 (기본: 안 뺌 → 대사까지 형광체 색으로 빛남)

define retro_term.settings = {
    "phosphor": "#5cff8a",      # 형광체 색: 글자와 밝은 곳이 빛나는 색 ("#ffb000" 호박색, "#c8f0ff" 하늘색)
    "background": "#061208",    # 바탕색: 가장 어두운 곳의 색 ("#000000" 검정, "#1f6aa0" 파란 바탕)
    "color_keep": 0.0,          # 원래 색 남기기 (0 = 형광체 한 가지 색, 1 = 원래 색)
    "bloom": 0.6,               # 빛 번짐 (밝은 글자 주변으로 빛이 퍼짐)
    "raster": "scanlines",      # 화면 결: "none", "scanlines" 주사선, "pixels" 픽셀 격자, "subpixels" RGB 서브픽셀
    "flicker": 0.04,            # 깜빡임
    "glow_line": 0.25,          # 위에서 아래로 지나가는 밝은 줄
    "static_noise": 0.06,       # 정적 노이즈
    "crt": True,                # 곡면 CRT 켜기 (False = 평평한 화면)
    "curvature": 0.25,          # 휘어짐
    "frame": True,              # 화면 둘레 테두리(모니터 틀)
    "frame_size": 0.035,        # 테두리 두께
    "vhs": False,               # 이 효과 안의 VHS 켜기 (흐르는 띠·수평 흔들림)
    "vhs_wobble": 0.4,          # 수평 흔들림
}
## 들어 있는 프리셋: "green" 녹색, "blue" 파란 화면, "amber" 호박색, "white" 흰색, "flat" 평평한 화면, "broken" 고장

## 게임 중에
$ screen_fx.use("retro_term")                     # 레트로 터미널로 (TV가 꺼졌다 켜지며)
$ retro_term.preset("blue", duration=1.0)         # 1초 동안 파란 화면으로
$ retro_term.set(vhs=True)                        # 이 효과의 VHS 켜기
$ retro_term.reset(duration=0.5)                  # 설정 파일 값으로
e "접속 중…" (fx="retro_term", font="screen_fx/fonts/neodgm.ttf", size=32)   # 대사 글꼴도 터미널 글씨로
```

| 하고 싶은 일 | 값 |
| --- | --- |
| 그림 1처럼 녹색 터미널 | 기본값 그대로, 또는 `retro_term.preset("green")` |
| 그림 2처럼 파란 화면 | `retro_term.preset("blue")` |
| 대사만 원래 색으로 | `define retro_term.exclude = ("say",)` |
| 곡면·테두리 없이 색과 결만 | `"crt": False` 또는 `retro_term.preset("flat")` |
| VHS 덮개와 같이 쓸 때 | 이 효과를 쓰는 동안 덮개는 기본으로 꺼짐(`retro_term.overlay = False`). 덮개를 켜려면 휘어짐이 두 번 걸리니 이 효과의 `"crt": False` |
| 테두리가 가장자리 버튼을 가림 | `"frame_size"`, `"curvature"`를 줄이기 (클릭 영역은 그대로라 어긋남) |
| 느린 PC | `"bloom": 0` |

편집기 "화면 효과" 탭 → "레트로 터미널" 버튼에서 색·빛·화면 결·곡면 CRT·VHS 묶음으로 막대를 고칩니다. 잔상(burn-in)은 없습니다. 자세한 값 설명은 `screen_fx/README.md` 7장.

### 게임보이 — `screen_fx/gameboy_config.rpy` (2.7)

옛날 휴대용 게임기의 LCD 화면처럼 바꿉니다. 화면을 **큰 점**으로 나누고, 밝기에 따라 **4가지 색(또는 2가지 색)**으로만 칠합니다. 색과 색 사이의 밝기를 그리는 방법은 두 가지 중에 고릅니다.

| 표현 방식 | 색 사이의 밝기 | 어울리는 그림 |
| --- | --- | --- |
| `"dither"` 디더링 (기본) | 점 무늬(바둑판·격자)로 섞어서 부드럽게 넘어감 | 사진 같은 CG, 어두운 장면, 빛 |
| `"pixel"` 픽셀화 | 가장 가까운 색으로 딱 끊어서 계단처럼 | 단순한 그림, 도트 그림, 넓은 면 |

글자는 기본으로 **4색만 입히고 점으로 쪼개지 않아서** 작은 대사도 그대로 읽힙니다(`"text_pixel": False`). 참고: Retro dither(CC0)의 디더링 무늬, Gameboy Classic Shader(GPL)의 LCD 모습 (코드는 가져오지 않고 새로 씀).

```py
define gameboy.exclude = ()     # 글자 빼기 (기본: 안 뺌 → 대사도 게임보이 색. 모양은 그대로라 읽힘)

define gameboy.settings = {
    "mode": "dither",           # 표현 방식: "dither" 디더링(점 무늬로 섞기) / "pixel" 픽셀화(딱 끊기)
    "pixel_size": 4.0,          # 점 하나의 크기(픽셀). 1280×720에서 4 = 가로 320점, 6 = 213점, 2 = 640점
    "dither": "4x4",            # 디더링 무늬: "4x4" 굵은 무늬 / "8x8" 고운 무늬
    "dither_strength": 1.0,     # 디더링 세기 (0.5 = 색이 바뀌는 근처에만 무늬, 0 = 픽셀화와 같음)
    "text_pixel": False,        # True면 글자도 점으로 쪼갬 (큰 글자나 픽셀 글꼴일 때만)
    "colors": 4,                # 색 수: 4 또는 2 (2면 1번과 4번 색만 씀)
    "color1": "#1c3f04",        # 1번: 가장 어두운 색
    "color2": "#456306",        # 2번: 어두운 색
    "color3": "#74870a",        # 3번: 밝은 색
    "color4": "#939f06",        # 4번: 가장 밝은 색 (꺼진 LCD 바탕)
    "gamma": 1.0,               # 감마 (0.6~0.8 = 어두운 곳이 밝아짐. 어두운 CG가 뭉개질 때)
    "grid": 0.4,                # 점 사이 틈 (0 = 없음)
    "shadow": 0.4,              # 점 그림자: 어두운 점의 그림자가 오른쪽 아래로 (0 = 없음)
    "texture": 0.2,             # LCD 얼룩 (0 = 없음)
}
## 들어 있는 프리셋: "dmg" 올리브 초록(기본), "green" 선명한 초록, "pocket" 회색, "light" 청록 백라이트,
##                   "bw" 흑백, "blood" 검붉은 색(공포 장면용), "1bit" 2색, "clean" LCD 질감 없음

## 게임 중에
$ screen_fx.use("gameboy")                        # 게임보이 화면으로 (TV가 꺼졌다 켜지며)
$ gameboy.set(mode="pixel")                       # 픽셀화로 (표현 방식은 바로 바뀜)
$ gameboy.preset("blood", duration=1.0)           # 1초 동안 붉은 화면으로
$ gameboy.set(pixel_size=24.0, duration=2.0)      # 2초 동안 점이 한 단계씩 커짐 (모자이크처럼)
$ gameboy.reset(duration=0.5)                     # 설정 파일 값으로
e "삐빅." (fx="gameboy", font="screen_fx/fonts/neodgm.ttf", size=32)   # 대사 글꼴도 픽셀 글씨로
```

| 하고 싶은 일 | 값 |
| --- | --- |
| 올리브 초록 게임보이 화면 | 기본값 그대로, 또는 `gameboy.preset("dmg")` |
| 그러데이션을 점 무늬로 | `"mode": "dither"` (기본). 더 곱게: `"dither": "8x8"` |
| 무늬 없이 딱딱 끊긴 도트 느낌 | `"mode": "pixel"` |
| 화면이 무늬로 가득해 보임 (어두운 CG) | `"gamma": 0.7`, `"dither_strength": 0.5`, 또는 `"mode": "pixel"` |
| 붉은 공포 장면 + 픽셀화 | `gameboy.preset("blood")` 다음에 `gameboy.set(mode="pixel")` (프리셋은 앞에서 set()으로 바꾼 값을 지우므로 이 순서) |
| 대사까지 점으로 (진짜 게임기처럼) | `"text_pixel": True`에 큰 픽셀 글꼴 (점 2픽셀이면 글자 32, 점 4픽셀이면 64) |
| 대사는 원래 색 그대로 | `define gameboy.exclude = ("say",)` |
| 느린 PC | `"shadow": 0` |

편집기 "화면 효과" 탭 → "게임보이" 버튼에서 화면·색·LCD 묶음으로 막대를 고칩니다(4가지 색은 버튼을 누르면 색 고르기 창이 열림). 진짜 LCD의 잔상은 없고, 화면 크기도 그대로입니다. 자세한 값 설명은 `screen_fx/README.md` 8장.

### 새 셰이더를 넣을 때

`screen_fx/README.md` 12-1의 흑백 견본 코드를 새 파일로 저장해 이름을 바꾸고(예: `glitch`) 셰이더 부분을 고칩니다. 넣기만 하면 `$ screen_fx.use("glitch")`, 대사 괄호 `(fx="glitch")`, 편집기 "화면 효과" 탭과 대사 탭의 버튼이 저절로 생깁니다. 단계별 방법은 `screen_fx/README.md` 12장. 글자 층만 다르게 그리는 효과(게임보이처럼)는 `layered()`와 `u_sfx_text`를 씁니다(같은 장).

## 타이틀 일렁임 — `screen_fx/watermorph_config.rpy`

타이틀 화면에서만 켜지는 셰이더입니다. 숫자 값만 바꾸면 됩니다.

| 값 | 배포 기본값 | 바꾸면 |
| --- | --- | --- |
| `watermorph.enabled` | `True` | `False`면 끔 |
| `watermorph.target` | `"screen"` | `"background"`면 배경만 일렁이고 메뉴 글자는 선명 |
| `watermorph.amount` | `6.0` | 일렁임 세기(픽셀). `"screen"`일 때는 클릭 위치가 어긋나지 않게 8 이하 |
| `watermorph.scale` | `180.0` | 물결 하나의 크기(픽셀). 클수록 느긋한 큰 물결 |
| `watermorph.speed` | `0.6` | 흐르는 속도 |
| `watermorph.flow` | `1.2` | 소용돌이 정도. 0이면 단순한 물결 |
| `watermorph.shine` | `0.15` | 표면 반사광. 검은 배경에서 연기처럼 보이면 0 |
| `watermorph.quality` | `2` | 1~3. 저사양 PC·모바일·웹은 1 |
| `watermorph.in_title_menus` | `False` | 타이틀에서 연 환경설정·불러오기 화면에도 적용 |

편집기의 "타이틀 일렁임" 탭에서 막대를 끌며 보면서 고칠 수 있습니다. 편집기에서 다른 탭을 쓰는 동안에도 효과가 보이고, V로 끄고 켭니다.

## VHS·CRT 효과 — `screen_fx/vhs_crt_config.rpy`

넣기만 하면 화면 전체에 씌워집니다. VHS는 **기본 효과**(`screen_fx.base = "vhs_crt"`)라서, `screen_fx.use()`로 다른 효과를 켜는 동안에는 쉬고 선택취소(`screen_fx.clear()`)하면 돌아옵니다. 범위는 `vhs_crt.scope`, 모양은 `vhs_crt.settings` 사전의 값으로 정합니다.

| 하고 싶은 일 | 값 |
| --- | --- |
| 효과 끄기 | `vhs_crt.enabled = False` |
| 게임 중에만 / 타이틀에서만 | `vhs_crt.scope = "game"` / `"main_menu"` (타이틀 전 스플래시는 타이틀 쪽에 들어감) |
| 대사창·메뉴는 선명하게, 장면에만 | `vhs_crt.auto = False` 후 스크립트에서 `camera at vhs_crt.effect` |
| 전체 세기 | `settings`의 `"strength"` (0 원래 화면 ~ 1) |
| 주사선·격자 | `"scanlines_opacity"`, `"scanlines_width"`, `"grille_opacity"`, `"pixelate"`, `"resolution"` |
| 흐르는 띠·화면 밀림 | `"roll"`, `"roll_speed"`, `"roll_size"`, `"distort_intensity"` |
| 노이즈 | `"noise_opacity"`, `"static_noise_intensity"` |
| 색 | `"aberration"`(색 번짐), `"brightness"`, `"discolor"`, `"saturation"`, `"contrast"` |
| 브라운관 모양 | `"warp_amount"`(가장자리 휘어짐, 크면 가장자리 버튼 클릭이 어긋남), `"vignette_intensity"`, `"vignette_opacity"` |
| 화면이 너무 어두움 | `"brightness"` 올리기, 또는 `scanlines_opacity`·`grille_opacity`·`vignette_opacity` 낮추기 |
| 저사양용 | `vhs_crt.redraw = 1.0/30`, `"pixelate": False`, `"noise_opacity": 0` |
| 게임 중 바꿀 묶음 | `vhs_crt.presets`에 이름과 값 추가 (`"clean"`, `"broken"`이 들어 있음) |

게임 중에는 스크립트에서 바꿉니다. 바꾼 값은 세이브·되감기에 같이 저장됩니다.

```py
$ vhs_crt.preset("broken")                     # 순간 고장
pause 0.3
$ vhs_crt.reset(duration=0.5)                 # 설정 파일 값으로 천천히
$ vhs_crt.set(noise_opacity=0.9, duration=1.0)
$ vhs_crt.off(duration=2.0)                   # 서서히 끄기
```

플레이어가 끌 수 있게 하려면 `screens.rpy`의 환경설정 화면에 `textbutton _("VHS 효과") action vhs_crt.Toggle()` 한 줄을 넣습니다. 모든 화면 효과와 TV 전환 연출을 한 번에 끄는 버튼은 `textbutton _("화면 효과") action screen_fx.Toggle()`입니다. 편집기의 "화면 효과" 탭(VHS 버튼)에서는 효과를 켠 채로 막대를 끌며 고칠 수 있고, "고칠 대상"을 프리셋으로 바꾸면 그 프리셋을 미리 보며 고칩니다. 편집기에서 다른 탭을 쓰는 동안에도 효과가 보이고, V로 끄고 켭니다.

## 값이 적용되는 순서와 문제 해결

같은 값이 여러 곳에 있으면 오른쪽으로 갈수록 이깁니다.

| 기능 | 순서 (→ 뒤가 우선) |
| --- | --- |
| 타이틀 메뉴 | `tmenu.default` → 편집기 공통 값 → 항목에 적은 값 → 편집기 항목 값 (`title_menu_layout.rpy`) |
| 선택지 | `cmenu.default` → (예전 편집기가 저장한) `choice_menu_layout.rpy` → `menu (…)` 괄호 → 선택지 괄호 |
| 커서·대사 소리 | `custom_ui_config.rpy` → `custom_ui_layout.rpy` |
| 대사 | 캐릭터 정의 → (예전 편집기가 저장한) `say_style_layout.rpy` → 대사 괄호 |
| 텍스트 속도 | `options.rpy` → `custom_ui.text_cps` → 플레이어가 환경설정에서 고른 값 |
| 타이틀 일렁임 | `watermorph_config.rpy` → `watermorph_layout.rpy` |
| 지금 켜진 화면 효과 | `screen_fx.base` → `screen_fx_layout.rpy`의 base → 게임 중 `screen_fx.use()` / 대사 `fx=` (`clear()`하면 base로) |
| 효과를 바꿀 때 전환 | `screen_fx_config.rpy` → `screen_fx_layout.rpy` → `use(transition=…)` / 대사 `fx_transition=` |
| 덮개 켬/끔 | `screen_fx.overlay`와 효과마다 `<이름>.overlay` → `screen_fx_layout.rpy`, `<이름>_layout.rpy` → `use(overlay=…)` / `set_overlay()` / 대사 `fx_overlay=` |
| 덮개 휘어짐 | `vhs_crt.settings`의 `warp_amount` → `vhs_crt_layout.rpy` → `screen_fx.set_warp()` / `vhs_crt.set()` / 대사 `fx_warp=` |
| 글자 빼기 | 효과 기본(ASCII는 글자 전부, 나머지 안 뺌) → 각 효과의 exclude (`ascii.exclude` 등) → 각 효과의 배치 파일 (`ascii_layout.rpy` 등) → `use(exclude=…)` / 대사 `fx_exclude=` |
| VHS 덮개·ASCII·레트로 터미널·게임보이 효과 값 | `vhs_crt.settings`·`ascii.settings`·`retro_term.settings`·`gameboy.settings` → `vhs_crt_layout.rpy`·`ascii_layout.rpy` → 게임 중 `vhs_crt.set()`·`screen_fx.set_warp()`·`ascii.set()` 등 |
| 스플래시 | 엔진 기본값 → `splash.default` → 페이지에 적은 값 |

| 증상 | 확인할 것 |
| --- | --- |
| 설정을 고쳤는데 그대로 | 같은 이름의 `*_layout.rpy`가 있는지 (편집기 값이 우선) |
| 글자가 네모로 나옴 | 그 글꼴에 한글이 없음 |
| 다른 컴퓨터에서만 글꼴이 안 나옴 | 파일 이름 대소문자 (`ChosunGu.TTF` ≠ `ChosunGu.ttf`) |
| 영상이 안 나오거나 투명한 곳이 검음 | 경로, VP9 코덱, side_mask 형식인지, `…_side_mask` 값 |
| 대사 소리가 두 번 남 | 캐릭터에 예전 `callback=` 소리 함수가 남아 있는지 |
| 편집기에서 바꾼 선택지·대사 값이 원고에 안 들어감 | 패널 아래 메시지에 이유가 나옴. Ctrl+C로 복사해서 그 줄에 붙여넣기 |
| 원고를 잘못 고쳤음 | 프로젝트 폴더 `ui_kit_backup/`에 고치기 전 원본이 시각별로 있음 |
| 속도·효과를 바꿔도 안 보임 | 텍스트 속도가 "즉시"인지 (물결·떨림은 항상 보임) |
| 플러그인을 넣자 "given a default a second time" 오류 | 같은 플러그인 폴더가 두 벌 들어 있음. 예전 폴더를 `.rpyc`까지 지우기 |
| 편집기가 안 열림 | 런처에서 실행했는지 (개발 모드에서만 열림) |
| 지운 파일이 계속 적용됨 / 스크린이 두 번 정의됨 | `.rpyc`도 같이 지웠는지, 예전 `title_menu` 등 폴더가 남았는지 |
| 편집기 저장 실패 | 프로젝트가 Dropbox 안이면 동기화를 잠시 멈추고 다시 저장 |
| 스플래시를 고쳤는데 안 보임 | Shift+R로는 안 나옴. 껐다 켜거나 `splash.preview()`. `developer_skip`, `once`·보지 않기로 빠진 것은 아닌지 |
| 내가 쓴 `splashscreen` 레이블만 나옴 | 그 레이블 안에 `call splash_play` |
| 스플래시 조작 방법 표가 아래 안내와 겹침 | 페이지의 `"yalign"`을 줄이거나 `"key_size"`, `"keys_spacing"`을 줄이기 |
| 글자 사이 가운뎃점(·)이 네모 | 렌파이 새 프로젝트의 한글 글꼴에 없는 글자. `/`나 `,`를 쓰거나 글꼴 바꾸기 |
| `use()`나 `fx=`를 했는데 효과가 안 보임 | 그 효과의 `enabled`, 플레이어가 끄지 않았는지(`persistent.screen_fx_off`), `strength`, 편집기에서 다른 탭을 쓰고 있지 않은지 |
| "…라는 효과가 없습니다" 오류 | 효과 이름 오타. 쓸 수 있는 이름이 오류 화면에 나옴 |
| 대사 괄호 `fx=`에서 "unknown keyword" 오류 | `screen_fx` 폴더가 없거나 예전 버전 (2.8 묶음으로 바꾸기. `fx_overlay`는 2.5부터, `fx_exclude`는 2.6부터) |
| `show rain`에서 "image not found" 오류 | 영상이 `game/movies/`에 있는지, 확장자가 `.webm`인지, 같은 이름의 그림이 `images/`에 있지 않은지 (그림이 우선) |
| 투명 영상이 두 그림이 옆으로 붙은 채 나옴 | 파일 이름 앞에 `mask_`가 있는지 (side_mask 영상) |
| 이미지/영상 탭에서 그림을 못 고름 | 원고의 show·scene 줄로 띄운 그림만 고를 수 있음. 세이브를 불러온 직후라면 줄 목록에서 고르기 |
| ASCII에서 대사가 안 읽힘 | `ascii.exclude`에 `"say"`가 있는지, `exclude=()`나 `fx_exclude=()`를 쓰지 않았는지 |
| 글자를 뺐는데 그대로 효과가 걸림 | 하나만 적을 때 쉼표를 빠뜨리지 않았는지 (`("say")`가 아니라 `("say",)`), `screen_fx.split_text_layers = False`인지 |
| 다른 코드가 대사창을 못 찾음 | 그 코드가 `layer="screens"`로 대사창을 찾고 있음. `define screen_fx.split_text_layers = False` |
| 레트로 터미널 + VHS 덮개에서 화면이 두 번 휨 | `retro_term.overlay = False`(기본)로 두거나, 덮개를 켤 거면 이 효과의 `"crt": False` |
| 게임보이 화면이 점 무늬로 가득함 | 어두운 CG는 1번·2번 색 사이를 무늬로 섞음. `"gamma"`를 0.6~0.8로, `"dither_strength"`를 0.5로, 또는 `"mode": "pixel"` |
| 게임보이에서 대사가 안 읽힘 | `"text_pixel": True`이면 글자도 점으로 쪼개짐. `False`로 하거나 `exclude=("say",)` |
| 게임보이에서 메뉴 화면 속 그림이 점으로 안 바뀜 | 메뉴·화면 층은 색만 바뀜(`"text_pixel": False`). 효과에서 `"screens"`를 빼고 그 그림에 `at screen_fx.scene` |
| ASCII가 너무 어두움 | `"color_boost"`·`"bg_tint"`·`"brightness"` 올리기. VHS를 덮었다면 `ascii.preset("glow")` |
| ASCII 글자가 흐릿함 / 네모로 나옴 | `"crisp": True`에 `"cell"` 16의 배수 / 글자 목록의 글자가 글꼴에 없음 |
| 스크린에 넣은 그림에 효과가 안 걸림 | 효과에서 `"screens"`(메뉴·화면)를 뺐음. 그림에 `at screen_fx.scene` |
| 덮개가 사라짐 / 다시 켜짐 | `use()`는 부를 때마다 덮개를 설정대로 다시 정함. 이어 가려면 `overlay=`를 적기 |
| VHS가 안 보임 | `screen_fx.overlay`가 `True`인지 (3.x 설정 파일의 `None`이 남아 있지 않은지), 지금 효과의 `<이름>.overlay`, `fx_overlay=False`를 쓰지 않았는지 |
| 화면 효과 탭에서 저장했는데 화면이 그대로 | 그 탭은 효과의 설정값을 고침. 지금 장면에 쓰려면 "이 대사부터 이 효과" 버튼이나 대사 탭 → Ctrl+S |
| "'mono'라는 효과가 없습니다" 오류 | 4.0에서 흑백을 지움. 원고의 `use("mono")`, `fx="mono"`를 바꾸거나 `screen_fx/README.md` 12-1의 견본으로 다시 넣기 |
| 효과를 처음 바꿀 때 한 번 멈칫함 | 그 셰이더를 처음 쓸 때 그래픽 카드가 준비하는 시간. 같은 실행 중에는 다시 안 멈춤 |
| TV 전환 없이 바로 바뀜 | 건너뛰기 중, 되감기·불러오기 직후, 편집기를 열어 둔 동안은 원래 바로 바뀜. `screen_fx.transition`도 확인 |
| 전환 중에 대사가 먼저 나옴 | `screen_fx.wait = False`이거나 `use(…, wait=False)` |
| 편집기에 "VHS 효과" 탭이 없음 | 2.4부터 "화면 효과" 탭 안의 "VHS" 버튼 |

## 자주 하는 커스텀

**로고 영상을 타이틀 전에 넣기**

1. webm(VP9, 게임 해상도)을 `game/movies/logo.webm`에 넣습니다.
2. `splash_config.rpy`의 `splash.pages` 맨 앞에 덩어리를 넣습니다.
   ```py
   {
       "id": "logo",
       "background": "movies/logo.webm",
       "duration": "movie",
   },
   ```
3. 게임을 껐다 켜거나 콘솔에서 `splash.preview()`로 확인, 런처에서 Lint.

**타이틀 메뉴에 "조작 방법" 항목 추가하기**

1. `title_menu_config.rpy`의 `tmenu.items`에 덩어리를 하나 넣습니다.
   ```py
   {
       "id": "howto",
       "text": _("조작 방법"),
       "action": splash.ShowPage("controls"),
   },
   ```
2. 누르면 스플래시의 `controls` 페이지가 타이틀 위에 나타나고, 클릭하면 타이틀로 돌아옵니다. 위치는 Shift+M으로 잡습니다.

**타이틀 메뉴에 "갤러리" 항목 추가하기**

1. `title_menu_config.rpy`의 `tmenu.items` 안, 원하는 순서 자리에 덩어리를 하나 넣습니다.
   ```py
   {
       "id": "gallery",
       "text": _("갤러리"),
       "action": ShowMenu("gallery"),
       "show_if": "persistent.cleared",
   },
   ```
2. 게임을 실행해 타이틀에서 Shift+M → 새 항목을 끌어서 자리 잡기 → Ctrl+S.

**타이틀 메뉴 글꼴을 한꺼번에 바꾸기**

1. 글꼴 파일을 `game/fonts/`에 넣습니다.
2. `tmenu.default`의 `"font"`를 그 경로로 바꾸거나, 편집기 타이틀 탭에서 3(모든 항목 공통) → 글꼴 버튼 → 고르기 → Ctrl+S.

**선택지 하나를 화면 아무 데나 띄우기**

1. 선택지가 나오는 곳까지 진행 → Shift+M (선택지 탭).
2. 선택지를 끌어 놓고 Q/E로 기울이기, 글꼴·색 버튼으로 바꾸기.
3. Ctrl+S. 원고의 그 선택지 줄 괄호가 바뀌고 같은 장면으로 다시 불러와집니다.

**대사 한 줄에서 이름을 다른 자리에 띄우고 떨리게 하기**

1. 그 대사까지 진행 → Shift+M (대사 탭).
2. Tab으로 "이름"을 고르고 이름을 끌어 놓기, S/W로 크기, 색 버튼으로 색.
3. 효과 "떨림", 속도 ×0.5 → 그 줄이 다시 나오며 확인됨.
4. Ctrl+S.

**모든 선택지에 hover 영상 깔기**

1. side_mask 형식 webm을 `game/gui/button/choice_hover.webm`에 넣습니다.
2. `choice_menu_config.rpy`의 `cmenu.default`에 `"hover_movie": "gui/button/choice_hover.webm",`과 `"hover_movie_size": (160, 150),`(표시 크기)을 적습니다.

**커서·클릭 대기 표시를 내 그림으로**

1. 프레임 그림을 `game/gui/cursor/`, `game/gui/ctc/`에 넣습니다. 이름은 1, 2, 3… 순서로.
2. 편집기 커서/대사 소리 탭 → 켬 → `<` `>`로 그 폴더 고르기 → 속도 막대 → Ctrl+S (자동으로 다시 불러와짐).

**대사 소리를 캐릭터마다 다르게**

```py
define custom_ui.typing_sound = "audio/type.ogg"                  # custom_ui_config.rpy: 기본 소리
define e = Character("에일린", cb_typing_sound="audio/type_soft.ogg")   # 스크립트: 이 캐릭터만
define narrator = Character(None, cb_typing_sound=None)            # 내레이션은 소리 없음
```

**공포 연출: 한 줄만 크고 빨갛게, 화면 지직**

```py
$ vhs_crt.preset("broken")
t "뒤를 돌아보지 마." (x=640, y=360, size=40, color="#aa0000")
$ vhs_crt.reset(duration=0.5)
```

**기능 하나를 잠시 꺼서 렌파이 기본과 비교하기**

설정 파일 맨 위 스위치를 `False`로 (`tmenu.enabled`, `cmenu.enabled` …) → Shift+R. 끄면 렌파이로 갓 만든 프로젝트와 똑같이 보이고, 스크립트의 선택지·대사 괄호 값은 무시됩니다.

**VHS 효과를 보면서 맞추고, 장면용 프리셋 만들기**

1. 효과를 보고 싶은 화면(대사 장면 등)에서 Shift+M → T로 "화면 효과" 탭 → 위쪽 "VHS 덮개" 버튼.
2. "기본"·"주사선"·"흔들림"… 묶음 버튼으로 막대를 바꿔 가며 평소 모습을 맞춥니다.
3. "고칠 대상"을 "프리셋: broken"으로 바꾸면 그 프리셋을 미리 보며 고칩니다. 기본 설정을 따르게 할 값은 "빼기".
4. Ctrl+S로 저장. 스크립트에서 `$ vhs_crt.preset("broken", duration=0.5)`로 그 장면에 씁니다.

**회상 장면만 게임보이 화면으로 (TV가 꺼졌다 켜지며)**

```py
$ gameboy.preset("pocket")        # 회색 프리셋 값으로 (화면은 아직 그대로)
$ screen_fx.use("gameboy")        # TV가 꺼졌다 켜지며 게임보이로. 다음 지시까지 유지
e "그해 여름, 우리는…"
e "아직 회상 중."
$ screen_fx.clear()               # 선택취소: 효과 없음 + VHS 덮개로
$ gameboy.reset()                 # 다음에 쓸 때를 위해 원래 값으로
```

**편집기로 "이 대사부터 게임보이" 정하기**

1. 효과를 바꿀 대사까지 진행 → Shift+M (대사 탭). (또는 "화면 효과" 탭 → [게임보이] → [이 대사부터 이 효과])
2. "화면 효과" 줄에서 [게임보이]. 전환을 바꾸려면 "전환" 줄에서 [서서히] / [바로]. 덮개를 끄려면 "덮개(VHS)" 줄에서 [끔], 휘어짐은 "덮개 휘어짐" 줄.
3. Ctrl+S → 원고의 그 줄이 `e "…" (fx="gameboy", fx_transition="fade")`처럼 바뀌고 원고를 다시 불러옵니다. 고친 줄은 그 앞 대사부터 다시 나오니 한 번 넘기면 보입니다. 줄 뒤의 `with dissolve` 등은 그대로입니다.
4. 돌아올 대사에서 같은 방법으로 [선택취소 → 기본(효과 없음)] → Ctrl+S. 원고에는 `(fx="default")`로 적힙니다. [그대로]는 이 줄에서 바꾸지 않기(괄호의 `fx`를 지움)입니다.

**이 대사부터 화면을 크게 휘게 (덮개 왜곡)**

```py
e "어지러워…" (fx_warp=3.0)               # 덮개 가장자리 휘어짐 3
e "괜찮아졌다." (fx_warp="default")        # 설정 파일 값으로
$ screen_fx.set_warp(5.0, duration=2.0)   # 스크립트로: 2초 동안 서서히 크게
```

**던전 장면을 ASCII로, 브라운관 너머처럼 (대사는 그대로 읽힘)**

```py
label dungeon:
    scene bg cave
    $ ascii.preset("glow")                        # 덮개를 씌워도 어둡지 않게 (화면은 아직 그대로)
    $ screen_fx.use("ascii", overlay=True)        # TV가 꺼졌다 켜지며 ASCII + VHS 덮개
    e "던전에 들어왔다."                      # 배경·캐릭터만 글자, 대사는 원래 글꼴
    $ ascii.set(cell=48, duration=2.0)            # 시야가 무너지는 연출
    e "눈앞이 흐려진다…"
    $ screen_fx.clear()                           # 선택취소: 효과 없음 + VHS 덮개로
    $ ascii.reset()                               # 다음에 ASCII를 쓸 때를 위해
```

**편집기로 "이 대사부터 ASCII + VHS 덮개" 정하기**

1. 바꿀 대사까지 진행 → Shift+M (대사 탭).
2. "화면 효과" 줄에서 [ASCII] → "덮개(VHS)" 줄에서 [켬]. 대사창까지 글자로 하려면 "글자 빼기" 줄에서 켜져 있는 [대사와 이름]·[선택지]·[메뉴와 화면]을 눌러 끕니다.
3. Ctrl+S → 원고의 그 줄이 `e "…" (fx="ascii", fx_overlay=True)`처럼 바뀝니다.

**ASCII 글자 크기를 보면서 맞추기**

1. Shift+M → T로 "화면 효과" 탭 → 위쪽 [ASCII].
2. "글자 칸 높이", "칸 가로 ÷ 세로" 막대를 끌고, "선명하게"를 켜거나 끕니다. 글자 목록과 색 입히기는 버튼으로 고릅니다.
3. "글자 빼기"에서 [안 뺌] / [전부 뺌]을 바꿔 보며 비교합니다.
4. Ctrl+S → `screen_fx/ascii_layout.rpy`로 저장되고 설정 파일보다 우선합니다.

**TV 꺼짐·켜짐에 소리 넣고 더 느리고 묵직하게**

1. 소리 파일을 `game/audio/tv_off.ogg`, `game/audio/tv_on.ogg`에 넣습니다.
2. `screen_fx_config.rpy`의 `screen_fx.tv`를 아래처럼 고칩니다. 시간·섬광 값은 편집기 "화면 효과" 탭 → "기본 효과, 전환"에서 막대로 맞추고 [미리 보기: TV]로 확인해도 됩니다(소리 경로는 설정 파일에서만).

```py
define screen_fx.tv = {
    "off_time": 0.8,                  # 꺼지는 시간(초)
    "black_time": 0.6,                # 검은 화면(초)
    "on_time": 1.0,                   # 켜지는 시간(초)
    "line": 3,                        # 가로선 두께(픽셀)
    "flash": 1.0,                     # 꺼질 때 새하얗게
    "noise": 0.8,                     # 켜질 때 지직거림 많이
    "off_sound": "audio/tv_off.ogg",
    "on_sound": "audio/tv_on.ogg",
    "volume": 1.0,
}
```

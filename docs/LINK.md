# showpy와 PyKaki 연결 약속

두 프로그램이 서로 맞춰야 하는 형식을 적은 문서입니다. 두 프로그램은 pygaki 저장소의 `showpy/`, `pykaki/` 폴더에 같이 들어 있고, 이 문서는 저장소 맨 위 `docs/`에 하나만 있습니다.

## 1. 역할

| 다루는 것 | 어디서 | 어디에 저장 |
|---|---|---|
| 대사, 선택지, 흐름 | PyKaki | `.flow.json` |
| 그림, webm 영상, 음악, 효과음 넣기 | 주로 showpy 편집기 (PyKaki에서도 칸으로 넣을 수 있음) | `.flow.json` (showpy에서 넣으면 PyKaki가 받아 적음) |
| 그림 위치 | showpy 편집기만 | `game/ui_kit/stage_layout.rpy` |
| 대사 글자 크기, 글꼴, 색, 속도, 등장 효과 | PyKaki | `.flow.json` |
| 대사와 이름의 위치, 줄마다 바꾸는 화면 효과 | showpy 편집기 대사 탭 (PyKaki는 받아 적어 보여 줌) | `.flow.json` |

```
PyKaki (.flow.json이 원본)
   │  내보내기: game/script_flow.rpy에 씀
   ▼
렌파이 + showpy 편집기
   │  그림, 영상, 소리 줄을 넣으면 script_flow.rpy와 showpy_inbox.json에 같이 씀
   ▼
PyKaki가 showpy_inbox.json을 받아 적음 → 대본에 보임 → 다음 내보내기에도 남음
```

**역가져오기는 없습니다.** PyKaki는 `.rpy`를 읽지 않습니다. 받는 것은 `showpy_inbox.json`에 적힌 기록뿐이고, 대사 글자와 선택지는 이 길로 오지 않습니다. 대사는 위치와 화면 효과만 옵니다.

## 2. 내보낸 `.rpy`의 표시

`renpyLink` 설정을 켜면 PyKaki는 아래처럼 내보냅니다.

```renpy
# 샘플: 빈 병동
# PyKaki가 만든 파일이에요. 직접 고치면 다음 내보내기 때 덮어써져요.

# @node:n1 도입
label ward:
label ward.n1:
    # @l:l1
    scene bg hall with fade
    # @l:l5
    mina "여기 아무도 없는 거 맞지?" (fx_warp=3)
    # @end:n1
    menu:
        "문을 연다":
            jump ward.n4
```

| 표시 | 뜻 | 누가 쓰는가 |
|---|---|---|
| `# PyKaki가 만든 파일이에요.` (파일 앞 5줄 안) | PyKaki 원고. 문구를 바꾸면 양쪽을 같이 고칩니다 | showpy `script_edit.is_pykaki` |
| `# @node:ID 제목` | 상자의 시작 | 그 줄이 어느 상자인지 찾을 때 |
| `label 그룹.ID:` | 모든 상자에 붙는 로컬 label | 실행 중 지금 상자를 알 때 (`config.label_callbacks`) |
| `# @l:ID` | 바로 다음 줄이 그 id의 대본 줄 | 줄 넣기, 줄 바꾸기의 기준 |
| `# @end:ID` | 여기부터 상자의 나가는 부분(선택지, jump, return) | 선택지 앞에 줄을 넣을 때 |

대사 줄 괄호에는 PyKaki의 `say` 값(`SayStyle`)이 짧은 이름으로 붙습니다. showpy `say_style`이 받습니다.

| 괄호 | PyKaki 값 | 뜻 |
|---|---|---|
| `size=30`, `font="…"`, `color="#…"`, `cps=30` | `size`, `font`, `color`, `cps` | 글자 모양과 속도 |
| `effect="slidein"`, `effect="slidein|shake"` | `effect` | 등장 효과. 두 효과 겹치기는 `|` (pygaki 2.0, `FEATURE` 3) |
| `box="bubble"`, `box="pill"` | `box` | 글 상자: 말풍선, 둥근 테두리 (showpy `ui_kit` 4.0 `text_box.rpy`, `FEATURE` 3) |
| `tail="top"`, `tail=None` | `tail` (`bottom` `top` `left` `right` `none`) | 말풍선 꼬리. 비우면 상자 기본(말풍선은 아래, 둥근 테두리는 없음) |
| `box_rotate=-4` | `box_rotate` | 상자와 글 기울기 (도) |
| `x=…`, `y=…`, `name_x=…`, `name_y=…` | 위치 | showpy가 정해서 PyKaki가 받아 적음 (3장) |

상자의 나머지 값(`bubble_color`, `pill_line` 등)은 showpy 원고나 `say_style.box_styles`에서만 고칩니다. 연결을 끈 파일에는 상자와 showpy 효과를 내보내지 않습니다(검사 탭에 경고).

`renpyLink`를 끈 파일에는 `# @l:`이 없습니다. showpy는 이런 원고에 그림 줄을 저장하지 않고, 연결을 켜고 다시 내보내라고 안내합니다.

## 3. `game/showpy_inbox.json`

showpy가 쓰고, PyKaki가 읽은 뒤 비웁니다. PyKaki가 읽은 기록만 지우므로 그사이 showpy가 더 적은 기록은 남습니다.

```json
{
  "format": "showpy-inbox",
  "version": 1,
  "ops": [
    { "id": "sp9a8f101", "op": "insert", "code": "show ghost", "box": "n1", "before": "l3" },
    { "id": "sp9a8f102", "op": "insert", "code": "play sound \"audio/knock.wav\"", "box": "n1", "after": "sp9a8f101" },
    { "id": "sp9a8f103", "op": "insert", "code": "scene bg room", "box": "n3", "end": "n3" },
    { "id": "sp9a8f104", "op": "replace", "code": "show mina scared with dissolve", "line": "l4" },
    { "id": "sp9a8f105", "op": "say_pos", "line": "l5", "pos": { "x": 520, "y": 60 } },
    { "id": "sp9a8f106", "op": "say_fx", "line": "l5", "sayFx": { "fx": "ascii", "overlay": "off", "warp": "3", "exclude": ["say"] } },
    { "id": "sp9a8f107", "op": "insert", "code": "$ screen_fx.shaders(\"ascii\", \"vhs_crt\", transition=\"fade\")", "box": "n1", "before": "l6" },
    { "id": "sp9a8f108", "op": "remove", "line": "l7" }
  ]
}
```

| 값 | 뜻 |
|---|---|
| `id` | `insert`면 새 줄의 id (`.rpy`의 `# @l:`과 같음). 이미 있는 id면 다시 넣지 않습니다 |
| `op` | `insert` 줄 넣기, `replace` 줄 바꾸기, `remove` 줄 지우기(showpy 4.22), `say_pos` 대사 위치, `say_fx` 대사 화면 효과 |
| `code` | 렌파이 명령 한 줄 |
| `box` | 줄이 들어갈 상자. 기준 줄이 사라졌을 때 그 상자의 끝에 넣습니다 |
| `before` `after` `end` | `insert`의 자리. 줄 앞, 줄 뒤, 상자 끝 중 하나 |
| `line` | `replace`, `remove`, `say_pos`, `say_fx`로 바꾸거나 지울 줄의 id |
| `pos` | `say_pos`의 값. `x` `y` `name_x` `name_y`, 대사창 왼쪽 위 기준. `null`이면 지움 |
| `sayFx` | `say_fx`의 값. PyKaki `LineFx`와 같은 이름: `fx` `transition`(`none`은 바로) `overlay`(`on` `off`) `warp` `cursor` `exclude`(목록). `null`이면 지움 |

`say_pos`, `say_fx`를 받으면 그 대사 줄의 괄호에 같은 값을 내보냅니다. 괄호 순서는 PyKaki 순서로 정리됩니다. 예전 PyKaki는 이 기록을 모른 채 지우므로 두 프로그램을 같이 올립니다.

`code`는 `show` `scene` `hide` `play` `stop`으로 시작하는 줄과, 셰이더·커서 칸이 넣는 `$ screen_fx.`로 시작하는 줄(showpy 4.22: `shaders`, `set_cursor`. 고른 줄 바로 위의 같은 줄들은 `replace`/`remove`로 바꿈)만 들어옵니다. PyKaki(`src/inbox.ts`)는 칸으로 나타낼 수 있으면 칸이 있는 연출 줄로, 아니면 "직접 명령" 줄로 바꿉니다.

| `code` | PyKaki 줄 |
|---|---|
| `scene bg hall with fade` | 배경, `image: hall`, `trans: fade` |
| `show mina scared` | 보이기, 캐릭터 `mina`, 표정 `scared` |
| `show ghost with stage.move("inleft", 0.8)` | 보이기, 기타 `ghost`, 전환은 적힌 그대로 |
| `hide ghost` | 숨기기, 기타 `ghost` |
| `play music "audio/hum.wav"` | 음악, `hum.wav` |
| `stop music fadeout 1.0` | 음악 멈추기 |
| `show ghost at stage.pos(1, 2)`, `show a as b` | 직접 명령 |

## 4. `ui_kit/stage_layout.rpy`

showpy 편집기가 만듭니다. PyKaki는 쓰지 않고, 플레이 화면의 그림 자리를 잡을 때 읽기만 합니다.

```renpy
define stage.placed = {
    "ghost": "stage.pos(900, 720)",          # 어디서나 ghost는 여기
    ("n4", "ghost"): "stage.pos(420, 720)",  # 상자 n4에서만 여기
}
```

정하는 순서: **원고의 `at` → (지금 상자, 태그) → (태그) → 렌파이 기본.** 배경 태그는 옮기지 않습니다.

## 5. 이름 규칙

- 캐릭터 id는 `define 이름 = Character(...)`가 되므로, 연결을 켜면 아래 이름을 막습니다. (`src/util.ts`의 `PLUGIN_NAMES`)
  ```
  ui_kit tmenu cmenu custom_ui say_style stage script_edit ui_editor
  screen_fx vhs_crt ascii retro_term gameboy watermorph hotkeys splash t n1 n2 n3
  ```
  showpy에 새 store 이름이 생기면 여기와 `PLUGIN_NAMES`를 같이 고칩니다.
- 렌파이 그림 이름은 파일 이름에서 확장자를 빼고 소문자로 바꾼 것입니다. 안쪽 폴더는 이름에 안 들어갑니다.
- `movies/mask_ghost.webm`은 `show ghost`로 씁니다. (앞의 `mask_`는 투명 영상 표시)
- PyKaki는 `label start:`를 내보내지 않고 `config.label_overrides["start"]`를 첫 상자로 정합니다. `script.rpy`는 그대로 둬도 되고, 그 안의 `label start:`는 실행되지 않습니다. 대본에 이름이 `start`인 label을 만들 때만 겹치므로, 그때 PyKaki가 알려 줍니다.

## 6. 플레이 화면이 읽는 파일

PyKaki 플레이 화면은 연결한 game 폴더에서 아래 값을 글자로 찾아 읽습니다. 게임 코드를 실행하지 않습니다.

| 파일 | 읽는 값 |
|---|---|
| `gui.rpy` | `gui.init` 크기, 글자 크기, 색, 글꼴, 대사창과 이름 자리 |
| `options.rpy`, `ui_kit/custom_ui_config.rpy` | 기본 텍스트 속도 (`custom_ui.text_cps`가 먼저) |
| `gui/textbox.png`, `gui/namebox.png` | 대사창과 이름 배경 |
| `ui_kit/stage_layout.rpy` | 그림 위치 |
| `images/`, `movies/`, `audio/` | 그림, 영상, 소리 |

## 7. `game/pykaki_preview.json` (렌파이 실시간 미리보기)

PyKaki가 쓰고 showpy가 읽기만 합니다. PyKaki 글자 효과 칸의 [렌파이에서 보기]를 켜면, 줄이나 값을 바꿀 때마다 0.3초 뒤에 덮어씁니다. showpy는 개발 모드에서 0.25초마다 고친 시각을 보고, 바뀌면 화면 위 미리보기 창에서 그 줄을 다시 재생합니다(`ui_kit/editor/editor_preview.rpy`).

```json
{ "format": "pykaki-preview", "version": 1, "enabled": true, "line": "l5",
  "text": "여기 아무도 없는 거 맞지?", "say": { "size": 34, "cps": 30, "effect": "scatter" } }
```

| 값 | 뜻 |
|---|---|
| `enabled` | `false`면 미리보기 창을 닫음 (스위치를 끌 때) |
| `text` | 대사. 텍스트 태그를 끈 대본이면 `{`를 `{{`로 바꿔 보냄 |
| `say` | 대사 괄호 값(`SayStyle`). `cps`는 실제로 내보낼 값(효과의 기본값 30 포함). 위치와 이름 값은 미리보기에서 쓰지 않음 |

게임을 켤 때 이미 있던 파일은 띄우지 않습니다. 켤 때 파일이 없었으면 PyKaki가 처음 쓴 파일부터 띄웁니다. 폴더 권한이 없어 쓰지 못하면 PyKaki가 스위치 옆에 안내와 [권한 허용] 버튼을 보여 줍니다. 배포판에서 빠집니다.

## 8. 등장 효과 셰이더 (`text_effects.glsl`)

등장 효과의 셰이더 코드는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나에 있습니다. PyKaki는 사본 없이 이 파일을 바로 가져다 빌드합니다(`pykaki/src/fx/textShaders.ts`의 `?raw` 가져오기).

| 누가 | 어떻게 쓰나 |
|---|---|
| showpy `engine/text_effects.rpy` | init에서 읽어 효과마다 `renpy.register_textshader`로 등록. 편집기 대사 탭의 효과 버튼 이름도 여기서 |
| PyKaki `src/fx/textShaders.ts`, `src/fx/FxCanvas.tsx` | 같은 코드를 렌파이가 셰이더 조각을 합치는 방식대로 합쳐 WebGL로 미리보기를 그림. 효과 목록, 한글 이름, 글자/초 기본값(`@cps`)도 여기서 |

적는 법은 파일 맨 위에 있습니다. `@effect 이름 한글이름`, `@cps`, `@slow 식`, `@redraw`, `@outline`, `@set u__이름 값`, `@variables`, `@vertex_N`, `@fragment_N`, `@part`/`@use`, `RAND(n)`. 두 프로그램의 읽는 코드(showpy `tfx_parse`, PyKaki `parseShaders`)는 같은 규칙이라 표시를 새로 만들면 둘 다 고칩니다.

렌파이에 들어 있는 효과(`dissolve` 등 7개)는 렌파이가 등록하므로 showpy 파일에 없고, PyKaki가 미리보기용으로 `src/fx/renpy_textshaders.glsl`에 같은 형식으로 옮겨 둡니다.

## 9. 실시간 연결 (`game/showpy_live.json`, showpy 4.15, 커서/대사 소리 4.16, 패널 통째로 4.17)

PyKaki 데스크톱 앱의 showpy 화면이 게임 안 편집기를 바깥에서 조종하는 연결입니다. 게임 창은 그대로 두고, 패널(숫자, 목록, 대본)만 앱에서 봅니다. 게임 화면에는 끌어서 옮기는 표시만 남습니다. 웹 버전 PyKaki에는 없습니다.

**찾기**: 게임이 개발 모드(`config.developer`)로 켜지면 showpy `editor/editor_live.rpy`가 `127.0.0.1`의 빈 포트를 열고 이 파일을 씁니다. 게임을 끄면 지웁니다. 배포판에는 넣지 않습니다.

```json
{ "version": 1, "port": 51234, "token": "9f2c...", "pid": 1234, "showpy": "3.14" }
```

앱(`pykaki/app/main.cjs`)은 `game` 폴더를 지켜보다가 이 파일이 생기거나 바뀌면 그 포트로 붙습니다. 끊기면 3초마다 다시 해 봅니다. 게임을 Shift+R로 다시 불러오면 포트가 바뀌어 파일이 다시 써지므로 앱이 따라옵니다.

**주고받기**: TCP, 한 줄에 JSON 하나(UTF-8, 줄 끝 `\n`). 앱이 처음 보내는 줄은 `{"hello": "<token>", "client": "pykaki"}`이고, 토큰이 틀리면 게임이 끊습니다. 붙는 앱은 하나뿐이라 새로 붙으면 앞의 연결을 끊습니다.

게임 → 앱 (`type`):

| type | 언제 | 내용 |
|---|---|---|
| `state` | 붙자마자, 그 뒤 바뀔 때마다 (0.1초마다 비교, 같으면 안 보냄) | 아래 |
| `files` | 붙자마자 한 번, 앱이 `files`를 보낼 때 (3.15) | `{"type": "files", "audio": ["audio/type.ogg"], "images": ["gui/ctc/ctc1.png", ...], "movies": ["movies/title.webm"]}` 게임 폴더 기준(`movies`는 3.19부터). 렌파이 `list_files`라 `.rpa` 안 파일도 들어감 |
| `error` | 명령 처리가 실패했을 때 | `{"type": "error", "text": "..."}` |
| `panel` | 게임 창에서 F9로 게임 안 편집기 패널을 보이게/숨기게 했을 때 (ui_kit 3.23) | `{"type": "panel", "hide": true}`. 앱은 이 값을 기억했다가(`localStorage` `pygaki-game-panel`) 다음에 붙을 때 `panel` 명령으로 보냄. 앱의 F9(단축키 `gamePanel`)도 같은 명령 |

```json
{
  "type": "state",
  "where": { "file": "game/script_flow.rpy", "line": 18, "screens": ["say", "quick_menu"], "main_menu": false, "menu": false },
  "editor": { "open": true, "tab": "title", "hide_panel": true, "message": "", "pending": 1,
              "tabs": [ { "id": "title", "label": "타이틀 메뉴", "ok": true, "why": "" } ],
              "info": [ "타이틀 메뉴  항목 1/5 ..." ] },
  "title": { "ok": true, "menu": "title", "sel": 0, "mode": "base", "scope": "item",
             "items": [ { "id": "start", "text": "시작하기", "x": 77, "y": 302, "anchor": [0.06, 0.42],
                          "rotate": -4, "skew": 0, "zoom": 1, "size": 36, "font": "...", "color": "#...",
                          "hover": { "offset": [10, 0], "rotate": -4, "skew": 0, "zoom": 1.15, "size": 36, "font": "...", "color": "#..." },
                          "edited": true } ] },
  "custom_ui": { "ok": true, "why": "", "cps": 30, "fps": 24, "max_frames": 12, "playing": false,
                 "values": { "text_cps": null, "typing_sound": "audio/type.ogg", "typing_volume": 1.0,
                             "ctc": true, "ctc_frames": ["gui/ctc/ctc1.png"], "ctc_hold": 2,
                             "cursor": false, "cursor_frames": [], "cursor_hold": 2, "cursor_mode": "software", "cursor_hotspot": [0, 0],
                             "quick_menu": true },
                 "edited": ["typing_sound"], "reload_keys": ["cursor", "cursor_frames", "cursor_mode", "cursor_hotspot", "ctc"] }
}
```

- `where.file`은 프로젝트 폴더 기준 경로입니다(렌파이 `get_filename_line`). 앱이 그 파일을 읽어 `line` 앞뒤 줄을 보여줍니다.
- `custom_ui`(3.15)는 편집기 "커서/대사 소리" 탭입니다. `values`는 편집 중인 값 → `custom_ui_layout.rpy` → 설정 파일 순서로 지금 쓰는 값이고, 이름은 `custom_ui.EDIT_KEYS`와 같습니다. `cps`는 `text_cps`가 `null`일 때 환경설정의 지금 값. `edited`는 저장 안 한 값 이름, `reload_keys`는 저장한 뒤 게임을 다시 불러와야 적용되는 값(저장할 때 게임이 저절로 다시 불러옴). 플러그인이 없으면 `null`, 꺼져 있으면 `{"ok": false, "why": "..."}`. 3.14 게임은 이 값이 없습니다.
- `custom_ui.cursor_lines`(3.21, Screen FX 4.5가 있을 때)는 커서와 셰이더 '여기에서부터': `choices`([자리, 이름] `effect` 1번·2번 다 받음 / `overlay` 2번만 / `top` 안 받음), `now`(칸에 보일 자리), `picked`, `file`, `line`(고른 줄), `follow`, `here`([파일, 줄] 게임의 지금 줄), `rows`(고른 줄 주변 `{line, text, sel, here, dirty}`), `have`(고른 줄 위에 이미 있는 커서 줄), `pending`, `changes`(이 파일에서 커서가 바뀌는 줄 `{line, target, label, kind, pending}`). 셰이더 칸과 같은 줄 고르기를 씁니다.
- `panel`(3.16)은 게임 안 편집기 패널을 통째로 옮긴 것입니다. 편집기가 열려 있고 게임 안 패널이 숨어 있을 때(`panel` 명령 `hide: true`)만 있고, 아니면 `null`. 게임이 패널(`ui_editor_panel_body`)과 고르기 창(글꼴, 색, 그림/영상, 프레임 그림)을 화면 밖에 그려 두고(`ui_editor_live_mirror` 스크린) 그 위젯을 나무 모양으로 보냅니다.
  ```json
  "panel": { "tab": "screen_fx", "popup_kind": null, "popup": null,
             "body": { "k": "v", "c": [ { "k": "t", "t": "효과:" },
                                        { "k": "h", "c": [ { "k": "b", "id": "p.0.5.0.2", "t": "ASCII", "on": false, "ok": true } ] },
                                        { "k": "bar", "id": "p.0.5.5.1", "r": 1.0, "v": 0.5, "s": 0.01 } ] } }
  ```
  | k | 뜻 | 값 |
  |---|---|---|
  | `v`, `h`, `g` | 세로, 가로(줄바꿈), 격자 | `c` 안의 것들 |
  | `t` | 글 | `t`, 회색이 아닌 글자색이면 `c` |
  | `b` | 버튼 | `id`, `t`(글), `on`(고른 상태), `ok`(누를 수 있음), 안에 그림/색이 있으면 `c` |
  | `bar` | 막대 | `id`, `r`(범위, 0부터), `v`(지금 값), `s`(간격) |
  | `in` | 입력칸 | `id`, `t`(지금 글), `w`(1이면 넓은 글 칸: 게임 쪽 `xmaximum`이 300 이상. 앱은 패널 폭 가득, 세 줄 칸으로 그림, ui_kit 3.23) |
  | `img` | 그림 | `p`(game 기준 경로) |
  | `col` | 색 견본 | `v`(#rrggbbaa) |

  `id`는 위젯 자리 번호라 화면이 바뀌면 다른 것을 가리킬 수 있습니다. 버튼은 `t`를 같이 보내서 글이 다르면 게임이 누르지 않습니다. 창 바탕, 세로 스크롤바, 거의 투명한 색, 무지개 띠 같은 꾸밈은 보내지 않습니다.
- `title`은 `tmenu`가 없거나 꺼져 있으면 `null`입니다. `menu`는 지금 보이는 메뉴(`"title"` 타이틀 / `"pause"` ESC 메뉴), `x`, `y`는 화면 픽셀입니다.
  - 3.19부터: `items`의 메뉴 항목 뒤에 제목, 부제가 `"kind": "label"`, `"name": "제목"`으로 붙습니다(`sel` 번호도 이어짐). 항목마다 `"kind": "item"`, `"effect"`(글자 효과 이름 또는 `null`). `title`에 `"background"`(이 메뉴의 배경 그림/영상 경로, 없으면 `null` = 타이틀 검은 화면 / ESC 메뉴 투명), `"effects"`(고를 수 있는 글자 효과 `[[이름, 표시], ...]`, 첫째는 `[null, "없음"]`).
- `flow`(ui_kit 4.1 + screen_fx 5.2)는 화면 효과 탭의 **줄기표**입니다. Screen FX가 없거나 예전 판이면 `null`(또는 없음), 접혀 있으면 `{"open": false}`.
  ```json
  "flow": { "open": true, "file": "game/script.rpy", "range": [5, 9], "sel": 15, "here": 10,
            "points": [ ["game/script.rpy", 16] ],
            "rows": [ { "l": 12, "k": "fx", "d": 0, "g": [0], "t": "셰이더: 1번 아스키 + 2번 기본 (설정대로)", "c": "#ff8fbf",
                        "a": "#4fc3f7", "b": null, "s": "1번 아스키 + 2번 기본", "p": ["game/script.rpy", 13], "i": false } ] }
  ```
  행(`rows`)은 원고 줄 순서이고 가지(선택지, `if`)는 그 블록이 이어서 나옵니다. `l` 원고 줄, `k` 종류(`label`, `branch` 선택지/조건 머리, `say`, `stmt`, `fx` 셰이더 줄, `jump`(return 포함), `call`, `show`(scene/show/hide/with), `menu`(menu/if/while)), `d` 깊이, `g` 이 행을 지나는 세로선 깊이, `t` 보일 글, `c` 글자색(어두운 바탕용), `a`/`b` 그 줄에 덮인 1번/2번 셰이더 색(없으면 `null`), `s` 두 자리 이름, `p` 전환 점이면 그 대상 [파일, 줄](전환을 바꾸면 이 줄 위의 셰이더 줄이 바뀜), `i` 고를 수 있는 줄. `range`는 고른 구간(행 번호), `sel` 고른 줄, `here` 게임의 지금 줄, `points` 고른 전환 점. [이 구간에 적용], 되돌리는 곳, 전환 고르기는 `panel`의 버튼입니다.
- `editor.pending`은 저장할 것의 수입니다. 3.19부터 원고에 넣을 줄(화면 효과 "여기에서부터 적용" 등)도 셉니다.

앱 → 게임 (`cmd`):

| cmd | 값 | 하는 일 |
|---|---|---|
| `editor` | `open`(참/거짓), `tab`(선택) | 편집기 열기/닫기. 열 때 그 탭으로 |
| `tab` | `id` | 탭 바꾸기 (그 화면에서 쓸 수 있을 때) |
| `panel` | `hide`(참/거짓) | 게임 안 편집기 패널 숨기기. 숨겨도 끌기와 단축키는 그대로 |
| `goto` | `where`: `"pause"`, `"title"`, `"start"`, `"line"` (+ `file`: `"game/…rpy"`, `line`: 줄 번호) | ESC 메뉴 열기 / 타이틀로 가기(진행 중인 게임은 끝남) / 타이틀에서 게임 시작(3.16) / 원고의 그 줄로(3.20): 이번에 지나온 줄이면 되감기, 아니면 렌파이 warp(게임을 다시 시작해서 그 줄까지 scene/show만 따라 함, 변수는 빠질 수 있음). 빈 줄, 주석 줄은 그 뒤 첫 문장, 아니면 그 줄이나 그 앞 문장 |
| `panel.do` | `id`, 버튼은 `t`, 막대와 입력칸은 `value`, 입력칸은 `enter`(참이면 Enter까지) | `panel`의 그 자리 위젯을 누름 / 막대 값 바꿈 / 입력칸 글 넣기 (3.16) |
| `title.select` | `index` | 고친 항목 고르기 |
| `title.mode` | `mode`: `"base"`, `"hover"` | 평소 / 선택됐을 때 |
| `title.scope` | `scope`: `"item"`, `"all"` | 이 항목만 / 모든 항목 공통 |
| `title.set` | `key`, `value` | 고른 항목(공통이면 공통 값)의 값. `key`는 `title_menu_layout.rpy`와 같은 이름(`text`, `x`, `y`, `rotate`, `skew`, `zoom`, `size`, `font`, `color`, `effect`, `hover_offset`, `hover_rotate` ...). 제목, 부제를 골랐으면 그 글자의 값(공통 값으로 가지 않음, 3.19). `value`가 `null`이면 그 값을 지움 |
| `title.reset` | | 고른 항목(공통이면 공통 값)의 저장 안 한 변경 되돌리기 |
| `title.background` | `value`(경로 또는 `null`) | 지금 메뉴의 배경 그림/영상 (3.19). `null`이면 타이틀은 검은 화면, ESC 메뉴는 투명 |
| `custom_ui.set` | `key`, `value` | 커서/대사 소리 값 하나 (3.15). `key`는 `values`의 이름. 그림은 game 기준 경로 목록(12장까지), `*_hold`는 1 또는 2, `text_cps`가 `null`이면 options.rpy 값, `typing_sound`가 `null`이면 끔. `ctc`, `cursor`를 켤 때 그림이 없으면 첫 그림 폴더를 넣음 |
| `custom_ui.reset` | `key` | 그 값의 저장 안 한 변경 되돌리기 |
| `custom_ui.listen` | | 지금 고른 대사 소리를 게임에서 1.5초 들려줌 (`playing`이 참) |
| `custom_ui.stop` | | 들려주던 소리 멈춤 |
| `custom_ui.cursor` | `do`: `mode`(+ `mode`) / `pick`(+ `file`, `line`, 게임도 그 줄로) / `step`(+ `n`) / `here` / `apply` / `remove` / `leave` | 커서와 셰이더 '여기에서부터' (3.21). `mode`는 미리 보기도 함, `apply`는 고른 줄 위에 `$ screen_fx.set_cursor("…")`(저장하면 원고에), `leave`는 미리 보기 끝 |
| `flow` | `do`: `open` / `close` / `toggle` / `range`(+ `a`, `b` 행 번호, `a`가 `null`이면 구간 풀기) / `pick`(+ `row`, 그 행부터 처음 고를 수 있는 줄을 고르고 게임도 그 줄로) / `point`(+ `target` [파일, 줄], 전환 점 고르기/풀기) / `delete`(고른 구간 안과 끝 다음 '원래대로' 줄, 고른 전환 점의 셰이더 줄을 지우기로 함. 대사 괄호면 `fx=`를 뺌. 저장하면 원고에서 빠짐) | 줄기표 (ui_kit 4.1 + screen_fx 5.2). 앱이 패널을 가져가 있으면 게임 창의 줄기표 서랍은 숨음 |
| `files` | | 파일 목록(`files`)을 다시 보내 달라고 함 |
| `save` | | 편집기 Ctrl+S와 같음 (배치 파일과 원고 저장) |
| `discard` | | 지금 탭의 저장 안 한 변경을 모두 버림 |

저장은 지금처럼 게임이 합니다(`*_layout.rpy`, 원고). 앱은 값을 보내기만 하고 showpy 파일을 직접 쓰지 않습니다.

## 10. 확인 상태 (showpy 4.13, 렌파이 8.5.3)

**자동으로 실행해서 확인함:**
- 실시간 미리보기: showpy는 미리보기 파일을 바꾸면 창이 새 줄로 바뀌고 `enabled: false`면 닫힘. PyKaki는 스위치를 켜고 고치고 끌 때 파일 내용이 맞음. **둘을 동시에 켜 놓고 확인하지는 않음**
- `cps`로 대사 속도가 바뀜 (`preferences.text_cps = 0`인 프로젝트에서. `speed`는 이 프로젝트에서 효과 없음)
- 대사 탭 함수로 위치와 화면 효과 저장 → 받아 적기 → 다시 내보내기를 하면 값이 그대로 남음. PyKaki 원고에서 글자 크기 바꾸기는 막힘
- `script.rpy`가 그대로 있거나, 지웠거나, 플러그인이 없어도 게임 시작이 첫 상자로 이어짐
- 플레이 화면의 그림, 표정, 선택지, 뒤로 가기, 상자 가운데서 시작, F8과 Esc. **브라우저 전체화면은 시험 도구에서 되지 않아 창을 덮는 화면으로 확인함**
- 샘플의 세 갈래와 call에서 지금 상자 추적이 맞음. `label ward:` 아래 `label ward.n1:`이 이어져도 동작함
- 줄 넣기 → 받아 적기 → 다시 내보내기를 하면 `.rpy`가 글자 하나까지 같음
- 대사 저장 막기, 위치 저장과 우선순위
- PyKaki 화면에서 폴더 연결, 목록 찾기, 창으로 돌아올 때 받아 적기, 내보내기. **브라우저의 폴더 선택창은 시험 도구로 바꿔서 돌림**

- 등장 효과 셰이더 파일: 새 `text_effects.rpy`가 파일을 읽어 등록하는 값(셰이더 코드, 기본값, 기다리는 시간, 다시 그리기)이 4.12와 20개 모두 같음 (렌파이 없이 등록 함수를 바꿔 끼워 비교). **렌파이 Lint와 실행은 아직 안 함**
- PyKaki WebGL 미리보기: 효과 27개를 렌파이 견본 영상과 같은 조건(1280x720, 글자 40, 30글자/초, 같은 문장)으로 프레임마다 찍어 나란히 비교해 모양과 순서가 맞음. 여러 줄, 색과 굵기 태그, WebGL을 끈 브라우저(CSS로 돌아감)도 확인

**아직 사람이 확인해야 함:**
- 바뀐 showpy(4.13)를 렌파이에서 Lint하고 실행해 효과가 그대로 나오는지
- 실제 폴더 선택창과 권한 창을 누르는 것
- 소리가 실제로 나는지 (플레이 화면에서 재생이 시작되는 것까지는 확인함)
- 크롬과 엣지에서 F8로 실제 전체화면이 되는 것
- 플레이 화면과 렌파이의 글자 효과, 전환이 비슷해 보이는지
- 편집기에서 마우스로 끌어 그림과 대사 위치를 저장하는 것 (같은 함수를 코드로 불러서 확인함)
- 자동 다시 불러오기가 켜진 채 PyKaki가 파일을 쓰는 것 (다른 방법으로 파일을 바꾼 경우만 확인함)

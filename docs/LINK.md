# pygaki 플러그인과 PyKaki 연결 약속

두 프로그램이 서로 맞춰야 하는 형식을 적은 문서입니다. 두 프로그램은 pygaki 저장소의 `showpy/`, `pykaki/` 폴더에 같이 들어 있고, 이 문서는 저장소 맨 위 `docs/`에 하나만 있습니다.

## 1. 역할

| 다루는 것 | 어디서 | 어디에 저장 |
|---|---|---|
| 대사, 선택지, 흐름 | PyKaki | `.flow.json` |
| 그림, webm 영상, 음악, 효과음 넣기 | 주로 GUI 편집기 (PyKaki에서도 칸으로 넣을 수 있음) | `.flow.json` (showpy에서 넣으면 PyKaki가 받아 적음) |
| 그림 위치 | GUI 편집기만 | `game/ui_kit/stage_layout.rpy` |
| 대사 글자 크기, 글꼴, 색, 속도, 등장 효과 | PyKaki | `.flow.json` |
| 대사와 이름의 위치, 줄마다 바꾸는 화면 효과 | GUI 편집기 대사 탭 (PyKaki는 받아 적어 보여 줌) | `.flow.json` |

```
PyKaki (.flow.json이 원본)
   │  내보내기: game/script_flow.rpy에 씀
   ▼
렌파이 + GUI 편집기
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
| `# PyKaki가 만든 파일이에요.` (파일 앞 5줄 안) | PyKaki 원고. 문구를 바꾸면 양쪽을 같이 고칩니다 | pygaki 플러그인 `script_edit.is_pykaki` |
| `# @node:ID 제목` | 상자의 시작 | 그 줄이 어느 상자인지 찾을 때 |
| `label 그룹.ID:` | 모든 상자에 붙는 로컬 label | 실행 중 지금 상자를 알 때 (`config.label_callbacks`) |
| `# @l:ID` | 바로 다음 줄이 그 id의 대본 줄 | 줄 넣기, 줄 바꾸기의 기준 |
| `# @end:ID` | 여기부터 상자의 나가는 부분(선택지, jump, return) | 선택지 앞에 줄을 넣을 때 |

**줄 끝 표시** (pygaki 플러그인 `ui_kit` 4.5, PyKaki `generateRpy`의 `endMarks`): 연결한 게임의 `game/ui_kit/engine/script_edit.rpy`에 `PK_END_MARKS = True`가 있으면, PyKaki는 표시를 윗줄에 따로 두지 않고 그 줄 끝에 빈칸 두 개를 두고 붙입니다. 뜻은 위 표와 같습니다.

```renpy
label ward:
label ward.n1:  # @node:n1 도입
    scene bg hall with fade  # @l:l1
    mina "여기 아무도 없는 거 맞지?" (fx_warp=3)  # @l:l5
    menu:  # @end:n1
        "문을 연다":
            jump ward.n4
```

- `# @l:ID`는 그 대본 줄이 쓴 줄들 가운데 첫 문장 끝에(메모 줄처럼 문장이 없으면 첫 줄 끝에), `# @node:`는 상자의 마지막 label 줄 끝에, `# @end:`는 나가는 부분의 첫 줄 끝에 붙습니다.
- 끝에 붙일 수 없으면 예전처럼 윗줄에 따로 씁니다: 내용이 없는 줄(빈 직접 명령), 다음 줄로 이어지는 줄(끝이 `\`이거나 따옴표가 안 닫힌 직접 명령), 나가는 줄이 없는 상자(다음 상자로 그냥 이어짐)의 `# @end:`.
- 그래서 읽는 쪽은 **두 자리를 모두** 봅니다: 그 줄 끝의 표시, 없으면 바로 윗줄의 표시. 한 파일에 두 형식이 섞여 있어도 됩니다. 플러그인이 새 줄을 넣을 때는 그 원고에 줄 끝 `# @l:`이 하나라도 있으면 줄 끝에, 아니면 윗줄에 표시를 씁니다.
- 플러그인이 4.5보다 예전이거나 폴더를 연결하지 않았으면(웹에서 파일로 받기 포함) PyKaki는 예전 형식으로 내보냅니다. 예전 플러그인은 줄 끝 표시를 못 읽기 때문입니다.
- 받아 적기 기록(3장)의 `code`에는 표시를 붙이지 않습니다.

대사 줄 괄호에는 PyKaki의 `say` 값(`SayStyle`)이 짧은 이름으로 붙습니다. pygaki 플러그인 `say_style`이 받습니다.

| 괄호 | PyKaki 값 | 뜻 |
|---|---|---|
| `size=30`, `font="…"`, `color="#…"`, `cps=30` | `size`, `font`, `color`, `cps` | 글자 모양과 속도 |
| `effect="slidein"`, `effect="slidein|shake"` | `effect` | 등장 효과. 두 효과 겹치기는 `|` (pygaki 2.0, `FEATURE` 3) |
| 글 안의 `{shader=shake}글{/shader}` | 대사 글 그대로 | 글의 일부에만 등장 효과(렌파이 텍스트 태그). 값은 `effect`와 같은 문법. 줄에 `effect`가 없으면 PyKaki가 `effect="typewriter"`를 붙여 내보내고(없으면 렌파이가 멈춤), 손으로 쓴 원고는 `say_style`이 같은 일을 함(`ui_kit` 4.4) |
| `box="bubble"`, `box="pill"` | `box` | 글 상자: 말풍선, 둥근 테두리 (pygaki 플러그인 `ui_kit` 4.0 `text_box.rpy`, `FEATURE` 3) |
| `tail="top"`, `tail=None` | `tail` (`bottom` `top` `left` `right` `none`) | 말풍선 꼬리. 비우면 상자 기본(말풍선은 아래, 둥근 테두리는 없음) |
| `box_rotate=-4` | `box_rotate` | 상자와 글 기울기 (도) |
| `x=…`, `y=…`, `name_x=…`, `name_y=…` | 위치 | pygaki 플러그인이 정해서 PyKaki가 받아 적음 (3장) |

상자의 나머지 값(`bubble_color`, `pill_line` 등)은 pygaki 플러그인 원고나 `say_style.box_styles`에서만 고칩니다. 연결을 끈 파일에는 상자와 pygaki 플러그인 효과를 내보내지 않습니다(검사 탭에 경고).

**상자와 label의 셰이더** (PyKaki `FEATURE` 5, `src/shader.ts`): 대본에서 상자나 label에 셰이더를 한 곳이라도 정하면, PyKaki는 **모든 상자의 첫 줄**(상자 label 바로 아래, 첫 `# @l:` 앞)에 표시 없이 `$ screen_fx.shaders("ascii", "vhs_crt", transition="fade")`를, 셰이더가 없는 상자에는 `$ screen_fx.clear()`를 적습니다. `call` 줄 바로 뒤에도 한 번 더 적습니다. PyKaki가 고르게 하는 전환은 `transition="tv"`와 `transition=None` 둘입니다(예전 판으로 쓴 대본에는 `transition="fade"`나 전환을 적지 않은 줄이 남아 있을 수 있고, 그대로 내보냅니다. 플러그인은 셋 다 그대로 받습니다). pygaki 플러그인 `screen_fx.use`가 같은 값이면 전환 없이 넘어가는 것에 기댑니다(이 동작을 바꾸면 PyKaki `exportRpy.ts`도 같이). 이 줄은 `# @l:` 표시가 없어서 받아 적기(3장)의 대상이 아니고, 내보낼 때마다 대본 값으로 다시 만들어집니다. 게임 안 편집기에서 이 줄을 고치거나 지워도 다음 내보내기 때 되돌아옵니다.

**셰이더와 TV 전환의 세부 값** (PyKaki `FEATURE` 6, screen_fx 5.5): 상자·label의 셰이더 칸에서 고른 셰이더 아래 막대로 값을 바꾸면 대본에 `shader.va`(1번), `shader.vb`(2번), `shader.tv`(TV 전환)로 저장되고, 원고 줄에 이렇게 붙습니다.

```renpy
$ screen_fx.shaders("vhs_crt", "none", transition="tv", tv={"off_time": 0.6}, values={"vhs_crt": {"warp_amount": 2.0}})
$ screen_fx.clear(transition="tv", tv={"noise": 0.2})
```

- `values`: `{셰이더 이름: {값 이름: 값}}`. 플러그인은 고른 두 자리 셰이더의 바꾼 값(`<이름>.set()`과 같은 곳, 세이브·되감기에 저장)을 **이 값으로 바꿉니다**. `{}`이면 설정대로. 대본 어딘가에 값을 하나라도 정했으면 PyKaki는 **모든 셰이더 줄에** `values`를 적어서 앞 상자의 값이 다음 상자에 남지 않게 합니다. 아무 데도 안 정했으면 `values`를 적지 않습니다(전과 같은 줄).
- `tv`: 이번 TV 전환에만 쓰는 값(`screen_fx.tv`와 같은 이름: `off_time` `black_time` `on_time` `line` `flash` `noise` `volume`). 전환이 `"tv"`일 때만 적습니다. 전환의 값은 그 전환을 고른 상자·label의 것(시작할 때는 들어오는 상자, 끝날 때는 나가는 상자)을 씁니다.
- 값 이름과 막대 범위는 11장 `shader_list.json`의 `params`, `groups`에서 옵니다. 목록 값(`choice`)이 여러 칸이면 튜플로 적습니다.
- PyKaki는 게임의 `shader_list.json`의 `screen_fx`가 5.5 이상일 때만 `values`와 `tv`를 적습니다. 예전 판이면 값 없이 내보내고 검사 칸에 알립니다.

**상자와 label의 대사 소리, 커서, 클릭 대기** (PyKaki `FEATURE` 7, `src/boxUi.ts`, pygaki 플러그인 ui_kit 4.7 `custom_ui.scene`): 대본 어딘가에 대사 소리, 커서, 클릭 대기를 한 곳이라도 정하면 PyKaki는 **모든 상자의 첫 줄**(셰이더 줄 바로 다음)과 `call` 줄 바로 뒤에 표시 없이 이 줄을 적습니다. 값은 상자 → label → 게임 처음 값 순서로 값마다 따로 찾습니다.

```renpy
$ custom_ui.scene(typing_sound="audio/soft.ogg", ctc="gui/ctc/heart", cursor="gui/cursor/hand")
$ custom_ui.scene(typing_sound=None)   # 이 장면은 대사 소리 끔
$ custom_ui.scene()                    # 모두 게임 처음 값으로
```

- `typing_sound`: game 기준 소리 파일, `None`이면 끔, 안 적으면 게임 처음 값. 캐릭터에 정한 `cb_typing_sound`가 먼저입니다.
- `ctc`, `cursor`: 그림이 든 폴더(game 기준). 플러그인은 그 폴더 바로 아래의 그림(`png` `webp` `jpg`)을 이름 차례(1, 2, 10)로 돌립니다. 그림이 없으면 게임 처음 값. 클릭 대기 표시와 커서는 게임 처음 값(`custom_ui_layout.rpy`)에서 켜 둔 것만 바뀌고, 커서는 소프트웨어 커서일 때만 바뀝니다.
- 값은 `store.custom_ui_scene`에 두어 세이브와 되감기에 남습니다. 같은 값이면 아무것도 하지 않습니다.
- **텍스트 속도**는 이 줄에 적지 않고, 그 상자의 대사·내레이션 줄 가운데 속도를 따로 정하지 않은 줄의 괄호에 `cps=`로 적습니다(플러그인 연결을 끄면 `what_slow_cps=`).
- PyKaki는 연결한 게임의 `ui_kit/engine/custom_ui.rpy`에 `def scene(`가 있을 때만 이 줄을 적고, 없으면 검사 칸에 알립니다(폴더를 연결하지 않았으면 적음). 이 줄도 받아 적기(3장) 대상이 아니고 내보낼 때마다 다시 만들어집니다.

`renpyLink`를 끈 파일에는 `# @l:`이 없습니다. pygaki 플러그인은 이런 원고에 그림 줄을 저장하지 않고, 연결을 켜고 다시 내보내라고 안내합니다.

## 3. `game/showpy_inbox.json`

pygaki 플러그인이 쓰고, PyKaki가 읽은 뒤 비웁니다. PyKaki가 읽은 기록만 지우므로 그사이 pygaki 플러그인이 더 적은 기록은 남습니다.

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
| `op` | `insert` 줄 넣기, `replace` 줄 바꾸기, `remove` 줄 지우기(pygaki 플러그인 4.22), `say_pos` 대사 위치, `say_fx` 대사 화면 효과 |
| `code` | 렌파이 명령 한 줄 |
| `box` | 줄이 들어갈 상자. 기준 줄이 사라졌을 때 그 상자의 끝에 넣습니다 |
| `before` `after` `end` | `insert`의 자리. 줄 앞, 줄 뒤, 상자 끝 중 하나 |
| `line` | `replace`, `remove`, `say_pos`, `say_fx`로 바꾸거나 지울 줄의 id |
| `pos` | `say_pos`의 값. `x` `y` `name_x` `name_y`, 대사창 왼쪽 위 기준. `null`이면 지움 |
| `sayFx` | `say_fx`의 값. PyKaki `LineFx`와 같은 이름: `fx` `transition`(`none`은 바로) `overlay`(`on` `off`) `warp` `cursor` `exclude`(목록). `null`이면 지움 |

`say_pos`, `say_fx`를 받으면 그 대사 줄의 괄호에 같은 값을 내보냅니다. 괄호 순서는 PyKaki 순서로 정리됩니다. 예전 PyKaki는 이 기록을 모른 채 지우므로 두 프로그램을 같이 올립니다.

`code`는 `show` `scene` `hide` `play` `stop`으로 시작하는 줄과, 셰이더·커서 칸이 넣는 `$ screen_fx.`로 시작하는 줄(pygaki 플러그인 4.22: `shaders`, `set_cursor`. 고른 줄 바로 위의 같은 줄들은 `replace`/`remove`로 바꿈)만 들어옵니다. PyKaki(`src/inbox.ts`)는 칸으로 나타낼 수 있으면 칸이 있는 연출 줄로, 아니면 "직접 명령" 줄로 바꿉니다.

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

GUI 편집기가 만듭니다. PyKaki는 쓰지 않습니다(예전에는 PyKaki 안 플레이 화면이 그림 자리를 잡을 때 읽었는데, 플레이 화면은 2026-11-12에 없앴습니다).

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

## 6. PyKaki가 읽는 게임 값

PyKaki는 연결한 game 폴더에서 아래 값을 글자로 찾아 읽습니다(대사 미리보기의 글꼴·색·속도, 그림·소리 목록 등). 게임 코드를 실행하지 않습니다. PyKaki 안 플레이 화면은 2026-11-12에 없앴고, 대본은 렌파이로 켜서 봅니다.

| 파일 | 읽는 값 |
|---|---|
| `gui.rpy` | `gui.init` 크기, 글자 크기, 색, 글꼴, 대사창과 이름 자리 |
| `options.rpy`, `ui_kit/custom_ui_config.rpy` | 기본 텍스트 속도 (`custom_ui.text_cps`가 먼저) |
| `gui/textbox.png`, `gui/namebox.png` | 대사창과 이름 배경 |
| `ui_kit/stage_layout.rpy` | 그림 위치 |
| `ui_kit/engine/script_edit.rpy` | `PK_END_MARKS = True`가 있는지 (있으면 줄 끝 표시로 내보냄, 2장) |
| `images/`, `movies/`, `audio/` | 그림, 영상, 소리 |

## 7. `game/pykaki_preview.json` (렌파이 실시간 미리보기, 없앰)

PyKaki 글자 효과 칸의 [렌파이에서 보기] 스위치와 이 파일은 없앴습니다(2026-11-11, `ui_kit` 4.3). PyKaki는 이 파일을 쓰지 않고 pygaki 플러그인은 읽지 않습니다. 글자 효과는 PyKaki의 미리보기로 보고, 게임에서는 자동 내보내기(7-1)로 그 줄에 가서 봅니다.

예전 프로젝트의 `game` 폴더에 이 파일이 남아 있을 수 있습니다. 지워도 되고, 그대로 두어도 배포판과 묶음에서 빠집니다(`editor_preview.rpy`의 `build.classify`, `bundle/make_bundle.py`).

### 7-1. 자동 내보내기와 `game/pykaki_goto.json` (ui_kit 4.2)

PyKaki는 렌파이 연결(`renpyLink`)을 켜고 폴더를 연결했으면, 대본이 바뀌고 자동 저장할 때(0.7초 뒤) `script_flow.rpy`를 다시 씁니다(Ctrl+E와 같은 원고, 바뀐 것이 없거나 검사 오류가 있으면 쓰지 않음). 쓰기 바로 전에 `pykaki_goto.json`을 씁니다. Ctrl+E로 내보낼 때도 같습니다.

```json
{ "format": "pykaki-goto", "version": 1, "file": "game/script_flow.rpy", "line": 12, "time": 1794282904000 }
```

- `line`: 지금 쓰는 줄(`# @l:<줄 id>` 표시 다음의 첫 문장)의 원고 줄 번호. 쓰는 줄이 없으면 고른 상자의 첫 줄. 툴바 [게임 줄 따라가기]를 끄면(`localStorage["pykaki-follow-line"] = "off"`) `null`
- pygaki 플러그인(개발 모드)은 0.25초마다 `script_flow.rpy`의 고친 시각과 크기를 보고, 같은 값을 두 번 보면 다시 불러옵니다(`renpy.reload_script`, Shift+R과 같음). 첫 줄에 "PyKaki가 만든 파일이에요"가 없으면 다시 불러오지 않습니다. GUI 편집기에 저장 안 한 값이 있으면 다시 불러오지 않고 알립니다
- 다시 불러오기 전에 `line`을 `renpy.session`에 두고, 다시 불러온 뒤 그 줄로 옮깁니다(앱 원고 칸의 줄 누르기와 같은 `goto_line`: 지나온 줄이면 되감기, 아니면 warp). 원고보다 5초 넘게 먼저 쓴 파일은 지난번 것이라 쓰지 않습니다
- `line`이 `null`이면 게임은 있던 자리에 남습니다. 렌파이는 warp로 들어간 게임을 다시 불러오면 타이틀로 가 버리므로, 그때는 보던 줄의 `# @l:` 표시를 새 원고에서 찾아 그 줄로 되돌립니다(다시 불러온 뒤 10초 안에 타이틀에 닿으면)
- 배포판에서 빠집니다
- **원고 덮어쓰기 막기**: PyKaki는 창을 열고 처음 `script_flow.rpy`를 쓰기 전에 있던 원고의 `# @node:<상자 id>` 표시를 봅니다. 표시가 둘 이상이고 그 절반 넘게가 지금 대본에 없는 상자면 다른 대본으로 만든 원고로 보고, 자동 내보내기는 쓰지 않고 알리며 Ctrl+E는 물어봅니다. 처음 덮어쓰기 전의 원고는 `game/script_flow.rpy.bak`으로 남깁니다(렌파이는 읽지 않고 배포판에서 빠짐)

## 8. 등장 효과 셰이더 (`text_effects.glsl`)

등장 효과의 셰이더 코드는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나에 있습니다. PyKaki는 사본 없이 이 파일을 바로 가져다 빌드합니다(`pykaki/src/fx/textShaders.ts`의 `?raw` 가져오기).

| 누가 | 어떻게 쓰나 |
|---|---|
| pygaki 플러그인 `engine/text_effects.rpy` | init에서 읽어 효과마다 `renpy.register_textshader`로 등록. 편집기 대사 탭의 효과 버튼 이름도 여기서 |
| PyKaki `src/fx/textShaders.ts`, `src/fx/FxCanvas.tsx` | 같은 코드를 렌파이가 셰이더 조각을 합치는 방식대로 합쳐 WebGL로 미리보기를 그림. 효과 목록, 한글 이름, 글자/초 기본값(`@cps`)도 여기서 |

적는 법은 파일 맨 위에 있습니다. `@effect 이름 한글이름`, `@cps`, `@slow 식`, `@redraw`, `@outline`, `@set u__이름 값`, `@variables`, `@vertex_N`, `@fragment_N`, `@part`/`@use`, `RAND(n)`. 두 프로그램의 읽는 코드(pygaki 플러그인 `tfx_parse`, PyKaki `parseShaders`)는 같은 규칙이라 표시를 새로 만들면 둘 다 고칩니다.

### 8-1. 효과 폴더 (`ui_kit/effects/*.glsl`, ui_kit 4.3)

기본 효과는 위의 한 파일에 그대로 두고, 더하는 효과는 `showpy/game/ui_kit/effects/`(게임에서는 `game/ui_kit/effects/`)에 파일 하나씩 둡니다. 같은 형식이고 기본 파일의 `@part`를 `@use`로 씁니다.

| 누가 | 어떻게 읽나 |
|---|---|
| pygaki 플러그인 `engine/text_effects.rpy` | 기본 파일 다음에 폴더의 `.glsl`을 이름 순서로. 틀린 파일은 건너뛰고 `say_style.TFX_ERRORS`에 이유 |
| pygaki 플러그인 `engine/image_effects.rpy` | 그 가운데 `@transition`을 장면 전환으로 등록. 원고에는 `with img_fx.use("이름"[, 초][, 값=…])` |
| PyKaki `src/fx/textShaders.ts` | 플러그인(`ui_kit`)이 있는 게임 폴더를 연결했으면 그 폴더의 파일만 읽음(`scanFolder` → `setFolderEffects`. 게임에서 뺀 샘플은 앱 목록에서도 빠짐). 연결하지 않았으면 빌드할 때 가져온 저장소의 샘플(`import.meta.glob`)을 씀. 못 읽은 파일은 알림 |
| PyKaki `src/effectsLib.ts` | 효과 파일을 넣고 뺌. 넣기 전에 위와 같은 규칙으로 검사해서 틀리면 쓰지 않음. 뺀 파일은 프로젝트 폴더의 `ui_kit_backup/effects/`에 남김(같은 이름이 있으면 `이름.날짜-시각.glsl`. 웹에서 game 폴더를 바로 골랐으면 `game/ui_kit_backup/effects/`) |

새 표시: `@transition 이름 한글이름`, `@time 초`, `@fragment`(전환의 색 코드. `l__t`, `l__uv`, `l__size`, `l__old`, `l__new`를 씀. 다른 자리의 색은 `texture2D(tex0, 자리)` 앞 그림, `texture2D(tex1, 자리)` 새 그림), `@param u__이름 최소 최대 한글이름`(막대). 두 프로그램의 읽는 규칙(이름은 `[a-z][a-z0-9_]*`, 이미 있는 이름은 못 씀, 코드가 없으면 틀린 파일)은 같아야 합니다.

### 8-2. 끈 효과 (`ui_kit/effects/effects_off.txt`, ui_kit 4.4)

효과를 지우지 않고 고르는 목록에서만 감추는 파일입니다. 효과 폴더 안에 있고, 없으면 모두 켠 것입니다.

```
# 끈 효과. 한 줄에 이름 하나
sweep
bands
```

- 한 줄에 효과 이름 하나. `#`부터 줄 끝까지는 설명, 빈 줄은 건너뜀. UTF-8(맨 앞 BOM은 무시)
- 글자 효과(`@effect`, 기본 효과와 렌파이 효과 `dissolve` 등 포함)와 그림 효과(`@transition`) 이름을 한 파일에 같이 적음. 모르는 이름은 그냥 둠(파일을 다시 넣으면 꺼진 채로 돌아옴)
- **등록은 다 합니다.** 끈 효과도 셰이더는 그대로 있어서 이미 쓴 대사, 타이틀, `img_fx.use("이름")`은 그대로 돎. 고르는 목록에서만 빠지고, 지금 그 효과를 쓰는 곳에서는 이름이 그대로 보임
- pygaki 플러그인: `say_style.TFX_OFF`(`text_effects.rpy`), 목록은 `say_style.tfx_listed`, `tmenu.effect_names`, `img_fx.listed`. 게임을 껐다 켜거나 Shift+R로 다시 읽음
- PyKaki: `scanFolder` 때 읽어 `EFFECTS`, `TRANSITIONS`(고르는 목록)에서 뺌. 그 효과를 쓴 줄의 칸에는 이름이 그대로 보이고 내보내기도 그대로. 켜고 끌 때(`effectsLib.ts` `setEffectOn`) 이 파일을 고쳐 씀: 그 이름의 줄만 더하거나 빼고, 설명 줄과 다른 이름은 그대로 둠

### 8-3. 효과 모음 (`showpy/effects_library/*.glsl`)

pygaki와 같이 오지만 게임에 저절로 들어가지 않는 효과 파일입니다. 형식은 효과 폴더와 같고, PyKaki가 빌드할 때 그대로 가져갑니다(사본 없음). 앱에서 [넣기]를 하면 그 게임의 `game/ui_kit/effects/`로 복사됩니다. 새 프로젝트마다 들어가는 샘플(`showpy/game/ui_kit/effects/`)도 게임에서 빼면 모음으로 보입니다. pygaki 플러그인은 이 폴더를 읽지 않습니다. 지금 들어 있는 것: 그림 효과 `slide`, `mosaic`, `blinds`.

대본에는 글자 효과가 이름 그대로(`say.effect`), 그림 전환이 `trans` 칸에 `img_fx.use("이름")`로 들어갑니다. pygaki 플러그인 연결이 꺼진 대본은 그림 전환을 `dissolve`로 내보냅니다. 적는 법 전체는 `showpy/game/ui_kit/effects/README.md`.

렌파이에 들어 있는 효과(`dissolve` 등 7개)는 렌파이가 등록하므로 pygaki 플러그인 파일에 없고, PyKaki가 미리보기용으로 `src/fx/renpy_textshaders.glsl`에 같은 형식으로 옮겨 둡니다.

## 9. 실시간 연결 (`game/showpy_live.json`, pygaki 플러그인 4.15, 커서/대사 소리 4.16, 패널 통째로 4.17)

PyKaki 데스크톱 앱의 [GUI 편집] 화면이 게임 안 편집기를 바깥에서 조종하는 연결입니다. 게임 창은 그대로 두고, 패널(숫자, 목록, 대본)만 앱에서 봅니다. 게임 화면에는 끌어서 옮기는 표시만 남습니다. 웹 버전 PyKaki에는 없습니다.

**찾기**: 게임이 개발 모드(`config.developer`)로 켜지면 pygaki 플러그인 `editor/editor_live.rpy`가 `127.0.0.1`의 빈 포트를 열고 이 파일을 씁니다. 게임을 끄면 지웁니다. 배포판에는 넣지 않습니다.

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
- `splash`(splash 2.2 + ui_kit 4.7)는 스플래시 페이지 목록입니다. `{"pages": [{"id": "logo", "title": "…", "new": false}], "cur": "logo"}`. 차례는 편집기의 페이지 차례, `new`는 `splash_config.rpy`에 없고 편집기에서 만든 페이지, `cur`는 편집기에서 고른 페이지. 스플래시가 없거나 예전 판이면 `null`(또는 없음). 앱은 GUI 편집 왼쪽 "스플래시" 카드에 페이지마다 항목을 보여 줍니다(`logo` 로고, `warning` 경고, `controls` 조작 방법, 나머지는 제목).
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
| `splash.page` | `id` | 스플래시 편집 탭에서 그 페이지를 고름 (splash 2.2). 목록에 없는 `id`는 무시 |
| `files` | | 파일 목록(`files`)을 다시 보내 달라고 함 |
| `save` | | 편집기 Ctrl+S와 같음 (배치 파일과 원고 저장) |
| `discard` | | 지금 탭의 저장 안 한 변경을 모두 버림 |

저장은 지금처럼 게임이 합니다(`*_layout.rpy`, 원고). 앱은 값을 보내기만 하고 pygaki 플러그인 파일을 직접 쓰지 않습니다.

## 11. 화면 셰이더 목록 (`screen_fx/shader_list.json`, `shaders_off.txt`, screen_fx 5.4. 세부 값 5.5)

상자와 label에 거는 셰이더(2장)의 이름을 PyKaki가 게임 폴더에서 읽습니다. 번호는 10장 뒤지만 쓰이는 차례 때문에 여기에 둡니다.

**`game/screen_fx/shader_list.json`** — 플러그인이 씁니다(`screen_fx.rpy` `_write_shader_list`, 개발 모드에서 게임을 켤 때, 내용이 달라졌을 때만). 저장소에도 기본 셰이더의 목록이 들어 있어서 게임을 한 번도 켜지 않은 새 프로젝트에도 있습니다. PyKaki는 읽기만 합니다.

```json
{ "version": 2, "screen_fx": "5.4",
  "shaders": [
    { "id": "boil", "label": "지글거림", "name": "지글거림", "order": 52, "overlay_only": false,
      "params": { "strength": ["float", 1.0], "amount": ["float", 1.5] },
      "groups": [ ["떨림", [ ["strength", "전체 세기", 0.0, 1.0, 0.01, 2] ]] ],
      "prefix": "u_boil_", "extra": false,
      "glsl": [ { "name": "boil.effect", "variables": "uniform sampler2D tex0; …",
                  "vertex_functions": "", "fragment_functions": "float bo_hash(vec2 p) { … }",
                  "vertex": [[200, "v_tex_coord = a_tex_coord;"]], "fragment": [[300, "…"]] } ] } ] }
```

- `shaders`의 차례는 편집기 버튼 차례. 끈 셰이더도 들어 있습니다(끈 것은 아래 파일로 가름).
- `id`는 `$ screen_fx.shaders("id", …)`에 적는 이름, `label`은 고르는 칸에 보이는 이름(`slot_label`), `name`은 효과의 이름.
- `params`는 값 이름 → `[종류, 기본값]`(`"choice"`면 세 번째에 고를 수 있는 값). 종류는 `float` `bool` `color` `vec2` `resolution` `choice` `str`.
- `groups`는 편집기 막대 묶음 `[묶음 이름, [줄…]]`. 줄은 `[값 이름, 보일 글, 최소, 최대, 한 칸, 소수 자리]` 또는 `[값 이름, 보일 글, "bool" | "color" | "options", …]`. 플러그인의 `GROUPS`를 그대로 적은 것입니다.
- 2판(`"version": 2`)부터 샘플용으로 `prefix`(값 이름 앞에 붙는 유니폼 머리. 값 `amount`는 `u_boil_amount`), `extra`(효과가 `extra()`로 값이나 그림을 더 넣는지. `true`면 PyKaki는 샘플을 그리지 않음), `glsl`(렌파이에 등록한 셰이더 조각: `renpy.gl2.gl2shadercache.shader_part`의 `raw_variables`, `vertex_functions`, `fragment_functions`, `vertex_parts`, `fragment_parts`. 못 꺼내면 `null`)이 더해집니다. 1판 파일도 그대로 읽고, 샘플만 "코드가 없어요"로 알립니다.
- PyKaki 샘플(`fx/ScreenFxCanvas.tsx`): `glsl`의 변수(uniform, varying)와 함수, `fragment`를 차례대로 합쳐 WebGL로 그립니다. 값은 `ShaderEffect._apply_values`와 같은 규칙(`choice`는 순서 번호, `bool`은 0/1, `color`는 0~1 세 값, `resolution`이 비면 화면의 절반, `str`은 안 보냄)이고, 렌파이가 넣는 `u_time` `u_model_size` `u_drawable_size` `u_lod_bias`와 플러그인의 `u_sfx_base`(1) `u_sfx_text`(0)도 넣습니다.
- 파일이 없거나 읽을 수 없으면 PyKaki는 빌드할 때 가져온 저장소의 목록(`showpy/game/screen_fx/shader_list.json`)을 씁니다. 폴더를 연결하지 않았을 때도 같습니다.

**`game/screen_fx/shaders_off.txt`** — 끈 셰이더. 한 줄에 `id` 하나, `#` 뒤는 설명, 파일이 없으면 다 켠 것(8-2장 `effects_off.txt`와 같은 규칙).

- 플러그인: `screen_fx.slot_choices()`가 끈 것을 뺍니다. 지금 고른 것은 남깁니다(`keep`). 효과 등록과 `screen_fx.shaders()`는 그대로라 이미 쓴 원고는 돕니다.
- PyKaki(`shader.ts` `shaderNames`): 고르는 목록에서 뺍니다. 이미 정해 둔 상자·label에는 "(끔)"으로 남고, 목록에 없는 이름은 "(이 게임에 없음)"으로 남습니다. 내보내는 줄은 대본 값 그대로입니다.
- PyKaki [효과] 화면의 [셰이더] 칸에서 켜고 끄면 PyKaki가 이 파일을 씁니다(`shaderLib.ts` `setShaderOn`). 적혀 있던 설명 줄과 다른 이름은 그대로 둡니다. 게임은 껐다 켜야(또는 다시 불러와야) 읽습니다.

## 10. 확인 상태 (pygaki 플러그인 4.13, 렌파이 8.5.3)

**자동으로 실행해서 확인함:**
- `cps`로 대사 속도가 바뀜 (`preferences.text_cps = 0`인 프로젝트에서. `speed`는 이 프로젝트에서 효과 없음)
- 대사 탭 함수로 위치와 화면 효과 저장 → 받아 적기 → 다시 내보내기를 하면 값이 그대로 남음. PyKaki 원고에서 글자 크기 바꾸기는 막힘
- `script.rpy`가 그대로 있거나, 지웠거나, 플러그인이 없어도 게임 시작이 첫 상자로 이어짐
- 샘플의 세 갈래와 call에서 지금 상자 추적이 맞음. `label ward:` 아래 `label ward.n1:`이 이어져도 동작함
- 줄 넣기 → 받아 적기 → 다시 내보내기를 하면 `.rpy`가 글자 하나까지 같음
- 대사 저장 막기, 위치 저장과 우선순위
- PyKaki 화면에서 폴더 연결, 목록 찾기, 창으로 돌아올 때 받아 적기, 내보내기. **브라우저의 폴더 선택창은 시험 도구로 바꿔서 돌림**

- 등장 효과 셰이더 파일: 새 `text_effects.rpy`가 파일을 읽어 등록하는 값(셰이더 코드, 기본값, 기다리는 시간, 다시 그리기)이 4.12와 20개 모두 같음 (렌파이 없이 등록 함수를 바꿔 끼워 비교). **렌파이 Lint와 실행은 아직 안 함**
- PyKaki WebGL 미리보기: 효과 27개를 렌파이 견본 영상과 같은 조건(1280x720, 글자 40, 30글자/초, 같은 문장)으로 프레임마다 찍어 나란히 비교해 모양과 순서가 맞음. 여러 줄, 색과 굵기 태그, WebGL을 끈 브라우저(CSS로 돌아감)도 확인

**아직 사람이 확인해야 함:**
- 바뀐 pygaki 플러그인(4.13)을 렌파이에서 Lint하고 실행해 효과가 그대로 나오는지
- 실제 폴더 선택창과 권한 창을 누르는 것
- 미리보기와 렌파이의 글자 효과, 전환이 비슷해 보이는지
- 편집기에서 마우스로 끌어 그림과 대사 위치를 저장하는 것 (같은 함수를 코드로 불러서 확인함)
- 자동 다시 불러오기가 켜진 채 PyKaki가 파일을 쓰는 것 (다른 방법으로 파일을 바꾼 경우만 확인함)

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
    { "id": "sp9a8f106", "op": "say_fx", "line": "l5", "sayFx": { "fx": "ascii", "overlay": "off", "warp": "3", "exclude": ["say"] } }
  ]
}
```

| 값 | 뜻 |
|---|---|
| `id` | `insert`면 새 줄의 id (`.rpy`의 `# @l:`과 같음). 이미 있는 id면 다시 넣지 않습니다 |
| `op` | `insert` 줄 넣기, `replace` 줄 바꾸기, `say_pos` 대사 위치, `say_fx` 대사 화면 효과 |
| `code` | 렌파이 명령 한 줄 |
| `box` | 줄이 들어갈 상자. 기준 줄이 사라졌을 때 그 상자의 끝에 넣습니다 |
| `before` `after` `end` | `insert`의 자리. 줄 앞, 줄 뒤, 상자 끝 중 하나 |
| `line` | `replace`, `say_pos`, `say_fx`로 바꿀 줄의 id |
| `pos` | `say_pos`의 값. `x` `y` `name_x` `name_y`, 대사창 왼쪽 위 기준. `null`이면 지움 |
| `sayFx` | `say_fx`의 값. PyKaki `LineFx`와 같은 이름: `fx` `transition`(`none`은 바로) `overlay`(`on` `off`) `warp` `cursor` `exclude`(목록). `null`이면 지움 |

`say_pos`, `say_fx`를 받으면 그 대사 줄의 괄호에 같은 값을 내보냅니다. 괄호 순서는 PyKaki 순서로 정리됩니다. 예전 PyKaki는 이 기록을 모른 채 지우므로 두 프로그램을 같이 올립니다.

`code`는 `show` `scene` `hide` `play` `stop`으로 시작하는 줄만 들어옵니다. PyKaki(`src/inbox.ts`)는 칸으로 나타낼 수 있으면 칸이 있는 연출 줄로, 아니면 "직접 명령" 줄로 바꿉니다.

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

## 9. 확인 상태 (showpy 4.13, 렌파이 8.5.3)

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

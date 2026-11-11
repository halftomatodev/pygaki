# PyKaki — 개발 명세서

지금 구현된 상태를 기준으로 정리한 명세예요. 처음 설계 문서(`../RENPY_FLOW_EDITOR_SPEC.md`)와 다른 곳은 이 문서가 맞아요.

- 사이트: https://halftomatodev.github.io/pygaki/
- 저장소: https://github.com/halftomatodev/pygaki (`pykaki/` 폴더)
- 사용자 가이드: [GUIDE.md](GUIDE.md)

## 1. 목적과 원칙

- Twine처럼 **상자와 선**으로 렌파이 대본의 흐름을 보며 쓰고, `.rpy`로 내보낸다.
- **원본은 툴의 JSON 파일**(`*.flow.json`)이다. `.rpy`는 결과물이다. 내보내기는 단방향이다.
- 서버가 없다. 모든 동작은 브라우저 안에서 일어나고, 대본은 사용자 PC에만 있다.

## 2. 기술 구성

| 항목 | 사용 |
|---|---|
| 화면 | React 18 + TypeScript |
| 상자/선 캔버스 | `@xyflow/react` 12 (React Flow) |
| 상태 관리 | `zustand` (실행 취소/다시 실행 포함) |
| 자동 정렬 | `elkjs` (layered 알고리즘) |
| 빌드 | Vite 5 + `vite-plugin-singlefile` → `dist/index.html` 한 파일 |
| 배포 | GitHub Actions → GitHub Pages (`main`에 push하면 자동) |
| 브라우저 저장 | IndexedDB (자동 저장, 버전 스냅샷) |
| 파일 저장 | File System Access API (크롬/엣지), 그 외 브라우저는 다운로드 |

## 3. 화면 구성

```
┌ 툴바: 새로 열기 저장 다른이름 │ 버전 저장/목록 │ +상자 정렬(전체/label/선택) 방향 │ ↶↷ │ ▶플레이 .rpy 내보내기 ┐
├ 왼쪽 ───────┬ 캔버스 ─────────────────────────┬ 오른쪽 탭 ────────────┤
│ 프로젝트 제목 │ label 묶음 배경(프레임)           │ 편집: 선택한 상자 설정 │
│ 캐릭터 목록   │ 상자(노드), 선(엣지)              │ 플레이: 테스트 플레이  │
│ label 목록    │ 미니맵, 확대/축소                │ 검사: 경고/오류 목록   │
│ 설정(이스케이프)│                                  │ 스크립트: .rpy 미리보기│
└──────────────┴──────────────────────────────────┴───────────────────────┘
```

- 왼쪽 칸과 오른쪽 칸은 캔버스 위쪽 양 끝의 작은 버튼(`.side-toggle`, `Canvas.tsx`)으로 따로 접고 편다(`store.hideLeft` `hideRight`, `localStorage['pygaki-hide-left']` `['pygaki-hide-right']`). 접어도 지우지 않고 CSS로만 숨긴다(플레이 상태 유지).
- 상자 머리와 label 틀 오른쪽 위에 [◐ 셰이더] 버튼. 누르면 오른쪽 편집 탭이 셰이더 고르기(`ShaderPanel.tsx`)로 바뀐다(4장).

## 4. 데이터 구조 (`src/types.ts`)

```jsonc
{
  "format": "renpy-flow",
  "version": 1,
  "project": { "title": "내 게임", "startNode": "n1" },
  "characters": [{ "id": "a", "name": "앨리스", "color": "#ff8fb1" }],
  "variables": [],                          // 2단계(플래그)용 자리
  "labels": [{ "id": "g1", "name": "scene_rain", "title": "비 오는 날", "color": "#dbeafe", "entry": "n1" }],
  "layout": { "direction": "TB" },          // TB | LR
  "settings": { "escapeBrackets": true, "allowTextTags": true, "escapePercent": true, "renpyLink": false },
  "nodes": [{
    "id": "n1", "group": "g1", "title": "도입", "pos": { "x": 0, "y": 0 }, "color": "#ff9500", // color는 없어도 됨
    "lines": [
      { "id": "l1", "type": "narration", "text": "비가 내렸다." },
      { "id": "l2", "type": "say", "who": "a", "attr": "smile", "text": "우산 있어?" },
      { "id": "l3", "type": "show", "text": "", "kind": "char", "who": "a", "attr": "smile", "at": "left", "trans": "dissolve" },
      { "id": "l5", "type": "music", "text": "", "file": "rain.ogg" },
      { "id": "l6", "type": "command", "text": "with vpunch" },
      { "id": "l4", "type": "note", "text": "작가 메모" }
    ],
    "exit": { "type": "next", "target": "n2" }
  }]
}
```

- **상자(node)**: 대사 묶음 하나. 반드시 label 그룹 하나(`group`)에 속한다. `color`(선택)는 상자 색으로, 없으면 label 색을 따른다. `.rpy`에는 영향이 없다.
- **label 그룹**: 렌파이 `label` 하나. 상자 여러 개를 묶는다. `entry`가 그 label의 첫 상자다.
- **줄(line) 종류**: `narration`(내레이션), `say`(캐릭터 대사, `who`=캐릭터 id, `attr`=표정 등), 연출 줄 5가지, `command`(렌파이 명령 그대로), `note`(주석).
- **연출 줄** (`src/stage.ts`): 명령을 직접 쓰지 않고 칸을 채운다. `text`는 쓰지 않는다.
  - `scene` `{ image, trans }`: 배경 이름(`bg` 뒤), 전환
  - `show` `{ kind, who, attr, image, at, trans }`: `kind`는 `char`(who+attr) | `bg`(image) | `etc`(image), 위치 `left`/`right`(비우면 가운데)
  - `hide` `{ kind, who, image, trans }`
  - `music` `{ file, stop }`, `sound` `{ file }`
  - `fx` `{ fx: { fx, transition, overlay, warp, cursor } }`: pygaki 플러그인 화면 효과 명령. 값은 `src/stage.ts`의 `FX_*`. 화면 효과는 렌파이 편집기에서 고치므로 줄 종류 목록에서 뺐고, 예전 파일의 이 줄만 그대로 보여 주고 내보낸다.
  - `trans`는 `dissolve` | `fade` | 비움, 또는 showpy에서 받아 적은 식(`stage.move("inleft", 0.8)` 등). 모두 선택 칸이라 예전 파일은 그대로 열린다.
- **대사 줄의 `fx`**: `say`, `narration` 줄도 같은 `fx` 값(`exclude` 포함)을 가질 수 있다. pygaki 플러그인 대사 탭에서 받아 적고, PyKaki에서는 고치지 않는다. 연결을 켜면 대사 괄호로 내보낸다.
- **대사 줄의 `say`** (`SayStyle`): `size` `font` `color` `cps` `effect` `box` `tail` `box_rotate` `name_size` `name_font` `name_color`는 PyKaki에서 고친다. `effect`는 두 효과를 `|`로 겹칠 수 있다(`slidein|shake`). `box`는 글 상자(`bubble` 말풍선, `pill` 둥근 테두리, pygaki 플러그인 `ui_kit` 4.0)이고 연결을 켰을 때만 내보낸다. 미리보기와 플레이 화면은 CSS로 비슷하게 그린다(`.sbox`, 셰이더 효과일 때는 기울기를 안 보여 줌). `x` `y` `name_x` `name_y`는 showpy에서 받아 적은 값을 보여 주고 지우기만 한다. 연결을 켜면 짧은 이름으로(`sayArgs`), 끄면 플러그인 없이 동작하는 렌파이 원래 이름(`what_size`, `what_slow_cps`, `what_textshader` 등)으로 내보낸다. 모두 선택 칸이라 예전 파일은 그대로 열린다.
- **나가는 방식(exit)**:
  - `next` `{ target }`: 다음 상자로
  - `menu` `{ choices: [{ id, text, target, mode:"jump", condition:null, actions:[] }] }`: 선택지
  - `call` `{ target, then }`: target을 call하고, 돌아오면 then으로. then이 없으면 return
  - `return`: 끝
- `condition`, `actions`, `variables`는 2단계(플래그)를 위해 비워 둔 자리다. 지금은 쓰지 않는다.
- id는 툴이 만든다. 상자는 `n01`, `n02` … 만든 순서 번호(`ops.nextBoxId`: 지금 있는 가장 큰 번호 다음, 지운 번호는 다시 안 씀, 99를 넘으면 `n100`. 한번 붙으면 안 바뀜. 예전 상자의 `n` + 영숫자 6자는 그대로 둠), 줄·선택지·label은 `l`/`c`/`g` + 영숫자 6자. 로컬 label 이름으로도 쓰이므로 영문 식별자 규칙을 지킨다.
- 불러올 때 `normalizeProject()`가 빠진 값을 채우고, 그룹이 없는 상자를 첫 그룹에 넣는다.
- **셰이더** (`BoxNode.shader`, `LabelGroup.shader`, `src/shader.ts`, `FEATURE` 5): `{ a, b, in?, out? }`. `a` `b`는 pygaki 플러그인 `screen_fx.shaders`의 1번, 2번 이름(`none`, `ascii`, `vhs_crt` …), `in` `out`은 전환(`tv` `fade` `none`, 비우면 게임 설정대로). 상자에 없으면 label 것, label에도 없으면 없음(`shaderOfBox`). 값이 없는 것이 기본이라 예전 파일은 그대로 열린다.
  - 내보내기: 셰이더를 한 곳이라도 정했고 `renpyLink`가 켜져 있으면 **모든 상자의 첫 줄**(상자 label 바로 아래, 첫 `# @l:` 앞)에 `$ screen_fx.shaders("a", "b"[, transition=…])`를, 셰이더가 없는 상자에는 `$ screen_fx.clear([transition=…])`를 적는다. pygaki 플러그인은 같은 값이면 전환 없이 넘어가므로(`screen_fx.use`의 `old == new`) 어느 길로 들어와도 맞다. `call` 줄 바로 뒤에도 한 번 더 적는다(불러온 장면이 바꿨을 때).
  - 전환(`enterTrans`): 그 상자의 `in` → 셰이더가 다른 앞 상자의 `out` → 없음(게임 설정). 상자 끝에는 줄을 넣지 않는다(선택지 화면이 바뀌지 않게).
  - 하나도 안 정한 대본에는 이 줄이 전혀 안 들어간다. `renpyLink`가 꺼져 있으면 검사 탭에 경고 한 줄.
  - 화면: 상자 머리와 label 틀 오른쪽 위의 `ShaderButton`(`BoxView.tsx`) → `store.openShader` → 오른쪽 편집 탭이 `ShaderPanel.tsx`. 그 상자만 골라져 있는 동안(label은 아무 상자도 안 고른 동안)만 열려 있다. 플레이는 상자에 들어갈 때 `stage.fx`에 이름만.
  - 예전 `fx` 줄(`screen_fx.use`)은 그대로 읽고 내보낸다(새 줄 목록에는 없음).

## 5. `.rpy` 내보내기 규칙 (`src/exportRpy.ts`)

1. 머리말 주석과 `define 캐릭터id = Character("이름", color="#...", image="캐릭터id")`. `image`가 있어야 대사 속성(`a smile "..."`)과 `show a smile`이 같은 그림을 쓴다.
2. 시작: `label start:`를 쓰지 않고 `init python:`에 `config.label_overrides["start"] = 시작상자`를 쓴다. 렌파이 새 프로젝트의 `script.rpy`에도 `label start`가 있어서, 그대로 두고 가는 길만 돌린다. 단, 이름이 `start`인 label이 있으면 그 label의 첫 상자가 시작 상자여야 하고, 이 줄을 쓰지 않는다.
3. **label 그룹마다 `label 이름:` 하나.** 그룹 안 상자 순서는 다음과 같다.
   - 첫 상자(`entry`)부터 시작해서, `next`나 call의 `then`으로 이어지는 같은 그룹 상자를 바로 뒤에 붙인다.
   - 나머지는 그룹 안에서 너비 우선으로 방문한 순서를 따른다.
4. 바로 앞 상자에서만 이어져 들어오는 상자는 label 없이 이어 쓴다(jump 생략). 그 외(선택지, jump, call로 들어오는 상자)에는 **로컬 label** `label 그룹이름.상자id:`를 붙인다.
5. 대상 참조: 그룹의 첫 상자면 `그룹이름`, 아니면 `그룹이름.상자id`.
6. 줄 출력:
   - 내레이션: `"텍스트"`
   - 대사: `id 속성 "텍스트"`
   - 명령: 여러 줄을 그대로 출력(끝 공백만 제거)
   - 연출: `scene bg 이름 [with 전환]`(이름이 비면 `scene`), `show 이미지 [at 위치] [with 전환]`, `hide 태그 [with 전환]`, `play music "audio/파일"`, `stop music fadeout 1.0`, `play sound "audio/파일"`. 이미지는 배경 `bg 이름`, 캐릭터 `캐릭터id 표정`, 기타 이름 그대로. 파일 이름에 `/`가 있으면 앞에 `audio/`를 붙이지 않는다. 칸이 덜 채워지면 `# TODO: 이유`를 쓰고 경고한다.
   - 메모: `# ...`
7. 텍스트 이스케이프: `\`→`\\`, `"`→`\"`. 설정에 따라 `[`→`[[`, `{`→`{{`(텍스트 태그 끔), `%`→`%%`. 줄바꿈은 `\n`.
8. 나가는 방식 출력:
   - `next`: 다음 상자가 바로 뒤에 놓였으면 생략, 아니면 `jump`. 연결이 없으면 `return  # TODO: 연결 안 됨`.
   - `menu`: `menu:` 아래 항목마다 `jump`.
   - `call`: `call 대상` 다음 줄은 then을 next와 같은 규칙으로 처리하고, then이 없으면 `return`.
9. 본문이 비면 `pass`를 넣는다. 각 상자 위에 `# @node:id 제목` 주석을 붙인다(나중에 역가져오기용).
10. **검사(경고/오류)**:
    - label 이름과 캐릭터 id의 형식 오류, 예약어, 중복
    - 시작 상자 없음
    - 등록되지 않은 화자
    - 빈 대사나 빈 선택지
    - 덜 채운 연출 줄, 등록되지 않은 캐릭터, 영문이 아닌 이미지 이름
    - 연결 안 된 선
    - 시작에서 도달할 수 없는 상자
    - call 대상에서 return에 도달하지 않음
    - `escapePercent`가 꺼졌는데 대사나 선택지에 `%`가 있음 (오류. 렌파이가 실행 중 멈춘다)
    - 텍스트 태그를 켰을 때 대사나 선택지의 태그 짝 (`checkTags`, 렌파이 `check_text_tags`와 같은 규칙): 여는 태그 없는 닫는 태그는 오류(렌파이가 실행 중 멈춘다), 엇갈려 닫힘·닫지 않음·모르는 태그는 경고
    - 연결을 켰는데 캐릭터 id가 pygaki 플러그인 이름과 겹침 (오류, `PLUGIN_NAMES`)
11. **pygaki 플러그인 연결(`renpyLink`)을 켜면 달라지는 것**. 끄면 예전과 똑같이 내보낸다.
    - 모든 상자에 `label 그룹.상자id:`를 쓴다. 첫 상자는 `label 그룹:` 바로 아래에 이어 쓴다.
    - 줄마다 앞에 `# @l:줄id`, 나가는 부분 앞에 `# @end:상자id`를 쓴다.
    - 대사 괄호(`fx=`, `size=` 등)와 `fx` 줄을 내보낸다. 끄면 `fx` 줄은 주석이 되고 경고가 뜬다. 괄호 순서는 화면 효과, 글자 모양, 위치다.
    - 형식은 [LINK.md](../../docs/LINK.md).

## 6. 자동 정렬 (`src/layout.ts`)

- **전체 정렬**: ELK 계층 그래프로 배치한다. label 그룹이 부모 노드가 되어 같은 label 상자가 한 덩어리로 모인다.
- **label 정렬 / 선택 정렬**: 해당 상자만 평면으로 배치하고, 왼쪽 위 위치는 유지한다.
- **흐름 순서**: 시작 상자부터 너비 우선으로 방문한 순서로 노드와 그룹을 ELK에 넘긴다. 그래서 선택지 순서대로 좌→우로 놓인다.
- **되돌아가는 선(루프)**: 깊이 우선으로 찾은 back edge는 정렬 계산에서 뺀다. ELK의 cycleBreaking 옵션은 계층 그래프에서 기대대로 동작하지 않았다.
- 정렬 결과는 `update()`로 반영되므로 실행 취소가 되고, 0.4초 이동 애니메이션이 붙는다.

## 7. 테스트 플레이 (`src/playEngine.ts`, `src/Player.tsx`, `src/PlayStage.tsx`)

- 상태: 현재 상자, 줄 위치, call 스택(`{from, to}`), 선택지, 표시 중인 줄, 명령 뱃지, 종료 사유, 방문한 상자와 선, 화면(`stage`: 배경, 그림, 사라지는 그림, 음악, 효과음, 화면 효과 이름). 화면도 상태 안에 있어서 뒤로 가기와 건너뛰기가 그대로 맞는다.
- `advance()`는 다음 표시할 줄까지 진행한다.
  - 메모는 건너뛴다.
  - 연출 줄은 화면 상태에 넣는다. 직접 명령도 `show`/`scene`/`hide`/`play`/`stop`, `stage.pos`, `screen_fx.use`/`clear`는 읽고, 나머지는 뱃지로만 쌓는다.
  - 나가는 방식은 jump, menu, call, return 규칙대로 따라간다.
  - 무한 반복은 5000단계에서 멈춘다.
- 종료 사유: `end`(return), `broken`(연결 없음), `missing`(없는 상자), `loop`.
- 텍스트 태그를 흉내 낸다: `{b} {i} {u} {s} {color=} {size=} {font=} {alpha=} {k=} {cps=} {p} {w} {nw} {fast} {a=}`, `{{`. 글자를 하나씩 내보내고(`parseTagged`, `SayBox`), 클릭하면 다음 멈춤까지 다 보여 준 뒤에 넘어간다.
- **게임 화면**: 게임 해상도로 그린 뒤 틀에 맞춰 줄인다(`GameFrame`). 크기와 대사창 값은 연결한 폴더에서 읽고(`readLook`, [LINK.md](../../docs/LINK.md) 6장), 없으면 1280x720 기본값이다. 파일이 없는 그림은 이름 표시로 대신한다. 폴더가 없어도 플레이된다.
- **전환**: `dissolve`, `fade`, `stage.move/ease/zoom`을 CSS로 흉내 내고, 전환 시간만큼 다음 글자를 기다린다.
- **등장 효과**: 렌파이 텍스트 셰이더 7개와 pygaki 플러그인이 등록한 20개를 **WebGL로, pygaki 플러그인과 같은 셰이더 코드로** 그린다(`src/fx/`). 효과 폴더(pygaki 플러그인 `ui_kit/effects/*.glsl`, LINK.md 8-1)의 효과도 같다: 저장소의 샘플은 빌드할 때 가져오고, 연결한 폴더의 파일은 `scanFolder`가 읽어 `setFolderEffects` → `refreshEffects`(`EFFECTS`, `TRANSITIONS` 배열을 그 자리에서 다시 채움, `useGameFolder.fxSeq`로 다시 그림). 바뀌면 `effectEpoch`가 올라 미리보기 셰이더를 다시 만든다. 그림 전환(`img_fx.use`)은 플레이 화면에서 같은 시간의 서서히 바뀌기로 보인다.
  - 셰이더는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나이고, 빌드할 때 `?raw`로 그대로 가져온다. 렌파이 내장 7개는 `src/fx/renpy_textshaders.glsl`(렌파이 8.5.3 `00textshader_ren.py`를 옮김, MIT). 형식은 [LINK.md](../../docs/LINK.md) 8장. 효과 목록 `EFFECTS`, `RENPY_EFFECTS`, 글자/초 기본값을 쓰는 효과(`@cps`)도 이 파일에서 온다.
  - `textShaders.ts`: 파일 읽기(`parseShaders`, pygaki 플러그인 `tfx_parse`와 같은 규칙), 효과 문자열(`"scatter:u__distance=200"`, `"a|b"`) 읽기(`parseTextShader`, 렌파이 `parse_textshader`), 렌파이처럼 셰이더 조각 합치기(`shaderSource`: `renpy.geometry` `renpy.texture` `textshader.이름`을 이름순으로, 쓰는 변수만 이름순으로, `vertex_N`/`fragment_N`은 우선순위순, `u__` `l__` `v__` `a__`는 `u_textshader_이름_…`으로 바꿈). 색 값은 투명도를 곱한 vec4.
  - `FxCanvas.tsx`: 화면의 글자(`span.ch`, `.fx-gl`이면 숨김)에서 자리를 재서, 렌파이처럼 글자를 그림으로 만들고(외곽선 겹은 따로) 글자마다 조각(줄 높이 × 글자 폭, 줄 왼쪽과 오른쪽 빈 곳은 가짜 글자, 그림 폭은 가장 긴 줄)을 만든다. 중심(`a_text_center`)은 글자 밑줄 자리. 글자 i의 `a_text_min_time`은 `useReveal`이 i번째 글자까지 내보낸 때라 렌파이처럼 한 글자 앞서 나오고, `{w}`에서 멈춘 동안 뒤 글자는 안 나온다. `u_text_slow_time`, `u_text_slow_duration`(1/cps), `u_text_to_drawable`(화면 배율 × devicePixelRatio), `u_text_main`, `u_text_depth`, `u_time`, `u_random`, `tex0`, `res0`를 렌파이와 같은 뜻으로 넘긴다. 클릭으로 한 번에 보이면 렌파이처럼 다 끝난 시간으로 그린다. 캔버스는 글 칸 둘레로 글자 크기 × 3만큼 넓다.
  - `echo`처럼 `@outline`이 있는 효과는 외곽선 겹(`u_text_main` 0)을 글자 뒤에 먼저 그린다.
  - WebGL이 없거나 셰이더가 실패하면 예전처럼 CSS로 흉내 낸다(`.fx-*`, `--cd`, `--r1`~`--r4`, `liquid`는 App.tsx의 SVG 필터).
  - pygaki 플러그인 효과는 연결을 끄면 내보내지 않고 경고한다(`RENPY_EFFECTS`). 렌파이처럼 글자가 하나씩 나올 때만 보이고, 물결과 떨림은 늘 보인다. 목록에서 뺀 효과는 `stage.ts`의 `REMOVED_EFFECTS`: 예전 대본 값은 그대로 두고 내보낸다(`typewriter`, `slowalpha`는 렌파이에 있어서 `RENPY_EFFECTS`에 넣음, 나머지는 pygaki 플러그인이 한 글자씩 나오기로 받음).
- **안 되는 것**: 화면 효과(ASCII 등)는 웹 글자에 셰이더를 입힐 수 없어서 이름만 보여 준다. `$` 명령은 실행하지 않는다. `screens.rpy`를 고친 내용은 반영되지 않는다.
- **전체화면** (`enterFullPlay`, `leaveFullPlay`, 기본 F8): 플레이 화면을 `document.body`로 옮겨 창을 덮고 브라우저 전체화면을 요청한다. 거절되어도 창을 덮은 채 플레이된다. 플레이 중이면 이어서, 아니면 고른 상자부터 시작한다. 시작 상자까지 가장 짧은 길을 따라가며 배경과 그림을 미리 채운다(`seedStage`). 돌아오면(F8, Esc) 플레이를 끝내고 보던 상자와 줄을 고른 채 편집 화면을 보여 주고, 다시 들어가면 그 줄부터 시작한다(`playResume`).
- 플레이 중인 상자는 캔버스에 강조되고 화면이 따라간다. 지나온 선은 주황색이다.
- 탭을 바꿔도 플레이 상태를 유지한다(컴포넌트를 숨길 뿐 지우지 않음). 플레이 중 대본을 고치면 다음 줄부터 반영된다.

## 8. 편집 동작

- **상자 더블클릭**: 상자 안에서 바로 편집한다(`store.inlineEdit`).
  - **볼 때와 같은 모양**: 상자 폭(250px), 글자 크기, 줄 배치가 같다. 같은 `LineRow`가 보기에서는 글자를, 편집에서는 테두리·여백 없는 `textarea`(`.ed`)를 같은 자리에 그린다. 보기 화면도 줄 수와 줄 길이를 자르지 않는다.
  - **줌인**: 편집을 시작하면 지금 화면(viewport)을 기억하고, 상자와 양옆 단추 자리가 들어오도록 확대(최대 1.6배, 지금보다 작게는 안 함)하며 0.45초 동안 이동한다. 끝내면 기억한 화면으로 돌아간다. 집중 모드를 바꾸면 다시 맞춘다.
  - **옆에 붙는 단추**: 지금 줄(`active`, 포커스를 받은 줄)의 높이에 맞춰 상자 왼쪽 바깥에 손잡이·줄 종류·표정·＋·✕ 묶음, 연출 줄이면 오른쪽 바깥에 `StageFields` 카드가 붙는다. 줄을 옮기면 `top`이 0.22초 동안 따라 움직인다. 연출 줄은 줄 자체가 `tabIndex`로 포커스를 받는다.
  - **다음 흐름 창** (`src/FlowMenu.tsx`): 편집 중 상자 오른쪽 바깥, 다음 흐름 줄 높이(연출 입력칸과 겹치면 그 아래. 상자 안이 바뀌면 `MutationObserver`로 다시 잰다)에 붙는 반투명(바탕 62%, 배경 흐림) 창. 선택칸 없이 항목을 모두 펼친다: 흐름 종류 4가지, 이어지는 곳(선마다, 고르면 상자 목록 단계로), 선택지 추가, 바로 가기(이어 쓰기, 새 상자에 이어 쓰기). 기본 Alt+Enter(`flowMenu`, 바꿀 수 있음)로 들어가면 숨은 입력칸이 키를 받아 ↑↓/Enter·→/←·Backspace/Esc로 움직이고, 상자 목록 단계에서는 그 칸이 찾기 칸이 된다. 나가면 들어오기 전의 글 칸으로 커서를 돌려준다. 마우스로도 누를 수 있다.
  - **다음 상자로 이어 쓰기** (`goNextBox`, 기본 Ctrl+Shift+Enter): `next`/call의 `then`이 이어져 있으면 그 상자를 편집, 없으면 `continueInNewBox`로 같은 label에 새 상자를 만들어 잇고 편집한다. 새 상자는 흐름 방향(TB면 아래, LR이면 오른쪽)에 놓고, 다른 상자와 겹치면 60px씩 비켜 놓는다. 선택지 상자는 카드에서 고른다.
  - 누른 곳의 `data-part`(줄 id, `title`, 선택지 id)로 커서가 간다.
  - 끝내는 방법: Esc, 빈 곳 클릭, 다른 상자 선택.
  - 입력칸 안의 더블클릭은 무시한다(단어 선택).
- **상자 한 번 클릭**: 오른쪽 편집 탭에서 label, 다음 흐름, 시작 상자 등을 설정한다.
- **줄 순서**: ⠿ 손잡이를 끌어 다른 줄의 위/아래 절반에 놓는다(HTML 드래그 앤 드롭, `useLineDrag`). 상자 안 편집과 편집 탭 모두.
- **편집 탭 줄 모양**: 줄마다 2칸 격자. 왼쪽 칸(136px)에 손잡이·줄 종류·✕와 대사 속성, 오른쪽 칸에 글(또는 연출 입력칸)을 두고 사이에 세로 선을 긋는다.
- **글자 효과 칸** (`LineLook`, 연결과 상관없이): 글 칸에는 글만 둔다. 오른쪽 편집 탭 위쪽에 붙어 있고(`.look-panel`, sticky), 지금 쓰는 줄(`store.activeLine`, 상자 안 편집과 편집 탭이 같이 씀)을 따라간다. 그 줄이 대사가 아니면 상자의 첫 대사 줄을 보여 준다. 집중 모드에서는 패널과 함께 숨는다. 글자 모양, 속도, 등장 효과가 들어 있고, 받아 적은 좌표와 화면 효과는 보여 주기만 한다. 맨 위 미리보기(`LinePreview`)는 플레이 화면과 같은 코드(`useReveal`, `Glyphs`, `FxCanvas`)로 글자만 그린다. 글자는 칸에 들어가는 가장 큰 크기(11~60px)로 맞추고, 효과나 글자/초를 바꾸면 다시 재생한다.
- **태그 상자** (`src/TagBar.tsx`, `src/tagEdit.ts`): 대사·내레이션 글 칸(`textarea[data-tags]`)에 포커스가 있으면 뜬다. 지금 칸은 `useTagTarget`(document `focusin`으로 따라가고, 태그 상자 안으로 포커스가 가도 그대로, 빈 곳으로 포커스가 사라지면 닫음). 상자 안 편집(`in-줄id`)이면 `BoxView`가 상자 오른쪽 위 바깥(`.tagbar-box`)에, 편집 탭(`ed-줄id`)이면 `LineLook`이 글자 효과 칸 제목 아래(`.tagbar-look`)에 그린다.
  - 단추를 눌러도 글 칸의 포커스와 고른 곳이 남게 `mousedown`을 막는다(입력 칸, 팔레트 칸 빼고). 고친 글은 `HTMLTextAreaElement` value setter + `input` 이벤트로 넣어서 React `onChange`를 그대로 탄다(실행 취소 묶음도 타이핑과 같음).
  - `tagEdit.ts`: `tokenize`(렌파이처럼 `{{`, `{#…}`, 짝 태그와 혼자 쓰는 태그는 렌파이 8.5.3 `text_tags` 목록), `pairTags`(닫는 태그는 가장 안쪽을 닫음). 고치기: `toggleTag`(b i u s: 같은 태그 안이면 빼기, 고른 곳이 안쪽 일부면 그 부분만 끊어서 밖으로, 아니면 감싸기), `setTagValue`(color size cps: 안이면 값만 바꾸기), `stepSize`(+10/-10, `+n`은 더하고 0이 되면 빼기, 숫자는 더하기, `*x`는 1.25배/0.8배), `removeTag`, `insertTag`(커서 자리, `{nw}`는 글 끝, `{w=0.5}`는 숫자를 골라 둠), `tagsAt`(단추 켜짐). 커서가 태그 글자 한가운데면 태그 밖으로 옮기고, 고른 곳 안의 태그 짝이 안 맞으면 넣지 않고 알린다.
  - 팔레트: 8색 × 밝게/보통/어둡게 + 회색 8칸, 이 프로젝트 색(`gui.rpy` `text_color`, 캐릭터 색), 최근 8칸(`localStorage["pykaki-recent-colors"]`), `#rrggbb` 칸, 브라우저 색 고르기. 화살표 8칸씩, Enter, Esc.
  - 단축키 `tagBold` `tagItalic` `tagUnderline`(기본 Ctrl+B/I/U, 글 칸에 포커스가 있을 때만 잡음).
  - 텍스트 태그가 꺼져 있으면(`allowTextTags`) [켜기]만 보인다.
  - 형식은 그대로다. 글 안의 태그일 뿐이라 `.flow.json`, LINK.md, `FEATURE`는 안 바뀐다.
- **상자 보기 화면의 태그** (`TagView`): 고칠 때(textarea)와 자리가 같아야 해서 글자는 그대로 두고 태그 글자만 흐리게(`.tg`, 멈춤 태그는 `.tg-stop`), 안쪽 글에 굵게(폭이 안 변하는 그림자), 기울임, 밑줄, 취소선, 색만 입힌다. 크기는 바꾸지 않는다.
- **렌파이 견본** (`EffectClip`): 효과를 고르면 미리보기 아래에 `public/effects/<효과>.webm`을 반복 재생한다. 렌파이에서 예시 대사를 재생하며 찍은 2.4초 영상이다. `tools/record_effect_clips.py`가 효과 목록을 `stage.ts`에서 읽어 렌파이 SDK와 ffmpeg로 만든다. 효과를 새로 넣으면 다시 돌린다.
- **렌파이에서 보기**는 없앴다(2026-11-11). `game/pykaki_preview.json`을 쓰지 않고, 예전에 쓰던 `localStorage["pykaki-live-preview"]`도 읽지 않는다. 게임에서 보려면 자동 내보내기와 [게임 줄 따라가기]를 쓴다([LINK.md](../../docs/LINK.md) 7-1).
- **글자/초 기본값** (`lineCps`, `DEFAULT_CPS` 30): 글자가 하나씩 나와야 보이는 효과(`wave`, `jitter`, `glow`, `liquid`, `vhs`를 뺀 모든 효과)에서 `cps`가 비면 30으로 재생하고 내보낸다. 효과가 없거나 `wave`, `jitter`이면 비운 채로 두고 게임 설정을 따른다.
- **Ctrl+Enter**: 같은 화자로 새 줄을 만든다. `flushSync`로 즉시 그려서 바로 이어 쳐도 글자가 새 줄에 들어간다.
- **빈 곳 더블클릭**: 새 상자를 만든다. label 프레임 안이면 그 label에 넣는다.
- **선을 빈 곳에 놓기**: 새 상자를 만들어 연결한다. 상자 몸통에 놓으면 그 상자에 연결한다.
- **선 더블클릭**: next ↔ call을 전환한다.
- **Delete**: 상자나 선을 삭제한다.
- **Shift+드래그**: 여러 상자를 선택한다.
- **단축키(기본값)**: Ctrl+\\ 집중 모드, Ctrl+Enter 새 줄, Ctrl+Shift+Enter 다음 상자로 이어 쓰기, Alt+Enter 다음 흐름 창, Ctrl+S 저장, Ctrl+Shift+S 다른 이름으로 저장, Ctrl+E 같은 곳에 다시 내보내기, Ctrl+Z/Y 실행 취소/다시 실행(입력칸 밖에서), Ctrl+B/I/U 대사 글 칸에서 굵게/기울임/밑줄 태그, Alt+N 새 상자, Alt+P 플레이, F8 편집 화면과 전체화면 플레이 바꾸기(F5는 새로고침과 겹쳐서 쓰지 않음). 8-1 참고.
- 실행 취소: 같은 key로 1.2초 안에 이어지는 변경(타이핑)은 한 번으로 묶는다. 최대 100단계.

## 8-1. 화면, 집중 모드, 환경 설정

- **눈에 덜 띄는 화면**: 버튼은 테두리 없이 흐린 글자, 입력칸은 테두리 없이 옅은 바탕. 툴바와 미니맵/확대 버튼은 평소 흐리고 마우스를 올리면 또렷해진다. 줄의 ✕ 버튼은 줄에 마우스를 올렸을 때만 보인다.
- **색 (`src/prefs.ts`)**: `--bg`(바탕) `--panel`(면) `--text`(글자) `--accent`(강조) 네 가지만 정하고, 테두리·흐린 글자·줄 종류 바탕은 CSS `color-mix()`로 이 넷에서 만든다. 테마 순서는 사과 스타일, 사과 컬러풀, 밝게, 어둡게, 1비트, 1비트 흰 바탕, 직접 고르기. (예전 '종이'는 없앴고, 저장된 값이면 사과 스타일로 연다) 바탕이 어두우면 `data-dark`를 붙이고 React Flow도 `colorMode="dark"`.
- **집중 모드**: `store.focusMode`. `.app.focus`가 툴바·양쪽 패널·미니맵·확대 버튼·안내 글을 숨긴다. 저장하지 않고 새로고침하면 꺼진다. 알림(`say`)은 화면 아래 토스트로 띄워서 집중 모드에서도 보인다.
- **밑줄 커서 (`src/Caret.tsx`)**: 상자 안 편집(`.box.editing`)의 글 입력칸에서 브라우저 커서를 투명하게 하고, 강조색 밑줄을 1.05초 주기로 깜박인다. 입력칸 스타일을 복사한 보이지 않는 div에 커서 앞 글자를 넣어 자리를 재고, 매 프레임 입력칸 위치·확대 비율을 다시 읽어 화면 이동/확대를 따라간다. 커서가 움직이면 켜진 상태부터 다시 깜박인다. 글자를 범위 선택하면 숨기고, 한글 조합 중에는 보인다.
- **단축키**: `ACTIONS`에 동작과 기본 키. 키는 `e.code`(자판 위치)로 적어 한글 입력 상태에서도 같다. Cmd는 Ctrl로 본다. 바꿀 때 Ctrl/Alt 없는 키는 F1~F12만 허용하고, 겹치면 다른 동작의 키를 비운다. 실행 취소/다시 실행은 입력칸 밖에서만(입력칸 안은 브라우저 글자 되돌리기).
- **글꼴**: Pretendard 400/500/600(`default`는 예전 설정과 맞추려고 Pretendard 400의 id)과 Neo둥근모. CSS 변수 `--font`(본문)·`--mono`(코드)·`--font-weight`로 화면 전체를 바꾼다. Pretendard는 `pretendard` 패키지의 가변 글꼴 `PretendardVariable.woff2`(약 2MB, 한글 11,172자, 굵기 45~930) 하나를 `?url`로 가져와 빌드 때 파일 안에 넣고 `FontFace('Pretendard Variable', …, { weight: '45 930' })`로 등록한다. Neo둥근모는 `@kfonts/neodgm`의 woff2(44KB). 각 글꼴은 고르거나 설정 창을 열 때 등록한다. 라이선스는 `licenses/`. 이 글꼴 때문에 `dist/index.html`이 약 4.7MB가 된다. 사과 스타일 테마도 같은 글꼴을 쓴다.
- **그라데이션 테마** (`light`, `dark`): 두 색 `grads[light|dark] = { a: 바탕 쪽, b: 끝 }`(처음 값 흰색→#8e8e93, 검정→#8b5cf6)에서 `gradColors()`로 바탕 0%, 면 8%, label 배경 30%, 상자 55% 지점의 색을 만든다. 글자색은 각 색 밝기로 검정/흰색(`textOn`), 강조색은 끝 색을 밝게(어두운 바탕)/어둡게(밝은 바탕). 상자·label 배경은 `data-boxfill`/`data-labelfill`과 `--theme-box`·`--theme-label`(+`-text`)로 칠한다. `data-grad`일 때는 상자 색(`.own-color`)을 쓰지 않고 모든 상자가 그라데이션 색이며, 설정의 [상자 색]도 막는다(칠해 둔 값은 남아서 다른 테마에서 보인다). 미니맵도 그라데이션 상자 색.
- **텍스트 색** (`textColor`, 기본 null=테마 색): 고르면 `--text`와 `--text-fix`를 그 색으로 하고 `data-textfix`로 상자(`--bt`)·label 제목 글자까지 덮어쓴다(모든 테마).
- **직접 고르기**: 바탕·면·상자 색(글자색은 텍스트 색, 강조색은 고르기 직전 테마 것을 이어받음). 상자 색은 `data-boxfill`로 칠하고 label 배경은 label 색.
- 상자 진하기·상자에 label 색 설정은 없앴다(`--box-strength` 0.3, `--label-tint` 0.5로 고정, 사과 테마에서 쓰임).
- **label 경계선** (`frameWidth`, 0~6px, 기본 3, 0이면 안 보임): CSS `--frame-w`. label 묶음 테두리 굵기. 1비트에서는 같은 굵기의 점선, 사과 스타일은 테두리 없음.
- **label 배경**: 사과 테마와 직접 고르기에서는 label 색(`LabelGroup.color`) 그대로, 그라데이션 테마에서는 테마 색. 제목 글자는 배경 밝기에 따라 검정/흰색. 1비트 테마만 칠하지 않는다.
- **사과 스타일 테마** (`apple`(기본 테마), `apple-color`, Apple 디자인 참고): `data-look`. 바탕 #f2f2f7, 면 흰색, 강조 #007aff, 회색 #8e8e93. 상자는 흰색(`--panel`) 카드로 두고(사과 컬러풀만 label 색을 입힘), 상자·label 배경·선택지·입력칸의 테두리를 없애고 둥근 모서리(상자 16px, label 24px)와 옅은 그림자, Apple 회색 채움(rgba(118,118,128,.08~.12))으로만 구분한다. 글꼴이 "기본"이면 시스템 글꼴(-apple-system 등)을 먼저 쓴다. `apple-color`는 label·캐릭터 색의 색상(hue)만 따서 `oklch(from 색 0.7 0.16 h)`로 또렷한 색을 만들어 상자·label 배경에 `--label-tint`만큼 입히고, 이름표는 진한 색에 흰 글자. (relative color를 못 쓰는 브라우저는 원래 label 색)
- **상자 색**: 상자에 `color`가 있으면 `.own-color`를 붙이고 상자 바탕을 그 색 그대로 칠한다(모든 테마, 1비트 제외). 글자색 `--bt`는 그 색이 밝으면 검정, 어두우면 흰색이고, 상자 머리·줄·다음 흐름 안에서만 `--text`·`--muted`·`--line` 등을 이 색에 맞춰 다시 정한다(옆에 붙는 단추·창은 원래 색). 고르는 곳은 환경 설정의 [상자 색] 하나뿐이다(편집 화면을 깔끔하게 두려고): 대상(모든 상자/선택한 상자/label 하나)과 색(색 고르기 칸과 hex 코드 입력칸. `#RRGGBB`/`#RGB`, `#` 없이 적어도 됨. 틀린 코드는 빨갛게 표시하고 칠할 색은 바꾸지 않는다)을 골라 한꺼번에 칠하거나 label 색으로 되돌린다. `update()`로 바꿔서 실행 취소가 된다. 미니맵도 이 색.
- **1비트 테마** (`onebit` 검정 바탕, `onebit-light` 흰 바탕): `data-mono="1"`. 모든 면을 바탕색으로, 테두리·글자·선·핸들·이름표를 글자색 하나로 그린다(칠하지 않고 외곽선만). 미니맵은 바탕색 상자에 글자색 테두리.
- **집중 모드 흐림**: 집중 모드이고 편집 중인 상자가 있을 때(`.app.focus:has(.box.editing)`), 편집 상자 안에서 포커스가 없는 줄·제목·선택지는 `--dim-line`, 다른 상자·label 배경·선은 `--dim-box` 불투명도. 흐린 상자는 마우스를 올리면 0.6 이상으로. 단계(끄기/약하게/보통/강하게)별 값은 `prefs.ts`의 `DIMS`.
- **처음 값으로**: 설정 창의 [모든 설정을 처음 값으로]는 확인을 받고 `resetPrefs()`로 환경 설정 전체(테마, 그라데이션 두 색, 직접 고른 색, 글꼴, 흐림, label 경계선, 단축키)를 `defaults()`로 되돌린다. 대본(상자 색 포함)은 건드리지 않는다.
- 환경 설정은 대본이 아니라 브라우저에 붙는 설정이라 `localStorage['pykaki-prefs']`에 둔다(못 쓰면 기본값).

## 9. 저장

| 층 | 방식 | 위치 |
|---|---|---|
| 자동 저장 | 변경 0.7초 뒤 | IndexedDB `renpy-flow-editor` / `kv.current` |
| 버전 스냅샷 | [버전 저장], 열기/새로/복원 직전 자동 | IndexedDB `snapshots` |
| 파일 | Ctrl+S, `.flow.json` | 사용자 폴더 (진짜 백업) |
| 자동 저장본 | 바뀐 것이 있으면 5분마다, 연결 내보내기 때. 최근 30개만 둠 | IndexedDB `snapshots` |
| `.rpy` | 내보내기, 핸들 기억 → Ctrl+E로 같은 곳. 연결을 켜면 연결한 폴더의 `script_flow.rpy` | 게임 `game/` 폴더 권장 |

- 파일로 저장하지 않은 변경이 있으면 탭을 닫을 때 경고한다.
- 파일에 쓸 때 `app: { by, build, needs }`를 붙인다(9-3).
- 사이트와 로컬 `dist/index.html`은 출처(origin)가 달라서 자동 저장 공간이 따로다.

## 9-0. pygaki 플러그인 연결 (`src/gameFolder.ts`, `src/inbox.ts`)

전체 형식은 [LINK.md](../../docs/LINK.md). `.rpy`를 되읽는 역가져오기는 없다.

- 연결 버튼 `linkProject` (왼쪽 패널): 폴더 고르기, 렌파이 프로젝트인지 확인(`gui.rpy`/`options.rpy`), `ui_kit`이 있으면 `renpyLink` 켜고 없으면 끄기, 이미 다른 `script_flow.rpy`가 있으면 묻기, 첫 내보내기까지 한 번에 한다.
- 폴더: `showDirectoryPicker`로 `game` 폴더 핸들을 받아 IndexedDB `kv.gameDir`에 둔다. 프로젝트 폴더를 고르면 안의 `game`을 쓴다. 권한은 사용자 동작이 있을 때 다시 얻는다.
- 목록: `images`, `movies`, `audio`를 읽어 연출 줄 칸의 `datalist`로 보여 준다. 대본에 이름이 `start`인 label이 있고 위쪽 폴더의 다른 `.rpy`에도 `label start`가 있으면 사이드바에 알린다.
- 목록과 함께 플레이 화면 값(`look`)과 글꼴 목록도 읽는다. 전체화면에 들어갈 때 다시 읽는다.
- 받아 적기 `pullInbox`: 창이 다시 focus될 때, 앱을 켤 때, [다시 읽기], 내보내기 직전. 받을 것이 있으면 저장본을 먼저 남기고 `applyInbox`로 넣은 뒤, 읽은 기록만 파일에서 지운다.
- 내보내기: 폴더를 연결했거나 연결을 켜면 먼저 받아 적고 `script_flow.rpy`에 쓴다. 받아 적기가 실패하면 쓰지 않는다. 폴더 권한을 못 쓰는 브라우저에서는 예전처럼 내려받기.
- 연결을 켜면 show 줄의 위치 칸을 숨긴다(값이 이미 있을 때만 보임). 위치는 pygaki 플러그인이 저장한다.
- 프로젝트 폴더(game 위)를 고르면 그 손잡이도 IndexedDB `kv.projectDir`에 두고, 대본을 그 폴더의 `.flow.json`에 둔다(9-3). 권한은 프로젝트 폴더에 받는다(안의 game까지 같이 됨). game 폴더를 바로 골랐으면 `projectDir`은 null이고 예전처럼 대본 파일은 따로.

## 9-2. 데스크톱 앱 (`app/`, `src/desktop.ts`)

- Electron 앱. 화면은 웹 빌드(`dist/index.html`)를 그대로 `app/web/index.html`로 복사해 `?app=1`로 연다. 웹 코드는 `window.pygaki`가 있으면 앱 모드(`isDesktop`)로 돈다.
- 렌파이 프로젝트 폴더 하나를 연다. `pygaki.exe --project "폴더"`(렌파이 런처 버튼), 없으면 폴더 고르는 창. 같은 프로젝트를 다시 열면 있던 창을 앞으로, 다른 프로젝트는 새 창.
- 파일은 메인 프로세스(`app/main.cjs`)가 다룬다: `info` `list` `stat` `read` `write`(임시 파일에 쓰고 바꿔 끼움) `openFolder` `choose`. 경로는 프로젝트 폴더 기준이고 밖은 막는다. `game/` 폴더를 `fs.watch`로 지켜보고 바뀐 파일 이름을 `pygaki:changed`로 알린다.
- `src/desktop.ts`의 `AppDir`, `AppFile`이 이 기능을 브라우저 폴더 손잡이(`FileSystemDirectoryHandle`)와 같은 모양으로 감싼다. 그래서 `gameFolder.ts`, `files.ts`는 웹과 같은 코드로 돈다. 권한은 늘 `granted`.
- 대본: 프로젝트 폴더 맨 위의 `*.flow.json`을 연다. 여러 개면 처음 열 때 고르게 하고(`src/flowPick.ts`, 상자 수·줄 수·고친 때, 가장 최근 것을 강조), 고른 이름을 `localStorage['pygaki-flow:<프로젝트 경로>']`에 둔다. 왼쪽 칸 [다른 대본 파일]은 이 기억을 지우고 창을 다시 연다. 없으면 `프로젝트이름.flow.json`으로 빈 대본을 만들고, pygaki 플러그인(`game/ui_kit`)이 있으면 `renpyLink`를 켠다. 바뀌면 0.7초 뒤 그 파일에 자동 저장(`saveQuiet`)하고 이어서 자동 내보내기(`autoExport`, 웹 자동 저장도 같음): `renpyLink`이고 폴더가 연결돼 있으면 받아 적기 → `generateRpy` → 오류가 없고 지난번과 다르면 `pykaki_goto.json`(지금 쓰는 줄 `activeLine`, 없으면 고른 상자의 첫 줄, [게임 줄 따라가기]를 끄면 `null`) → `script_flow.rpy`. 형식은 LINK.md 7-1. 창을 열고 처음 쓸 때(`lastAuto === null`)는 `foreignBoxes`로 원고의 `# @node:` 표시를 보고, 절반 넘게 지금 대본에 없으면 자동은 멈추고(`autoHeld`) Ctrl+E는 물어본다. 처음 덮어쓰기 전 원고는 `script_flow.rpy.bak`(`backupRpy`). 끄기 버튼 상태는 `localStorage['pykaki-follow-line']`. 브라우저 저장소의 `current`는 읽지 않는다. 버전 목록(IndexedDB)은 앱 전체가 같이 쓴다.
- [열기]는 두 대본의 요약을 보여 주고 확인을 받은 뒤 고른 파일의 내용을 이 프로젝트 대본으로 가져오고, [새로]는 이 프로젝트 대본을 비운다. 저장 파일은 바뀌지 않는다.
- 메인 프로세스는 프로젝트 폴더 맨 위도 지켜보고 `*.flow.json`이 바뀌면 `pygaki:changed`로 이름을 알린다. 연 대본 파일이면 0.3초 뒤 `checkExternal`(9-3).
- 왼쪽 "렌파이 프로젝트" 칸: [다시 읽기] [폴더 열기] [다른 프로젝트]. 연결과 끊기는 없다.
- `showpy_inbox.json`이 바뀌면 0.3초 뒤 받아 적는다(창으로 돌아올 때도).
- [GUI 편집] 화면 (`src/ShowpyView.tsx`, `src/showpyLive.ts`): 툴바 [대본 편집 | GUI 편집]로 바꾼다(앱에서만). 대본 화면은 숨기기만 해서 캔버스 상태가 남는다. 메인 프로세스가 `game/showpy_live.json`을 보고 그 포트로 붙어(지켜보기 + 3초마다 다시 시도) 한 줄 JSON을 `pygaki:live`로 넘기고, 화면은 `liveSend`로 명령을 보낸다(`pygaki:liveSend`). 형식은 저장소 맨 위 docs/LINK.md 9장.
  - 줄기표 (`src/ShowpyFlow.tsx`, pygaki 플러그인 screen_fx 5.2): (앱에서는 꺼 둠, `ShowpyView.tsx` `FLOW_IN_APP = false`. 셰이더를 거는 자리를 상자·label로 옮겨서) "셰이더" 칸에서 `state.flow`가 있으면 가운데 위 [줄기표 펴기/접기](`flow` `toggle`). 펴지면 가운데가 원고 | 줄기표. 행을 끌면 `flow` `range`, 누르면 `flow` `pick`과 원고 칸 스크롤(`peek`), 네모 점은 `flow` `point`, 줄기표에서 Delete나 [셰이더 지우기]는 `flow` `delete`(Delete는 상자 캔버스로 안 가게 막음). 게임 서랍과 같은 어두운 바탕.
  - 왼쪽: 고칠 것 목록. 타이틀 메뉴, 게임 내 메뉴(ESC)는 앱 칸이 있고, 나머지는 게임 안 편집기 탭을 패널과 함께 연다. 메뉴 바로 아래 "└ 타이틀 셰이더"(`title_fx`), "└ 게임 내 메뉴 셰이더"(`pause_fx`) (pygaki 플러그인 4.20).
  - 가운데: 지금 화면, 원고 위치, 그 앞뒤 9줄(파일이 바뀌면 다시 읽음). 줄 위의 `# @node:` 표시로 PyKaki 상자를 찾아 [상자로] 버튼. [표시 숨기기](`localStorage['pygaki-hide-marks']`)는 `# @l:` `# @node:` `# @end:` 줄을 그리지 않는다(지금 줄은 그림, 줄 번호는 그대로).
  - 오른쪽: 저장(게임의 Ctrl+S), 버리기, 편집기 닫기, 게임 안 패널 보이기. 타이틀 칸은 배경(그림/영상 고르기, `title.background`), 평소/선택됐을 때, 이 항목만/공통, 항목 목록(메뉴 항목 + 제목, 부제), 글 칸, 숫자 칸, 글자 효과. 입력하는 동안은 게임에서 오는 값으로 덮지 않는다.
  - [GUI 편집] 화면에서는 저장 단축키가 게임 저장이다.
- 확인: GitHub Actions "pygaki 앱"(`.github/workflows/app.yml`)이 리눅스에서 진짜 Electron으로 켜서 `app/smoke.cjs`(자동 저장, 내보내기, 받아 적기, 쓴 판 표시, 밖에서 바뀐 대본 다시 읽기, 더 새 판 경고, 대본 파일 고르기, 밖에 쓰기 막기, 가짜 게임으로 pygaki 플러그인 연결)를 돌리고, 윈도우 `pygaki.exe` 폴더(`pygaki-win`)를 만든다. 배포 묶음은 저장소 맨 위 `bundle/`.

## 9-3. 프로젝트 대본 파일과 쓴 판 (`src/files.ts`, `src/version.ts`)

웹에서 쓰고 앱에서 이어 쓰기 위한 약속. 앱은 늘, 웹은 프로젝트 폴더를 연결했을 때 "프로젝트 대본 파일"(`bound`)을 쓴다.

- **파일 이름**: 앱은 위(9-2)대로. 웹은 연결할 때 `폴더이름.flow.json`이 있으면 그것, `.flow.json`이 하나뿐이면 그것, 아니면 `폴더이름.flow.json`. 이름은 `kv.flowName`.
- **연결할 때 (웹)**: 폴더에 그 파일이 있고 지금 대본과 다르면(쓴 판 표시는 빼고 비교) 요약을 보여 주고 묻는다. [확인] 그 파일을 열기(지금 대본은 버전 목록에 백업), [취소] 지금 대본을 쓰고 다음 저장 때 덮어쓰기. 받아 적기(`showpy_inbox.json`)는 대본을 정한 뒤에 한다.
- **저장**: 앱은 바뀌고 0.7초 뒤 자동으로, 웹은 Ctrl+S와 Ctrl+E 때(자동 저장은 지금처럼 IndexedDB). [다른 이름]은 프로젝트 대본 파일을 바꾸지 않고 사본만 쓴다. 웹은 다시 켜면 `kv.flowName`이 지금 `fileName`과 같을 때 다시 잇는다.
- **밖에서 바뀜**: 이 창이 마지막으로 읽거나 쓴 글의 지문(`seen`, 웹은 `kv.flowSeen`)과 파일이 다르면 다른 곳이 고친 것. 이 창이 최근에 쓴 지문 20개와 쓰는 중에 읽은 것은 빼고 본다. 쓰기 전과, 창으로 돌아올 때, 앱은 파일 바뀜 알림 때 본다. 묻기: [확인] 파일을 다시 읽기(지금 대본은 백업), [취소] 지금 대본을 쓰고 덮어쓰기. 빈 파일, 읽을 수 없는 글(쓰는 중)은 다음에 다시 본다.
- **쓴 판** (`app`): 파일에 쓸 때 `{ by: "PyKaki 웹" | "pygaki 앱", build: "2026-11-05 dc3ac85", needs }`를 붙인다. `build`는 `vite.config.ts`가 빌드 날짜와 커밋으로 넣는다. `needs`는 `max(파일의 needs, FEATURE)`라서 내려가지 않는다. `FEATURE`(지금 5: 2 글자 효과 11개, 3 글 상자·효과 겹치기·새 화면 효과 이름, 4 효과 폴더, 5 상자와 label의 셰이더)는 예전 판이 모르는 줄 종류나 값을 대본에 더할 때만 올린다. 예전 파일은 `app`이 없다(needs 0).
- `needs`가 이 판의 `FEATURE`보다 크면 열 때 알리고, 왼쪽 "렌파이 프로젝트" 칸에 경고를 둔다. 모르는 값은 지우지 않고 그대로 저장한다.
- `format`, `version`, `.flow.json`, IndexedDB 이름은 바꾸지 않는다.

## 9-1. 웹앱 설치 (PWA)

- `public/`의 `manifest.webmanifest`, `sw.js`, 아이콘(Ren'Py 런처 아이콘을 보라색 모노톤으로 바꾼 PNG 32/192/512/마스크용 512, `licenses/RENPY-ICON.txt`)이 빌드 때 `dist/`로 그대로 복사된다. 경로는 모두 상대 경로라 GitHub Pages의 `/pykaki/` 아래에서 동작한다.
- 서비스 워커는 **네트워크 먼저**: 인터넷이 되면 늘 새로 받아 캐시에 넣고, 안 되면 캐시로 연다. 그래서 `main`에 올린 업데이트가 설치한 앱에도 바로 반영된다.
- 등록은 `src/pwa.ts`에서 http/https일 때만 한다(파일로 연 `dist/index.html`에서는 하지 않음). `beforeinstallprompt`를 잡아 두었다가 툴바 [앱 설치]로 띄운다.
- `theme-color`는 화면 색 설정의 바탕색을 따른다.

## 10. 소스 구조

| 파일 | 역할 |
|---|---|
| `src/types.ts` | 데이터 구조 |
| `src/ops.ts` | 편집 함수 (연결, 상자/그룹 추가, 삭제, 나가는 방식 변경, 화자 변경) |
| `src/store.ts` | zustand 상태, 실행 취소, 선택, 플레이 상태, 상자 안 편집 상태 |
| `src/showpyLive.ts`, `src/ShowpyView.tsx` | 데스크톱 앱의 [GUI 편집] 화면 (게임과 실시간 연결) |
| `src/sample.ts` | 예제/빈 프로젝트, 불러오기 정규화 |
| `src/persist.ts` | IndexedDB |
| `src/files.ts` | 파일 열기/저장/`.rpy` 내보내기, 프로젝트 대본 파일과 밖에서 바뀜(9-3) |
| `src/version.ts` | 쓴 판 표시 (`FEATURE`, `BUILD`) |
| `src/flowPick.ts` | 앱: 대본 파일이 여러 개일 때 고르기 |
| `src/exportRpy.ts` | `.rpy` 변환과 검사 |
| `src/gameFolder.ts` | 렌파이 game 폴더 연결, 목록, 받아 적기 파일 읽기와 쓰기 |
| `src/inbox.ts` | pygaki 플러그인이 남긴 줄을 대본에 넣기 |
| `src/stage.ts` | 연출 줄 → 렌파이 명령 |
| `src/LineFields.tsx` | 줄 종류 선택, 연출 줄 입력칸, 줄 끌어 옮기기 |
| `src/layout.ts` | 자동 정렬 |
| `src/playEngine.ts` | 플레이 엔진 (Windows는 대소문자를 구분하지 않아서 `Player.tsx`와 이름을 다르게 함) |
| `src/actions.ts` | 정렬 실행, 상자 추가, 상자 더블클릭 편집, 포커스 |
| `src/Canvas.tsx` | React Flow 캔버스, label 프레임, 선 |
| `src/BoxView.tsx` | 상자 표시와 상자 안 편집 |
| `src/Inspector.tsx` | 오른쪽 편집 탭 |
| `src/Player.tsx` | 플레이 탭, 조작, 소리 |
| `src/PlayStage.tsx` | 게임 화면: 틀, 그림, 대사창과 글자 내보내기 |
| `src/Panels.tsx` | 오른쪽 탭, 검사, 스크립트 미리보기 |
| `src/Toolbar.tsx`, `src/Sidebar.tsx` | 툴바, 버전 목록, 왼쪽 패널 |
| `src/textTags.tsx` | 텍스트 태그 표시 |
| `src/prefs.ts` | 환경 설정(화면 색, 단축키) |
| `src/SettingsModal.tsx` | 환경 설정 창 |
| `src/Caret.tsx` | 상자 안 편집의 밑줄 커서 |
| `src/FlowMenu.tsx` | 편집 중 오른쪽에 붙는 다음 흐름 창 |
| `src/pwa.ts`, `public/` | 웹앱 설치 |
| `licenses/` | 함께 배포하는 글꼴의 라이선스 |

## 11. 남은 단계

- **2단계 (플래그)**:
  - `variables` → `default 이름 = 값`
  - 선택지/상자 동작 → `$ 이름 = 값`
  - 선택지 조건 → `"텍스트" if 조건:`
  - 조건 분기 상자 → `if/elif/else` + `jump`
  - 플레이에서 변수 보기와 바꾸기
- **확인됨**: 내보낸 `.rpy`가 렌파이 8.5.3에서 실행된다(로컬 label 포함). 연결 쪽 확인 상태는 [LINK.md](../../docs/LINK.md) 9장.

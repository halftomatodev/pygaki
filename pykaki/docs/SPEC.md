# PyKaki — 개발 명세서

지금 구현된 상태를 기준으로 정리한 명세예요. 처음 설계 문서(`../RENPY_FLOW_EDITOR_SPEC.md`)와 다른 곳은 이 문서가 맞아요.

- 웹 버전(사이트, 웹앱 설치)은 2026-11-12에 없앴다. 데스크톱 앱(9-2)만 낸다. 화면 코드는 웹 빌드 그대로이고, `npm run dev`는 개발용(렌파이 프로젝트 없이 예제 대본, 브라우저 자동 저장)
- 저장소: https://github.com/halftomatodev/pygaki (`pykaki/` 폴더)
- 사용자 가이드: [GUIDE.md](GUIDE.md)

## 1. 목적과 원칙

- Twine처럼 **상자와 선**으로 렌파이 대본의 흐름을 보며 쓰고, `.rpy`로 내보낸다.
- **원본은 툴의 JSON 파일**(`*.flow.json`)이다. `.rpy`는 결과물이다. 내보내기는 단방향이다.
- 서버가 없다. 대본은 사용자 PC에만 있다.

## 2. 기술 구성

| 항목 | 사용 |
|---|---|
| 화면 | React 18 + TypeScript |
| 상자/선 캔버스 | `@xyflow/react` 12 (React Flow) |
| 상태 관리 | `zustand` (실행 취소/다시 실행 포함) |
| 자동 정렬 | `elkjs` (layered 알고리즘) |
| 빌드 | Vite 5 + `vite-plugin-singlefile` → `dist/index.html` 한 파일 |
| 배포 | 데스크톱 앱(Electron, GitHub Actions "pygaki 앱"), 묶음(`bundle/`) |
| 앱 안 저장 | IndexedDB (버전 스냅샷, 자동 저장본. 개발 서버는 자동 저장도) |
| 파일 저장 | 프로젝트 대본 파일은 앱 IPC(9-2), [다른 이름]·[열기]는 File System Access API |

## 3. 화면 구성

```
┌ 위쪽 줄: [제목] [대본 편집|GUI 편집|효과|셰이더] [● 게임과 연결됨 / ◐ 게임 수정 중 / ○ 연결 안 됨(앱)]   ⇢ 오른쪽 끝: [▶렌파이에서 실행] [게임 줄 따라가기] (초록, `.tb-run`) ┐
│ 둘째 줄(왼쪽부터, `.tb-right`): ↶↷ [집중](보라) 설정 │ 새로 열기 저장 다른이름 │ 폴더 │ 버전 │ .rpy 내보내기                           │
├ 왼쪽 ───────┬ 캔버스 ─────────────────────────┬ 오른쪽 (탭 없음, 카드) ─┤
│ label+정렬    │ label 묶음 배경(프레임)           │ 상자 / 글자 효과 /      │
│ 캐릭터        │ 상자(노드), 선(엣지)              │ 대사 / 다음 흐름        │
│ 검사          │ 미니맵, 확대/축소                │ 또는 셰이더 / 전환 / 줄 │
│ 프로젝트 정보 │                                  │                        │
│ 스크립트, 설정         │                          │                        │
└──────────────┴──────────────────────────────────┴───────────────────────┘
```

- 양쪽 칸의 묶음은 모두 같은 카드(`.sec`)다. 오른쪽 칸(`Panels.tsx` `RightPanel`)은 탭이 없다(2026-11-12). 상자를 고르면 상자 / 글자 효과(`.look-panel`, 같이 스크롤됨. 세션 34에 sticky를 풀었다) / 대사 / 다음 흐름 카드(`.right-scroll`), ◐ 셰이더면 `ShaderPanel`. 칸 맨 위 오른쪽에 [모두 접기]↔[모두 펼치기](`Card.tsx` `FoldAll`, 그 칸 `FoldScope` 안에 지금 보이는 카드를 모두). 검사와 스크립트는 왼쪽 칸 카드(`Sidebar.tsx` `WarnCard` `ScriptCard`, 원고는 `generateRpy`를 `useMemo`로). 왼쪽 순서: label(+ 상자와 정렬) / 캐릭터 / 검사 / 렌파이 프로젝트 정보 / 스크립트 / 설정. 사용법 카드는 세션 39에 없앴다.
- **도움말과 ⓘ** (`src/Help.tsx`, 2026-11-13): 화면에는 설명 문단을 두지 않는다. 칸 이름 옆 `Hint`(ⓘ)에 올리면 한두 줄(`HintTip`, 화면 맨 위 층 fixed), 누르면 도움말의 그 항목(`topic` = GUIDE 제목의 일부). 카드는 `Card`의 `hint`, `topic`. 도움말 창은 둘째 줄 [도움말]과 F1(단축키로 못 고름)로 열고, 내용은 `docs/GUIDE.md`를 빌드할 때 `?raw`로 넣어 작은 마크다운 그리기로 보여 준다(목차, 찾기). 경고·빈 상태·지금 값은 짧게 화면에 남긴다.
- **카드 접기** (`Card.tsx`, 2026-11-12 세션 32): 양쪽 칸과 GUI 편집 칸의 카드는 모두 `Card`. 제목 오른쪽 회색 [접기]/[펼치기](`.fold-btn`), 제목 더블클릭도 같음. 접으면 이름만 한 줄, 하늘색 톤(`.sec.folded`). 접은 것은 카드 id로 `localStorage['pygaki-folded']`에 기억. 왼쪽 칸 카드(`FRESH`)는 기억을 읽지 않고 켤 때마다 모두 접혀서 시작한다(세션 34). 내보내기가 오류로 멈추면 검사 카드를 편다. 왼쪽 칸 스크롤바는 왼쪽(`.sidebar { direction: rtl }`, 안쪽은 `ltr`).
- **상자 카드 더** (세션 32): 대사 카드 아래 배경(그림, 영상) / 그림, 영상 / 효과음, 음악 카드(`StageCards.tsx`). 이 상자의 그 종류 줄 목록(누르면 그 줄로), 게임 폴더 파일을 눌러서 넣기(`scene`, `show`, `sound`/`music` 줄), 이름을 쳐서 넣기. 지금 쓰는 줄(`activeLine`) 바로 앞에, 없으면 상자 끝에 넣는다(안내 글은 세션 34에 뺌). [📂 파일 고르기](세션 34, `StageCards.tsx` `PickFile`): 앱 `pygaki:pickFile(kind)`가 `dialog.showOpenDialog`(시작은 `game/images`·`game/audio`)로 고르고, game 안이면 game 기준 경로, 밖이면 표(token)만 돌려준다. 묻고 `pygaki:importFile(token, dir)`로 `game/images|movies|audio`에 복사(같은 이름이면 `_2`…, 화면은 고른 파일의 전체 경로를 모름) → `scanFolder`. 경로 → 이름은 `imageNameOf`/`movieNameOf`, 소리는 `audio/` 기준. images·movies 밖의 game 파일(gui 등)은 그림으로 안 받는다. **캐릭터 그림** (세션 36, `CharPics`): 지금 쓰는 줄이 캐릭터 대사(`say`, `who`)면 그림 카드 맨 위에 `who`로 시작하는 그림 격자와 표정 이름 칸 → `show` 캐릭터 줄(`kind: 'char'`, `attr`)을 그 대사 앞에. 대사 줄 `attr`은 화면에서 새로 넣지 않는다(형식과 내보내기는 그대로). **사용 중 카드** (세션 36): 지금 쓰는 줄(`activeLine`)이 이 상자에 있으면 이어진 카드에 `.in-use`(옅은 녹색 `#34c759` 8%, 제목 옆 "사용 중"). 대사·내레이션 → 대사, 글자 효과 / `scene` → 대사, 배경 / `show`·`hide` → 대사, 그림 / `sound`·`music` → 대사, 효과음. **게임 수정 중** (세션 36): 게임이 끊기 직전 `reloading`을 보내면 앱(`main.cjs` `entry.reloading`)은 다시 붙을 때까지 `liveStatus.reloading`을 켬. 끊긴 동안 3초마다 `process.kill(pid, 0)`으로 게임 프로세스를 보고, 없거나 2분이 지나면 끔. 화면은 `useLive.reloading`, 연결 단추 노란색 "◐ 게임 수정 중", 그동안 파일 목록(`files`)은 그대로 둔다.
- **게임으로 가는 단추** (`PickPos.tsx`, 세션 34. 앱 + 게임 연결일 때만, `useGameReady`): 상자 카드 [렌파이에서 여기로 이동](연결 안 되면 회색)은 원고를 내보내고(`files.ts` `exportedBoxLineOf` → `codeBoxLineOf`: `# @node:` 다음 첫 실행 줄, label 줄은 건너뜀, 줄이 없으면 label 줄) `goto`. 대사 카드 줄에 마우스를 올리면 카드 왼쪽 바깥에 뜨는 작은 팝업(`useSidePop`, body에 붙인 `position: fixed`, 화자 칸이 잘리지 않게)에 [여기로 이동](`exportedLineOf`)과, 대사·내레이션 줄에는 [위치 옮기기](`goto` → `panel` → 0.7초 뒤 `editor open tab:'say'`, 연결 설정 `renpyLink`도 켜져 있어야 함). 다음 흐름(선택지) 카드의 [위치 옮기기]는 상자 마지막 줄로 가서 `choice` 탭. 배경·보이기 줄(대사 카드, 그림 카드의 줄 목록 `StageCards.tsx` `Used`)의 [위치 옮기기]는 `stage` 탭을 `editor` 명령의 `line` `file`과 같이 연다(ui_kit 4.8이 그 줄을 고름, LINK.md 9장). 누른 줄 아래에 [저장 (수)] [끝내기](`PickBand`, 안내 글은 단추 툴팁). 게임 창에서 끌고 저장하면 받아 적기(LINK.md 3장). 연결 안 됐으면 대사 카드 아래에 안내 한 줄(`GameOffTip`).
- 칸 너비: 칸 사이의 `.resizer`(`Resizer.tsx`)를 끌면 `prefs`의 너비가 바뀌고 CSS 변수로 적용된다. 대본 편집 `leftW` `rightW`(`--left-w` `--right-w`), GUI 편집 `guiLeftW` `guiRightW`(`--gui-left-w` `--gui-right-w`), 효과·셰이더 오른쪽 `fxSideW`(`--fx-side-w`). 범위와 처음 값은 `prefs.ts` `SIZES`. 더블클릭은 그 칸만 처음 값, 왼쪽 "설정"의 [처음 크기]는 모든 칸, [잠금](`prefs.sizeLock`)이면 손잡이가 움직이지 않는다. 접은 칸은 손잡이도 없다.
- 왼쪽 칸과 오른쪽 칸은 캔버스 위쪽 양 끝의 작은 버튼(`.side-toggle`, `Canvas.tsx`)으로 따로 접고 편다(`store.hideLeft` `hideRight`, `localStorage['pygaki-hide-left']` `['pygaki-hide-right']`). 접어도 지우지 않고 CSS로만 숨긴다.
- 툴바 왼쪽의 화면 바꾸기(`Toolbar.tsx` `ViewSwitch`, `showpyLive.ts`의 `view`): [대본 편집] / [GUI 편집](데스크톱 앱에서만) / [효과]. 대본 화면은 다른 화면을 보는 동안에도 지우지 않고 숨긴다.
- **[효과] 화면** (`EffectsView.tsx`): 왼쪽은 효과 카드 목록([글자 효과 | 그림 효과], 찾기, [파일 넣기], [새 효과 요청문 복사]), 오른쪽은 대본 편집·GUI 편집처럼 바탕 위의 카드 셋(샘플 / 세부 값 / 쓰인 곳, `Card`, 접은 것 기억). [셰이더] 화면의 [셰이더]·[전환]도 같다. 왼쪽은 갤러리(`FxGallery.tsx`, `prefs.gallery`, 처음 값)와 목록 중 고른다. 갤러리 카드는 멈춘 그림: 셰이더·그림 효과는 `fx/thumbs.ts`가 종류마다 WebGL 판 하나로 차례대로 그려 data URL로(그림 효과는 앞·새 그림과 가장 다른 순간), 글자 효과는 `TextPhotographer` 하나가 화면 밖에서 돌려 반쯤 나온 순간을 `FxCanvas` `onFrame`으로 찍는다. 움직이는 샘플은 마우스를 올린 카드 하나, [▶ 움직이기](`prefs.galleryMove`, 처음 값 끔)를 켜면 `IntersectionObserver`로 보이는 카드에 보인 차례대로 `MAX_LIVE`(6)개까지 자리를 준다(브라우저의 WebGL 판 수 제한, 16쯤). 만들 그림 수는 `thumbs.ts` `workAdd/workDone/workDrop`으로 세어 `GallerySwitch`에 진행 막대로 보이고, 다 되면 0으로 돌아가 숨는다. 목록과 파일 다루기는 `effectsLib.ts`의 함수만 부른다(7장).
  - 카드: 체크(켬/끔 = `setEffectOn`), 한글 이름, 영어 이름, 쓰인 줄 수, 어디 것(렌파이 / 기본 / 프로젝트 / 모음), 프로젝트 효과는 [빼기], 아직 넣지 않은 모음은 [넣기]. 플러그인이 있는 게임 폴더를 연결하지 않았으면 구경만 하고 버튼은 막는다.
  - [빼기]는 창을 띄워 그 파일에 든 효과가 쓰인 줄 수를 보여 주고, 쓰였으면 [다른 효과로 바꾸고 빼기](효과마다 바꿀 것을 고름) / [그냥 빼기] / [취소].
  - 샘플(글자 효과): 대사 미리보기와 같은 `FxCanvas`로 샘플 글을 돌린다. 세부 값 막대(`effectKnobs`)를 움직이면 다시 돌고, 그 값은 저장하지 않는다. 아직 넣지 않은 모음의 효과는 `textShaders.ts`의 `previewPack`으로 샘플용으로만 올려서(`shaderEffect(name, true)`) 돌린다(고르는 목록에는 안 나옴). 셰이더 코드가 틀리면 샘플 칸에 이유가 나온다.
  - 샘플(그림 효과): `fx/TransitionCanvas.tsx`가 효과 파일의 `@fragment`를 게임(`image_effects.rpy`)과 같은 틀(`tex0` 앞 그림, `tex1` 새 그림, `l__uv` `l__old` `l__new` `l__t` `l__size`, 이름은 `u_imgfx_<효과>_값`)로 묶어 WebGL로 그린다. 샘플 그림 둘은 캔버스로 만들고, [고르기]로 고른 그림 파일은 새 그림 자리에 꽉 차게 넣는다(저장 안 함). 막대는 `@time`(걸리는 시간)과 `effectKnobs`, "원고에 적는 법" 줄에 맞춘 값 그대로의 `with img_fx.use(...)`가 나온다.
  - 쓰인 곳의 [보기]는 [대본 편집]으로 돌아가 그 상자를 고르고 그 줄에 초점을 둔다.
  - [새 효과 요청문 복사]는 `showpy/game/ui_kit/effects/README.md`의 요청문을 빌드할 때 가져와 클립보드에 넣는다(사본 없음, 밖으로 통신 없음).
  - 이 화면에서는 단축키가 저장, 실행 취소, 다시 실행만 듣는다.
- 상자 머리와 label 틀 오른쪽 위에 [◐ 셰이더] 버튼. 누르면 오른쪽 칸이 셰이더 고르기(`ShaderPanel.tsx`)로 바뀐다(4장).

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
- **대사 줄의 `say`** (`SayStyle`): `size` `font` `color` `cps` `effect` `box` `tail` `box_rotate` `name_size` `name_font` `name_color`는 PyKaki에서 고친다. `effect`는 두 효과를 `|`로 겹칠 수 있다(`slidein|shake`). `box`는 글 상자(`bubble` 말풍선, `pill` 둥근 테두리, pygaki 플러그인 `ui_kit` 4.0)이고 연결을 켰을 때만 내보낸다. 미리보기는 CSS로 비슷하게 그린다(`.sbox`, 셰이더 효과일 때는 기울기를 안 보여 줌). `x` `y` `name_x` `name_y`는 showpy에서 받아 적은 값을 보여 주고 지우기만 한다. 연결을 켜면 짧은 이름으로(`sayArgs`), 끄면 플러그인 없이 동작하는 렌파이 원래 이름(`what_size`, `what_slow_cps`, `what_textshader` 등)으로 내보낸다. 모두 선택 칸이라 예전 파일은 그대로 열린다.
- **나가는 방식(exit)**:
  - `next` `{ target }`: 다음 상자로
  - `menu` `{ choices: [{ id, text, target, mode:"jump", condition:null, actions:[] }] }`: 선택지
  - `call` `{ target, then }`: target을 call하고, 돌아오면 then으로. then이 없으면 return
  - `return`: 끝
- `condition`, `actions`, `variables`는 2단계(플래그)를 위해 비워 둔 자리다. 지금은 쓰지 않는다.
- id는 툴이 만든다. 상자는 `n01`, `n02` … 만든 순서 번호(`ops.nextBoxId`: 지금 있는 가장 큰 번호 다음, 지운 번호는 다시 안 씀, 99를 넘으면 `n100`. 한번 붙으면 안 바뀜. 예전 상자의 `n` + 영숫자 6자는 그대로 둠), 줄·선택지·label은 `l`/`c`/`g` + 영숫자 6자. 로컬 label 이름으로도 쓰이므로 영문 식별자 규칙을 지킨다.
- 불러올 때 `normalizeProject()`가 빠진 값을 채우고, 그룹이 없는 상자를 첫 그룹에 넣는다.
- **셰이더** (`BoxNode.shader`, `LabelGroup.shader`, `src/shader.ts`, `FEATURE` 5): `{ a, b, in?, out? }`. `a` `b`는 pygaki 플러그인 `screen_fx.shaders`의 1번, 2번 이름(`none`, `ascii`, `vhs_crt` …), `in` `out`은 전환. 고를 수 있는 것은 `tv`와 `none`(없음, `transition=None`) 둘이고(`SHADER_TRANS`), 새로 정하면 둘 다 `tv`로 시작한다(`newShader`). 예전 판의 `fade`와 빈 값(게임 설정대로)은 대본에 그대로 두고 그대로 내보내며, 칸에 "예전 값"으로 알린다(`oldTransLabel`). 상자에 없으면 label 것, label에도 없으면 없음(`shaderOfBox`). 값이 없는 것이 기본이라 예전 파일은 그대로 열린다.
  - 내보내기: 셰이더를 한 곳이라도 정했고 `renpyLink`가 켜져 있으면 **모든 상자의 첫 줄**(상자 label 바로 아래, 첫 `# @l:` 앞)에 `$ screen_fx.shaders("a", "b"[, transition=…])`를, 셰이더가 없는 상자에는 `$ screen_fx.clear([transition=…])`를 적는다. pygaki 플러그인은 같은 값이면 전환 없이 넘어가므로(`screen_fx.use`의 `old == new`) 어느 길로 들어와도 맞다. `call` 줄 바로 뒤에도 한 번 더 적는다(불러온 장면이 바꿨을 때).
  - 고르는 목록(`shaderNames`): 게임 폴더의 `screen_fx/shader_list.json`(없으면 빌드할 때 가져온 저장소의 목록)에서 `screen_fx/shaders_off.txt`에 적힌 것을 뺀 것. `gameFolder.ts` `scanFolder`가 읽어 `setShaderList` `setShadersOff`로 넘긴다. 형식은 LINK.md 11장. 지금 고른 것은 꺼져 있거나 목록에 없어도 남긴다.
  - 위쪽 [셰이더] 화면의 [셰이더] 칸(`ShadersView.tsx`, `shaderLib.ts`. 2026-11-12에 [효과] 안에서 위쪽 큰 탭으로 올림): 카드 목록(이름, 쓰인 곳 수, 끔·덮개 표시), 켜기/끄기(`setShaderOn`이 `screen_fx/shaders_off.txt`를 씀), 샘플(`fx/ScreenFxCanvas.tsx` `ScreenFxCanvas`: 목록 파일의 `glsl`을 합쳐 WebGL로 계속 그림, `extra`인 효과와 코드가 없는 1판 목록은 안내만)과 세부 값 막대(`ScreenFxKnobs`, 플러그인 `GROUPS` 그대로. 값은 저장하지 않음), 쓰인 곳 [보기](`openShader`). `useLive.view === 'shaders'`일 때 `App.tsx`가 그린다.
  - 화면(`ShaderPanel.tsx`): 카드 셋. 셰이더(1번, 2번) / 전환(시작할 때, 끝날 때. 픽셀소트·데이터모싱이면 그 줄 아래 **방향** 단추(`IMG_TRANS_DIR`, 대본 `shader.iv` `{효과: {값: 값}}`, `FEATURE` 9, 효과 파일에 그 `u__` 값이 있을 때만)와 그림 전환 시간 막대 `shader.time`. 내보낼 때 방향은 `tv={…}`로, 게임 효과 파일에 있는 값만) / `script_flow.rpy`에 들어가는 줄.
  - 전환(`enterTrans`): 그 상자의 `in` → 셰이더가 다른 앞 상자의 `out` → 없음(게임 설정). 상자 끝에는 줄을 넣지 않는다(선택지 화면이 바뀌지 않게).
  - 하나도 안 정한 대본에는 이 줄이 전혀 안 들어간다. `renpyLink`가 꺼져 있으면 왼쪽 검사 카드에 경고 한 줄.
  - 화면: 상자 머리와 label 틀 오른쪽 위의 `ShaderButton`(`BoxView.tsx`) → `store.openShader` → 오른쪽 칸이 `ShaderPanel.tsx`. 그 상자만 골라져 있는 동안(label은 아무 상자도 안 고른 동안)만 열려 있다.
  - **세부 값** (`FEATURE` 6, screen_fx 5.5): `BoxShader.va`(1번) `vb`(2번)는 `{값 이름: 값}`, `tv`는 TV 전환 값. 셰이더 칸에서 고른 셰이더 아래 [세부 값]을 펼치면 `ScreenFxKnobs`(값 이름과 범위는 `shader_list.json`의 `params` `groups`), 전환이 TV면 `TvKnobs`(`shader.ts` `TV_KNOBS`). 셰이더를 바꾸면 그 자리 값은 지운다. 내보낼 때(`shaderCode`) 대본 어디에든 셰이더 값이 있으면(`usesShaderValues`) 모든 셰이더 줄에 `values={이름: {…}}`(두 자리를 이름별로 합침, `slotValues`), 전환이 `"tv"`이고 그 전환의 주인에게 `tv`가 있으면 `tv={…}`. 들어올 때 전환과 TV 값은 `enterTransTv`. 게임 목록의 `screen_fx`가 5.5보다 낮으면(`valuesSupported`) 값을 빼고 검사 경고. 형식은 LINK.md 2장.
  - 위쪽 [셰이더] 화면(`ShadersView.tsx`): [셰이더](목록, 켜기/끄기, 샘플, 구경용 막대) / [전환](TV 꺼짐·켜짐, 픽셀소트, 데이터모싱, TV 지직, 조정 화면, 테이프 늘어짐, 점멸, 없음(`SHADER_TRANS`, 새 넷은 `FEATURE` 11). TV 말고는 효과 폴더 효과를 `PictureSample`로. TV는 CSS로 비슷하게 그리는 샘플 `TvSample`과 구경용 막대, 쓰인 곳).
  - 예전 `fx` 줄(`screen_fx.use`)은 그대로 읽고 내보낸다(새 줄 목록에는 없음).
  - 셰이더 카드 맨 아래 [⚠ 모든 상자에 적용](이 상자·label에 걸린 셰이더를 모든 label에 걸고 상자마다 따로 정한 것은 지움) / [⚠ 전부 삭제](대본 전체에서 지움). 확인 창을 띄우고, ↶로 되돌린다(`UiPanel.tsx` `AllRow`).
- **대사 소리와 속도** (`Line.say.sound`, `say.cps`, `FEATURE` 10): 대사·내레이션 줄 하나마다. `sound`는 game 기준 경로, `''`이면 이 줄은 끔, 없으면 캐릭터 `cb_typing_sound` → 게임 처음 값. 원고에는 대사 괄호에 `cb_typing_sound=`(연결을 켰을 때만). 상자 편집 칸 글자 효과 카드 아래 `UiPanel.tsx` `SayUiCard`: 값마다 [따름]/[이 대사에], [이 상자의 모든 대사에].
- **커서, 클릭 대기** (`BoxNode.ui`, `src/boxUi.ts`, `FEATURE` 7, 10부터 상자에만): `{ ctc?, cursor? }`. 값마다 상자 → 게임 처음 값(앞 상자 것을 이어받지 않음). `ctc` `cursor`는 그림 폴더(`gui/ctc/heart`). 상자 편집 칸 `UiPanel.tsx` `CursorCard`: 값마다 [게임 처음 값]/[이 상자에], 카드 맨 아래 [⚠ 모든 상자에 적용] [⚠ 전부 삭제](`applyAll` `clearAll`).
- **예전 대본 옮기기** (`sample.ts` `moveUi`): `FEATURE` 9까지의 `BoxNode.ui.cps/sound`, `LabelGroup.ui`는 열 때 상자 → label 차례로 찾아서, 속도·소리는 그 상자의 대사·내레이션 줄 가운데 값이 없는 줄로, 커서·클릭 대기는 상자로 옮기고 지운다. 그림 묶음은 `scanFolder`가 `gui/ctc`, `gui/cursor` 안의 폴더를 읽은 것(`Media.frames`).
  - 내보내기: `cps`는 그 상자의 대사·내레이션 줄 가운데 속도를 정하지 않은 줄에 `cps=`로. 나머지는 하나라도 쓰면(`usesSceneUi`) 모든 상자의 첫 줄(셰이더 줄 다음)과 `call` 뒤에 `$ custom_ui.scene(...)`(`sceneCode`). 게임의 `custom_ui.rpy`에 `def scene(`가 없으면(`sceneSupported`, `useGameFolder.sceneUi`) 빼고 검사 경고. 형식은 LINK.md 2장.

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
    - 텍스트 태그를 켰을 때 대사나 선택지의 태그 짝 (`checkTags`, 렌파이 `check_text_tags`와 같은 규칙): 여는 태그 없는 닫는 태그는 오류(렌파이가 실행 중 멈춘다), 엇갈려 닫힘(글 하나에 첫 번째만 알림)·닫지 않음·모르는 태그는 경고
    - 없는 상자를 가리키는 흐름은 파일을 열 때 `normalizeProject`가 "연결 안 됨"으로 돌리고, 그 뒤에 생기면 내보내기가 멈추지 않고 오류로 알린다
    - 태그 효과와 그림 효과의 세부 값: 태그 상자 [세부 값]은 `tagEdit.retag`로 `{shader=이름:u__값=3}`의 값만 고치고, 배경·보이기·숨기기 줄의 "나타나는 방식"은 고르기 창(`TransPicker.tsx`, 세션 34): `effectCatalog`의 그림 효과(켠 것)와 연결했으면 모음(아직 안 넣은 것, 고르면 묻고 `addFromLibrary` 뒤 고름), 위에 마우스를 올린 효과의 샘플(`EffectsView.tsx` `PictureSample`, WebGL 하나만). 창은 `document.body`에 `position: fixed`로 띄워 칸에 안 잘린다. 그 줄의 [세부 값]은 `stage.parseImageFx`/`formatImageFx`로 `trans`의 `img_fx.use("이름", 초, 값=…)`를 고친다(저장 형식은 그대로).
    - 연결을 켰는데 캐릭터 id가 pygaki 플러그인 이름과 겹침 (오류, `PLUGIN_NAMES`)
11. **pygaki 플러그인 연결(`renpyLink`)을 켜면 달라지는 것**. 끄면 예전과 똑같이 내보낸다.
    - 모든 상자에 `label 그룹.상자id:`를 쓴다. 첫 상자는 `label 그룹:` 바로 아래에 이어 쓴다.
    - 줄마다 앞에 `# @l:줄id`, 나가는 부분 앞에 `# @end:상자id`를 쓴다.
    - **줄 끝 표시** (`generateRpy(p, { endMarks })`, LINK.md 2장): 연결한 게임의 플러그인이 읽을 수 있으면(`gameFolder`의 `endMarks`, `ui_kit/engine/script_edit.rpy`에 `PK_END_MARKS = True`) 세 표시를 윗줄이 아니라 그 줄 끝에 붙인다(`mark()`). 끝에 붙일 수 없는 줄(`tailSafe`가 아니거나 쓴 줄이 없음)은 윗줄에 둔다. 폴더에 쓰는 길(`files.ts makeRpy`)과 원고 탭이 같은 값을 쓰고, 폴더 없이 받는 파일은 예전 형식이다. `codeLineOf`와 [GUI 편집] 원고 칸(`ShowpyView.tsx MARK_*`)은 두 형식을 모두 읽는다.
    - 대사 괄호(`fx=`, `size=` 등)와 `fx` 줄을 내보낸다. 끄면 `fx` 줄은 주석이 되고 경고가 뜬다. 괄호 순서는 화면 효과, 글자 모양, 위치다.
    - 형식은 [LINK.md](../../docs/LINK.md).

## 6. 자동 정렬 (`src/layout.ts`)

- **전체 정렬**: ELK 계층 그래프로 배치한다. label 그룹이 부모 노드가 되어 같은 label 상자가 한 덩어리로 모인다.
- **label 정렬 / 선택 정렬**: 해당 상자만 평면으로 배치하고, 왼쪽 위 위치는 유지한다.
- **흐름 순서**: 시작 상자부터 너비 우선으로 방문한 순서로 노드와 그룹을 ELK에 넘긴다. 그래서 선택지 순서대로 좌→우로 놓인다.
- **되돌아가는 선(루프)**: 깊이 우선으로 찾은 back edge는 정렬 계산에서 뺀다. ELK의 cycleBreaking 옵션은 계층 그래프에서 기대대로 동작하지 않았다.
- 정렬 결과는 `update()`로 반영되므로 실행 취소가 되고, 0.4초 이동 애니메이션이 붙는다.

## 7. 대사 미리보기와 등장 효과 (`src/SayPreview.tsx`, `src/fx/`)

- **PyKaki 안 플레이는 없앴다** (세션 34, 사용자 말): 위쪽 [▶ 플레이] [⛶ 전체화면], 오른쪽 플레이 카드, 단축키 Alt+P·F8, `playEngine.ts` `Player.tsx`, store의 `playing` `play` `fullPlay` 등. 대본은 [▶ 렌파이에서 실행]과 [렌파이에서 여기로 이동](6장)으로 게임에서 본다. 남긴 것은 `SayPreview.tsx`(예전 `PlayStage.tsx`의 `useReveal` `Glyphs` `LinePreview`): 글자 효과 카드 미리보기와 [효과] 화면 샘플이 쓴다.
- 텍스트 태그를 흉내 낸다: `{b} {i} {u} {s} {color=} {size=} {font=} {alpha=} {k=} {cps=} {p} {w} {nw} {fast} {a=}`, `{{`. 글자를 하나씩 내보내고(`parseTagged`, `useReveal`), 클릭하면 다음 멈춤까지 다 보여 준다.
- **등장 효과**: 렌파이 텍스트 셰이더 7개와 pygaki 플러그인이 등록한 20개를 **WebGL로, pygaki 플러그인과 같은 셰이더 코드로** 그린다(`src/fx/`). 효과 폴더(pygaki 플러그인 `ui_kit/effects/*.glsl`, LINK.md 8-1)의 효과도 같다: 플러그인이 있는 폴더를 연결했으면 그 폴더의 파일만 `scanFolder`가 읽고(연결하지 않았으면 빌드할 때 가져온 저장소의 샘플) `setFolderEffects` → `refreshEffects`(`EFFECTS`, `TRANSITIONS` 배열을 그 자리에서 다시 채움, `useGameFolder.fxSeq`로 다시 그림). 바뀌면 `effectEpoch`가 올라 미리보기 셰이더를 다시 만든다. 그림 전환(`img_fx.use`)은 [효과] 화면 샘플에서 같은 셰이더 코드로 그린다(`fx/TransitionCanvas.tsx`).
  - **효과 관리** (`src/effectsLib.ts`, 화면은 3장의 [효과] 화면. `window.pykakiEffects`로도 부를 수 있음): `effectCatalog`가 렌파이 / 기본 / 프로젝트 / 모음(샘플과 `showpy/effects_library`, 아직 넣지 않은 것)을 한 목록으로 만든다(켬·끔, 쓰인 줄 수). `setEffectOn`은 `effects_off.txt`(LINK.md 8-2)를 고치고, 끈 효과는 `stage.ts`의 `refreshEffects`가 고르는 목록에서 뺀다. `addEffectFile`·`addFromLibrary`는 `checkPack`으로 검사한 뒤에만 효과 폴더에 쓰고, `removeEffectFile`은 백업(`ui_kit_backup/effects/`)을 남기고 지우며 `replace`를 주면 대본의 그 효과를 다른 값으로 바꾼다(`replaceInProject`: 칸으로 고른 값, 명령 줄의 `effect="…"`·`img_fx.use(…)`, 대사 글의 `{shader=…}`). 쓰인 곳은 `effectUses`.
  - 셰이더는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나이고, 빌드할 때 `?raw`로 그대로 가져온다. 렌파이 내장 7개는 `src/fx/renpy_textshaders.glsl`(렌파이 8.5.3 `00textshader_ren.py`를 옮김, MIT). 형식은 [LINK.md](../../docs/LINK.md) 8장. 효과 목록 `EFFECTS`, `RENPY_EFFECTS`, 글자/초 기본값을 쓰는 효과(`@cps`)도 이 파일에서 온다.
  - `textShaders.ts`: 파일 읽기(`parseShaders`, pygaki 플러그인 `tfx_parse`와 같은 규칙), 효과 문자열(`"scatter:u__distance=200"`, `"a|b"`) 읽기(`parseTextShader`, 렌파이 `parse_textshader`), 렌파이처럼 셰이더 조각 합치기(`shaderSource`: `renpy.geometry` `renpy.texture` `textshader.이름`을 이름순으로, 쓰는 변수만 이름순으로, `vertex_N`/`fragment_N`은 우선순위순, `u__` `l__` `v__` `a__`는 `u_textshader_이름_…`으로 바꿈). 색 값은 투명도를 곱한 vec4.
  - `FxCanvas.tsx`: 화면의 글자(`span.ch`, `.fx-gl`이면 숨김)에서 자리를 재서, 렌파이처럼 글자를 그림으로 만들고(외곽선 겹은 따로) 글자마다 조각(줄 높이 × 글자 폭, 줄 왼쪽과 오른쪽 빈 곳은 가짜 글자, 그림 폭은 가장 긴 줄)을 만든다. 중심(`a_text_center`)은 글자 밑줄 자리. 글자 i의 `a_text_min_time`은 `useReveal`이 i번째 글자까지 내보낸 때라 렌파이처럼 한 글자 앞서 나오고, `{w}`에서 멈춘 동안 뒤 글자는 안 나온다. `u_text_slow_time`, `u_text_slow_duration`(1/cps), `u_text_to_drawable`(화면 배율 × devicePixelRatio), `u_text_main`, `u_text_depth`, `u_time`, `u_random`, `tex0`, `res0`를 렌파이와 같은 뜻으로 넘긴다. 클릭으로 한 번에 보이면 렌파이처럼 다 끝난 시간으로 그린다. 캔버스는 글 칸 둘레로 글자 크기 × 3만큼 넓다.
  - `echo`처럼 `@outline`이 있는 효과는 외곽선 겹(`u_text_main` 0)을 글자 뒤에 먼저 그린다.
  - WebGL이 없거나 셰이더가 실패하면 예전처럼 CSS로 흉내 낸다(`.fx-*`, `--cd`, `--r1`~`--r4`, `liquid`는 App.tsx의 SVG 필터).
  - pygaki 플러그인 효과는 연결을 끄면 내보내지 않고 경고한다(`RENPY_EFFECTS`). 렌파이처럼 글자가 하나씩 나올 때만 보이고, 물결과 떨림은 늘 보인다. 목록에서 뺀 효과는 `stage.ts`의 `REMOVED_EFFECTS`: 예전 대본 값은 그대로 두고 내보낸다(`typewriter`, `slowalpha`는 렌파이에 있어서 `RENPY_EFFECTS`에 넣음, 나머지는 pygaki 플러그인이 한 글자씩 나오기로 받음).
- 화면 효과(ASCII 등)는 웹 글자에 셰이더를 입힐 수 없어서 미리보기에 안 나온다.

## 8. 편집 동작

- **상자 더블클릭**: 상자 안에서 바로 편집한다(`store.inlineEdit`).
  - **볼 때와 같은 모양**: 상자 폭(250px), 글자 크기, 줄 배치가 같다. 같은 `LineRow`가 보기에서는 글자를, 편집에서는 테두리·여백 없는 `textarea`(`.ed`)를 같은 자리에 그린다. 보기 화면도 줄 수와 줄 길이를 자르지 않는다.
  - **줌인**: 편집을 시작하면 지금 화면(viewport)을 기억하고, 상자와 양옆 단추 자리가 들어오도록 확대(최대 1.6배, 지금보다 작게는 안 함)하며 0.45초 동안 이동한다. 끝내면 기억한 화면으로 돌아간다. 집중 모드를 바꾸면 다시 맞춘다.
  - **옆에 붙는 단추**: 지금 줄(`active`, 포커스를 받은 줄)의 높이에 맞춰 상자 왼쪽 바깥에 손잡이·줄 종류·＋·✕ 묶음(세션 36부터 대사 줄에 표정 칸 없음, 예전 `attr`이 있으면 빼기 단추 `OldAttr`만), 연출 줄이면 오른쪽 바깥에 `StageFields` 카드가 붙는다. 줄을 옮기면 `top`이 0.22초 동안 따라 움직인다. 연출 줄은 줄 자체가 `tabIndex`로 포커스를 받는다.
  - **다음 흐름 창** (`src/FlowMenu.tsx`): 편집 중 상자 오른쪽 바깥, 다음 흐름 줄 높이(연출 입력칸과 겹치면 그 아래. 상자 안이 바뀌면 `MutationObserver`로 다시 잰다)에 붙는 반투명(바탕 62%, 배경 흐림) 창. 선택칸 없이 항목을 모두 펼친다: 흐름 종류 4가지, 이어지는 곳(선마다, 고르면 상자 목록 단계로), 선택지 추가, 바로 가기(이어 쓰기, 새 상자에 이어 쓰기). 기본 Alt+Enter(`flowMenu`, 바꿀 수 있음)로 들어가면 숨은 입력칸이 키를 받아 ↑↓/Enter·→/←·Backspace/Esc로 움직이고, 상자 목록 단계에서는 그 칸이 찾기 칸이 된다. 나가면 들어오기 전의 글 칸으로 커서를 돌려준다. 마우스로도 누를 수 있다.
  - **다음 상자로 이어 쓰기** (`goNextBox`, 기본 Ctrl+Shift+Enter): `next`/call의 `then`이 이어져 있으면 그 상자를 편집, 없으면 `continueInNewBox`로 같은 label에 새 상자를 만들어 잇고 편집한다. 새 상자는 흐름 방향(TB면 아래, LR이면 오른쪽)에 놓고, 다른 상자와 겹치면 60px씩 비켜 놓는다. 선택지 상자는 카드에서 고른다.
  - 누른 곳의 `data-part`(줄 id, `title`, 선택지 id)로 커서가 간다.
  - 끝내는 방법: Esc, 빈 곳 클릭, 다른 상자 선택.
  - 입력칸 안의 더블클릭은 무시한다(단어 선택).
- **상자 한 번 클릭**: 오른쪽 칸에서 label, 다음 흐름, 시작 상자 등을 설정한다.
- **줄 순서**: ⠿ 손잡이를 끌어 다른 줄의 위/아래 절반에 놓는다. 오른쪽 칸은 HTML 드래그 앤 드롭(`useLineDrag`), 캔버스 상자 안은 포인터 끌기(`BoxView.tsx` `usePtrDrag`, React Flow의 상자 끌기·화면 이동과 겹치지 않게 `nodrag nopan`). 상자 안은 줄마다 왼쪽 여백에 손잡이(마우스를 올리면 보임, 볼 때도 고칠 때도)와 편집 중 왼쪽 바깥 단추 묶음의 손잡이.
- **떠 있는 좌우 칸** (세션 35): `.sidebar` `.right-panel`은 `.main` 위에 `position: absolute`, 바탕 투명, `pointer-events: none`(카드만 `auto`)이라 카드 사이·접힌 카드 아래로 캔버스가 보이고 눌린다. 캔버스는 `.main` 전체. 화면 맞추기는 두 칸 사이에 맞춘다(`Canvas.tsx` `fitVisible`, 컨트롤 [맞추기]도), 글 고치기로 다가갈 때도 칸이 덮은 만큼 옮긴다. 컨트롤·미니맵·`‹ ›`·안내 줄은 `--lw` `--rw`만큼 안쪽.
- **오른쪽 칸 줄 모양**: 줄마다 2칸 격자. 왼쪽 칸(136px)에 손잡이·줄 종류·✕와 대사 속성, 오른쪽 칸에 글(또는 연출 입력칸)을 두고 사이에 세로 선을 긋는다.
- **글자 효과 칸** (`LineLook`, 연결과 상관없이): 글 칸에는 글만 둔다. 오른쪽 칸 상자 카드 아래에 있고(`.look-panel`), 지금 쓰는 줄(`store.activeLine`, 상자 안 편집과 오른쪽 칸이 같이 씀)을 따라간다. 그 줄이 대사가 아니면 상자의 첫 대사 줄을 보여 준다. 집중 모드에서는 패널과 함께 숨는다. 글자 모양, 속도, 등장 효과가 들어 있고, 받아 적은 좌표와 화면 효과는 보여 주기만 한다. 맨 위 미리보기(`LinePreview`)는 `SayPreview.tsx`의 `useReveal`, `Glyphs`, `FxCanvas`로 글자만 그린다. 글자는 칸에 들어가는 가장 큰 크기(11~60px)로 맞추고, 효과나 글자/초를 바꾸면 다시 재생한다.
- **태그 상자** (`src/TagBar.tsx`, `src/tagEdit.ts`): 대사·내레이션 글 칸(`textarea[data-tags]`)에 포커스가 있으면 뜬다. 지금 칸은 `useTagTarget`(document `focusin`으로 따라가고, 태그 상자 안으로 포커스가 가도 그대로, 빈 곳으로 포커스가 사라지면 닫음). 상자 안 편집(`in-줄id`)이면 `BoxView`가 상자 오른쪽 위 바깥(`.tagbar-box`)에, 오른쪽 칸(`ed-줄id`)이면 `LineLook`이 글자 효과 칸 제목 아래(`.tagbar-look`)에 그린다.
  - 단추를 눌러도 글 칸의 포커스와 고른 곳이 남게 `mousedown`을 막는다(입력 칸, 팔레트 칸 빼고). 고친 글은 `HTMLTextAreaElement` value setter + `input` 이벤트로 넣어서 React `onChange`를 그대로 탄다(실행 취소 묶음도 타이핑과 같음).
  - `tagEdit.ts`: `tokenize`(렌파이처럼 `{{`, `{#…}`, 짝 태그와 혼자 쓰는 태그는 렌파이 8.5.3 `text_tags` 목록), `pairTags`(닫는 태그는 가장 안쪽을 닫음). 고치기: `toggleTag`(b i u s: 같은 태그 안이면 빼기, 고른 곳이 안쪽 일부면 그 부분만 끊어서 밖으로, 아니면 감싸기), `setTagValue`(color size cps: 안이면 값만 바꾸기), `stepSize`(+10/-10, `+n`은 더하고 0이 되면 빼기, 숫자는 더하기, `*x`는 1.25배/0.8배), `removeTag`, `insertTag`(커서 자리, `{nw}`는 글 끝, `{w=0.5}`는 숫자를 골라 둠), `tagsAt`(단추 켜짐). 커서가 태그 글자 한가운데면 태그 밖으로 옮기고, 고른 곳 안의 태그 짝이 안 맞으면 넣지 않고 알린다.
  - [더 보기] (2단계, 펼침은 `localStorage["pykaki-tag-more"]`): 투명도 `{alpha}`(막대는 끄는 동안 값만 보이고 놓을 때 한 번 넣음, 1이면 빼기), 자간 `{k}`(`stepK` ±1, 0이 되면 빼기), 외곽선 색 `{outlinecolor}`(같은 팔레트, 외곽선이 있는지는 읽지 않고 안내만), 글꼴 `{font}`(연결한 폴더 `media.fonts`), `{space=30}` `{vspace=30}` `{{`, 루비 `insertRuby`(`{rb}고른 글{/rb}{rt}읽는 법{/rt}`, 읽는 법을 골라 둠), 글 속 그림 `{image=}`(`media.images`). 렌파이 기본 `ruby_text` 스타일은 본문과 같은 크기·자리라 겹쳐 보여서, 루비를 넣을 때 게임 쪽 스타일을 정하라고 알린다(`RUBY_NOTE`, 멈추지는 않음). `select`도 포커스를 받게 `mousedown` 막기에서 뺀다.
  - 고른 글에만 효과 (3단계): [더 보기]의 효과 목록이 `{shader=이름}`으로 감싼다(`setTagValue`, 빼기는 `removeTag`). 목록은 `stage.ts` `EFFECTS`(켜 둔 글자 효과)에서 `@outline`이 있는 효과를 뺀 것(외곽선 겹은 줄 전체의 값이라 일부에만 못 넣음). 렌파이는 줄에 텍스트 셰이더가 없으면 `{shader}`에서 예외를 내므로, `sayArgs(s, native, text)`가 줄에 효과가 없을 때 `effect="typewriter"`(플러그인이 없으면 `what_textshader=`)를 붙인다. `lineCps(s, text)`는 태그의 효과가 `@cps`여도 기본 글자/초를 쓴다. 내보내기 검사: 모르는 효과 이름, 플러그인이 없는데 플러그인 효과, 선택지 글의 `{shader=}`(오류). 그리기: `parseTagged`가 글자마다 `shader`(가장 안쪽 태그 값)를 적고, `SayPreview.tsx` `useShader`가 줄의 효과(없으면 숨은 `typewriter`, `textShaders.ts` `HIDDEN_SHADERS`)와 태그 값마다의 셰이더(`tagTs`)를 만든다. `FxCanvas.tsx`는 렌파이 `create_mesh_displayable`처럼 효과마다 조각 묶음을 따로 만들고(글자 번호와 시간은 줄 전체 기준, 줄 양옆 빈 조각은 첫 글자의 묶음에만), 겹마다 묶음을 차례로 그린다. 기다리는 시간은 가장 긴 효과, 하나라도 계속 그리는 효과면 계속 그린다(`compute_times`). 값이 틀린 태그의 글자는 줄의 효과로 그린다.
  - 팔레트: 8색 × 밝게/보통/어둡게 + 회색 8칸, 이 프로젝트 색(`gui.rpy` `text_color`, 캐릭터 색), 최근 8칸(`localStorage["pykaki-recent-colors"]`), `#rrggbb` 칸, 브라우저 색 고르기. 화살표 8칸씩, Enter, Esc.
  - 단축키 `tagBold` `tagItalic` `tagUnderline`(기본 Ctrl+B/I/U, 글 칸에 포커스가 있을 때만 잡음).
  - 텍스트 태그가 꺼져 있으면(`allowTextTags`) [켜기]만 보인다.
  - 형식은 그대로다. 글 안의 태그일 뿐이라 `.flow.json`, LINK.md, `FEATURE`는 안 바뀐다.
- **상자 보기 화면의 태그** (`TagView`): 고칠 때(textarea)와 자리가 같아야 해서 글자는 그대로 두고 태그 글자만 흐리게(`.tg`, 멈춤 태그는 `.tg-stop`), 안쪽 글에 굵게(폭이 안 변하는 그림자), 기울임, 밑줄, 취소선, 색만 입힌다. 크기는 바꾸지 않는다.
- **렌파이 견본** (`EffectClip`): 효과를 고르면 미리보기 아래에 `public/effects/<효과>.webm`을 반복 재생한다. 렌파이에서 예시 대사를 재생하며 찍은 2.4초 영상이다. `tools/record_effect_clips.py`가 효과 목록을 `stage.ts`에서 읽어 렌파이 SDK와 ffmpeg로 만든다. 효과를 새로 넣으면 다시 돌린다.
- **렌파이에서 보기**는 없앴다(2026-11-11). `game/pykaki_preview.json`을 쓰지 않고, 예전에 쓰던 `localStorage["pykaki-live-preview"]`도 읽지 않는다. 게임에서 보려면 자동 내보내기와 [게임 줄 따라가기]를 쓴다([LINK.md](../../docs/LINK.md) 7-1).
- **글자/초 기본값** (`lineCps`, `DEFAULT_CPS` 30): 글자가 하나씩 나와야 보이는 효과(`wave`, `jitter`, `liquid`, `vhs`를 뺀 모든 효과)에서 `cps`가 비면 30으로 재생하고 내보낸다. 효과가 없거나 `wave`, `jitter`이면 비운 채로 두고 게임 설정을 따른다.
- **Ctrl+Enter**: 같은 화자로 새 줄을 만든다. `flushSync`로 즉시 그려서 바로 이어 쳐도 글자가 새 줄에 들어간다.
- **빈 곳 더블클릭**: 새 상자를 만든다. label 프레임 안이면 그 label에 넣는다.
- **선을 빈 곳에 놓기**: 새 상자를 만들어 연결한다. 상자 몸통에 놓으면 그 상자에 연결한다.
- **선 더블클릭**: next ↔ call을 전환한다.
- **Delete**: 상자나 선을 삭제한다.
- **Shift+드래그**: 여러 상자를 선택한다.
- **단축키(기본값)**: Ctrl+\\ 집중 모드, Ctrl+Enter 새 줄, Ctrl+Shift+Enter 다음 상자로 이어 쓰기, Alt+Enter 다음 흐름 창, Ctrl+S 저장, Ctrl+Shift+S 다른 이름으로 저장, Ctrl+E 같은 곳에 다시 내보내기, Ctrl+Z/Y 실행 취소/다시 실행(입력칸 밖에서), Ctrl+B/I/U 대사 글 칸에서 굵게/기울임/밑줄 태그, Alt+N 새 상자(F5는 새로고침과 겹쳐서 쓰지 않음. 플레이 단축키 Alt+P, F8은 세션 34에 뺌). 8-1 참고.
- 실행 취소: 같은 key로 1.2초 안에 이어지는 변경(타이핑)은 한 번으로 묶는다. 최대 100단계.

## 8-1. 화면, 집중 모드, 환경 설정

- **눈에 덜 띄는 화면**: 버튼은 테두리 없이 흐린 글자, 입력칸은 테두리 없이 옅은 바탕. 위쪽 줄의 오른쪽 메뉴 묶음(`.tb-right`)과 미니맵/확대 버튼은 평소 흐리고 마우스를 올리면 또렷해진다. 줄의 ✕ 버튼은 줄에 마우스를 올렸을 때만 보인다.
- **색 (`src/prefs.ts`)**: `--bg`(바탕) `--panel`(면) `--text`(글자) `--accent`(강조) 네 가지만 정하고, 테두리·흐린 글자·줄 종류 바탕은 CSS `color-mix()`로 이 넷에서 만든다. 테마는 사과 스타일, 어둡게, 직접 고르기 셋. (예전 '종이', '사과 컬러풀', '밝게', '1비트', '1비트 흰 바탕'은 없앴고, 저장된 값이면 사과 스타일로 연다) 바탕이 어두우면 `data-dark`를 붙이고 React Flow도 `colorMode="dark"`.
- **집중 모드**: `store.focusMode`. `.app.focus`가 툴바·양쪽 패널·미니맵·확대 버튼·안내 글을 숨긴다. 저장하지 않고 새로고침하면 꺼진다. 알림(`say`)은 화면 아래 토스트로 띄워서 집중 모드에서도 보인다.
- **밑줄 커서 (`src/Caret.tsx`)**: 상자 안 편집(`.box.editing`)의 글 입력칸에서 브라우저 커서를 투명하게 하고, 강조색 밑줄을 1.05초 주기로 깜박인다. 입력칸 스타일을 복사한 보이지 않는 div에 커서 앞 글자를 넣어 자리를 재고, 매 프레임 입력칸 위치·확대 비율을 다시 읽어 화면 이동/확대를 따라간다. 커서가 움직이면 켜진 상태부터 다시 깜박인다. 글자를 범위 선택하면 숨기고, 한글 조합 중에는 보인다.
- **단축키**: `ACTIONS`에 동작과 기본 키. 키는 `e.code`(자판 위치)로 적어 한글 입력 상태에서도 같다. Cmd는 Ctrl로 본다. 바꿀 때 Ctrl/Alt 없는 키는 F1~F12만 허용하고, 겹치면 다른 동작의 키를 비운다. 실행 취소/다시 실행은 입력칸 밖에서만(입력칸 안은 브라우저 글자 되돌리기).
- **글꼴**: Pretendard 500 하나(고르는 칸 없음. 예전 `font` 설정 값은 읽을 때 버린다). CSS 변수 `--font`(본문)·`--mono`(코드)·`--font-weight`로 화면 전체에 적용한다. Pretendard는 `pretendard` 패키지의 가변 글꼴 `PretendardVariable.woff2`(약 2MB, 한글 11,172자, 굵기 45~930) 하나를 `?url`로 가져와 빌드 때 파일 안에 넣고 `FontFace('Pretendard Variable', …, { weight: '45 930' })`로 등록한다. 처음 켤 때 한 번 등록한다. 라이선스는 `licenses/`. 이 글꼴 때문에 `dist/index.html`이 약 4.7MB가 된다. 사과 스타일 테마도 같은 글꼴을 쓴다.
- **그라데이션 테마** (`dark`, 화면 이름 '어둡게'): 두 색 `grads.dark = { a: 바탕 쪽, b: 끝 }`(처음 값 검정→#8b5cf6)에서 `gradColors()`로 바탕 0%, 면 8%, label 배경 30%, 상자 55% 지점의 색을 만든다. 글자색은 각 색 밝기로 검정/흰색(`textOn`), 강조색은 끝 색을 밝게(어두운 바탕)/어둡게(밝은 바탕). 상자·label 배경은 `data-boxfill`/`data-labelfill`과 `--theme-box`·`--theme-label`(+`-text`)로 칠한다. `data-grad`일 때는 상자 색(`.own-color`)을 쓰지 않고 모든 상자가 그라데이션 색이며, 설정의 [상자 색]도 막는다(칠해 둔 값은 남아서 다른 테마에서 보인다). 미니맵도 그라데이션 상자 색.
- **텍스트 색** (`textColor`, 기본 null=테마 색): 고르면 `--text`와 `--text-fix`를 그 색으로 하고 `data-textfix`로 상자(`--bt`)·label 제목 글자까지 덮어쓴다(모든 테마).
- **직접 고르기**: 바탕·면·상자 색(글자색은 텍스트 색, 강조색은 고르기 직전 테마 것을 이어받음). 상자 색은 `data-boxfill`로 칠하고 label 배경은 label 색.
- 상자 진하기·상자에 label 색 설정은 없앴다(`--box-strength` 0.3, `--label-tint` 0.5로 고정, 사과 테마에서 쓰임).
- **label 경계선** (`frameWidth`, 0~6px, 기본 3, 0이면 안 보임): CSS `--frame-w`. label 묶음 테두리 굵기. 사과 스타일은 테두리 없음.
- **label 배경**: 사과 테마와 직접 고르기에서는 label 색(`LabelGroup.color`) 그대로, 그라데이션 테마에서는 테마 색. 제목 글자는 배경 밝기에 따라 검정/흰색.
- **사과 스타일 테마** (`apple`, 기본 테마, Apple 디자인 참고): `data-look`. 바탕 #f2f2f7, 면 흰색, 강조 #007aff, 회색 #8e8e93. 상자는 흰색(`--panel`) 카드로 두고, 상자·label 배경·선택지·입력칸의 테두리를 없애고 둥근 모서리(상자 16px, label 24px)와 옅은 그림자, Apple 회색 채움(rgba(118,118,128,.08~.12))으로만 구분한다. 글꼴이 "기본"이면 시스템 글꼴(-apple-system 등)을 먼저 쓴다.
- **상자 색**: 상자에 `color`가 있으면 `.own-color`를 붙이고 상자 바탕을 그 색 그대로 칠한다(어둡게 제외 모든 테마). 글자색 `--bt`는 그 색이 밝으면 검정, 어두우면 흰색이고, 상자 머리·줄·다음 흐름 안에서만 `--text`·`--muted`·`--line` 등을 이 색에 맞춰 다시 정한다(옆에 붙는 단추·창은 원래 색). 고르는 곳은 환경 설정의 [상자 색] 하나뿐이다(편집 화면을 깔끔하게 두려고): 대상(모든 상자/선택한 상자/label 하나)과 색(색 고르기 칸과 hex 코드 입력칸. `#RRGGBB`/`#RGB`, `#` 없이 적어도 됨. 틀린 코드는 빨갛게 표시하고 칠할 색은 바꾸지 않는다)을 골라 한꺼번에 칠하거나 label 색으로 되돌린다. `update()`로 바꿔서 실행 취소가 된다. 미니맵도 이 색.
- **집중 모드 흐림**: 집중 모드이고 편집 중인 상자가 있을 때(`.app.focus:has(.box.editing)`), 편집 상자 안에서 포커스가 없는 줄·제목·선택지는 `--dim-line`, 다른 상자·label 배경·선은 `--dim-box` 불투명도. 흐린 상자는 마우스를 올리면 0.6 이상으로. 단계(끄기/약하게/보통/강하게)별 값은 `prefs.ts`의 `DIMS`.
- **처음 값으로**: 설정 창의 [모든 설정을 처음 값으로]는 확인을 받고 `resetPrefs()`로 환경 설정 전체(테마, 그라데이션 두 색, 직접 고른 색, 글꼴, 흐림, label 경계선, 단축키)를 `defaults()`로 되돌린다. 대본(상자 색 포함)은 건드리지 않는다.
- 환경 설정은 대본이 아니라 브라우저에 붙는 설정이라 `localStorage['pykaki-prefs']`에 둔다(못 쓰면 기본값).

## 9. 저장

| 층 | 방식 | 위치 |
|---|---|---|
| 자동 저장 | 변경 0.7초 뒤 | 앱: 프로젝트 대본 파일(9-2). 개발 서버: IndexedDB `renpy-flow-editor` / `kv.current` |
| 버전 스냅샷 | [버전 저장], 열기/새로/복원 직전 자동 | IndexedDB `snapshots` |
| 파일 | Ctrl+S, `.flow.json` | 사용자 폴더 (진짜 백업) |
| 자동 저장본 | 바뀐 것이 있으면 5분마다, 연결 내보내기 때. 최근 30개만 둠 | IndexedDB `snapshots` |
| `.rpy` | 내보내기, 핸들 기억 → Ctrl+E로 같은 곳. 연결을 켜면 연결한 폴더의 `script_flow.rpy` | 게임 `game/` 폴더 권장 |

- 파일로 저장하지 않은 변경이 있으면 탭을 닫을 때 경고한다.
- 파일에 쓸 때 `app: { by, build, needs }`를 붙인다(9-3).

## 9-0. pygaki 플러그인 연결 (`src/gameFolder.ts`, `src/inbox.ts`)

전체 형식은 [LINK.md](../../docs/LINK.md). `.rpy`를 되읽는 역가져오기는 없다.

- 폴더: 앱이 연 렌파이 프로젝트의 `game` 폴더(`restoreFolder`, 9-2). 웹의 폴더 고르기(`showDirectoryPicker`, `linkProject`, `kv.gameDir`)는 웹 버전과 같이 없앴다.
- 목록: `images`, `movies`, `audio`를 읽어 연출 줄 칸의 `datalist`로 보여 준다. 대본에 이름이 `start`인 label이 있고 위쪽 폴더의 다른 `.rpy`에도 `label start`가 있으면 사이드바에 알린다.
- 목록과 함께 미리보기 값(`look`: 글꼴, 글자 색, 글자/초)과 글꼴 목록도 읽는다.
- 받아 적기 `pullInbox`: 창이 다시 focus될 때, 앱을 켤 때, [다시 읽기], 내보내기 직전. 받을 것이 있으면 저장본을 먼저 남기고 `applyInbox`로 넣은 뒤, 읽은 기록만 파일에서 지운다.
- 내보내기: 폴더를 연결했거나 연결을 켜면 먼저 받아 적고 `script_flow.rpy`에 쓴다. 받아 적기가 실패하면 쓰지 않는다.
- 연결을 켜면 show 줄의 위치 칸을 숨긴다(값이 이미 있을 때만 보임). 위치는 pygaki 플러그인이 저장한다.

## 9-2. 데스크톱 앱 (`app/`, `src/desktop.ts`)

- Electron 앱. 화면은 웹 빌드(`dist/index.html`)를 그대로 `app/web/index.html`로 복사해 `?app=1`로 연다. 웹 코드는 `window.pygaki`가 있으면 앱 모드(`isDesktop`)로 돈다.
- 렌파이 프로젝트 폴더 하나를 연다. `pygaki.exe --project "폴더"`(렌파이 런처 버튼), 없으면 폴더 고르는 창. 같은 프로젝트를 다시 열면 있던 창을 앞으로, 다른 프로젝트는 새 창.
- 파일은 메인 프로세스(`app/main.cjs`)가 다룬다: `info` `list` `stat` `read` `write`(임시 파일에 쓰고 바꿔 끼움) `remove`(효과 파일 `game/ui_kit/effects/*.glsl`만 지움) `openFolder` `choose`. 경로는 프로젝트 폴더 기준이고 밖은 막는다. `game/` 폴더를 `fs.watch`로 지켜보고 바뀐 파일 이름을 `pygaki:changed`로 알린다.
- `src/desktop.ts`의 `AppDir`, `AppFile`이 이 기능을 브라우저 폴더 손잡이(`FileSystemDirectoryHandle`)와 같은 모양으로 감싼다. 그래서 `gameFolder.ts`, `files.ts`는 웹과 같은 코드로 돈다. 권한은 늘 `granted`.
- 대본: 프로젝트 폴더 맨 위의 `*.flow.json`을 연다. 여러 개면 처음 열 때 고르게 하고(`src/flowPick.ts`, 상자 수·줄 수·고친 때, 가장 최근 것을 강조), 고른 이름을 `localStorage['pygaki-flow:<프로젝트 경로>']`에 둔다. 왼쪽 칸 [다른 대본 파일]은 이 기억을 지우고 창을 다시 연다. 없으면 `프로젝트이름.flow.json`으로 빈 대본을 만들고, pygaki 플러그인(`game/ui_kit`)이 있으면 `renpyLink`를 켠다. 바뀌면 0.7초 뒤 그 파일에 자동 저장(`saveQuiet`)하고 이어서 자동 내보내기(`autoExport`): `renpyLink`이고 폴더가 연결돼 있으면 받아 적기 → `generateRpy` → 오류가 없고 지난번과 다르면 `pykaki_goto.json`(지금 쓰는 줄 `activeLine`, 없으면 고른 상자의 첫 줄, [게임 줄 따라가기]를 끄면 `null`) → `script_flow.rpy`. 형식은 LINK.md 7-1. 창을 열고 처음 쓸 때(`lastAuto === null`)는 `foreignBoxes`로 원고의 `# @node:` 표시를 보고, 절반 넘게 지금 대본에 없으면 자동은 멈추고(`autoHeld`) Ctrl+E는 물어본다. 처음 덮어쓰기 전 원고는 `script_flow.rpy.bak`(`backupRpy`). 끄기 버튼 상태는 `localStorage['pykaki-follow-line']`. 브라우저 저장소의 `current`는 읽지 않는다. 버전 목록(IndexedDB)은 앱 전체가 같이 쓴다.
- [열기]는 두 대본의 요약을 보여 주고 확인을 받은 뒤 고른 파일의 내용을 이 프로젝트 대본으로 가져오고, [새로]는 이 프로젝트 대본을 비운다. 저장 파일은 바뀌지 않는다.
- 메인 프로세스는 프로젝트 폴더 맨 위도 지켜보고 `*.flow.json`이 바뀌면 `pygaki:changed`로 이름을 알린다. 연 대본 파일이면 0.3초 뒤 `checkExternal`(9-3).
- 위쪽 줄 오른쪽(`Toolbar.tsx` `FolderButtons`): [다시 읽기] [폴더 열기] [다른 프로젝트]. 연결과 끊기는 없다. 왼쪽 "렌파이 프로젝트 정보" 칸에는 정보만 둔다.
- [▶ 렌파이에서 실행] (`files.ts` `runInRenpy`, `main.cjs` `pygaki:runGame`): 대본을 내보낸 뒤 렌파이로 이 프로젝트를 켠다. 렌파이는 앱 실행 파일의 두 칸 위 폴더(묶음의 `<렌파이 SDK>/pygaki/app`)에서, 없으면 환경 변수 `RENPY_SDK`에서 찾는다. 답은 `started` / `running` / `no-sdk` / `failed`. 설정 `prefs.runSkip`(처음 값 켬)이 켜져 있으면, 게임과 붙어 있거나(실시간 연결) 이 창이 켠 게임이 살아 있을 때 켜지 않고 `running`만 돌려준다. 켠 게임은 앱을 꺼도 그대로 둔다. PyKaki 안 플레이는 세션 34에 없앴다(7장).
- `showpy_inbox.json`이 바뀌면 0.3초 뒤 받아 적는다(창으로 돌아올 때도).
- [GUI 편집] 화면 (`src/ShowpyView.tsx`, `src/showpyLive.ts`): 툴바 [대본 편집 | GUI 편집]로 바꾼다(앱에서만). 대본 화면은 숨기기만 해서 캔버스 상태가 남는다. 메인 프로세스가 `game/showpy_live.json`을 보고 그 포트로 붙어(지켜보기 + 3초마다 다시 시도) 한 줄 JSON을 `pygaki:live`로 넘기고, 화면은 `liveSend`로 명령을 보낸다(`pygaki:liveSend`). 형식은 저장소 맨 위 docs/LINK.md 9장.
  - 줄기표 (`src/ShowpyFlow.tsx`, pygaki 플러그인 screen_fx 5.2): (앱에서는 꺼 둠, `ShowpyView.tsx` `FLOW_IN_APP = false`. 셰이더를 거는 자리를 상자·label로 옮겨서) "셰이더" 칸에서 `state.flow`가 있으면 가운데 위 [줄기표 펴기/접기](`flow` `toggle`). 펴지면 가운데가 원고 | 줄기표. 행을 끌면 `flow` `range`, 누르면 `flow` `pick`과 원고 칸 스크롤(`peek`), 네모 점은 `flow` `point`, 줄기표에서 Delete나 [셰이더 지우기]는 `flow` `delete`(Delete는 상자 캔버스로 안 가게 막음). 게임 서랍과 같은 어두운 바탕.
  - 왼쪽: 고칠 것 목록. 타이틀 메뉴, 게임 내 메뉴(ESC)는 앱 칸이 있고, 나머지는 게임 안 편집기 탭을 패널과 함께 연다. 메뉴 바로 아래 "└ 타이틀 셰이더"(`title_fx`), "└ 게임 내 메뉴 셰이더"(`pause_fx`) (pygaki 플러그인 4.20).
  - 가운데: 지금 화면, 원고 위치, 그 앞뒤 9줄(파일이 바뀌면 다시 읽음). 줄 위의 `# @node:` 표시로 PyKaki 상자를 찾아 [상자로] 버튼. [표시 숨기기](`localStorage['pygaki-hide-marks']`)는 `# @l:` `# @node:` `# @end:` 줄을 그리지 않는다(지금 줄은 그림, 줄 번호는 그대로).
  - 오른쪽: 저장(게임의 Ctrl+S), 버리기, 편집기 닫기, 게임 안 패널 보이기. 타이틀 칸은 배경(그림/영상 고르기, `title.background`), 평소/선택됐을 때, 이 항목만/공통, 항목 목록(메뉴 항목 + 제목, 부제), 글 칸, 숫자 칸, 글자 효과. 입력하는 동안은 게임에서 오는 값으로 덮지 않는다.
  - [GUI 편집] 화면에서는 저장 단축키가 게임 저장이다.
- 확인: GitHub Actions "pygaki 앱"(`.github/workflows/app.yml`)이 리눅스에서 진짜 Electron으로 켜서 `app/smoke.cjs`(자동 저장, 내보내기, 받아 적기, 쓴 판 표시, 밖에서 바뀐 대본 다시 읽기, 더 새 판 경고, 대본 파일 고르기, 밖에 쓰기 막기, 가짜 게임으로 pygaki 플러그인 연결)를 돌리고, 윈도우 `pygaki.exe` 폴더(`pygaki-win`)를 만든다. 배포 묶음은 저장소 맨 위 `bundle/`.

## 9-3. 프로젝트 대본 파일과 쓴 판 (`src/files.ts`, `src/version.ts`)

앱은 늘 "프로젝트 대본 파일"(`bound`)을 쓴다. (예전 웹 버전의 폴더 연결과 `kv.flowName` `kv.flowSeen`은 없앴다)

- **파일 이름**: 9-2대로.
- **저장**: 바뀌고 0.7초 뒤 자동으로. [다른 이름]은 프로젝트 대본 파일을 바꾸지 않고 사본만 쓴다.
- **밖에서 바뀜**: 이 창이 마지막으로 읽거나 쓴 글의 지문(`seen`)과 파일이 다르면 다른 곳이 고친 것. 이 창이 최근에 쓴 지문 20개와 쓰는 중에 읽은 것은 빼고 본다. 쓰기 전과, 창으로 돌아올 때, 앱은 파일 바뀜 알림 때 본다. 묻기: [확인] 파일을 다시 읽기(지금 대본은 백업), [취소] 지금 대본을 쓰고 덮어쓰기. 빈 파일, 읽을 수 없는 글(쓰는 중)은 다음에 다시 본다.
- **쓴 판** (`app`): 파일에 쓸 때 `{ by: "pygaki 앱"(개발 서버는 "PyKaki 웹"), build: "2026-11-05 dc3ac85", needs }`를 붙인다. `build`는 `vite.config.ts`가 빌드 날짜와 커밋으로 넣는다. `needs`는 `max(파일의 needs, FEATURE)`라서 내려가지 않는다. `FEATURE`(지금 5: 2 글자 효과 11개, 3 글 상자·효과 겹치기·새 화면 효과 이름, 4 효과 폴더, 5 상자와 label의 셰이더)는 예전 판이 모르는 줄 종류나 값을 대본에 더할 때만 올린다. 예전 파일은 `app`이 없다(needs 0).
- `needs`가 이 판의 `FEATURE`보다 크면 열 때 알리고, 왼쪽 "렌파이 프로젝트 정보" 칸에 경고를 둔다. 모르는 값은 지우지 않고 그대로 저장한다.
- `format`, `version`, `.flow.json`, IndexedDB 이름은 바꾸지 않는다.

## 9-1. 웹앱 설치 (PWA)

- 웹 버전과 같이 없앴다(2026-11-12): `pwa.ts`, `public/manifest.webmanifest`, `sw.js`, 아이콘, `.github/workflows/deploy.yml`. 이미 설치한 사람의 앱은 마지막으로 배포된 페이지가 남아 있는 동안 그대로 열린다.

## 10. 소스 구조

| 파일 | 역할 |
|---|---|
| `src/types.ts` | 데이터 구조 |
| `src/ops.ts` | 편집 함수 (연결, 상자/그룹 추가, 삭제, 나가는 방식 변경, 화자 변경) |
| `src/store.ts` | zustand 상태, 실행 취소, 선택, 상자 안 편집 상태 |
| `src/showpyLive.ts`, `src/ShowpyView.tsx` | 데스크톱 앱의 [GUI 편집] 화면 (게임과 실시간 연결) |
| `src/effectsLib.ts`, `src/EffectsView.tsx` | 효과 관리: 목록·켜고 끄기·넣기·빼기(7장), [효과] 화면(3장) |
| `src/fx/TransitionCanvas.tsx` | 그림 효과(`@transition`)를 WebGL로 그리기: [효과] 화면의 샘플 |
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
| `src/actions.ts` | 정렬 실행, 상자 추가, 상자 더블클릭 편집, 포커스 |
| `src/Canvas.tsx` | React Flow 캔버스, label 프레임, 선 |
| `src/BoxView.tsx` | 상자 표시와 상자 안 편집 |
| `src/Inspector.tsx` | 오른쪽 칸 |
| `src/SayPreview.tsx` | 대사 미리보기: 글자 내보내기(`useReveal`, `Glyphs`), 글자 효과 카드의 `LinePreview` |
| `src/PickPos.tsx` | 앱: [렌파이에서 여기로 이동], [위치 옮기기] |
| `src/Card.tsx` | 카드 접기, [모두 접기] |
| `src/Panels.tsx` | 오른쪽 칸 |
| `src/Toolbar.tsx`, `src/Sidebar.tsx` | 툴바, 버전 목록, 왼쪽 패널 |
| `src/textTags.tsx` | 텍스트 태그 표시 |
| `src/prefs.ts` | 환경 설정(화면 색, 단축키) |
| `src/SettingsModal.tsx` | 환경 설정 창 |
| `src/Caret.tsx` | 상자 안 편집의 밑줄 커서 |
| `src/FlowMenu.tsx` | 편집 중 오른쪽에 붙는 다음 흐름 창 |
| `licenses/` | 함께 배포하는 글꼴의 라이선스 |

## 11. 남은 단계

- **2단계 (플래그)**:
  - `variables` → `default 이름 = 값`
  - 선택지/상자 동작 → `$ 이름 = 값`
  - 선택지 조건 → `"텍스트" if 조건:`
  - 조건 분기 상자 → `if/elif/else` + `jump`
- **확인됨**: 내보낸 `.rpy`가 렌파이 8.5.3에서 실행된다(로컬 label 포함). 연결 쪽 확인 상태는 [LINK.md](../../docs/LINK.md) 9장.

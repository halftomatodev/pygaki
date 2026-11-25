# pygaki — 개발 명세서

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
┌ 위쪽 줄(가운데): (파란 탭 묶음 LiquidTabs) [● 게임과 연결됨 …(앱)] (분홍 묶음 `.tb-ctx`: [제목] [렌파이에서 실행] [스크립트 따라가기]) ┐
│ 둘째 줄(왼쪽부터, `.tb-right`): ↶↷ [집중](보라) 설정 │ 새로 열기 저장 다른이름 │ 폴더 │ 버전 │ .rpy 내보내기                           │
├ 왼쪽 ───────┬ 캔버스 ─────────────────────────┬ 오른쪽 (탭 없음, 카드) ─┤
│ label+정렬    │ label 묶음 배경(프레임)           │ 상자 / 글자 효과 /      │
│ 캐릭터        │ 상자(노드), 선(엣지)              │ 대사 / 다음 흐름        │
│ 검사          │ 왼쪽 위: 캔버스 조작 ⓘ [＋ − ⛶], 그 아래 미니맵 │ 또는 셰이더 / 전환 / 줄 │
│ 프로젝트 정보 │                                  │                        │
│ 스크립트, 설정         │                          │                        │
└──────────────┴──────────────────────────────────┴───────────────────────┘
```

- 양쪽 칸의 묶음은 모두 같은 카드(`.sec`)다. 오른쪽 칸(`Panels.tsx` `RightPanel`)은 탭이 없다(2026-11-12). 상자를 고르면 상자 / 글자 효과(`.look-panel`, 같이 스크롤됨. 세션 34에 sticky를 풀었다) / 대사 / 다음 흐름 카드(`.right-scroll`), ◐ 셰이더면 `ShaderPanel`. 칸 맨 위 오른쪽에 [모두 접기]↔[모두 펼치기](`Card.tsx` `FoldAll`, 그 칸 `FoldScope` 안에 지금 보이는 카드를 모두). 검사와 스크립트는 왼쪽 칸 카드(`Sidebar.tsx` `WarnCard` `ScriptCard`, 원고는 `generateRpy`를 `useMemo`로). 왼쪽 순서: label(+ 상자와 정렬) / 캐릭터 / 검사 / 렌파이 프로젝트 정보 / 스크립트 / 설정. 사용법 카드는 세션 39에 없앴다.
- **도움말과 ⓘ** (`src/Help.tsx`, 2026-11-13): 화면에는 설명 문단을 두지 않는다. 칸 이름 옆 `Hint`(ⓘ)에 올리면 한두 줄(`HintTip`, 화면 맨 위 층 fixed), 누르면 도움말의 그 항목(`topic` = GUIDE 제목의 일부). 카드는 `Card`의 `hint`, `topic`. 도움말 창은 둘째 줄 [도움말]과 F1(단축키로 못 고름)로 열고, 내용은 `docs/GUIDE.md`를 빌드할 때 `?raw`로 넣어 작은 마크다운 그리기로 보여 준다(목차, 찾기). 경고·빈 상태·지금 값은 짧게 화면에 남긴다. 언어 버튼이 일본어·영어면 안내서 번역 `../bundle/guide/ja|en/pykaki.md`를 보인다(제목 줄 차례가 원본과 같아서 `topic`은 원본에서 찾은 차례로 연다. 항목 수가 다르면 한국어). 창에는 `data-no-tr`.
- **카드 접기** (`Card.tsx`, 2026-11-12 세션 32): 양쪽 칸과 GUI 편집 칸의 카드는 모두 `Card`. 카드마다 접기 단추는 없고(세션 78) 제목 줄(`h3.card-head`, 단추·ⓘ·입력 칸 빼고)을 누르거나 제목에서 Enter/Space. 접으면 이름만 한 줄, 하늘색 톤(`.sec.folded`), 폭은 이름 길이만큼(`width: fit-content`, 내용이 다 빠진 뒤). 펼칠 때 `FoldBody`가 높이·폭을 `--dur-view` `--ease-spring`으로 늘리고 안의 줄들을 제목 쪽에서 작고 흐리게 30ms씩 늦게 꺼냄(아이폰 폴더 열기), 접을 때는 거꾸로 `--dur-pop` `--ease-in`. 일괄 단추에는 학종이 아이콘(`PaperFold`, 날개가 대각선을 축으로 뒤집힘). 머리의 작은 단추(`.card-acts`)는 캡슐. 접은 것은 카드 id로 `localStorage['pygaki-folded']`에 기억. 왼쪽 칸 카드(`FRESH`)는 기억을 읽지 않고 켤 때마다 모두 접혀서 시작한다(세션 34). 내보내기가 오류로 멈추면 검사 카드를 편다. 왼쪽 칸 스크롤바는 왼쪽(`.sidebar { direction: rtl }`, 안쪽은 `ltr`).
- **상자 카드 더** (세션 32): 대사 카드 아래 배경(그림, 영상) / 그림, 영상 / 효과음, 음악 카드(`StageCards.tsx`). 이 상자의 그 종류 줄 목록(누르면 그 줄로), 게임 폴더 파일을 눌러서 넣기(`scene`, `show`, `sound`/`music` 줄), 이름을 쳐서 넣기. 지금 쓰는 줄(`activeLine`) 바로 앞에, 없으면 상자 끝에 넣는다(안내 글은 세션 34에 뺌). [📂 파일 고르기](세션 34, `StageCards.tsx` `PickFile`): 앱 `pygaki:pickFile(kind)`가 `dialog.showOpenDialog`(시작은 `game/images`·`game/audio`)로 고르고, game 안이면 game 기준 경로, 밖이면 표(token)만 돌려준다. 묻고 `pygaki:importFile(token, dir)`로 `game/images|movies|audio`에 복사(같은 이름이면 `_2`…, 화면은 고른 파일의 전체 경로를 모름) → `scanFolder`. 경로 → 이름은 `imageNameOf`/`movieNameOf`, 소리는 `audio/` 기준. images·movies 밖의 game 파일(gui 등)은 그림으로 안 받는다. **캐릭터 그림** (세션 36, `CharPics`): 지금 쓰는 줄이 캐릭터 대사(`say`, `who`)면 그림 카드 맨 위에 `who`로 시작하는 그림 격자와 표정 이름 칸 → `show` 캐릭터 줄(`kind: 'char'`, `attr`)을 그 대사 앞에. 대사 줄 `attr`은 화면에서 새로 넣지 않는다(형식과 내보내기는 그대로). **사용 중 카드** (세션 36): 지금 쓰는 줄(`activeLine`)이 이 상자에 있으면 이어진 카드에 `.in-use`(세션 102부터 유리 바탕은 다른 카드와 같고 뒤 비침만 채도 0(`Card.tsx` `--card-sat` 0, 보통 1.6, `styles.css` `.card [data-fluidkit='liquid-fill']`의 `saturate()`). 세션 100~101의 투명 바탕은 눈에 안 띄어 뺌) + 둘레 흰 점선(`styles.css` `.card.in-use:not(.folded)` `outline: 2px dotted #fff`). 세션 90~99의 `border-beam` 빛 띠와 그 전 conic-gradient 빛은 뺌, `border-beam` 패키지도 뺌. 제목 옆 보라 바탕 흰 글자 "사용 중"). 대사·내레이션 → 대사, 글자 효과 / `scene` → 대사, 배경 / `show`·`hide` → 대사, 그림 / `sound`·`music` → 대사, 효과음. **게임 수정 중** (세션 36): 게임이 끊기 직전 `reloading`을 보내면 앱(`main.cjs` `entry.reloading`)은 다시 붙을 때까지 `liveStatus.reloading`을 켬. 끊긴 동안 3초마다 `process.kill(pid, 0)`으로 게임 프로세스를 보고, 없거나 2분이 지나면 끔. 화면은 `useLive.reloading`, 연결 단추 노란색 "◐ 게임 수정 중", 그동안 파일 목록(`files`)은 그대로 둔다.
- **게임으로 가는 단추** (`PickPos.tsx`, 세션 34. 앱 + 게임 연결일 때만, `useGameReady`): 상자 카드 [렌파이에서 여기로 이동](연결 안 되면 회색)은 원고를 내보내고(`files.ts` `exportedBoxLineOf` → `codeBoxLineOf`: `# @node:` 다음 첫 실행 줄, label 줄은 건너뜀, 줄이 없으면 label 줄) `goto`. 대사 카드 줄에 마우스를 올리면 카드 왼쪽 바깥에 뜨는 작은 팝업(`useSidePop`, body에 붙인 `position: fixed`, 화자 칸이 잘리지 않게)에 [여기로 이동](`exportedLineOf`)과, 대사·내레이션 줄에는 [위치 옮기기](`goto` → `panel` → 0.7초 뒤 `editor open tab:'say'`, 연결 설정 `renpyLink`도 켜져 있어야 함). 다음 흐름(선택지) 카드의 [위치 옮기기]는 상자 마지막 줄로 가서 `choice` 탭. 배경·보이기 줄(대사 카드, 그림 카드의 줄 목록 `StageCards.tsx` `Used`)의 [위치 옮기기]는 `stage` 탭을 `editor` 명령의 `line` `file`과 같이 연다(ui_kit 4.8이 그 줄을 고름, LINK.md 9장). 누른 줄 아래에 [저장 (수)] [끝내기](`PickBand`, 안내 글은 단추 툴팁). 게임 창에서 끌고 저장하면 받아 적기(LINK.md 3장). 연결 안 됐으면 대사 카드 아래에 안내 한 줄(`GameOffTip`).
- 칸 너비: 칸 사이의 `.resizer`(`Resizer.tsx`)를 끌면 `prefs`의 너비가 바뀌고 CSS 변수로 적용된다. 대본 편집 `leftW` `rightW`(`--left-w` `--right-w`), GUI 편집 `guiLeftW` `guiRightW`(`--gui-left-w` `--gui-right-w`), 효과·셰이더 오른쪽 `fxSideW`(`--fx-side-w`). 범위와 처음 값은 `prefs.ts` `SIZES`. 더블클릭은 그 칸만 처음 값, 왼쪽 "설정"의 [처음 크기]는 모든 칸, [잠금](`prefs.sizeLock`)이면 손잡이가 움직이지 않는다. 접은 칸은 손잡이도 없다.
- 왼쪽 칸과 오른쪽 칸은 캔버스 위쪽 양 끝의 작은 버튼(`.side-toggle`, `Canvas.tsx`)으로 따로 접고 편다(`store.hideLeft` `hideRight`, `localStorage['pygaki-hide-left']` `['pygaki-hide-right']`). 접어도 지우지 않고 CSS로만 숨긴다.
- 툴바 왼쪽의 화면 바꾸기(`Toolbar.tsx` `ViewSwitch`, `showpyLive.ts`의 `view`): [대본 편집] / [GUI 편집](데스크톱 앱에서만) / [효과]. 대본 화면은 다른 화면을 보는 동안에도 지우지 않고 숨긴다.
- **[효과] 화면** (`EffectsView.tsx`): 왼쪽은 효과 카드 목록([글자 효과 | 그림 효과], 찾기, [파일 넣기]. 세션 94에 [새 효과 요청문 복사]는 뺌), 오른쪽은 대본 편집·GUI 편집처럼 바탕 위의 카드 셋(샘플 / 세부 값 / 쓰인 곳, `Card`, 접은 것 기억). [셰이더] 화면의 [셰이더]·[전환]도 같다. 왼쪽은 갤러리(`FxGallery.tsx`, `prefs.gallery`, 처음 값)와 목록 중 고른다. 갤러리 카드는 멈춘 그림: 셰이더·그림 효과는 `fx/thumbs.ts`가 종류마다 WebGL 판 하나로 차례대로 그려 data URL로(그림 효과는 앞·새 그림과 가장 다른 순간), 글자 효과는 `TextPhotographer` 하나가 화면 밖에서 돌려 반쯤 나온 순간을 `FxCanvas` `onFrame`으로 찍는다. 움직이는 샘플은 마우스를 올린 카드 하나, [▶ 움직이기](`prefs.galleryMove`, 처음 값 끔)를 켜면 `IntersectionObserver`로 보이는 카드에 보인 차례대로 `MAX_LIVE`(6)개까지 자리를 준다(브라우저의 WebGL 판 수 제한, 16쯤). 만들 그림 수는 `thumbs.ts` `workAdd/workDone/workDrop`으로 세어 `GallerySwitch`에 진행 막대로 보이고, 다 되면 0으로 돌아가 숨는다. 목록과 파일 다루기는 `effectsLib.ts`의 함수만 부른다(7장).
  - 카드: 체크(켬/끔 = `setEffectOn`), 한글 이름, 영어 이름, 쓰인 줄 수, 어디 것(렌파이 / 기본 / 프로젝트 / 모음), 프로젝트 효과는 [빼기], 아직 넣지 않은 모음은 [넣기]. 플러그인이 있는 게임 폴더를 연결하지 않았으면 구경만 하고 버튼은 막는다.
  - [빼기]는 창을 띄워 그 파일에 든 효과가 쓰인 줄 수를 보여 주고, 쓰였으면 [다른 효과로 바꾸고 빼기](효과마다 바꿀 것을 고름) / [그냥 빼기] / [취소].
  - 샘플(글자 효과): 대사 미리보기와 같은 `FxCanvas`로 샘플 글을 돌린다. 세부 값 막대(`effectKnobs`)를 움직이면 다시 돌고, 그 값은 저장하지 않는다. 아직 넣지 않은 모음의 효과는 `textShaders.ts`의 `previewPack`으로 샘플용으로만 올려서(`shaderEffect(name, true)`) 돌린다(고르는 목록에는 안 나옴). 셰이더 코드가 틀리면 샘플 칸에 이유가 나온다.
  - 샘플(그림 효과): `fx/TransitionCanvas.tsx`가 효과 파일의 `@fragment`를 게임(`image_effects.rpy`)과 같은 틀(`tex0` 앞 그림, `tex1` 새 그림, `l__uv` `l__old` `l__new` `l__t` `l__size`, 이름은 `u_imgfx_<효과>_값`)로 묶어 WebGL로 그린다. 샘플 그림 둘은 캔버스로 만들고, [고르기]로 고른 그림 파일은 새 그림 자리에 꽉 차게 넣는다(저장 안 함). 막대는 `@time`(걸리는 시간)과 `effectKnobs`, "원고에 적는 법" 줄에 맞춘 값 그대로의 `with img_fx.use(...)`가 나온다.
  - 쓰인 곳의 [보기]는 [대본 편집]으로 돌아가 그 상자를 고르고 그 줄에 초점을 둔다.
  - 이 화면에서는 단축키가 저장, 실행 취소, 다시 실행만 듣는다.
- 상자 머리와 label 틀 오른쪽 위에 [◐ 셰이더] 버튼. 누르면 오른쪽 칸이 셰이더 고르기(`ShaderPanel.tsx`)로 바뀐다(4장).

## 4. 데이터 구조 (`src/types.ts`)

```jsonc
{
  "format": "renpy-flow",
  "version": 1,
  "project": { "title": "내 게임", "startNode": "n1" },
  "characters": [{ "id": "a", "name": "앨리스", "color": "#ff8fb1" }],
  "variables": [{ "id": "v1", "name": "love", "kind": "int", "init": 0, "note": "호감" }],  // 플래그 (FEATURE 14). kind bool | int | str
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
- **줄(line) 종류**: `narration`(내레이션), `say`(캐릭터 대사, `who`=캐릭터 id, `attr`=표정 등), 연출 줄(`scene` `show` `hide` `music` `sound` `pause` `shake` `hud`, 예전 `fx`), `flag`(플래그 바꾸기), `input`(이름 입력), `command`(렌파이 명령 그대로), `note`(주석).
- **연출 줄** (`src/stage.ts`): 명령을 직접 쓰지 않고 칸을 채운다. `text`는 쓰지 않는다.
  - `scene` `{ image, trans }`: 배경 이름(`bg` 뒤), 전환
  - `show` `{ kind, who, attr, image, at, trans, zorder?, behind? }`: `kind`는 `char`(who+attr) | `bg`(image) | `etc`(image), 위치 `left`/`right`(비우면 가운데). 앞뒤(`FEATURE` 15): `zorder` 숫자 또는 `behind` 태그 하나(화면은 둘 중 하나만, `LayerPick`)
  - `hide` `{ kind, who, image, trans }`
  - `music` `{ file, stop, fadein?, fadeout?, queue?, loop? }`, `sound` `{ file, stop?, channel?, fadeout? }` (`FEATURE` 15: `fadein` 시작 초(없으면 바로), `fadeout` 멈출 때 초(없으면 1초, 0이면 바로), `queue` 이어 틀기, `loop` true/false(없으면 게임 기본, loop/noloop을 안 적음), `channel: 'audio'` 겹쳐 나옴(없으면 sound))
  - 음성(`FEATURE` 16, `src/voice.ts`, `VoiceCard.tsx`): `settings.voice`를 켜면 `say` 줄(who 있음)에 `vno`(label 안 번호)를 매긴다. `store.update`와 `load` 뒤 `addFixup`으로 `assignVoiceNos`: 내보내는 상자 차례로 보며 번호가 없거나 같은 label 안에서 겹치면 그 label의 가장 큰 번호 + 1. `voice`는 직접 고른 파일(audio 기준), `''`이면 음성 없음, 없으면 `audio/voice/캐릭터_label_번호`(소문자로 맞춤)를 연결한 게임의 소리 목록에서 찾는다(`generateRpy` opts `audio`). 원고는 대사 앞 `voice "audio/…"`
  - `pause` `{ secs? }`: 멈춤(`FEATURE` 15). 없으면 클릭할 때까지
  - `shake` `{ shake? }`: 흔들기(`FEATURE` 15). `vpunch`(없을 때) | `hpunch` | `flash`(렌파이에 없어서 `Fade(0.1, 0.0, 0.5, color="#fff")`, `stage.ts` `FLASH_CODE`)
  - `hud` `{ screen?, stop? }`: HUD 보이기/숨기기(`FEATURE` 18). `screen`은 `project.screens`의 id(HUD 종류만 고름), `stop`이면 `hide screen 이름`, 아니면 `show screen 이름`. 화면이 없거나 전체 화면이면 `stageCode`가 문제로 알림(`stageCode(l, screens)`). 세션 79부터 대사 줄로 넣지 않고 상자 머리 [♡ HUD](BoxView `HudButton`, 세션 81부터 [◐ 셰이더] 아래 `.box-tools`)와 오른쪽 HUD 카드(Inspector `HudCard`)에서 HUD마다 그대로/보이기/숨기기를 고른다. 고르면 그 HUD의 hud 줄을 모두 지우고 상자 맨 앞에 하나만 둔다(저장 형식은 그대로). hud 줄은 상자와 대사 카드의 줄 목록, 줄 종류 고르기에서 숨긴다. 단추는 셰이더 단추처럼 늘 있고(HUD를 고르면 꽉 찬 하트 ♥), HUD 카드도 늘 있어 HUD가 없으면 [화면] 탭으로 안내한다. **label의 HUD** (`FEATURE` 27, 세션 81): `labels[].hud` `{ screen, stop? }[]`. label 틀 [♡ HUD] → `openLabelHud` → 오른쪽 칸 `LabelHudPanel`(store `hudOf`, 셰이더 칸 자리, 상자를 고르면 닫힘). 내보내기는 상자마다 첫머리(커서 줄 뒤)에 표시 없이 `show/hide screen`, 상자에 같은 HUD의 hud 줄이 있으면 뺌, 지운 HUD는 label마다 경고 한 번. 상자 [♡ HUD]는 label 것을 따르면 `.inh`(점선), HUD 카드 "그대로" 줄에 "label: 보이기"
  - `input` `{ text, flag? }`: 플래그 입력(`FEATURE` 30 이름 입력, 31부터 글자·숫자 플래그). `text`는 묻는 글, `flag`는 친 값을 넣을 플래그 id(이름이 아니라 id라 이름을 바꿔도 그대로). 최대 글자 수는 플래그의 입력칸 `ui.len`(`inputLen`: 숫자는 최솟값·최댓값 자릿수). FEATURE 30 파일의 줄 `length`는 `normalizeProject`가 그 글자 플래그의 `ui.len`(없을 때만, 꼴이 없으면 입력칸 꼴로)으로 옮기고 지운다. 내보내기 `flags.ts` `inputCode`: 글자는 `$ 이름 = renpy.input("묻는 글", default=이름, length=N).strip() or "처음 값"`(비우면 처음 값), 숫자는 `$ _pk_typed = renpy.input(…, default=str(이름), allow="-0123456789", length=N).strip()` + `$ 이름 = max(최솟값, min(최댓값, int(_pk_typed))) if _pk_typed.lstrip("-").isdigit() else 이름`(잘못 치면 그대로). 묻는 글은 렌파이가 `%%`를 풀지 않아서 `%`를 바꾸지 않는다(8.6.1에서 봄). 칸은 `LineFields.tsx` `InputFields`(넣을 플래그 고르기 + [+ 새 이름 플래그](`pname`, 처음 값 "주인공", 입력칸 꼴, 12자), 묻는 글, 한 줄 도움말), 줄 종류 "기타"의 ✎ 플래그 입력과 상자 편집 [+ 플래그 입력]. 캔버스는 플래그 줄처럼 `✎ 입력 pname · 묻는 글`. 검사: 플래그 없음(경고), 켜짐/꺼짐 플래그(오류), 글자 플래그 처음 값이 빔(경고). 캐릭터 이름을 플래그 값으로 하는 것은 그 플래그 [꼴 ▾] 입력칸의 "이름으로 쓰는 캐릭터"(`FlagLook.tsx` `InputKnobs`, 표시 이름을 `[pname]`으로 하고 잇기 전 이름은 `characters[].nameBefore`에 적어 둠, 빼면 그 이름으로(적어 둔 이름이 없는 예전 파일은 처음 값으로). 원고 `Character("[pname]", …)`). 플래그 이름을 바꾸면 대사·선택지·플래그 입력 글과 캐릭터 이름의 `[이름]`도 바뀐다(`renameFlag` `renameSub`), 쓰인 곳에 "플래그 입력 줄"(✎)과 "대사 글"(?)
  - `fx` `{ fx: { fx, transition, overlay, warp, cursor } }`: pygaki 플러그인 화면 효과 명령. 값은 `src/stage.ts`의 `FX_*`. 화면 효과는 렌파이 편집기에서 고치므로 줄 종류 목록에서 뺐고, 예전 파일의 이 줄만 그대로 보여 주고 내보낸다.
  - `trans`는 `dissolve` | `fade` | 비움, 또는 게임 안 편집 화면에서 받아 적은 식(`stage.move("inleft", 0.8)` 등). 모두 선택 칸이라 예전 파일은 그대로 열린다.
- **대사 줄의 `fx`**: `say`, `narration` 줄도 같은 `fx` 값(`exclude` 포함)을 가질 수 있다. pygaki 플러그인 대사 탭에서 받아 적고, pygaki에서는 고치지 않는다. 연결을 켜면 대사 괄호로 내보낸다.
- **대사 줄의 `say`** (`SayStyle`): `size` `font` `color` `cps` `effect` `box` `tail` `box_rotate` `name_size` `name_font` `name_color`는 pygaki에서 고친다. `effect`는 두 효과를 `|`로 겹칠 수 있다(`slidein|shake`). `box`는 글 상자(`bubble` 말풍선, `pill` 둥근 테두리, pygaki 플러그인 `ui_kit` 4.0, `media` 그림/영상 `ui_kit` 4.14)이고 연결을 켰을 때만 내보낸다. 그림/영상 상자(`FEATURE` 24)는 `media`(game 기준 경로), `media_fit`(`image`면 그림 크기 그대로), `media_zoom`을 쓰고(기본 대사창·이름 칸 배경은 늘 투명). 그림의 자리·크기·회전 `media_x` `media_y` `media_zoom` `media_angle`(`FEATURE` 25, `ui_kit` 4.15)은 게임 안 편집 화면 대사 탭 [그림]에서 정해 `say_pos`로 받아 적고(`inbox.ts`), 대본 편집기는 [그림 옮김 · 배율 · 도 ✕]로 보여 주고 지우기만 한다(`MediaField.tsx` `MediaPlace`, 미리보기는 `MediaBg`가 CSS transform으로). 선택지 `media`의 `x` `y` `zoom` `angle`도 같고 `choice_media` 기록으로 받으며, 뒤 그림이 있는 선택지 줄 끝에 `# @c:선택지id`를 붙인다(`endMarks`일 때). 내보내기는 `stage.ts` `mediaPlace`, 미리보기는 게임 폴더의 파일을 글 뒤에 깐다(`SayPreview.tsx` `MediaBg`). 선택지의 `media`(`ChoiceMedia`: `idle` `hover` `select` `time` `fit` `zoom`)는 상자 편집의 선택지 [🖼]에서 고치고 `"문구" (idle_media=…) if 조건:`으로 내보낸다(`exportRpy.ts` `choiceMediaArgs`). 글 상자 칸은 `LineFields.tsx` `BoxFields` 하나로, 오른쪽 편집 탭과 상자 안 편집의 태그 상자 맨 아래 [글 상자] 카드(`TagBar` `extra`, 접어도 보임)가 함께 쓴다. 파일 칸은 `MediaField.tsx`(앱에서 [📂]로 고르고 game 밖이면 images·movies로 복사). 게임의 플러그인이 예전 판이면(`gameFolder` `mediaBox` false) 검사 탭에 오류. 미리보기는 CSS로 비슷하게 그린다(`.sbox`, 셰이더 효과일 때는 기울기를 안 보여 줌). `x` `y` `name_x` `name_y`는 showpy에서 받아 적은 값을 보여 주고 지우기만 한다. 연결을 켜면 짧은 이름으로(`sayArgs`), 끄면 플러그인 없이 동작하는 렌파이 원래 이름(`what_size`, `what_slow_cps`, `what_textshader` 등)으로 내보낸다. 모두 선택 칸이라 예전 파일은 그대로 열린다.. 투명 영상(`FEATURE` 26): `media_mask`(없으면 파일 이름이 `mask_`로 시작하는 영상이면 켬, `stage.ts` `mediaMasked`. 칸은 영상일 때만 [투명 영상] 체크, 이름과 같은 값이면 지움), `media_alpha`(0~1, 1이면 지움). 원고에는 영상이 투명 영상이면 늘 `media_mask=True`(예전 플러그인도 알게), `mask_` 이름을 끈 것만 `False`. 미리보기는 `maskVideo/MaskMovie.tsx`가 두 쪽을 합침. 묶기·네 점 변형·그림 효과(`FEATURE` 28, `ui_kit` 4.18): `media_link`(묶을 때의 그림 [크기, 회전, 가로, 세로]), `media_quad`·`media_text_quad`(네 모서리 옮김 8개, 크기에 대한 비율), `media_fx`(나타나는 방식과 같은 `img_fx.use(…)` 글). 선택지 `media`의 `link` `quad` `text_quad` `fx`도 같다. 칸은 `MediaField.tsx` `MediaGroupFields`(🔗 [글 묶기]는 지금 `media_x` `media_y` `media_zoom` `media_angle`을 적음, 네 점 변형은 받아 적은 것을 보여 주고 지우기만, [나타날 때]는 `TransPicker noBasic`과 [세부 값]). 캔버스 줄과 선택지에 체인 표시(`BoxView.tsx` `LinkMark`). 네 점 변형과 묶기는 게임 안 편집 화면에서 정해 `say_pos`·`choice_media`로 받아 적는다(`inbox.ts`의 숫자 목록). 내보내기는 `stage.ts` `mediaGroupArgs`(`media_fx`는 `media_fx="이름"`, `media_fx_time`, `media_fx_values={…}`로 풀어 씀). 게임의 `text_box.rpy`에 `def link_base(`가 없으면(`gameFolder` `mediaGroup` false) 이 값은 적지 않고 검사 탭에 알림. 미리보기는 그림만 네 점 변형(`SayPreview.tsx` `quadMatrix`, CSS matrix3d), 글 묶기는 미리보기에 안 그림
- **나가는 방식(exit)**:
  - `next` `{ target }`: 다음 상자로
  - `menu` `{ choices, ask? }`: `ask` `{ who, text }`는 선택지 질문 대사(`FEATURE` 15, `who` null이면 내레이션, 글이 비면 안 내보냄)
  - `menu` `{ choices: [{ id, text, target, mode:"jump", condition, actions }] }`: 선택지. condition은 보이는 조건(렌파이 조건식, 없으면 null), actions는 고르면 바꾸는 식 목록(`love += 1`, `met_alice = True`) (`FEATURE` 14)
  - `if` `{ branches: [{ id, cond, target }], else }`: 조건 분기(`FEATURE` 13). cond는 렌파이 조건식 그대로, 위에서부터 맞는 갈래로, 모두 아니면 else로
  - `answer` `{ ask, cases: [{ id, text, flag?, target }], else, keep?, exact?, length? }`: 정답 입력(주관식, `FEATURE` 32, 세션 87). 상자 끝에서 `ask`를 묻고 플레이어가 친 글을 `cases` 위에서부터 견줌. `text`는 정답 글(여러 개는 `/`로 나눔), `flag`는 그 플래그 값도 정답(플래그 id, 빈 값이면 안 맞음), 모두 아니면 `else`(틀림. 이 상자로 다시 이으면 맞힐 때까지). `keep`은 친 값을 넣을 글자·숫자 플래그 id(숫자는 범위 안 정수, 숫자가 아니면 그대로), `exact`면 앞뒤 빈칸만 빼고 똑같아야(없으면 띄어쓰기를 빼고 소문자로 견줌), `length`는 최대 글자 수(친 값 플래그의 `ui.len`은 안 따름). 원고 `$ _pk_typed = renpy.input("묻는 글", length=N).strip()`, (`keep`) `$ 플래그 = _pk_typed`, `$ _pk_answer = "".join(_pk_typed.split()).lower()`, `if _pk_answer in ["김철수", "kim"]:` / `elif ("".join(str(플래그).split()).lower() != "" and _pk_answer == …):` `jump`, 틀림은 `if`처럼 else나 아래로. 묻는 글은 입력 줄처럼 `%`를 안 바꾸고 `[이름]`은 플래그 값. 선 손잡이 `a:id`, `else`(캔버스 글 "✎ 정답", "틀림"). 상자 안 `AnswerExit`(쓰는 중이면 묻는 글·정답 글을 바로 고침, 첫 칸 `in-ask-상자id`), 오른쪽 [다음 흐름] `AnswerExitEditor`(정답마다 글·플래그 값·갈 상자, 틀림, 친 값, 정확히, 최대 글자 수), 다음 흐름 창 [✎ 정답 입력]. 따라가 보기는 정답마다 단추(친 값 플래그가 글자면 첫 정답 글을 넣음)와 틀림. 플래그 카드 쓰인 곳 "정답 입력"(친 값, 쓰기)·"정답 입력의 정답"(읽기), 이름 바꾸기는 묻는 글의 `[이름]`과 힌트의 `[이름]`. **다시 묻기**(`retry: { tries, hints[], who }`, `FEATURE` 33, 세션 89): 틀리면 이 자리에서 다시 묻는다. 원고 `$ _pk_miss = 0`, `while _pk_miss < tries:`(0이면 `while True:`) 안에 묻기·견주기(맞으면 늘 `jump`), `$ _pk_miss += 1`, `if _pk_miss < tries:` 아래 힌트 대사(`if _pk_miss == 1:` … `else:` 마지막 힌트, 화자 `who`, 빈 힌트는 뺌), while 뒤 틀림(else). Ren'Py 스크립트에는 `break`가 없어서 while 조건으로 나감. 기회 0이면 `else` 손잡이와 선이 없고(`ops.links`, `fallTarget` null) 틀림 경고도 없음. 캔버스 틀림 선 글 "틀림 (N번)", 상자 안 "↻ 틀리면 다시 묻기" 줄. 오른쪽 [틀리면 다시 묻기]·기회·힌트 화자·힌트 줄. **따라가 보기 입력**(세션 89): 상자의 ✎ 플래그 입력 줄마다 입력칸(`InputLines`, 게임 규칙 `typedValue`: 글자는 앞뒤 빈칸 빼고 비우면 처음 값, 숫자는 숫자일 때만 범위 안으로), 정답 입력은 [답 쳐 보기](게임과 같은 견주기, 친 값 플래그에도 넣음)와 틀림. 다시 묻기면 틀릴 때 같은 걸음에 `miss`·`hint`를 두고 머물며, 기회를 다 쓰면 틀림 상자로
  - `call` `{ target, then }`: target을 call하고, 돌아오면 then으로. then이 없으면 return
  - `return`: 끝
- **플래그** (세션 50, `FEATURE` 14, `src/flags.ts`, `src/FlagFields.tsx`): `variables`는 `{ id, name, kind, init, note? }`. 줄 종류 `flag`는 `text`에 바꾸는 식 하나(`name op value`, op는 `=` `+=` `-=`). `normalizeProject`가 예전 빈 배열·모양이 다른 값을 맞추고(`normalizeFlags`, 종류가 없으면 init으로 정함), 선택지의 condition(빈 글은 null)·actions(글만)를 맞춘다.
  - 오른쪽 칸 맨 위 **플래그 카드**(`FlagsCard`, 카드 id `i-flags`, 상자를 고르지 않아도 늘 보임): 이름(입력을 마치면 확정, `renameFlag`가 조건·고르면·바꾸기 줄의 이름도 바꿈. 명령 줄과 글자 안은 그대로), 종류(바꾸면 `fitInit`), 처음 값(켜짐/꺼짐은 고르기, 숫자, 글), 메모, 쓰인 곳(`flagUses`: 바꾸기 줄·선택지 고르면은 ✎, 선택지 조건·조건 분기·명령 줄은 ?, 누르면 그 상자를 골라 보여 줌). 이름 검사 `flagNameProblem`: 파이썬 이름, 예약어·파이썬 내장 이름, 연결을 켜면 플러그인 이름, 캐릭터 id, 다른 플래그.
  - 플래그 카드 [+ 추가]는 **플래그 만들기 메뉴**(`FlagMenu.tsx`, Command Palette 꼴): 찾기 칸 + 용례 줄(아이콘, 이름, 오른쪽 종류). 위아래 화살표·Enter·Esc(`isComposing`이면 무시: 한글을 짜는 중의 Enter로 만들어지지 않게), 바깥을 누르면 닫힘. 닫으면 초점이 [+ 추가]로 돌아감(바깥을 눌러 다른 칸으로 갔으면 그대로). 올린 줄은 옅은 강조색 배경 + 강조색 글자, 바닥에 키 안내 줄. 고른 줄 옆(자리가 없으면 오른쪽)에 설명 카드: 설명, 움직이는 견본(꼴 2단계부터. HUD 틀 메뉴는 렌파이 영상), ✎ 바꾸는 곳·? 보는 곳, 원고 몇 줄. 고르면 `addRecipeFlags`가 플래그를 만들고(update 한 번이라 실행 취소 한 번, 이름이 겹치면 `love_2`처럼 `freeFlagName`) 첫 플래그 이름 칸으로 감. 용례는 `src/flagRecipes.ts` 한 곳(빈 플래그, 호감도, 한 번 본 장면, 물건 얻기·쓰기, 잠긴 선택지, 갈래 정하기, 여러 끝). `src/flagclips/<id>.webm`은 메뉴 견본을 찍은 안내서용 영상(`tools/record_flag_demos.cjs`: 빌드한 `dist/index.html`을 Playwright(설치된 Chrome·Edge)로 열어 견본 부분을 연달아 찍고 ffmpeg concat으로 VP9, 빌드에는 안 들어감). 안내서는 GUIDE의 `<!-- flag-recipes -->` 자리에 `build_guide.py` `flag_recipes()`가 같은 목록(빈 플래그 빼고)을 영상 카드로 넣음(이름·설명·바꾸는 곳·보는 곳과 원고 속 대사 번역은 앱 사전, [영상 | 글] 줄). 설명 카드 너비는 `min(480px, 100vw - 300px)`. 상자는 만들지 않음(나중에 플래그 설계 창의 틀에서).
  - **플래그 꼴** (`FEATURE` 20, `src/flagUi.ts`, `src/FlagWidget.tsx`, `src/FlagLook.tsx`): 플래그 `ui` `{ look: level|switch|checkbox|radio|pulldown|input, style?: continuous|discrete|rating, min?(0), max?(10), options?, skin?: { 부품: { color?, image? } } }`. 없거나 종류와 안 맞으면 `flagUi`가 종류의 기본(숫자 레벨 0~10, 켜짐/꺼짐 스위치, 글자 라디오). `FEATURE` 29에서 슬라이더·콤보박스를 뺌: 예전 파일의 `slider`는 레벨(이어진 막대), `combo`는 풀다운으로 읽음(`normalizeUi`). 켜짐/꺼짐은 스위치·체크박스, 글자는 라디오·풀다운. 부품은 `skinParts`(레벨: 채움·바탕·테두리, 별: 찬 기호·빈 기호, 스위치: 켜짐 바탕·꺼짐 바탕·손잡이, 체크박스: 상자·체크된 상자·체크 마크·테두리, 라디오: 링·고른 링·선택 점·글자(게임, 기본 흰색. 앱은 글자 색을 정했을 때만), 풀다운: 바탕·글자·테두리), 그림·영상은 게임 그림 이름이나 game 기준 파일 경로(`useMediaPic`: 경로면 `fileUrl`, 영상은 `<video>` 반복·소리 없이, 늘여 맞춤. 팝오버 📂 `pickMediaFile`·🎞 `openMaskDialog`, GIF는 🎞로 투명 영상). **FEATURE 29 레벨 짜임**(HUD 요소 데모): `ui.warn`·`crit`·`dir`(`levelState`: 낮을수록/높을수록 위험), 막대는 프레임(`border`, 그림이면 `slice`로 9-slice) → 여백 `pad`(없으면 1, 칸 막대 2) 안에 트랙 → 채움(`fill`·`fillWarn`·`fillCrit`, `statePart`: 제 것이 없고 정상 채움이 그림이면 색조만 바꿈 `SHIFT_CSS`/렌파이 `HueMatrix`) → 끝 장식 `tip`(높이 `ui.tip`) → 광택 `gloss`, 채움 맞춤 `fit`(없으면 자르기 = `clip-path`, 렌파이 bar가 자름 / `stretch` 늘이기 = 렌파이 `bar_resizing` + `Frame(부품, 0, 0)` / `tile` = 렌파이 `Tile(Transform(ysize, contain))`). 칸형(`style: rating`)은 `cells`(없으면 범위, 20칸까지)·`gap`, 칸마다 빈칸(`off`) 위에 채움(`on`·`onWarn`·`onCrit`)을 그 칸 몫만큼 잘라 덮음(반 칸, 렌파이 `Crop`), 그림이 없으면 ★. 스위치는 트랙 꺼짐·켜짐(켜짐이 서서히 겹침)·썸·켜짐 썸 `thumbOn`. 원고 그림은 `mediaCode`(영상은 `Movie(play, loop=True)`, `mask_`면 `side_mask=True`). 숫자 꼴 `height`(화면 탭 무대는 항목 높이). 숫자 꼴은 `role=slider`(끌기·화살표·Page·Home·End, 별은 칸마다 한 값, 별 10개·칸 20개까지) + 고칠 수 있을 때 옆에 수치 칸 `NumInput`(치는 중에는 빈 칸·`-`도 두고 숫자가 되면 바로 바꿈, 반올림·범위 안으로, 칸을 떠나면 지금 값, Enter로 떠남, 키는 꼴·캔버스로 안 감), 스위치 `role=switch`, 체크박스 `role=checkbox`, 라디오 `role=radiogroup`(고를 값마다 `role=radio`, 방향키로 옮김), 풀다운은 `select`. 글자 고를 값은 `strOptions`(꼴 목록 + 대본에서 그 플래그에 넣거나 견주는 글). 플래그 카드 줄 `FlagLookRow`: 꼴(시험 값 `useFlagTest`, 저장 안 함, [처음 값으로]) + [꼴 ▾] 팝오버 `LookPop`(꼴, 레벨 모양, 최솟값·최댓값, 고를 값 칩, 부품마다 색·`#rrggbbaa`·그림, ↺) + **이 값일 때** `flagEffects`(시험 값 전부로 `evalExpr`: 선택지 보임/숨음, 조건 분기는 앞 갈래부터 하나만 감 + 간 상자의 첫 대사, 바꾸는 식은 바꾼 뒤 값). 용례 `flagRecipes`에 꼴과 `demo`(걸음마다 값, 식, 대사, 선택지 열림/잠김): 메뉴 설명 카드는 영상 대신 `RecipeDemo`(1.5초마다 다음 걸음, 점으로 고름, `prefers-reduced-motion`이면 멈춤). 안내서 용례 카드는 그 견본을 찍은 영상(`g-flag-demos`). **입력칸** (`FEATURE` 31, `look: input`, 글자·숫자): 플레이어가 쳐서 정하는 꼴. `ui.len` 최대 글자 수(글자). 부품은 풀다운과 같음(바탕·글자·테두리). 앱은 `InputLook`(`input`, 숫자는 숫자만·범위 안으로), [꼴 ▾] `InputKnobs`(최대 글자 수, 이름으로 쓰는 캐릭터, 어디서 치는지 안내). 화면 원고 `lookCode`: 보기만이면 값 글, `edit`이면 `button`(누르면 `값.Toggle()`) 안 `input`(`action` `값.Disable()`이라 Enter가 대사로 안 감, 렌파이는 한 번에 칸 하나만 침. 글자는 `VariableInputValue("이름")`(점 이름이라 `persistent.이름`도), 비우고 Enter면 처음 값. 숫자는 원고 끝 `_PkNumInput`(`VariableInputValue`를 이은 것: 치는 동안 초안, 숫자가 되면 범위 안으로 바로, `allow "-0123456789"`)). 렌파이 8.6.1에서 대사 중 HUD로 치기·스페이스·h·Enter·칸 옮기기·persistent를 봄(세션 86). 용례 "주인공 이름"(`player_name`)
  - **조건 눈금·판단** (꼴 2단계): `flagMarks`가 숫자 플래그를 견주는 조건(선택지 condition, 조건 분기 갈래)을 `parseCond`로 읽어 절마다 눈금 `{ value, op, ok(그 절만), open(조건 전체), ref: { nodeId, at, id, clause } }`(대본 차례, 번호는 기준 값 차례). 숫자 꼴 위 Steps 꼴 동그라미(넘으면 ✓), 끌면 `setMarkValue`가 그 절의 값을 바꿈(update 키로 끄는 동안 한 번의 실행 취소). 플래그 줄 아래 `fw-steps` 목록(선택지 열림/잠김, 갈래 이 갈래, `aria-current` 다음 눈금). 눈금으로 보이는 조건은 "이 값일 때"에서 뺌. 판단 인스펙터 `FlagJudge.tsx` `JudgeInspector`(플래그 카드 맨 아래): `judgeBoxes`(숫자 플래그를 보는 ◇ 상자) + [+ ◇ 상자 열기]. 상자마다 접기, 쓰는 플래그 꼴(시험 값), 갈래 줄(`CondInput compact`, → 상자, ↑ 차례, `takenBranch`로 지금 가는 갈래 + 첫 대사), 그 밖. 더하기 `judgeCond`: all `a >= n and b >= n`, any `or`, sum `a + b >= n`, top `a >= b and a >= c` → `newBranch(null, 식)`을 맨 아래에. 용례 `marks`(견본 꼴 위 눈금)
  - 조건 칸 `CondInput`(선택지 보이는 조건, 조건 분기 갈래. 오른쪽 칸과 상자 안 `compact`): 저장은 렌파이 조건식 글 그대로(형식 안 바뀜). 플래그가 있고 `parseCond`로 읽히면 고르는 칸: 조건 하나가 한 줄 [플래그] [켜져 있으면/꺼져 있으면 | 숫자 + 이상·이하·보다 크면·보다 작으면·이면·이 아니면 | 글 + 이면·이 아니면] ✕, 둘째 줄부터 [그리고/또는](하나로 모두 바뀜), 맨 아래 [+ 조건 더하기 ▾]와 `{ }`. 읽는 모양: `이름`, `not 이름`, `이름 == True/False`(켜짐/꺼짐으로), `이름 비교 값`(숫자, `"글"`, True/False)을 `and`만 또는 `or`만으로 이은 것. 괄호, and·or 섞임, 함수는 글 칸(`CondText`)으로. 글 칸: 글 + [플래그 ▾](커서 자리에 넣음. 켜짐/꺼짐은 이름, 숫자는 `이름 >= 1`, 글자는 `이름 == ""`, 앞에 식이 있으면 `and`로 잇기) + 읽히면 ▾(고르는 칸으로). 플래그 카드와 캐릭터 id에 없는 이름(`exprNames`: 글자 안, 점 뒤, 함수 부르기, 파이썬 키워드·내장 이름은 뺌)이 있으면 빨간 테두리. 상자 안 표시는 `condWords`(`love ≥ 5 그리고 met 켜짐`, 못 읽으면 식 그대로, 툴팁은 식).
  - 바꾸기 칸 `ActionInput`: [플래그][어떻게][값]. 켜짐/꺼짐은 켜기 `True`·끄기 `False`·뒤집기 `not 이름`, 숫자는 더하기·빼기·정하기와 숫자, 글자는 글(따옴표로 감쌈). `{ }`나 이 모양으로 못 읽는 식, 카드에 없는 플래그면 글 칸으로 그대로 고친다.
  - 선택지 줄(오른쪽 칸 `ChoiceRow`)의 **⚑**: 보이는 조건과 고르면 목록을 펼침(값이 있으면 처음부터 펼침, 단추는 주황). 상자 안 선택지에는 `if 조건`(주황), `⚑ love +1`(초록) 작은 표시(`ChoiceFlags`, `actionWords`).
  - 바꾸기 줄: 화자 칸 "기타"의 ⚑ 플래그 바꾸기, 대사 카드 [+ 플래그 바꾸기](첫 플래그로 채움). 상자 안에서는 연출 줄처럼 `⚑ love +1`로 그리고, 고르면 오른쪽 옆 칸에 `ActionInput`.
  - **엔딩 후에도 남는 플래그** (`FEATURE` 30, `variables[].persist: true`): 플래그 카드 메모 옆 [엔딩 후에도 남음]. 대본(조건, 바꾸기, 화면)에는 이름 그대로 쓰고, 원고를 만들 때만 `persistent.이름`으로 바꾼다(`flags.ts` `flagRef` `persistExpr` `persistSub`): `default persistent.이름 = 값`, 바꾸기 줄·선택지 조건·고르면·조건 분기·이름 입력, 대사·선택지 글의 `[이름]`(`escapeText` `subs`), 캐릭터 이름, 화면의 보이는 조건·고른 상태·글·버튼 바꾸기(`flagAction(식, p)`: `SetVariable("persistent.이름", …)`, 렌파이는 점 이름을 받음)·막대·꼴. 직접 쓴 명령 줄은 그대로 두고, 그 이름을 이름만으로 쓰면 검사 경고(렌파이가 멈춤). 대본 편집기 안의 따라가 보기·시험 값은 다른 플래그와 같다
  - 내보내기: 캐릭터 `define` 아래에 `default 이름 = 값  # 메모`(세이브를 불러오면 세이브 값이 이김). 바꾸기 줄은 `$ 식`(비면 `pass`와 경고). 선택지는 `"문구" if 조건:`, 그 아래 `$ 식`들, 다음 `jump`. 검사: 플래그 이름 오류, 식으로 못 읽는 바꾸기는 오류, 카드에 없는 이름은 경고(조건 분기 조건도).
- id는 툴이 만든다. 상자는 `n01`, `n02` … 만든 순서 번호(`ops.nextBoxId`: 지금 있는 가장 큰 번호 다음, 지운 번호는 다시 안 씀, 99를 넘으면 `n100`. 한번 붙으면 안 바뀜. 예전 상자의 `n` + 영숫자 6자는 그대로 둠), 줄·선택지·조건 갈래·label은 `l`/`c`/`b`/`g` + 영숫자 6자. 로컬 label 이름으로도 쓰이므로 영문 식별자 규칙을 지킨다.
- 불러올 때 `normalizeProject()`가 빠진 값을 채우고, 그룹이 없는 상자를 첫 그룹에 넣는다.
- **셰이더** (`BoxNode.shader`, `LabelGroup.shader`, `src/shader.ts`, `FEATURE` 5): `{ a, b, in?, out? }`. `a` `b`는 pygaki 플러그인 `screen_fx.shaders`의 1번, 2번 이름(`none`, `ascii`, `vhs_crt` …), `in` `out`은 전환. 고를 수 있는 것은 `tv`와 `none`(없음, `transition=None`) 둘이고(`SHADER_TRANS`), 새로 정하면 둘 다 `tv`로 시작한다(`newShader`). 예전 판의 `fade`와 빈 값(게임 설정대로)은 대본에 그대로 두고 그대로 내보내며, 칸에 "예전 값"으로 알린다(`oldTransLabel`). 상자에 없으면 label 것, label에도 없으면 없음(`shaderOfBox`). 값이 없는 것이 기본이라 예전 파일은 그대로 열린다.
  - 내보내기: 셰이더를 한 곳이라도 정했고 `renpyLink`가 켜져 있으면 **모든 상자의 첫 줄**(상자 label 바로 아래, 첫 `# @l:` 앞)에 `$ screen_fx.shaders("a", "b"[, transition=…])`를, 셰이더가 없는 상자에는 `$ screen_fx.clear([transition=…])`를 적는다. pygaki 플러그인은 같은 값이면 전환 없이 넘어가므로(`screen_fx.use`의 `old == new`) 어느 길로 들어와도 맞다. `call` 줄 바로 뒤에도 한 번 더 적는다(불러온 장면이 바꿨을 때).
  - 고르는 목록(`shaderNames`): 게임 폴더의 `screen_fx/shader_list.json`(없으면 빌드할 때 가져온 저장소의 목록)에서 `screen_fx/shaders_off.txt`에 적힌 것을 뺀 것. `gameFolder.ts` `scanFolder`가 읽어 `setShaderList` `setShadersOff`로 넘긴다. 형식은 LINK.md 11장. 지금 고른 것은 꺼져 있거나 목록에 없어도 남긴다.
  - 위쪽 [셰이더] 화면의 [셰이더] 칸(`ShadersView.tsx`, `shaderLib.ts`. 2026-11-12에 [효과] 안에서 위쪽 큰 탭으로 올림): 카드 목록(이름, 쓰인 곳 수, 끔·덮개 표시), 켜기/끄기(`setShaderOn`이 `screen_fx/shaders_off.txt`를 씀), 샘플(`fx/ScreenFxCanvas.tsx` `ScreenFxCanvas`: 목록 파일의 `glsl`을 합쳐 WebGL로 계속 그림, `extra`인 효과와 코드가 없는 1판 목록은 안내만)과 세부 값 막대(`ScreenFxKnobs`, 플러그인 `GROUPS` 그대로. 값은 저장하지 않음), 쓰인 곳 [보기](`openShader`). `useLive.view === 'shaders'`일 때 `App.tsx`가 그린다.
  - 화면(`ShaderPanel.tsx`): 카드 셋. 셰이더(1번, 2번) / 전환(시작할 때, 끝날 때. 픽셀소트·데이터모싱이면 그 줄 아래 **방향** 단추(`IMG_TRANS_DIR`, 대본 `shader.iv` `{효과: {값: 값}}`, `FEATURE` 9, 효과 파일에 그 `u__` 값이 있을 때만), 그 밖의 세부 값 막대·색(`ivRows`, `u__cut`과 방향은 빼고, 같은 `shader.iv`에 숫자나 `"#rrggbb"`, `FEATURE` 12. `count`가 있으면 한 번 깜빡임 초를 보여 줌)와 그림 전환 시간 막대 `shader.time`(0.1~4초). 내보낼 때 방향은 `tv={…}`로, 게임 효과 파일에 있는 값만) / `script_flow.rpy`에 들어가는 줄.
  - 전환(`enterTrans`): 그 상자의 `in` → 셰이더가 다른 앞 상자의 `out` → 없음(게임 설정). 상자 끝에는 줄을 넣지 않는다(선택지 화면이 바뀌지 않게).
  - 하나도 안 정한 대본에는 이 줄이 전혀 안 들어간다. `renpyLink`가 꺼져 있으면 왼쪽 검사 카드에 경고 한 줄.
  - 화면: 상자 머리와 label 틀 오른쪽 위의 `ShaderButton`(`BoxView.tsx`) → `store.openShader` → 오른쪽 칸이 `ShaderPanel.tsx`. 그 상자만 골라져 있는 동안(label은 아무 상자도 안 고른 동안)만 열려 있다.
  - **세부 값** (`FEATURE` 6, screen_fx 5.5): `BoxShader.va`(1번) `vb`(2번)는 `{값 이름: 값}`, `tv`는 TV 전환 값. 셰이더 칸에서 고른 셰이더 아래 [세부 값]을 펼치면 `ScreenFxKnobs`(값 이름과 범위는 `shader_list.json`의 `params` `groups`), 전환이 TV면 `TvKnobs`(`shader.ts` `TV_KNOBS`). 셰이더를 바꾸면 그 자리 값은 지운다. 내보낼 때(`shaderCode`) 대본 어디에든 셰이더 값이 있으면(`usesShaderValues`) 모든 셰이더 줄에 `values={이름: {…}}`(두 자리를 이름별로 합침, `slotValues`), 전환이 `"tv"`이고 그 전환의 주인에게 `tv`가 있으면 `tv={…}`. 들어올 때 전환과 TV 값은 `enterTransTv`. 게임 목록의 `screen_fx`가 5.5보다 낮으면(`valuesSupported`) 값을 빼고 검사 경고. 형식은 LINK.md 2장.
  - 위쪽 [셰이더] 화면(`ShadersView.tsx`): [셰이더](목록, 켜기/끄기, 샘플, 구경용 막대) / [전환](TV 꺼짐·켜짐, 픽셀소트, 데이터모싱, TV 지직, 조정 화면, 테이프 늘어짐, 점멸, 물결로 넘기기, 없음(`SHADER_TRANS`, 새 넷은 `FEATURE` 11, 물결로 넘기기 `bendwave`는 세션 94). TV 말고는 효과 폴더 효과를 `PictureSample`로. TV는 CSS로 비슷하게 그리는 샘플 `TvSample`과 구경용 막대, 쓰인 곳).
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
   - 연출: `scene bg 이름 [with 전환]`(이름이 비면 `scene`), `show 이미지 [at 위치] [with 전환]`, `hide 태그 [with 전환]`, `show 이미지 … [zorder 숫자] [behind 태그]`, `play|queue music "audio/파일" [fadein 초] [loop|noloop]`, `stop music|sound|audio [fadeout 초]`(기본 1.0, 0이면 fadeout 없음), `play sound|audio "audio/파일"`, `pause [초]`, `with vpunch|hpunch|Fade(…)`. 초는 정수면 `2.0`처럼. 이미지는 배경 `bg 이름`, 캐릭터 `캐릭터id 표정`, 기타 이름 그대로. 파일 이름에 `/`가 있으면 앞에 `audio/`를 붙이지 않는다. 칸이 덜 채워지면 `# TODO: 이유`를 쓰고 경고한다.
   - 메모: `# ...`
7. 텍스트 이스케이프: `\`→`\\`, `"`→`\"`. 설정에 따라 `[`→`[[`, `{`→`{{`(텍스트 태그 끔), `%`→`%%`. 줄바꿈은 `\n`. **플래그 값** `[이름]`(이름이 플래그 카드에 있고 앞이 `[`가 아닐 때, `flags.ts` `FLAG_SUB`)은 `[`를 바꾸지 않고 그대로 둬서 렌파이가 그때 값을 보인다(`escapeText`의 `subs`). 태그 상자 [진행] 줄의 [플래그 값] 고르기로 넣고(`TagBar` `FlagValuePick`, 텍스트 태그를 꺼도 보임), 캔버스 줄은 초록 칩(`TagView` `.tg-var`), 미리보기는 처음 값·시험 값으로 바꿔 보인다(`fillFlags`). 플래그가 아닌 `[이름]`은 검사 경고(설정을 켜면 글자 그대로 보인다는 것, 끄면 렌파이가 멈출 수 있다는 것). 저장 형식은 그대로
8. 나가는 방식 출력:
   - `next`: 다음 상자가 바로 뒤에 놓였으면 생략, 아니면 `jump`. 연결이 없으면 `return  # TODO: 연결 안 됨`.
   - `menu`: `menu:` 아래 질문 대사(`ask`의 글이 있으면 `화자 "글"` 또는 `"글"`), 항목마다 `jump`.
   - `call`: `call 대상` 다음 줄은 then을 next와 같은 규칙으로 처리하고, then이 없으면 `return`.
9. 본문이 비면 `pass`를 넣는다. 각 상자 위에 `# @node:id 제목` 주석을 붙인다(나중에 역가져오기용).
10. **검사(경고/오류)**:
    - label 이름과 캐릭터 id의 형식 오류, 예약어, 중복
    - 시작 상자 없음
    - 등록되지 않은 화자
    - 빈 대사나 빈 선택지
    - 덜 채운 연출 줄, 등록되지 않은 캐릭터, 영문이 아닌 이미지 이름
    - 게임에 없는 그림(경고, `FEATURE` 15, `src/imageCheck.ts`): 렌파이 프로젝트를 연결했을 때만. `scanFolder`가 만든 `imageBook`(images·movies 파일 이름 + 게임 `.rpy`의 `image 이름 =|:`, `renpy.image("이름"`; `layeredimage` 태그는 속성 상관없음, 글자로 못 읽는 `renpy.image(변수`가 있으면 검사 끔)과 `scene`/`show` 줄의 "태그 속성"을 맞춘다. 그 태그의 그림이 없거나, 줄의 속성을 모두 가진 그림이 없으면 경고(속성 없이 태그만이면 태그만 있으면 됨). 렌파이 기본 그림 `black` `text` `vtext`는 통과. 검사 카드(`Sidebar.tsx` `useRpy`)만 넘기고 내보내기는 막지 않는다
    - 보이기의 `behind`에 태그 하나가 아닌 글
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

- **pygaki 안 플레이는 없앴다** (세션 34, 사용자 말): 위쪽 [▶ 플레이] [⛶ 전체화면], 오른쪽 플레이 카드, 단축키 Alt+P·F8, `playEngine.ts` `Player.tsx`, store의 `playing` `play` `fullPlay` 등. 대본은 [▶ 렌파이에서 실행]과 [렌파이에서 여기로 이동](6장)으로 게임에서 본다. 남긴 것은 `SayPreview.tsx`(예전 `PlayStage.tsx`의 `useReveal` `Glyphs` `LinePreview`): 글자 효과 카드 미리보기와 [효과] 화면 샘플이 쓴다.
- 텍스트 태그를 흉내 낸다: `{b} {i} {u} {s} {color=} {size=} {font=} {alpha=} {k=} {cps=} {p} {w} {nw} {fast} {a=}`, `{{`, 그리고 pygaki의 `{clear}`(클릭 대기 + 다음 글자가 나오면 앞 글자 감춤, `Tagged.clears`, `Glyphs`). 글자를 하나씩 내보내고(`parseTagged`, `useReveal`), 클릭하면 다음 멈춤까지 다 보여 준다.
- **등장 효과**: 렌파이 텍스트 셰이더 7개와 pygaki 플러그인이 등록한 20개를 **WebGL로, pygaki 플러그인과 같은 셰이더 코드로** 그린다(`src/fx/`). 효과 폴더(pygaki 플러그인 `ui_kit/effects/*.glsl`, LINK.md 8-1)의 효과도 같다: 플러그인이 있는 폴더를 연결했으면 그 폴더의 파일만 `scanFolder`가 읽고(연결하지 않았으면 빌드할 때 가져온 저장소의 샘플) `setFolderEffects` → `refreshEffects`(`EFFECTS`, `TRANSITIONS` 배열을 그 자리에서 다시 채움, `useGameFolder.fxSeq`로 다시 그림). 바뀌면 `effectEpoch`가 올라 미리보기 셰이더를 다시 만든다. 그림 전환(`img_fx.use`)은 [효과] 화면 샘플에서 같은 셰이더 코드로 그린다(`fx/TransitionCanvas.tsx`).
  - **효과 관리** (`src/effectsLib.ts`, 화면은 3장의 [효과] 화면. `window.pykakiEffects`로도 부를 수 있음): `effectCatalog`가 렌파이 / 기본 / 프로젝트 / 모음(샘플과 `showpy/effects_library`, 아직 넣지 않은 것)을 한 목록으로 만든다(켬·끔, 쓰인 줄 수). `setEffectOn`은 `effects_off.txt`(LINK.md 8-2)를 고치고, 끈 효과는 `stage.ts`의 `refreshEffects`가 고르는 목록에서 뺀다. `addEffectFile`·`addFromLibrary`는 `checkPack`으로 검사한 뒤에만 효과 폴더에 쓰고, `removeEffectFile`은 백업(`ui_kit_backup/effects/`)을 남기고 지우며 `replace`를 주면 대본의 그 효과를 다른 값으로 바꾼다(`replaceInProject`: 칸으로 고른 값, 명령 줄의 `effect="…"`·`img_fx.use(…)`, 대사 글의 `{shader=…}`). 쓰인 곳은 `effectUses`.
  - **숨김만 (2026-11-14)**: [효과]·[셰이더] 화면과 나타나는 방식 고르기 창은 효과 폴더에 있는 것만 보이고, 카드의 [숨김]/[숨김 해제](`setEffectOn`, `setShaderOn` → `effects_off.txt`, `shaders_off.txt`)만 한다. [넣기], [빼기], [파일 넣기], 효과 모음 칸은 없앰(`effectsLib`의 `addFromLibrary`, `addEffectFile`, `removeEffectFile`은 남아 smoke만 씀). `showpy/effects_library`는 비워서 지움(셋은 효과 폴더 샘플로)
  - **숨김 아래로 (2026-11-14)**: `prefs.hiddenLast`(처음 true). `FxGallery.tsx`의 `HiddenLastSwitch`(단추, 숨긴 개수)와 `hiddenLastSort`(숨긴 것만 뒤로, 나머지는 원래 차례)를 `EffectsView`의 `here`, `ShadersView` `ShaderList`의 `shown`에 씀. 갤러리와 목록 둘 다
  - 셰이더는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나이고, 빌드할 때 `?raw`로 그대로 가져온다. 렌파이 내장 7개는 `src/fx/renpy_textshaders.glsl`(렌파이 8.6.1 `00textshader_ren.py`를 옮김, MIT. 8.6의 `jitter` `u__duration` `u__individual`과 `u_text_time`까지). 형식은 [LINK.md](../../docs/LINK.md) 8장. 효과 목록 `EFFECTS`, `RENPY_EFFECTS`, 글자/초 기본값을 쓰는 효과(`@cps`)도 이 파일에서 온다.
  - `textShaders.ts`: 파일 읽기(`parseShaders`, pygaki 플러그인 `tfx_parse`와 같은 규칙), 효과 문자열(`"scatter:u__distance=200"`, `"a|b"`) 읽기(`parseTextShader`, 렌파이 `parse_textshader`), 렌파이처럼 셰이더 조각 합치기(`shaderSource`: `renpy.geometry` `renpy.texture` `textshader.이름`을 이름순으로, 쓰는 변수만 이름순으로, `vertex_N`/`fragment_N`은 우선순위순, `u__` `l__` `v__` `a__`는 `u_textshader_이름_…`으로 바꿈). 색 값은 투명도를 곱한 vec4.
  - `FxCanvas.tsx`: 화면의 글자(`span.ch`, `.fx-gl`이면 숨김)에서 자리를 재서, 렌파이처럼 글자를 그림으로 만들고(외곽선 겹은 따로) 글자마다 조각(줄 높이 × 글자 폭, 줄 왼쪽과 오른쪽 빈 곳은 가짜 글자, 그림 폭은 가장 긴 줄)을 만든다. 중심(`a_text_center`)은 글자 밑줄 자리. 글자 i의 `a_text_min_time`은 `useReveal`이 i번째 글자까지 내보낸 때라 렌파이처럼 한 글자 앞서 나오고, `{w}`에서 멈춘 동안 뒤 글자는 안 나온다. `u_text_slow_time`, `u_text_slow_duration`(1/cps), `u_text_to_drawable`(화면 배율 × devicePixelRatio), `u_text_main`, `u_text_depth`, `u_time`, `u_random`, `tex0`, `res0`를 렌파이와 같은 뜻으로 넘긴다. 클릭으로 한 번에 보이면 렌파이처럼 다 끝난 시간으로 그린다. 캔버스는 글 칸 둘레로 글자 크기 × 3만큼 넓다.
  - `echo`처럼 `@outline`이 있는 효과는 외곽선 겹(`u_text_main` 0)을 글자 뒤에 먼저 그린다.
  - WebGL이 없거나 셰이더가 실패하면 예전처럼 CSS로 흉내 낸다(`.fx-*`, `--cd`, `--r1`~`--r4`, `liquid`는 App.tsx의 SVG 필터).
  - pygaki 플러그인 효과는 연결을 끄면 내보내지 않고 경고한다(`RENPY_EFFECTS`). 렌파이처럼 글자가 하나씩 나올 때만 보이고, 물결과 떨림은 늘 보인다. 목록에서 뺀 효과는 `stage.ts`의 `REMOVED_EFFECTS`: 예전 대본 값은 그대로 두고 내보낸다(`typewriter`, `slowalpha`는 렌파이에 있어서 `RENPY_EFFECTS`에 넣음, 나머지는 pygaki 플러그인이 한 글자씩 나오기로 받음).
- 화면 효과(ASCII 등)는 웹 글자에 셰이더를 입힐 수 없어서 미리보기에 안 나온다.

## 8. 편집 동작

- **상자 더블클릭**: 상자 안에서 바로 편집한다(`store.inlineEdit`).
  - **볼 때와 같은 모양**: 상자 폭(기본 250px. 세션 81부터 오른쪽 아래 손잡이 `BoxResize`로 250~900px, 대본 `nodes[].w`(`FEATURE` 27), 더블클릭하면 기본 폭, 끄는 동안은 같은 key로 되돌리기 한 번), 글자 크기, 줄 배치가 같다. 같은 `LineRow`가 보기에서는 글자를, 편집에서는 테두리·여백 없는 `textarea`(`.ed`)를 같은 자리에 그린다. 보기 화면도 줄 수와 줄 길이를 자르지 않는다.
  - **줌인**: 편집을 시작하면 지금 화면(viewport)을 기억하고, 상자와 양옆 단추 자리가 들어오도록 확대(최대 1.6배, 지금보다 작게는 안 함)하며 0.45초 동안 이동한다. 끝내면 기억한 화면으로 돌아간다. 집중 모드를 바꾸면 다시 맞춘다.
  - **옆에 붙는 단추**: 지금 줄(`active`, 포커스를 받은 줄)의 높이에 맞춰 상자 왼쪽 바깥에 손잡이·✕만 있는 방울(`src/LineChip.tsx`, 손잡이 표시는 세션 102부터 ←(`.lc-arrow`, 예전 ⠿. 위 ↑·오른쪽 →와 같이 펼치는 쪽), 세션 91 사용자 손그림: 줄 종류 단추와 ＋를 뺌. 새 줄은 Ctrl+Enter, 줄 종류는 Alt+←나 손잡이를 4px 안으로 톡 누름(`usePtrDrag` `grip(i, tap)`). `Liquid.Item` 둘이 2.4초마다 ±2px 안에서 `ease-in-out`으로 떠다님, 애니메이션 줄이기면 가만히. 예전 `attr`이 있으면 빼기 단추 `OldAttr`도 옆에. 세션 36부터 대사 줄에 표정 칸 없음), 연출 줄이면 오른쪽 바깥에 `StageFields` 카드가 붙는다. 줄을 옮기면 `top`이 0.22초 동안 따라 움직인다. 연출 줄은 줄 자체가 `tabIndex`로 포커스를 받는다.
  - **다음 흐름 창** (`src/FlowMenu.tsx`): 편집 중 상자 오른쪽 바깥, 다음 흐름 줄 높이(연출 입력칸과 겹치면 그 아래. 상자 안이 바뀌면 `MutationObserver`로 다시 잰다)에 붙는 반투명(바탕 62%, 배경 흐림) 창. 항목은 다섯(세션 48, 사용자 그림. 세션 49에 조건 분기를 더하고 항목마다 카드 `.fm-item`, 고른 흐름은 테두리 강조, 이어 쓰기는 떨어진 점선 카드 `.fm-act`): 다음 상자로 / 끝(return) / 선택지(첫 선택지 칸으로 포커스) / 조건 분기(첫 조건 칸으로) / 정답 입력(묻는 글 칸으로, `FEATURE` 32) / 다음 상자로 이어 쓰기(`goOn`: 끝이면 다음으로 바꾸고 새 상자, 나머지는 `goNextBox`). 이어지는 곳 목록·call·바로 가기 묶음은 없앴다(선을 끌어 붙임, call은 선 더블클릭). 기본 Alt+→(`flowMenu`, 바꿀 수 있음, 세션 94 전에는 Alt+Enter)로 들어가면 지금 흐름 항목에서 시작하고, 숨은 입력칸이 키를 받아 방향키(↑↓←→)/Enter/Esc·Backspace로 움직인다. 흐름 종류를 고르면 닫고 글 칸으로 돌아간다. 나가면 들어오기 전의 글 칸으로 커서를 돌려준다. 마우스로도 누를 수 있다.
  - **세 버블** (세션 94 사용자 이름): 상자 안 편집의 줄 종류 고르기 = **대사 버블**(Alt+← `lineType`), 태그 상자 = **글꼴 버블**(Alt+↑ `tagBox`), 다음 흐름 창 = **흐름 버블**(Alt+→ `flowMenu`). 셋 다 같이 열 수 있다: 대사·흐름 버블은 숨은 키 칸이 커서를 잃어도 닫지 않고(오른쪽 칸의 줄 종류 고르기는 그대로 닫음), 키 칸으로 커서가 가도 `useTagTarget`을 지우지 않아 글꼴 버블이 남는다(`TagBar.tsx` focusin). 열린 버블의 단축키는 커서가 그 버블에 없으면 그리로 옮기고(App.tsx), 버블 안에서 누르면 닫는다. 버블 안에서 Alt·Ctrl이 든 키는 App.tsx로 보낸다. 상자 편집을 끝내거나 다른 상자로 가면 `store.ts` 구독이 셋을 접는다. **Alt+↓**(`bubbles`, 세션 97)는 셋을 한 번에: 하나라도 열려 있으면 모두 닫고(대사 버블은 상자 안 것만), 아니면 모두 연다(대사 버블은 쓰는 줄 `activeLine`이 있을 때). Alt+Space는 윈도우 창 메뉴와 다른 프로그램의 전역 단축키가 먼저 잡아서(이 컴퓨터에서 앱에 안 옴, 세션 97 시험) 처음 값으로 쓰지 않는다. 세 버블 모두 유리 바탕을 칠하지 않는다(`GooGlass.tsx` `GLASS_GOO` fill·shadow 없음, `.gg-one` 흐림 없음). 예전 저장 단축키 Alt+T·Alt+Enter·Alt+↓는 `prefs.ts` `KEYS_REV`(`OLD_DEF_KEYS`에 차례마다)로 한 번 새 처음 값으로 옮긴다
  - **줄 종류 고르기** (`src/LineTypeMenu.tsx`, 세션 90): 예전 `<select>`(`LineFields.tsx` `SpeakerSelect`는 이것을 다시 내보냄)를 단추 + 끈적 펼침으로. 단추(오른쪽 칸)나 손잡이 톡(상자 안, 단추 없이 방울에 붙는 `TypeMenuFor`)이나 기본 Alt+←(`lineType`, 세션 94 전 Alt+↓, App.tsx: 상자 편집 중이면 그 줄, 아니면 오른쪽 `.insp` 안에서 쓰는 줄)로 store `typeMenu` `{ line, where: 'box' | 'insp' }`를 켬. 대사·연출·기타 세 칸(`columns`, 고를 것은 예전 select와 같음)을 `liquid-gooey` `Liquid`의 `Liquid.Item` 셋으로(오른쪽 칸은 가로, 상자 안 `TypeMenuFor`는 `side`: 방울 왼쪽에 오른쪽 끝을 맞춰 세로로, 칸마다 `STAGGER` 12·46·0px 엇갈림, 높이를 재서 화면 안으로, 왼쪽 자리가 모자라면 화면 안으로 밀어 상자를 덮음. 세션 91) 단추 자리에서 `bouncy`로 흘러나오게(처음 그림에서 칸마다 단추까지 거리를 재고 다음 프레임에 0으로), 닫을 때는 단추로 빨려 듦(260ms). 숨은 입력칸이 키를 받음: ↑↓ 칸 안(칸 끝에서 다음·앞 칸으로 넘어감, 세션 94), Tab·Shift+Tab(←→도) 칸 사이(줄 번호 유지, 세션 91), Enter 정하기, Esc·같은 단축키 닫기, 닫으면 들어오기 전 글 칸으로. 몸은 `document.body`에 portal. 상자 안(`side`)에서는 글꼴·흐름 버블처럼 캔버스 확대 배율로 `scale`(오른쪽 위 기준)하고, 캔버스를 움직이거나 확대할 때마다(`@xyflow/react` `transform` 구독) 방울 옆에 다시 맞춤(세션 95. 펼침 거리 `home`은 배율로 나눔). 흐름 창 툴팁(`FlowDemo`)은 읽히게 배율을 안 탐, 애니메이션 줄이기면 움직이지 않음
  - **완료/취소 버블** (`src/DoneBubble.tsx`, 세션 90): 상자 편집 중 글을 쓰는 줄(대사·내레이션·명령·메모, `BoxView.tsx` `TEXT_LINE`)의 높이에 맞춰 상자 바깥 오른쪽(`.side-r` 자리, 글 줄에는 `.side-r`가 없음. 세션 91부터 대사를 가리지 않게 상자 밖, 작게 위아래로)에 `Liquid` 둥근 방울 둘 ✓ ✕(세션 102부터 옅은 회색 #e5e7eb 바탕에 회색 #6b7280 표시, 그 전은 푸른 #2f8cff 바탕에 흰 표시. 세션 91: 글자 없이, 튀어나온 0.6초 뒤부터 `LineChip.tsx` `useDrift`로 일렁임, 마우스를 올리면 `.tip` `data-tip` 안내 "완료 · Ctrl+Enter" "취소 · Esc". 왼쪽 방울도 같은 안내)이 `bouncy`로 튀어나옴(줄 id가 key라 줄을 옮기면 다시). [✓ 완료]는 Ctrl+Enter(`addAfter`, 같은 화자로 새 줄), [✕ 취소]는 Esc(`inlineEdit: null`). 글은 칠 때마다 저장돼서 취소해도 그대로(사용자가 고름). 눌러도 글 칸 초점을 안 빼앗음(`mousedown` 막음)
  - **다음 상자로 이어 쓰기** (`goNextBox`, 기본 Ctrl+Shift+Enter): 선택지·조건 분기는 안 이어진 첫 갈래(모두 이어졌으면 첫 갈래)로. `next`/call의 `then`이 이어져 있으면 그 상자를 편집, 없으면 `continueInNewBox`로 같은 label에 새 상자를 만들어 잇고 편집한다. 새 상자는 흐름 방향(TB면 아래, LR이면 오른쪽)에 놓고, 다른 상자와 겹치면 60px씩 비켜 놓는다.
  - **흐름 창 툴팁** (세션 50, `src/FlowDemo.tsx`): 카드에 마우스를 올리거나(키로 고르는 중이면 고른 카드) 350ms 뒤 툴팁. 이름, 설명, 움직이는 견본(SVG `animate`·`animateMotion`, 3.6초 돌기, 색은 화면 테마 변수), 내보내는 원고 몇 줄. 창이 캔버스 안이라 오른쪽 칸에 가려지지 않게 `document.body`에 `position: fixed`로 띄우고, 창 오른쪽에 자리가 없으면 왼쪽. 대본 화면을 감추면 안 보임. 모양은 태그 상자 툴팁(`.tb-tip`)과 같다.
  - **조건 분기** (세션 49, `FEATURE` 13): `exit = { type: 'if', branches: [{ id, cond, target }], else }`. 선 handle은 `b:<id>`와 `else`(`exitLinks` kind `if` `else`, 선 이름은 조건 18글자 / "그 밖", 주황, 그 밖은 점선). 상자 안에서는 갈래마다 "◇ 만약 / 아니고 [조건 칸]"(`in-<id>`, 고르는 칸이면 첫 칸), [+ 조건], "◇ 그 밖". 상자 안 선택지·조건 갈래(`Exits`)는 대사 줄처럼 커서가 있는 갈래 높이에 왼쪽 바깥 묶음 `⠿ ◆ 선택지/◇ 조건 ＋ ✕`(`.side-exit`, 상자 기준 자리)를 붙인다. ⠿로 끌어 순서를 바꾸고(`usePtrDrag`에 `[data-row]`, `ops.moveIn`. 선 handle은 id라 그대로), ＋는 바로 아래에 넣고, ✕는 지우고 커서를 앞 갈래로, 마지막 하나면 `setExitType(next)`로 선택지·조건 분기를 없앤다(첫 이어진 상자로 이어짐, 커서는 상자 마지막 줄). 빈 선택지에서 BackSpace로도 지운다(마지막 하나는 안 지움). "그 밖"은 손잡이 없음. 지금 줄·갈래(`active`)는 상자 하나에 하나라 묶음이 둘 뜨지 않는다. 오른쪽 칸 `ExitEditor`도 같음(↑ ✕, 갈래가 하나면 ✕ 막음). 내보내기: `if 조건:` / `elif 조건:` 아래 `jump`, 그 밖은 `else:` 아래. 그 밖이 바로 다음에 놓인 상자면 else 없이 이어지고(`fallTarget`이 if면 else), 비면 `return  # TODO`(아래 label로 흘러가지 않게). 조건은 한 줄로 모으고 끝의 `:`는 뗀다. 빈 조건은 `False  # TODO`와 오류, 안 이어진 갈래·그 밖은 경고. 조건식은 검사하지 않는다(렌파이 Lint가 봄).
  - 누른 곳의 `data-part`(줄 id, `title`, 선택지 id)로 커서가 간다.
  - 끝내는 방법: Esc, 빈 곳 클릭, 다른 상자 선택.
  - 입력칸 안의 더블클릭은 무시한다(단어 선택).
- **상자 한 번 클릭**: 오른쪽 칸에서 label, 다음 흐름, 시작 상자 등을 설정한다.
- **줄 순서**: ⠿ 손잡이를 끌어 다른 줄의 위/아래 절반에 놓는다. 오른쪽 칸은 HTML 드래그 앤 드롭(`useLineDrag`), 캔버스 상자 안은 포인터 끌기(`BoxView.tsx` `usePtrDrag`, React Flow의 상자 끌기·화면 이동과 겹치지 않게 `nodrag nopan`). 상자 안은 줄마다 왼쪽 여백에 손잡이(마우스를 올리면 보임, 볼 때도 고칠 때도)와 편집 중 왼쪽 바깥 단추 묶음의 손잡이.
- **떠 있는 좌우 칸** (세션 35): `.sidebar` `.right-panel`은 `.main` 위에 `position: absolute`, 바탕 투명, `pointer-events: none`(카드만 `auto`)이라 카드 사이·접힌 카드 아래로 캔버스가 보이고 눌린다. 캔버스는 `.main` 전체. 화면 맞추기는 두 칸 사이에 맞춘다(`Canvas.tsx` `fitVisible`, 컨트롤 [맞추기]도), 글 고치기로 다가갈 때도 칸이 덮은 만큼 옮긴다. 컨트롤·미니맵·`‹ ›`·안내 줄은 `--lw` `--rw`만큼 안쪽.
- **오른쪽 칸 줄 모양**: 줄마다 2칸 격자. 왼쪽 칸(136px)에 손잡이·줄 종류·✕와 대사 속성, 오른쪽 칸에 글(또는 연출 입력칸)을 두고 사이에 세로 선을 긋는다.
- **글자 효과 칸** (`LineLook`, 연결과 상관없이): 글 칸에는 글만 둔다. 오른쪽 칸 상자 카드 아래에 있고(`.look-panel`), 지금 쓰는 줄(`store.activeLine`, 상자 안 편집과 오른쪽 칸이 같이 씀)을 따라간다. 그 줄이 대사가 아니면 상자의 첫 대사 줄을 보여 준다. 집중 모드에서는 패널과 함께 숨는다. 글자 모양, 속도, 등장 효과가 들어 있고, 받아 적은 좌표와 화면 효과는 보여 주기만 한다. 맨 위 미리보기(`LinePreview`)는 `SayPreview.tsx`의 `useReveal`, `Glyphs`, `FxCanvas`로 글자만 그린다. 글자는 칸에 들어가는 가장 큰 크기(11~60px)로 맞추고, 효과나 글자/초를 바꾸면 다시 재생한다.
- **태그 상자** (`src/TagBar.tsx`, `src/tagEdit.ts`): 대사·내레이션 글 칸(`textarea[data-tags]`)에 포커스가 있으면 뜬다. 지금 칸은 `useTagTarget`(document `focusin`으로 따라가고, 태그 상자 안으로 포커스가 가도 그대로, 빈 곳으로 포커스가 사라지면 닫음). 상자 안 편집(`in-줄id`)이면 `BoxView`가 상자 오른쪽 위 바깥(`.tagbar-box`)에, 오른쪽 칸(`ed-줄id`)이면 `LineLook`이 글자 효과 칸 제목 아래(`.tagbar-look`)에 그린다.
  - **지우고 이어서** `{clear}`(세션 52): 렌파이에서는 NVL 화면 지우기 태그라 일반 대사에 그대로 두면 "Unknown text tag"로 멈춘다. 그래서 내보낼 때 `splitClear`(tagEdit.ts)로 그 자리에서 나눠 같은 화자·속성·괄호 값의 대사 여러 줄로 쓴다(렌파이 모놀로그 모드가 `{clear}`로 나누는 것과 같은 뜻). 걸친 짝 태그는 닫고 다음 조각에서 다시 연다. 앞 글은 지우지 않고 자리만 남긴다(세션 53, 사용자 말: 줄바꿈·빈칸을 그대로 써서 다음 글이 원래 자리에 나오게): 둘째 조각부터 앞 조각들을 `{alpha=0}{outlinecolor=#0000}…{/outlinecolor}{/alpha}{fast}`로 앞에 다시 넣는다(`{alpha}`만으로는 외곽선이 남음, 그냥 `Text`에서는 `{fast}`가 안 먹고 대사에서는 먹음, 렌파이에서 확인). 숨긴 글에서는 `{w} {p} {nw} {fast} {cps} {alpha} {outlinecolor}`를 뺀다. 빈칸은 그대로 두고, 글 없는 조각은 대사로 안 내보냄. 미리보기(`Glyphs`)도 앞 글을 `visibility: hidden`으로. 줄 표시 `# @l:`은 첫 조각에만. 텍스트 태그를 끈 대본은 나누지 않는다.
  - 생김새(세션 93·94부터 "글꼴 버블", 위 "세 버블"): 묶음마다 `.tb-sec`(`TbCard`)를 상자를 둘러싼 호 위에 놓음(`GooGlass.tsx` `useArc`·`arcRow`, `data-arc`). 바탕은 `.tb-liquid` `Liquid`(`GLASS_GOO`) 덩어리, 캔버스 안에서는 `BoxView`가 넘긴 `zoom`으로 `--lg-unscale`. 줄 이름은 `.tb-chip`. (세션 47~92의 `.tb-card`·`Liquid.Item observe`·[더 보기] 카드·`cardsIn`은 없어짐) 값은 `Slide`(막대 + 숫자 칸, 끄는 동안 값만 보이고 놓을 때·Enter 때 한 번 넣음. 놓은 뒤 글 칸으로 포커스가 가며 오는 blur에 또 넣지 않게 ref로 막음, 태그 효과 [세부 값]도 같음). 속도는 1초에 몇 글자 `{cps=N}`(세션 48, 대사 칸 텍스트 속도와 같은 단위. `CPS_STOPS` 3~150 칸칸이, 숫자 칸 1~300, 앞에 "1초에" 뒤에 "글자"). 예전 `{cps=*배}`는 "보통의 N배"로만 알림. 툴팁(`.tb-tip`, 상자 아래, 350ms 뒤): `TIPS`(진행, 넣기. 진행 카드는 세션 52까지 "멈춤")와 막대 셋(지금 값)으로 이름·태그·설명·견본(`TagDemo.tsx`: `parseTagged` + `useReveal` + `Glyphs`, 14글자/초, 클릭 대기는 0.9초 ▼ 뒤 저절로, `{nw}`는 다음 줄로, 끝나면 1.6초 쉬고 다시). `parseTagged`는 `{space}` `{vspace}`를 빈 글자(픽셀/30 em)로 그린다.
  - 단추를 눌러도 글 칸의 포커스와 고른 곳이 남게 `mousedown`을 막는다(입력 칸, 팔레트 칸 빼고). 고친 글은 `HTMLTextAreaElement` value setter + `input` 이벤트로 넣어서 React `onChange`를 그대로 탄다(실행 취소 묶음도 타이핑과 같음).
  - `tagEdit.ts`: `tokenize`(렌파이처럼 `{{`, `{#…}`, 짝 태그와 혼자 쓰는 태그는 렌파이 8.5.3 `text_tags` 목록(8.6.1도 같음)), `pairTags`(닫는 태그는 가장 안쪽을 닫음). 고치기: `toggleTag`(b i u s: 같은 태그 안이면 빼기, 고른 곳이 안쪽 일부면 그 부분만 끊어서 밖으로, 아니면 감싸기), `setTagValue`(color size cps: 안이면 값만 바꾸기), `stepSize`(+10/-10, `+n`은 더하고 0이 되면 빼기, 숫자는 더하기, `*x`는 1.25배/0.8배), `removeTag`, `insertTag`(커서 자리, `{nw}`는 글 끝, `{w=0.5}`는 숫자를 골라 둠), `tagsAt`(단추 켜짐). 커서가 태그 글자 한가운데면 태그 밖으로 옮기고, 고른 곳 안의 태그 짝이 안 맞으면 넣지 않고 알린다.
  - [더 보기] (2단계, 펼침은 `localStorage["pykaki-tag-more"]`): 투명도 `{alpha}`(1이면 빼기), 자간 `{k}`(막대 -10~30, 0이면 빼기), 외곽선 색 `{outlinecolor}`(같은 팔레트, 외곽선이 있는지는 읽지 않고 안내만), 글꼴 `{font}`(연결한 폴더 `media.fonts`), `{space=30}` `{vspace=30}` `{{`, 루비 `insertRuby`(`{rb}고른 글{/rb}{rt}읽는 법{/rt}`, 읽는 법을 골라 둠), 글 속 그림 `{image=}`(`media.images`). 커서가 `{rt}`/`{art}` 안이면 [더 보기]와 상관없이 [루비 글] 카드(`rubyAt`, `setRubyStyle`): 크기 막대(6~60, 기본 14)와 색(같은 팔레트, `rubycolor`), [기본]. `{rt}` 안 맨 앞의 `{size=}{color=}`를 다시 적는다. 자리와 효과는 플러그인 `say_style._ruby_style`(showpy SPEC 3장). `select`도 포커스를 받게 `mousedown` 막기에서 뺀다.
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
- **상자 복사·붙여넣기·복제** (`src/boxClip.ts`, `App.tsx` Keys): 글 칸 밖에서 Ctrl+C는 document `copy` 이벤트로 고른 상자를 `{"pykaki-boxes":1,"nodes":[…]}` 글자로 클립보드에 넣는다(앱 창·대본 사이에도 붙게). Ctrl+V(`paste` 이벤트)는 그 글자를 읽어 `pasteClip`: 상자 id는 `nextBoxId`로 새로, 줄·선택지·조건 갈래 id도 새로, 같이 복사한 상자끼리의 선은 새 상자로, 밖으로 가는 선은 이 대본에 그 상자가 있으면 그대로(없으면 끊음), label이 없으면 첫 label. 마우스가 캔버스 위면 묶음의 왼쪽 위를 그 자리로, 아니면 +40px. 붙인 상자를 고르고 `update` 한 번(실행 취소 한 번). 복제(`duplicate`, 기본 Ctrl+D)는 클립보드를 거치지 않고 같은 길. 대본 형식은 안 바뀜(FEATURE 그대로)
- **선 더블클릭**: next ↔ call을 전환한다.
- **Delete**: 상자나 선을 삭제한다.
- **Shift+드래그**: 여러 상자를 선택한다.
- **단축키(기본값)**: Ctrl+\\ 집중 모드, Ctrl+Enter 새 줄, Ctrl+Shift+Enter 다음 상자로 이어 쓰기, Alt+← 대사 버블(줄 종류 고르기), Alt+↑ 글꼴 버블(상자 안 태그 상자), Alt+→ 흐름 버블(다음 흐름 창), Alt+↓ 세 버블 한 번에 열기/닫기(`bubbles`, 하나라도 열려 있으면 모두 닫음, 세션 97), F8 게임 창 여백 띠(`gameBands`, 앱), Ctrl+S 저장, Ctrl+Shift+S 다른 이름으로 저장, Ctrl+E 같은 곳에 다시 내보내기, Ctrl+Z/Y 실행 취소/다시 실행(입력칸 안에서도), Ctrl+B/I/U 대사 글 칸에서 굵게/기울임/밑줄 태그, Alt+N 새 상자, Ctrl+D 상자 복제(Ctrl+C/V 상자 복사·붙여넣기는 바꿀 수 없음)(F5는 새로고침과 겹쳐서 쓰지 않음. 플레이 단축키 Alt+P, F8은 세션 34에 뺌). 8-1 참고.
- 실행 취소: 같은 key로 1.2초 안에 이어지는 변경(타이핑)은 한 번으로 묶는다. 최대 100단계.

## 8-1. 화면, 집중 모드, 환경 설정

- **눈에 덜 띄는 화면**: 버튼은 테두리 없이 흐린 글자, 입력칸은 테두리 없이 옅은 바탕. 위쪽 줄의 오른쪽 메뉴 묶음(`.tb-right`)과 미니맵/확대 버튼은 평소 흐리고 마우스를 올리면 또렷해진다. 줄의 ✕ 버튼은 줄에 마우스를 올렸을 때만 보인다.
- **색 (`src/prefs.ts`)**: `--bg`(바탕) `--panel`(면) `--text`(글자) `--accent`(강조) 네 가지만 정하고, 테두리·흐린 글자·줄 종류 바탕은 CSS `color-mix()`로 이 넷에서 만든다. **화면 테마는 사과 스타일 하나**(세션 77, `bd8f7b0`): 어둡게(그라데이션), 직접 고르기, 텍스트 색 고르기는 없앴고 예전 설정의 `theme`·`custom`·`textColor`는 읽어도 무시한다(`prefs.ts` `themeOf`). 새 화면은 밝은 바탕 하나만 생각해서 만든다(어두운 테마 갈래를 만들지 않음). (예전 '종이', '사과 컬러풀', '밝게', '1비트', '1비트 흰 바탕'은 없앴고, 저장된 값이면 사과 스타일로 연다) 바탕이 어두우면 `data-dark`를 붙이고 React Flow도 `colorMode="dark"`.
- **집중 모드**: `store.focusMode`. `.app.focus`가 툴바·양쪽 패널·미니맵·확대 버튼·안내 글을 숨긴다. 저장하지 않고 새로고침하면 꺼진다. 알림(`say`)은 화면 아래 토스트로 띄워서 집중 모드에서도 보인다.
- **밑줄 커서 (`src/Caret.tsx`)**: 상자 안 편집(`.box.editing`)의 글 입력칸에서 브라우저 커서를 투명하게 하고, 강조색 밑줄을 1.05초 주기로 깜박인다. 입력칸 스타일을 복사한 보이지 않는 div에 커서 앞 글자를 넣어 자리를 재고, 매 프레임 입력칸 위치·확대 비율을 다시 읽어 화면 이동/확대를 따라간다. 커서가 움직이면 켜진 상태부터 다시 깜박인다. 글자를 범위 선택하면 숨기고, 한글 조합 중에는 보인다.
- **단축키**: `ACTIONS`에 동작과 기본 키. 키는 `e.code`(자판 위치)로 적어 한글 입력 상태에서도 같다. Cmd는 Ctrl로 본다. 바꿀 때 Ctrl/Alt 없는 키는 F1~F12만 허용하고, 겹치면 다른 동작의 키를 비운다. 실행 취소/다시 실행은 입력칸 안에서도 앱의 것(`appUndo`. React 칸은 브라우저 글자 되돌리기가 거의 안 먹어서). 창(`.modal`) 안의 칸과 확정 전까지 대본에 안 들어가는 칸(`data-native-undo`, 플래그 이름)은 브라우저에 맡긴다.
- 데스크톱 앱: 윈도우 Electron은 `alert`/`confirm`을 닫은 뒤 글 칸을 눌러도 커서가 안 들어가는 일이 있어서, `desktop.ts`가 둘을 감싸 닫을 때마다 `pygaki:refocus`(창 blur → focus, webContents focus)를 부른다.
- **글꼴**: Pretendard 500 하나(고르는 칸 없음. 예전 `font` 설정 값은 읽을 때 버린다). CSS 변수 `--font`(본문)·`--mono`(코드)·`--font-weight`로 화면 전체에 적용한다. Pretendard는 `pretendard` 패키지의 가변 글꼴 `PretendardVariable.woff2`(약 2MB, 한글 11,172자, 굵기 45~930) 하나를 `?url`로 가져와 빌드 때 파일 안에 넣고 `FontFace('Pretendard Variable', …, { weight: '45 930' })`로 등록한다. 처음 켤 때 한 번 등록한다. 라이선스는 `licenses/`. 이 글꼴 때문에 `dist/index.html`이 약 4.7MB가 된다. 사과 스타일 테마도 같은 글꼴을 쓴다.
- (없앰, 세션 77) **그라데이션 테마** (`dark`, 화면 이름 '어둡게'): 두 색 `grads.dark = { a: 바탕 쪽, b: 끝 }`(처음 값 검정→#8b5cf6)에서 `gradColors()`로 바탕 0%, 면 8%, label 배경 30%, 상자 55% 지점의 색을 만든다. 글자색은 각 색 밝기로 검정/흰색(`textOn`), 강조색은 끝 색을 밝게(어두운 바탕)/어둡게(밝은 바탕). 상자·label 배경은 `data-boxfill`/`data-labelfill`과 `--theme-box`·`--theme-label`(+`-text`)로 칠한다. `data-grad`일 때는 상자 색(`.own-color`)을 쓰지 않고 모든 상자가 그라데이션 색이며, 설정의 [상자 색]도 막는다(칠해 둔 값은 남아서 다른 테마에서 보인다). 미니맵도 그라데이션 상자 색.
- (없앰, 세션 77) **텍스트 색** (`textColor`, 기본 null=테마 색): 고르면 `--text`와 `--text-fix`를 그 색으로 하고 `data-textfix`로 상자(`--bt`)·label 제목 글자까지 덮어쓴다(모든 테마).
- (없앰, 세션 77) **직접 고르기**: 바탕·면·상자 색(글자색은 텍스트 색, 강조색은 고르기 직전 테마 것을 이어받음). 상자 색은 `data-boxfill`로 칠하고 label 배경은 label 색.
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
- 파일은 메인 프로세스(`app/main.cjs`)가 다룬다: `info` `list` `stat` `read` `write`(임시 파일에 쓰고 바꿔 끼움) `remove`(`game/ui_kit/effects/*.glsl`과 `game/fonts/**.ttf|otf|ttc`만 지움) `openFolder` `pickFile`(그림·소리·글꼴) `importFile`(images·movies·audio·fonts로) `choose`. 경로는 프로젝트 폴더 기준이고 밖은 막는다. `game/` 폴더를 `fs.watch`로 지켜보고 바뀐 파일 이름을 `pygaki:changed`로 알린다.
- `src/desktop.ts`의 `AppDir`, `AppFile`이 이 기능을 브라우저 폴더 손잡이(`FileSystemDirectoryHandle`)와 같은 모양으로 감싼다. 그래서 `gameFolder.ts`, `files.ts`는 웹과 같은 코드로 돈다. 권한은 늘 `granted`.
- 대본: 프로젝트 폴더 맨 위의 `*.flow.json`을 연다. 여러 개면 처음 열 때 고르게 하고(`src/flowPick.ts`, 상자 수·줄 수·고친 때, 가장 최근 것을 강조), 고른 이름을 `localStorage['pygaki-flow:<프로젝트 경로>']`에 둔다. 왼쪽 칸 [다른 대본 파일]은 이 기억을 지우고 창을 다시 연다. 없으면 `프로젝트이름.flow.json`으로 빈 대본을 만들고, pygaki 플러그인(`game/ui_kit`)이 있으면 `renpyLink`를 켠다. 바뀌면 0.7초 뒤 그 파일에 자동 저장(`saveQuiet`)하고 이어서 자동 내보내기(`autoExport`): `renpyLink`이고 폴더가 연결돼 있으면 받아 적기 → `generateRpy` → 오류가 없고 지난번과 다르면 `pykaki_goto.json`(지금 쓰는 줄 `activeLine`, 없으면 고른 상자의 첫 줄, [게임 줄 따라가기]를 끄면 `null`) → `script_flow.rpy`. 형식은 LINK.md 7-1. 창을 열고 처음 쓸 때(`lastAuto === null`)는 `foreignBoxes`로 원고의 `# @node:` 표시를 보고, 절반 넘게 지금 대본에 없으면 자동은 멈추고(`autoHeld`) Ctrl+E는 물어본다. 처음 덮어쓰기 전 원고는 `script_flow.rpy.bak`(`backupRpy`). 끄기 버튼 상태는 `localStorage['pykaki-follow-line']`. 브라우저 저장소의 `current`는 읽지 않는다. 버전 목록(IndexedDB)은 앱 전체가 같이 쓴다.
- [열기]는 두 대본의 요약을 보여 주고 확인을 받은 뒤 고른 파일의 내용을 이 프로젝트 대본으로 가져오고, [새로]는 이 프로젝트 대본을 비운다. 저장 파일은 바뀌지 않는다.
- 메인 프로세스는 프로젝트 폴더 맨 위도 지켜보고 `*.flow.json`이 바뀌면 `pygaki:changed`로 이름을 알린다. 연 대본 파일이면 0.3초 뒤 `checkExternal`(9-3).
- 위쪽 줄 오른쪽(`Toolbar.tsx` `FolderButtons`): [다시 읽기] [폴더 관리 ▾] [아이콘] [다른 프로젝트]. [폴더 관리]는 Command Palette 꼴 메뉴(`FolderMenu.tsx`, `.fmenu` 모양을 같이 씀): 프로젝트, game, 그림, 영상, 음악·효과음, 음성, 글꼴, UI 그림, 커서, 클릭 대기, 글자 효과, 화면 셰이더, 렌파이 세이브, 앱 설정. 찾기 칸, 화살표·Enter·Esc, 고른 줄의 "쓰는 곳". game 안 폴더가 없으면 "없음, 만들고 열기"(`openFolder(rel, make)`가 game 안만 만듦). 렌파이 세이브(`options.rpy`의 `config.save_directory` → `%APPDATA%/RenPy/이름`)와 앱 설정(userData)은 `placeInfo`·`openPlace`. 연결과 끊기는 없다. 왼쪽 "렌파이 프로젝트 정보" 칸에는 정보만 둔다.
- [▶ 렌파이에서 실행] (`files.ts` `runInRenpy`, `main.cjs` `pygaki:runGame`): 대본을 내보낸 뒤 렌파이로 이 프로젝트를 켠다. 렌파이는 앱 실행 파일의 두 칸 위 폴더(묶음의 `<렌파이 SDK>/pygaki/app`)에서, 없으면 환경 변수 `RENPY_SDK`에서 찾는다. 답은 `started` / `running` / `no-sdk` / `failed`. 설정 `prefs.runSkip`(처음 값 켬)이 켜져 있으면, 게임과 붙어 있거나(실시간 연결) 이 창이 켠 게임이 살아 있을 때 켜지 않고 `running`만 돌려준다. 켠 게임은 앱을 꺼도 그대로 둔다. pygaki 안 플레이는 세션 34에 없앴다(7장).
- `showpy_inbox.json`이 바뀌면 0.3초 뒤 받아 적는다(창으로 돌아올 때도).
- [아이콘] (`src/IconsDialog.tsx`, `src/icons/iconFiles.ts`, 앱에서만, Modal Dialog): 창 아이콘(`game/` + `options.rpy`의 `config.window_icon`이 가리키는 PNG, 없거나 PNG가 아니면 `gui/window_icon.png`로 그 줄을 고치거나 끝에 더함)과 윈도우 exe 아이콘(프로젝트 폴더 `icon.ico`, 렌파이 런처 `change_icon.py`가 exe에 넣음) 두 칸. 원본은 `pickFile('icon')`(PNG·JPEG·WebP·ICO, 복사 안 함, `read`/`readPicked`) 또는 끌어 놓기, [그림 하나로 둘 다]. 요구: 정사각형 256×256 이상(아니면 [투명 여백으로 정사각형 만들기] 켜야 저장), .ico 원본은 exe 칸만이고 256 칸이 있어야 함. 창 PNG는 1024까지 줄임(렌파이가 1024 넘으면 줄임). .ico는 16·24·32·48·64·128·256, 256은 PNG 칸, 나머지는 32비트 BMP 칸(아래에서 위로 BGRA, 높이 두 배, AND 마스크 0). 반씩 줄여 가며 캔버스로 크기 맞춤. 투명한 곳이 없으면(JPEG 등) 경고만. 저장 전 예전 파일·options.rpy는 `ui_kit_backup/icons/이름.날짜.확장자`. 맥 `icon.icns`·안드로이드·iOS·웹 아이콘은 안 함
- [투명 영상 만들기] (`src/MaskVideoDialog.tsx`, `src/maskVideo/convert.ts`, `src/maskVideo/webm.ts`, 앱에서만): 그림/영상 칸(`MediaField`)의 [🎞]과 [그림, 영상] 카드의 [🎞 투명 영상 만들기]가 연다(Modal Dialog). 원본은 `pickMaskSource`(여러 장 고르기, 복사 안 함)·`readPicked` 또는 끌어 놓기: 영상 하나(`<video>`, 1초 장 수는 재생하며 `requestVideoFrameCallback` 간격으로 잼, 프레임 가운데 때로 찾아가 그림), 움직이는 GIF·WebP·PNG 하나(`ImageDecoder`, 프레임 길이 그대로), 그림 여러 장(이름 숫자 순서, 1초 장 수는 고름). 처음·가운데·끝 프레임으로 투명한 곳이 있는지와 가장자리에 고르게 깔린 색(초록 화면)을 보고 방식을 정함. 방식: 원본 투명도 / 색 빼기(뺄 색과 CbCr 거리로 투명도, 세기·가장자리 폭, 뺀 색이 가장 센 채널을 나머지 둘의 큰 값으로 깎아 번짐 걷기). 크기(높이 1080·720·540·360, 짝수), 1초 장 수(영상은 줄일 수 있음). 프레임마다 가로 두 배 캔버스에 왼쪽 색(투명한 곳 둘레로 흐린 색을 먼저 깔아 압축 뒤 검은 테를 줄임), 오른쪽 투명도(흰색 = 보임) → WebCodecs `VideoEncoder` VP9(`vp09.00.10.08`, 2초마다 키 프레임) → `webm.ts`가 EBML로 묶음(SeekHead·Cues 포함) → `game/movies/mask_이름.webm`(있으면 묻고 덮음). 렌파이 `Movie(side_mask=True)`가 바로 틀고, pygaki 플러그인은 `mask_` 이름이면 저절로 투명(stage 자동 등록, 글 상자·선택지는 `ui_kit` 4.16). 결과는 `MaskMovie`로 체크 무늬 위에 돌려 보이고 [이 칸에 넣기]/[보이기 줄 넣기]
- [글꼴] 화면 (`src/FontsView.tsx`, `src/fontsLib.ts`, `src/fontInfo.ts`, 앱에서만, 툴바 맨 끝): 왼쪽 목록(게임 폴더 바로 아래와 `game/fonts/**`의 `.ttf` `.otf` `.ttc`, `media.fonts`) 위에 기본 글꼴 네 줄(대사 `gui.text_font`, 이름 `gui.name_text_font`, 메뉴·버튼 `gui.interface_text_font`, 선택지 `gui.choice_button_text_font`. `readRoles`가 `gui.rpy`의 `define` 줄을 글자로 읽고 `gui.text_font` 같은 식은 "같게"로 따라감), 오른쪽 카드(견본, 들어 있는 글자, 기본 글꼴로, 정보, 쓰인 곳). 
  - 글꼴 파일은 `fontInfo.readFontInfo`가 `name`(이름 16→1, 모양, 라이선스 13·14, 저작권 0. 한국어 → 영어 차례)과 `cmap`(형식 12 → 4)만 읽는다. `.ttc`는 첫 글꼴(렌파이와 같음). `coverage`는 영문·숫자 62자, 한글 11,172자(20% 넘으면 있음, 2,350자 글꼴 때문), 가나, 한자. `missingChars`는 `fontsLib.scriptText`(대사·선택지·물음·캐릭터 이름·화면 글, `{태그}`·`[변수]` 뺌)에서 없는 글자. 견본은 없는 글자를 □로 그린다(`Tofu`. 브라우저는 다른 글꼴로 대신 그려서 있는 것처럼 보이니까). 라이선스 글에 OFL·Apache면 배포 가능, 윈도우 글꼴 문구면 경고(`licenseKind`).
  - 넣기: [+ 글꼴 넣기] → `pickFile('font')`/`importFile(token, 'fonts')`(같은 이름이면 `_2`), 끌어다 놓기는 바이트를 `readFontInfo`로 확인한 뒤 `game/fonts/`에 바로 씀. 넣은 뒤 `scanFolder`.
  - 기본 글꼴로: `setRole` → `writeRole`이 그 `define` 줄의 값만 바꿈(뒤 주석·줄바꿈 꼴·BOM 그대로, 없으면 끝에 더함). 앱을 켠 동안 처음 바꿀 때만 `ui_kit_backup/gui/gui.날짜-시각.rpy` 백업. 뒤에 `scanFolder`(대사 미리보기 글꼴도 바뀜).
  - 쓰인 곳(`fontUses`): 기본 글꼴 자리, 대본 줄(`say.font`, `say.name_font`, 글과 선택지의 `{font=경로}`), 게임 코드(game의 `.rpy`에서 `"경로"`를 찾음. `script_flow.rpy`·`gui.rpy`, `tl` `cache` `saves` 등 폴더, 플러그인 `editor` `engine` 폴더는 뺌). 빼기는 `game/fonts` 안에서 어디에도 안 쓰는 것만: 바이트를 `ui_kit_backup/fonts/`에 쓴 뒤 `remove`(main.cjs가 `game/fonts/**.ttf|otf|ttc`도 허락).
- [GUI 편집] 화면 (`src/ShowpyView.tsx`, `src/showpyLive.ts`): 툴바 [대본 편집 | GUI 편집]로 바꾼다(앱에서만). 대본 화면은 숨기기만 해서 캔버스 상태가 남는다. 메인 프로세스가 `game/showpy_live.json`을 보고 그 포트로 붙어(지켜보기 + 3초마다 다시 시도) 한 줄 JSON을 `pygaki:live`로 넘기고, 화면은 `liveSend`로 명령을 보낸다(`pygaki:liveSend`). 형식은 저장소 맨 위 docs/LINK.md 9장.
  - 줄기표 (`src/ShowpyFlow.tsx`, pygaki 플러그인 screen_fx 5.2): (앱에서는 꺼 둠, `ShowpyView.tsx` `FLOW_IN_APP = false`. 셰이더를 거는 자리를 상자·label로 옮겨서) "셰이더" 칸에서 `state.flow`가 있으면 가운데 위 [줄기표 펴기/접기](`flow` `toggle`). 펴지면 가운데가 원고 | 줄기표. 행을 끌면 `flow` `range`, 누르면 `flow` `pick`과 원고 칸 스크롤(`peek`), 네모 점은 `flow` `point`, 줄기표에서 Delete나 [셰이더 지우기]는 `flow` `delete`(Delete는 상자 캔버스로 안 가게 막음). 게임 서랍과 같은 어두운 바탕.
  - 왼쪽: 고칠 것 목록. 타이틀 메뉴, 게임 내 메뉴(ESC)는 앱 칸이 있고, 나머지는 게임 안 편집기 탭을 패널과 함께 연다. 메뉴 바로 아래 "└ 타이틀 셰이더"(`title_fx`), "└ 게임 내 메뉴 셰이더"(`pause_fx`) (pygaki 플러그인 4.20).
  - 가운데: 지금 화면, 원고 위치, 그 앞뒤 9줄(파일이 바뀌면 다시 읽음). 줄 위의 `# @node:` 표시로 pygaki 상자를 찾아 [상자로] 버튼. [표시 숨기기](`localStorage['pygaki-hide-marks']`)는 `# @l:` `# @node:` `# @end:` 줄을 그리지 않는다(지금 줄은 그림, 줄 번호는 그대로).
  - 오른쪽: 저장(게임의 Ctrl+S), 버리기, 편집기 닫기, 게임 안 패널 보이기. 타이틀 칸은 배경(그림/영상 고르기, `title.background`), 평소/선택됐을 때, 이 항목만/공통, 항목 목록(메뉴 항목 + 제목, 부제), 글 칸, 숫자 칸, 글자 효과. 입력하는 동안은 게임에서 오는 값으로 덮지 않는다.
  - [GUI 편집] 화면에서는 저장 단축키가 게임 저장이다.
- 확인: GitHub Actions "pygaki 앱"(`.github/workflows/app.yml`)이 리눅스에서 진짜 Electron으로 켜서 `app/smoke.cjs`(자동 저장, 내보내기, 받아 적기, 쓴 판 표시, 밖에서 바뀐 대본 다시 읽기, 더 새 판 경고, 대본 파일 고르기, 밖에 쓰기 막기, 가짜 게임으로 pygaki 플러그인 연결)를 돌리고, 윈도우 `pygaki.exe` 폴더(`pygaki-win`)를 만든다. 배포 묶음은 저장소 맨 위 `bundle/`.

## 9-3. 프로젝트 대본 파일과 쓴 판 (`src/files.ts`, `src/version.ts`)

앱은 늘 "프로젝트 대본 파일"(`bound`)을 쓴다. (예전 웹 버전의 폴더 연결과 `kv.flowName` `kv.flowSeen`은 없앴다)

- **파일 이름**: 9-2대로.
- **저장**: 바뀌고 0.7초 뒤 자동으로. [다른 이름]은 프로젝트 대본 파일을 바꾸지 않고 사본만 쓴다.
- **밖에서 바뀜**: 이 창이 마지막으로 읽거나 쓴 글의 지문(`seen`)과 파일이 다르면 다른 곳이 고친 것. 이 창이 최근에 쓴 지문 20개와 쓰는 중에 읽은 것은 빼고 본다. 쓰기 전과, 창으로 돌아올 때, 앱은 파일 바뀜 알림 때 본다. 묻기: [확인] 파일을 다시 읽기(지금 대본은 백업), [취소] 지금 대본을 쓰고 덮어쓰기. 빈 파일, 읽을 수 없는 글(쓰는 중)은 다음에 다시 본다.
- **쓴 판** (`app`): 파일에 쓸 때 `{ by: "pygaki 앱"(개발 서버는 "pygaki 웹"), build: "2026-11-05 dc3ac85", needs }`를 붙인다. `build`는 `vite.config.ts`가 빌드 날짜와 커밋으로 넣는다. `needs`는 `max(파일의 needs, FEATURE)`라서 내려가지 않는다. `FEATURE`(지금 15, 판마다 무엇이 더해졌는지는 `src/version.ts`)는 예전 판이 모르는 줄 종류나 값을 대본에 더할 때만 올린다. 예전 파일은 `app`이 없다(needs 0).
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
| `src/fontsLib.ts`, `src/fontInfo.ts`, `src/FontsView.tsx` | 글꼴 관리(9-2): 글꼴 파일 읽기(name·cmap 표), 기본 글꼴(gui.rpy), 넣기·빼기, [글꼴] 화면 |
| `src/IconsDialog.tsx`, `src/icons/iconFiles.ts` | 아이콘 창(창 아이콘 PNG, exe 아이콘 .ico 만들기) |
| `src/MaskVideoDialog.tsx`, `src/maskVideo/` | 투명 영상 만들기(`convert.ts` 원본 열기·색 빼기·굽기, `webm.ts` webm 묶기, `MaskMovie.tsx` 두 쪽 합친 미리보기) |
| `src/fx/TransitionCanvas.tsx` | 그림 효과(`@transition`)를 WebGL로 그리기: [효과] 화면의 샘플 |
| `src/sample.ts` | 예제/빈 프로젝트, 불러오기 정규화 |
| `src/persist.ts` | IndexedDB |
| `src/files.ts` | 파일 열기/저장/`.rpy` 내보내기, 프로젝트 대본 파일과 밖에서 바뀜(9-3) |
| `src/version.ts` | 쓴 판 표시 (`FEATURE`, `BUILD`) |
| `src/flowPick.ts` | 앱: 대본 파일이 여러 개일 때 고르기 |
| `src/exportRpy.ts` | `.rpy` 변환과 검사 |
| `src/gameFolder.ts` | 렌파이 game 폴더 연결, 목록, 받아 적기 파일 읽기와 쓰기 |
| `src/inbox.ts` | pygaki 플러그인이 남긴 줄을 대본에 넣기 |
| `src/imageCheck.ts` | 그림 이름 검사 (게임에 없는 그림 경고) |
| `src/voice.ts`, `src/VoiceCard.tsx` | 음성 번호, 이름 규칙, [음성] 카드 |
| `src/screens.ts`, `src/ScreensView.tsx` | 화면 만들기 (`FEATURE` 17). `project.screens` `{ id, name, title, bg?, items }`, 항목 `{ id, kind: imagebutton|textbutton|text|image, x, y, image?, hover?, text?, size?, color?, hoverColor?, value? }`. `screensCode` → `game/pykaki_screens.rpy`(`screen 이름():` `modal True`, 배경 `add Solid()`/`add "그림"`, 버튼 `action Return("값")`). 화면이 없으면 예전 파일이 있을 때만 머리말로 비운다(`writeScreensToFolder`, 바뀐 것만). 흐름 `exit` `{ type: 'screen', screen, outs: { id, value, target }[], else }`: `addFixup`의 `syncOuts`가 화면 버튼 값(차례, 겹치면 하나)에 맞춰 outs를 고친다(같은 값은 선 유지). 선 손잡이 `s:id`, `else`. 원고 `call screen 이름` → `if/elif _return == "값": jump`, 그 밖은 next처럼<br>**HUD** (`FEATURE` 18): 화면 `kind: 'hud'`(없으면 전체 화면), `w` `h`(없으면 420×160), `anchor`(`tl` `t` `tr` `l` `c` `r` `bl` `b` `br`, 없으면 `tl`), `dx` `dy`, `bgAlpha`(0~100), `zorder`, `overlay`. 원고는 `modal` 없이 `fixed:` `xysize` `align (0.0~1.0 소수. 렌파이는 정수 1을 1px로 읽음)` `offset`, 그 안에 항목(자리는 HUD 왼쪽 위 기준). `overlay`는 파일 끝 `init python:`에서 `config.overlay_screens`에 더함. 항목 `kind: 'bar'` `{ flag, max?(10), w?, h?, color?, bgColor? }` → `bar` `value AnimatedValue(플래그, max, 0.3)` `left_bar`/`right_bar Solid()` `thumb None`(플래그가 이름이 아니면 안 내보냄). 항목 `cond`(조건식) → `if 조건:` 블록. 버튼 `act`: `return`(없을 때 전체 화면) `Return` / `flag`(HUD 처음 값) `acts` 식마다 `flagAction`: `=` → `SetVariable`, `not 이름` → `ToggleVariable`, 숫자 `+=`·`-=` → `IncrementVariable`, 그 밖 `SetVariable(이름, 이름 + (값))`, 여럿이면 목록 / `jump` `target`(상자 id → `boxRef` `label` 또는 `label.상자`) `Jump` / `toggle` `screen` `ToggleScreen`. 고르지 않았으면 `NullAction()`. HUD의 `return` 버튼은 `NullAction()`과 검사 경고. `screenValues`는 `return` 버튼만. 틀 `addHudTemplate`(inventory, love, map, 플래그도 만들고 글은 화면 언어로. love는 `look` 항목이라 love 플래그의 꼴 그대로, 플래그를 새로 만들 때 꼴 레벨 0~10). 미리 보기 `ScreenArt`(무대와 따라가 보기가 같이 씀, 글 속 `[이름]`은 값으로, 거짓 조건 항목은 흐리게/숨김). 따라가 보기 `Step.huds`(상자의 hud 줄 차례대로, `overlay`는 늘). 플래그 이름 바꾸기(`renameFlag`)가 화면 cond·acts·flag·글 속 `[이름]`도 바꾸고, `screenFlagUses`로 플래그 카드(?·✎)와 설계 표 노란 표시가 화면에서 쓰는 것을 셈. 검사: HUD return 버튼, 갈 상자·열 화면 없음, 바꿀 식 없음·못 읽음, 막대 플래그, 조건의 모르는 이름, 화면 부르기로 HUD를 부름. HUD 버튼이 가는 상자는 닿는 곳으로 침<br>**끌어 놓기** (`FEATURE` 19): 항목 `drag`(text·image만, `isDragged`), 항목 `kind: 'drop'` `{ w?, h?(160×100), text?, size?, color?, bgColor?(칸 색), accept?(끌 수 있는 항목 id, 없으면 아무거나), act·acts·target·screen·value }`(버튼과 같은 할 일, `hasAct`). 원고: 한 화면의 끌기·놓는 곳 항목을 처음 나온 자리에 `draggroup:` 하나로 모음(`itemsCode`), 끌기는 `drag:` `drag_name 항목 id` `pos` `droppable False` `dragged _PkBack(x, y)`(놓으면 `snap`으로 제자리), 놓는 곳은 `draggable False` `dropped _PkDrop(받는 id 또는 None, 동작)` `fixed: xysize, add Solid, text`. `_PkDrop`은 받는 것이 맞으면 `renpy.run(동작)`의 값을 돌려줌(`Return`이면 call screen이 닫힘). 렌파이는 `dragged`를 먼저 부르고 `None`이면 `dropped`. 도움 클래스는 끌어 놓기가 있을 때만 파일 끝 `init -1 python:`. 끄는 것은 화면 칸(draggroup) 안에서만 움직임. 검사: 끌 것이 없는 놓는 곳. 새로 만드는 [+ 놓는 곳]·[끌 수 있음]과 틀 `use`(물건 쓰기)는 `FEATURE` 29에서 뺌(너무 복잡함). 예전 대본의 끌기·놓는 곳은 원고를 그대로 내보내고, [끌 수 있음]은 켜져 있는 항목에만 보임. [+ 막대]도 뺌(예전 막대는 그대로, 새것은 플래그 꼴). **플래그 꼴 항목** (`FEATURE` 21): `kind: 'look'` `{ flag, w?, h? }`, 꼴·꾸미기는 그 플래그의 `ui`(`flagUi`) 그대로. 그림·그림 버튼 칸의 📂(`BrowseBtn`, `pickMediaFile`)는 탐색기에서 골라 game 기준 경로로(밖이면 복사), 무대는 `useMediaPic`(영상도), 원고는 `dispRef`(영상이면 `Movie`). **버튼 상태·나타날 때** (`FEATURE` 29): 버튼 `selected`(조건 → 렌파이 `selected (식)`), `selImage`(그림 버튼 `selected_idle`·`selected_hover`, 글 버튼 `selected_background`·`selected_hover_background`), `selColor`(글 버튼 `text_selected_idle_color`·`hover`). 글 버튼의 `image`·`hover`는 배경 그림(`Frame(그림, 0, 0)`, 있으면 `padding (14, 6)`, 비우면 배경 없이 글자 색만). 항목 `anim`(`fade` `slide` `rise` `pop`, `ANIM_LABEL`)·`sfxIn`·`sfxOut`: 보이는 조건이 있을 때만, 원고는 `if` 대신 `showif` + 항목 첫 줄 뒤 `at _pk_anim_종류(소리, 소리)`, 파일 끝 `ANIM_HELPER`(`_PkSfx`가 `audio` 채널로 틀고, `on appear`는 움직이지 않음). 항목 칸 [종류](글↔그림, 글 버튼↔그림 버튼), [고른 상태] 조건·그림·글자 색, [생길 때·없어질 때]·소리(📂 `pickGameFile('sound')`). HUD 배경 그림은 HUD 크기에 늘여 맞춤(`mediaCode`, 무대도 `.scv-bg.fit`), 📂. 틀: 인벤토리 물건은 `anim: 'pop'`, 미니맵 버튼은 `selected: place == "이름"`·`selColor`. 화면 탭 [+ 플래그 가져오기 ▾](세션 84)는 `PickMenu`로 플래그 이름부터 고름(`flagEntries`: 줄은 종류·꼴, 카드는 꼴이 값을 바꾸며 움직이는 견본과 들어갈 `lookCode` 원고). 항목 칸 [꼴 · 꾸미기 ▾]는 플래그 카드와 같은 `LookPop`을 엶(그 플래그를 쓰는 곳 모두 바뀜). 기본 크기 `LOOK_SIZE`(레벨 240×22, 별 220×30, 스위치 64×32, 체크박스 32×32, 라디오 폭 200·높이 고를 값마다 32, 풀다운 200×40), `lookSize`. 무대는 `FlagWidget`(보기만, 따라가 보기 값). 원고 `lookCode`: 이어진 막대 `frame`(테두리) + `bar value AnimatedValue(이름 - 최솟값, 범위, 0.3)` `left_bar`/`right_bar`, 칸 막대 `frame` + `hbox` `for i in range(칸)` `add (채움 if … else 바탕)`, 별 `hbox` `for` `text "★" font "DejaVuSans.ttf"`(그림이 둘 다 있으면 `add` `fit "contain"`), 스위치 `fixed` 바탕(켜짐/꺼짐) + 손잡이 `xpos`, 체크박스 `fixed` 테두리+상자(체크되면 체크된 상자) + `Text("✓", DejaVuSans)`(마크 그림이면 `fit contain`), 라디오 `vbox` 고를 값마다 `fixed`(링: 그림이 없으면 둥근 색 두 겹, 고르면 선택 점, 글 `xpos 링+8`), 글자 `frame` + `text "[이름]"`. 부품은 그림이면 `Transform(그림, xysize)`, 아니면 `Solid(색, xysize)`. 기본 바탕·테두리 색은 회색 반투명(밝은 앱과 어두운 게임 둘 다 보임). **게임에서 바꾸기** (`FEATURE` 22): 항목 `edit`. 이어진 막대는 `VariableValue("이름", min, max, step=1, force_step=True)`(정수), 칸 막대·별은 칸마다 `button`(배경·여백 없음, `hover_foreground`) `SetVariable(이름, 그 칸까지 찬 값)`(첫 칸이 이미 그 값이면 최솟값), 스위치·체크박스는 `button` `ToggleVariable`, 라디오는 줄마다 `button` `SetVariable`, 글자는 `vbox` + `default _pk_open_항목id` + 머리 `button` `ToggleScreenVariable` + 펼친 목록 `textbutton`(고를 값 `strOptions`에서 빈 글 뺌, `selected`, 올린 줄·고른 줄은 글자 색 바탕) `SetVariable` + 닫기. ▾는 따로 DejaVuSans. 무대 ✋. 검사: 플래그 없음, 바꿀 수 있는 풀다운에 고를 값 없음. **틀 메뉴**: `HUD_TEMPLATES` `HudTpl`(아이콘, 이름, 종류, 설명, 플래그, ✎·?)을 플래그 메뉴와 같은 `PickMenu`(`FlagMenu.tsx`)로, 카드 원고는 `hudTemplateCode`(빈 대본에 그 틀만 넣은 `screensCode`), 영상 `src/hudclips/<틀 id>.webm`<br>**모서리** (`FEATURE` 23): 꼴 `ui.corner`(`square` 각지게, `pill` 알약, 없으면 둥글게). 앱은 `.c-square`/`.c-pill` 클래스, 원고는 색 부품을 `_pk_round(Solid, 반지름)`(파일 끝 `init -1 python:`의 `renpy.register_shader("pygaki.round")`, `u_model_size`로 모서리를 깎음, 둥근 부품이 있을 때만). 반지름: 둥글게 높이/4(8px까지), 알약 높이/2, 스위치는 각지게가 아니면 알약·동그라미. 그림 부품은 그대로. **키보드**: 바꿀 수 있는 꼴은 올리거나 키보드로 고르면 밝게(`hover_foreground`, 막대 `hover_left_bar`/`hover_right_bar`). 렌파이 기본대로 화살표로 고르고 Enter로 누름, 막대는 Enter로 잡고 ←→, 다시 Enter. **스크롤** (`FEATURE` 23): HUD `cw` `ch`(안쪽 크기, `hudInner`가 HUD보다 클 때만) → `viewport:` `xysize (w, h)` `draggable True` `mousewheel`(세로로 넘길 것이 없으면 `"horizontal"`) 안에 `fixed: xysize (cw, ch)`, 맨 뒤에 `button` `NullAction()` `keyboard_focus False`(빈 곳을 눌러도 대사가 안 넘어가게). 무대는 `.scv-scroll`. **게임 안 편집 화면에서 고치기**: 원고 표시 `# @s:` `# @i:`(원고 보기 `only`에는 안 붙임)와 `pykaki_screens.json`(`screensMeta`, `writeScreensToFolder`가 원고와 같이)을 플러그인 [화면] 탭(ui_kit 4.13 `editor_screens.rpy`)이 읽고 고침. 받아 적기 `screen`/`screen_item`은 `applyScreenOp`(LINK.md 3장, 12장)<br>**음성 빛** (`FEATURE` 34, 세션 90): 항목 `kind: 'voice'` `{ w?, h?, voice: { shape?: line·ring·orb, palette?: colorful·ocean·sunset·candy·forest·mono, strength?(0.9), gain?(1.4), idle?(0.1) } }`(`VOICE_DEF`, 기본 크기 `VOICE_SIZE` 아래 띠 700×90·테두리 360×120·둥근 빛 160×160, 모양을 바꾸면 w·h를 지움). 원고 `add _PkVoiceGlow(w, h, 모양 번호, [색 넷], 진하기, 키우기, 쉴 때):` + `pos`, 있으면 파일 끝에 `voiceHelper.ts` `VOICE_HELPER`(`_pk_voice_level`: `renpy.music.get_playing("voice")`·`get_pos("voice")`로 `pykaki_voice_levels.json`의 바이트를 읽음, 표에 없으면 말하는 듯한 흔들림. 셰이더 `pygaki.voice`(GLSL ES 1.00, 8.6이면 `glsl=100`), `_PkVoiceGlow` Displayable은 오를 때 빠르게·내릴 때 천천히(22/6) 따라가고 매 프레임 `renpy.redraw`). 소리 크기 표는 `writeScreensToFolder`가 원고에 `_PkVoiceGlow(`가 있으면 `voiceLevels.ts` `buildLevels`로(대상 `voiceFiles`: `audio/voice/` 모두 + 줄마다 고른 음성, `fileUrl`로 읽어 `OfflineAudioContext.decodeAudioData` → 1/30초 RMS → 가장 큰 값 기준 0.6제곱 0~255 → base64, 크기가 같으면 예전 값, 없어진 파일은 뺌, 바뀐 것이 없으면 안 씀). 형식 LINK.md 13장, 배포판에 들어감. 무대 미리보기 `VoiceGlowPreview.tsx`는 같은 GLSL을 `VOICE_HELPER`에서 잘라 WebGL로(정점 셰이더의 `u_model_size`는 `mediump`로 맞춤, 링크가 안 되면 그리지 않음), 소리는 `fakeLevel`(말하기 2.4초·쉬기 0.8초). 렌파이 8.6.1에서 셋 모두와 큰 소리·조용·중간·끝 값을 봄(세션 90). 게임 안 편집 화면 [화면] 탭에는 자리만 보임(`editor_screens.rpy` "음성 빛") |
| `src/i18n.ts`, `i18n/` | 언어 버튼 (한국어·일본어·영어). 소스 글은 한국어, 화면에 그려진 글 노드와 title·placeholder·aria-label을 `src/i18n/dict.json`(i18n/strings.tsv에서 만듦)으로 바꾼다(MutationObserver, 원문은 WeakMap에 두어 언어를 바꾸면 다시). textarea·pre·`[data-no-tr]`(도움말 창 포함, 도움말은 번역 문서를 따로 읽음)는 안 바꿈. alert/confirm/prompt도. 고른 언어는 localStorage `pygaki-lang` |
| `src/FindPanel.tsx` | 찾기·바꾸기 (Ctrl+F, `showFind`). 대사·내레이션 글, 선택지, 선택지 질문, 상자 제목. 모두 바꾸기는 `update` 한 번 |
| `src/trace.ts`, `src/TracePanel.tsx` | 플래그 따라가 보기 (`showTrace`: '' 대본 시작, 상자 id). 파이썬 일부 식 계산(`evalExpr`, 모르면 `UNKNOWN`), 상자의 flag 줄과 직접 명령 `$ a op b`를 적용, 선택지 조건·고르면, 조건 분기, call 스택. 대본은 안 고친다 |
| `src/flagTable.ts`, `src/FlagDesign.tsx` | 플래그 설계 표 (`showDesign`, 플래그 카드 [설계]). 캔버스 아래쪽 시트(`.fdesign`, 좌우 칸 사이). 가로 = `flowOrder`(시작 상자부터 깊이 먼저, call은 "돌아오면"을 뒤에, 닿지 않는 상자는 label 입구·남은 상자 차례, `unreached`), 세로 = 플래그. 칸 = `boxUses`(flag 줄, 명령 줄 `$`, 선택지 condition·actions, 조건 분기). 닿는 값은 상자 단위 넓게 따라가기(`reach`: 플래그마다 값 모음, 12개 넘으면 'many', return은 그 상자에 닿는 call의 then으로). 검사: 안 씀, 바꾸기만, 보기만, 선택지 조건·갈래가 늘 참/거짓(`condOver`, 값 짝을 모두 넣어 봄, 확실할 때만). 칸 팝오버(`CellPop`)는 `ActionInput`·`CondInput`으로 고치고 더함(update 한 번). 저장 형식은 안 바뀜 |
| `src/flagWiz.ts`, `src/FlagWizard.tsx` | 플래그 설계 마법사(시트 머리 [틀에서 만들기] → 표 오른쪽 칸 `.fwiz`, 시트가 `with-wiz`로 높아짐). Steps 꼴 단계: 틀 → 플래그 → 바꾸는 곳 → 보는 곳 → 확인(단계 번호 하나로 끝남/지금/앞, `aria-current="step"`). 틀은 `WIZ_SHAPES`(빈 플래그 뺀 용례 여섯: 바꾸는 곳 choices/boxes, 보는 곳 branch/conds, 기준 값, 갈래 이름). 화면 상태 `WizState` → `makePlan`(새 플래그, 선택지 actions, 상자 끝 flag 줄, 선택지 condition `andCond`로 이어 붙임, 조건 분기) → `applyPlan`을 update 한 번(실행 취소 한 번). 이름은 같은 이름·종류의 플래그가 있으면 그것을 씀(`nameCheck` 'reuse'), 다른 종류면 막음. 조건 분기로 바꿀 상자는 `canBranch`(next: 그 밖 = 원래 다음, return: 그 밖 비움, if: 갈래를 앞에 더함). 확인 단계는 `planWarnings`(복사본에 넣고 `buildDesign`의 노란 표시). 넘어가지 못하는 까닭은 `stepProblem`. 파일 이름은 `FlagWizard.tsx`와 대소문자만 다르지 않게 `flagWiz.ts`. Esc는 팝오버 → 마법사 → 표 차례. 저장 형식은 안 바뀜 |
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
| `src/LineTypeMenu.tsx`, `src/DoneBubble.tsx` | 줄 종류 고르기(끈적 세 칸, Alt+←), 쓰는 줄 끝의 완료/취소 버블 (`liquid-gooey`) |
| `src/voiceHelper.ts`, `src/voiceLevels.ts`, `src/VoiceGlowPreview.tsx` | 음성 빛: 게임 쪽 코드, 소리 크기 표, 무대 미리보기 |
| `src/FlowDemo.tsx` | 다음 흐름 창의 툴팁과 움직이는 견본 (정답 입력 견본은 세션 93) |
| `src/GooGlass.tsx` | 상자 둘레 세 메뉴(줄 종류 고르기, 태그 상자, 다음 흐름)가 같이 쓰는 유리 끈적 덩어리(`GLASS_GOO`, `--glass-tint`), 상자를 둘러싼 호 배치(`useArc`, 칸마다 `data-arc`), 방울에서 흘러나오는 펼치기(`useReveal`) (세션 93) |
| `src/GooPill.tsx` | 접어 둔 창의 방울 하나: 태그 상자 보라 [↑](Alt+↑ `tagBox`, 세션 102 전에는 [⋯]), 다음 흐름 녹색 [→](Alt+→) (세션 93, 단축키는 세션 94) |
| `src/flags.ts`, `src/FlagFields.tsx`, `src/FlagMenu.tsx`, `src/flagRecipes.ts` | 플래그: 이름 검사, 식 읽기, 쓰인 곳, 플래그 카드, 조건 칸, 바꾸기 칸, 플래그 만들기 메뉴와 용례 |
| `src/BranchTree.tsx` | 조건 분기 칸 (세션 84): 오른쪽 칸 플래그 카드 아래 `BranchCard`. ◇ 조건 분기(켜면 조건 있는 선택지 ◆도)를 보는 플래그 이름 묶음(노랑) → 상자(보라) → 갈래 조건·그 밖(파랑) → 갈 상자(초록) 트리(`role=tree`), 시험 값(`testVars`·`takenBranch`)으로 가는 갈래 ✓·안 가는 갈래 흐리게, 장면 거르기, 상자 이름을 누르면 고르고 캔버스로. 갈 곳 고르는 칸 `TargetSelect`(Inspector)는 맨 위에 "◇ 조건 분기 상자" 묶음(`branchSummary`: 조건 / … / 그 밖) |
| `src/flagUi.ts`, `src/FlagWidget.tsx`, `src/FlagLook.tsx`, `src/FlagJudge.tsx` | 플래그 꼴 (`FEATURE` 20): 기본 꼴·부품·불러오기, 시험 값, 이 값일 때. 레벨 인디케이터·스위치·체크박스·라디오·풀다운 그리기, 플래그 카드 꼴 줄과 꼴 팝오버, 조건 눈금, 판단 인스펙터 |
| `licenses/` | 함께 배포하는 글꼴의 라이선스 |

## 11. 남은 단계

- **2단계 (플래그)**: 세션 50에 함(위 "플래그"). 남은 것: 플래그 값을 pygaki 안에서 따라가 보기(어느 갈래로 가는지 미리 보기)
- **확인됨**: 내보낸 `.rpy`가 렌파이 8.5.3에서 실행된다(로컬 label 포함). 연결 쪽 확인 상태는 [LINK.md](../../docs/LINK.md) 9장.

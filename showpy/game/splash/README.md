# Splash 플러그인 (타이틀 전 로고·경고·조작 방법)

게임을 켰을 때 **타이틀 화면이 나오기 전에** 로고, 경고, 조작 방법 같은 페이지를 순서대로 보여 주는 렌파이 플러그인입니다. 페이지마다 바탕에 색, 이미지, **webm 영상**을 쓸 수 있습니다.

버전 2.3 · 렌파이 8.5.3에서 만들고 테스트했습니다.

- 2.3: 편집기 "스플래시" 탭의 [보이기] 아래에서 **보이는 방식**을 고릅니다: **계속 보임**(켤 때마다), **클릭 시 안 보임**(오른쪽 아래 "다음부터 보지 않기"를 누른 플레이어에게는 다음부터 안 나옴, 페이지의 `"dont_show_again"` 글을 넣음), **한 번만 보임**(처음 켤 때만, `"once": True`). 예전의 "처음 한 번만" 켬/끔 단추는 여기로 옮겼습니다.

- 2.1: 편집기 "스플래시" 탭 맨 위에서 페이지마다 게임 켤 때 [보이기] [안 보이기]를 고릅니다(페이지의 `"show"`). 그 아래에 지금 게임을 켤 때 이 페이지가 나오는지, 안 나오면 까닭을 보여 줍니다. 까닭이 "다음부터 보지 않기"나 "처음 한 번만인데 이미 봄"이면 [다시 보이게]로 그 기록을 지웁니다.

- 2.0: 편집기 "스플래시" 탭의 가운데에 고른 페이지가 그대로 그려집니다. 누르면 고르고 끌면 옮기고(빈 곳을 끌면 묶음 전체), 모서리 손잡이로 크기, 분홍 손잡이로 회전합니다. 글(제목, 본문, 안내, 보지 않기, 조작 방법 표 칸)은 더블클릭이나 Enter로 그 자리에서 고칩니다(Enter 끝, Esc 취소, Shift+Enter 줄바꿈). 페이지를 더하고, 복제하고, 지우고, 순서를 바꿉니다. 저장하면 `splash_layout.rpy`에 바꾼 값(`*_offset`, `*_rotate`, 글은 `_("…")`)과 순서(`splash.page_order`)가 적히고, 설정 파일보다 우선합니다.

- 1.2: `ui_kit` 편집기(개발 모드 Shift+M)에 "스플래시" 탭이 생깁니다(`editor/editor_splash.rpy`). 페이지마다 바탕색, 바탕·로고 그림, 글자 색·글꼴·크기, 위치, 넘어가는 때, 시간을 바꾸고 [이 페이지 보기]로 확인합니다. 저장하면 이 폴더의 `splash_layout.rpy`(`define splash.layout = { "페이지 id": { … } }`)에 바꾼 값만 적히고, 그 값이 `splash_config.rpy`보다 우선합니다. 그 파일을 지우면 설정 파일 값으로 돌아갑니다. PyKaki 앱의 [GUI 편집] 화면에서도 고칠 수 있습니다.
- 1.1: `screen_fx` 3.1의 "장면만" 화면 효과(예: ASCII)가 페이지의 바탕·로고 그림에도 걸립니다. 글자(제목·본문·안내)는 그대로입니다.

- 설정 파일 하나(`splash_config.rpy`)에 페이지를 목록으로 적습니다.
- 페이지는 시간이 지나면 넘어가거나, 클릭할 때까지 기다리거나, **영상이 끝나면** 넘어갑니다.
- "처음 한 번만", "다음부터 보지 않기", 타이틀 메뉴에서 "조작 방법 다시 보기"를 지원합니다.
- `hotkeys`가 있으면 조작 방법 표를 그 설정에서 가져올 수 있고, `screen_fx`가 있으면 VHS 효과 범위가 스플래시를 알아봅니다. 없어도 혼자 동작합니다.

---

## 1. 파일 구성

```
game/splash/
├── splash_config.rpy    설정   ← 여기만 고침
├── engine/
│   └── splash.rpy       엔진 (고치지 않음)
└── README.md            이 설명서 (배포판에는 자동으로 빠짐)
```

---

## 2. 설치

`splash` 폴더를 프로젝트의 `game` 폴더 안에 넣으면 끝입니다. **`script.rpy`, `screens.rpy`는 고치지 않아도 됩니다.** 게임을 켜면 기본 예시 페이지 세 개(만든 사람 이름 → 경고 → 조작 방법)가 나온 뒤 타이틀이 나옵니다.

- 렌파이의 `splashscreen` 레이블을 이 플러그인의 `splash_play` 레이블로 이어 줍니다 (`config.label_overrides`).
- **스크립트에 이미 `label splashscreen:`이 있으면** 그 레이블을 그대로 두고 이어 주지 않습니다. 그 레이블 안 원하는 자리에 `call splash_play` 한 줄을 넣으세요.

  ```renpy
  label splashscreen:
      play sound "audio/boot.ogg"      # 직접 쓰던 연출
      call splash_play                 # 설정 파일의 페이지들
      return
  ```

- 끄려면 `define splash.enabled = False`. 렌파이 기본처럼 바로 타이틀이 나옵니다.

---

## 3. 페이지 만들기

`splash.pages`에 페이지를 `{ … },` 덩어리로 적습니다. 적은 순서대로 나옵니다.

`splash_config.rpy`의 예시에는 **쓸 수 있는 값이 모두** 주석과 함께 적혀 있습니다. 앞에 `#`이 없는 줄은 지금 켜져 있는 값이고(대부분 기본값과 같아서 지워도 그대로), `#`이 있는 줄은 그림·영상·소리 파일이 있어야 하는 값이라 파일을 넣은 뒤 `#`만 지우면 켜집니다. 아래는 그 예시의 페이지 부분입니다.

```renpy
define splash.pages = [

    ## 1. 로고 ──────────────────────────────────────────────────────────────
    {
        "id": "logo",

        ## 바탕
        "color": "#000000",                      # 바탕색
        # "background": "movies/logo.webm",      # 바탕: 색 "#202020" / 그림 "gui/splash/bg.png" /
                                                 #       이미지 이름 "black" / 영상 "movies/bg.webm" (화면 크기로 재생)
        # "background_loop": False,              # 바탕 영상 반복 (기본 True). duration이 "movie"면 자동으로 꺼짐
        # "background_side_mask": False,         # 바탕 영상이 투명(side_mask) 형식이면 True

        ## 가운데 그림·영상 (로고)
        # "image": "gui/splash/logo.png",        # 그림(.png) 또는 영상(.webm). 제목 위에 놓임
        # "image_pos": (640, 200),               # 적으면 제목과 상관없이 그 자리(그림 가운데 기준)에 놓음
        # "image_zoom": 1.0,                     # 확대
        # "image_size": (400, 200),              # 영상 표시 크기 (가로, 세로). 안 적으면 영상 크기 그대로
        # "image_side_mask": True,               # 투명 영상(side_mask 형식)이면 True(기본), 그냥 영상이면 False
        # "image_loop": True,                    # 로고 영상 반복 (기본 True)

        ## 글자
        "title": _("만든 사람 이름"),
        "title_size": 56,                        # 이 페이지만 제목을 크게

        ## 넘어가는 때
        "duration": 2.0,                         # 2초 보여 주고 넘어감. 영상이 끝날 때 넘기려면 "movie"
        "fade_in": 0.6,
        "fade_out": 0.6,

        ## 소리
        # "sound": "audio/logo.ogg",             # 페이지가 나올 때 한 번
        # "music": "audio/title.ogg",            # 음악 채널에서 반복. 다음 페이지·타이틀 음악과 같은 파일이면 끊기지 않음
    },

    ## 2. 경고 ──────────────────────────────────────────────────────────────
    {
        "id": "warning",

        # "background": "movies/noise_loop.webm",   # 경고 글 뒤에서 반복되는 영상
        # "background_loop": True,

        "title": _("경고"),
        "title_color": "#d23c3c",                # 이 페이지만 제목을 빨갛게
        "body": _("이 게임에는 공포 연출과 갑작스러운 소리, 깜빡이는 화면이 포함되어 있습니다.\n빛에 민감하신 분은 플레이에 주의해 주세요."),
        # "body_text_align": 0.0,                # 본문을 왼쪽 정렬로
        "prompt": _("클릭하면 계속합니다"),       # 넘길 수 있게 되면 아래에 깜빡임

        "duration": None,                        # 클릭할 때까지
        "min_time": 1.5,                         # 다 나타난 뒤 1.5초는 클릭해도 안 넘어감 (처음 볼 때만, splash.min_time_once)
        "skippable": True,

        "dont_show_again": _("다음부터 보지 않기"),   # 오른쪽 아래 체크 버튼. 체크하면 다음 실행부터 건너뜀
        "once": False,                           # True면 처음 실행할 때 한 번만
        "show_if": None,                         # 보일 조건. 예: "not persistent.cleared" (엔딩을 본 뒤로는 안 보임)
    },

    ## 3. 조작 방법 ─────────────────────────────────────────────────────────
    {
        "id": "controls",

        "title": _("조작 방법"),

        ## 표: (키, 설명) 목록. "auto"로 적으면 조작방법 화면과 같은 목록
        ## (hotkeys 플러그인이 있으면 hotkeys.keyboard_help, 없으면 렌파이 기본 설명)
        "keys": [
            (_("클릭 / 엔터 / 스페이스"), _("대사 넘기기, 선택하기")),
            (_("마우스 휠 위 / Page Up"), _("이전 대사 다시 보기")),
            (_("오른쪽 클릭 / Esc"), _("메뉴 열기 (저장, 불러오기, 환경설정)")),
            (_("Ctrl (누르고 있기)"), _("대사 빨리 넘기기")),
            ("H", _("대사창 숨기기")),
        ],
        # "keys": "auto",

        "key_width": 300,                        # 키 칸 폭
        "key_color": "#ffffff",
        "desc_color": "#bbbbbb",

        "prompt": _("클릭하면 타이틀로 넘어갑니다"),
        "once": True,                            # 처음 실행할 때 한 번만 (타이틀에서는 splash.ShowPage("controls")로 다시 보기)

        "xalign": 0.5,
        "yalign": 0.45,                          # 줄이 많아 아래 안내와 겹치면 줄이기
        "width": 960,
    },
]
```

모든 페이지에 공통으로 쓰는 값(`splash.default`)의 전체 목록도 설정 파일에 같은 방식으로 적혀 있습니다.

### 3-1. 페이지에 쓰는 값

적지 않은 값은 `splash.default`, 거기에도 없으면 아래 기본값을 따릅니다.

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `"id"` | (꼭 적기) | 페이지 이름. 한 번 본 기록, 다시 보기, 오류 메시지에 씀 |
| `"color"` | `"#000000"` | 바탕색. `background`가 있으면 그 아래 깔림 |
| `"background"` | 없음 | 바탕. 색 `"#202020"`, 이미지 `"gui/splash/bg.png"`, 이미지 이름 `"black"`, 영상 `"movies/bg.webm"` |
| `"background_loop"` | `True` | 배경 영상 반복 (`"duration": "movie"`면 자동으로 끔) |
| `"background_side_mask"` | `False` | 배경 영상이 투명(side_mask) 형식일 때 `True` |
| `"image"` | 없음 | 가운데 그림이나 영상 (로고 등). 글자 위에 놓임 |
| `"image_pos"` | 없음 | `(x, y)`로 적으면 글자와 상관없이 그 자리(가운데 기준)에 놓음 |
| `"image_zoom"` | `1.0` | 그림 확대 |
| `"image_size"` | 없음 | 영상 표시 크기 `(가로, 세로)` |
| `"image_side_mask"` | `True` | 그림 자리 영상이 side_mask 형식인지. 투명하지 않은 영상이면 `False` |
| `"image_loop"` | `True` | 그림 자리 영상 반복 |
| `"title"` | 없음 | 제목 |
| `"body"` | 없음 | 본문. `\n`으로 줄바꿈 |
| `"keys"` | 없음 | 조작 방법 표 `[ (키, 설명), … ]`. `"auto"`면 조작방법 화면과 같은 목록 (7장) |
| `"prompt"` | 없음 | 넘길 수 있게 되면 아래에 깜빡이는 안내 |
| `"dont_show_again"` | 없음 | 적으면 오른쪽 아래에 체크 버튼. 체크하면 다음부터 이 페이지를 건너뜀 |
| `"duration"` | `None` | 숫자: 다 나타난 뒤 그 초만큼 보여 주고 넘어감 · `None`: 클릭할 때까지 · `"movie"`: 영상이 끝날 때까지 |
| `"min_time"` | `0.5` | 다 나타난 뒤 이 시간이 지나야 클릭으로 넘어감 (실수로 넘기지 않게) |
| `"skippable"` | `True` | `False`면 클릭으로 못 넘김. 이때는 `duration`을 꼭 적기 |
| `"fade_in"`, `"fade_out"` | `0.6`, `0.6` | 나타나고 사라지는 시간(초). 페이지 사이는 검은 화면을 거침 |
| `"show"` | `True` | `False`면 이 페이지를 건너뜀 (편집기의 [보이기] [안 보이기], 2.1) |
| `"once"` | `False` | `True`면 처음 한 번만 |
| `"show_if"` | 없음 | 보일 조건. 예: `"not persistent.cleared"` |
| `"sound"` | 없음 | 페이지가 나올 때 한 번 재생하는 효과음 |
| `"music"` | 없음 | 음악 채널로 반복 재생. 다음 페이지에서 같은 파일이면 끊기지 않음 (4장) |
| `"xalign"`, `"yalign"` | `0.5`, `0.45` | 그림·제목·본문·표 묶음의 위치 |
| `"image_offset"`, `"title_offset"`, `"body_offset"`, `"keys_offset"` | `(0, 0)` | 묶음 안 자리에서 그만큼 비켜 그림 (x, y 픽셀). 편집기에서 끌면 적힘 (2.0) |
| `"image_rotate"`, `"title_rotate"`, `"body_rotate"`, `"keys_rotate"`, `"prompt_rotate"` | `0` | 돌린 각도(도). 자기 가운데를 축으로 (2.0) |
| `"width"` | `960` | 묶음의 최대 폭 (글자가 이 폭에서 줄바꿈) |
| `"spacing"` | `28` | 그림·제목·본문·표 사이 간격 |
| `"key_width"`, `"key_gap"`, `"keys_spacing"` | `300`, `32`, `12` | 조작 방법 표의 키 칸 폭, 키와 설명 사이, 줄 사이 |

### 3-2. 글자 모양

글자마다 앞말을 붙여 렌파이 글자 스타일 속성을 그대로 씁니다. (`font`, `size`, `color`, `outlines`, `kerning`, `bold`, `italic`, `line_spacing`, `text_align`, `xalign` …)

| 앞말 | 대상 | 기본 모양 |
|---|---|---|
| `title_` | 제목 | 44, 흰색, 가운데 |
| `body_` | 본문 | 24, 밝은 회색, 가운데 정렬 |
| `key_` | 조작 방법의 키 | 22, 흰색, 오른쪽 정렬 |
| `desc_` | 키 설명 | 22, 회색 |
| `prompt_` | "클릭하면 계속" 안내 | 20, 반투명 흰색, 화면 아래 (`prompt_yalign` 0.95) |
| `option_` | "다음부터 보지 않기" 버튼 | 18, 오른쪽 아래 (`option_xalign` 0.96, `option_yalign` 0.95). 체크 상자 색은 `option_color`를 따름 |

```renpy
"title_font": "fonts/ChosunGu.TTF",
"title_size": 56,
"title_outlines": [ (3, "#000000", 0, 0) ],
"body_text_align": 0.0,          # 본문 왼쪽 정렬
"body_xalign": 0.0,
"prompt_yalign": 0.9,
```

모든 페이지에 공통으로 쓸 값은 `splash.default`에 같은 이름으로 적습니다.

### 3-3. 전체 설정

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `splash.enabled` | `True` | 끄면 바로 타이틀 |
| `splash.developer_skip` | `False` | `True`면 개발 모드(런처에서 실행)에서는 건너뜀 |
| `splash.default` | (설정 파일) | 모든 페이지에 공통으로 쓰는 값 |
| `splash.start_delay` | `0.3` | 게임을 켜고 첫 페이지 전 검은 화면(초) |
| `splash.gap` | `0.3` | 페이지 사이 검은 화면(초) |
| `splash.end_transition` | `Dissolve(0.6)` | 마지막 페이지 뒤 타이틀이 나타나는 전환. `options.rpy` 등에서 `config.end_splash_transition`을 정했으면 그쪽이 우선 |
| `splash.min_time_once` | `True` | `min_time`은 그 페이지를 처음 볼 때만 (두 번째부터는 다 나타나자마자 넘길 수 있음) |
| `splash.music_fadeout` | `1.0` | 페이지에서 튼 음악이 타이틀 음악과 다를 때 서서히 끄는 시간(초) |
| `splash.movie_wait` | `5.0` | 영상이 이 시간(초) 안에 시작되지 않으면(코덱 문제 등) 멈춰 있지 않고 다음 페이지로 |
| `splash.page_order` | 없음 | 편집기가 `splash_layout.rpy`에 적는 페이지 순서. 있으면 그 순서로 보여 주고, 여기 없는 `splash.pages`의 페이지는 보여 주지 않음(`splash.ShowPage`로는 보임). 편집기에서 새로 만든 페이지는 값이 `splash.layout`에만 있음 (2.0) |

---

## 4. 영상과 소리

- **배경 영상**(`"background"`)은 화면 크기에 맞춰 늘려 재생합니다. 게임 해상도(예: 1280×720)로 만드세요. 형식은 **WebM(VP9)** 권장.
- **로고 영상**(`"image"`)은 가운데에 놓입니다. 투명하게 하려면 side_mask 형식(왼쪽 절반 색, 오른쪽 절반 투명도, 파일 가로 = 표시 가로 × 2)으로 만드세요. 만드는 법은 `ui_kit/README.md`의 "영상 준비"에 있습니다. 투명하지 않은 영상이면 `"image_side_mask": False`.
- **영상이 끝나면 넘어가기**: `"duration": "movie"`. 그림 자리(`image`) 영상이 있으면 그 영상을, 없으면 배경 영상을 기다립니다. 그 영상은 반복하지 않습니다. 영상이 끝나면 바로 사라지기 시작하고, 사라지는 동안에는 `color` 색이 보이니 영상 끝을 바탕색으로 처리하면 자연스럽습니다.
- 영상이 5초 안에 시작되지 않으면(코덱 문제 등) 멈춰 있지 않고 다음 페이지로 넘어갑니다.
- 영상에 소리가 들어 있으면 같이 나옵니다 (환경설정의 음악 음량을 따름).
- `"music"`은 음악 채널에서 반복 재생합니다. 다음 페이지에 같은 파일을 적으면 이어지고, 마지막 페이지 뒤에는
  - `config.main_menu_music`과 같은 파일이면 타이틀까지 끊기지 않고 이어지고,
  - 다르면 `splash.music_fadeout`초 동안 서서히 꺼진 뒤 타이틀이 나옵니다.

---

## 5. 한 번만, 다음부터 보지 않기, 다시 보기

| 하고 싶은 일 | 방법 |
|---|---|
| 처음 실행할 때만 보여 주기 | 페이지에 `"once": True` |
| 플레이어가 끌 수 있게 | 페이지에 `"dont_show_again": _("다음부터 보지 않기")` |
| 타이틀 메뉴에 "조작 방법" 항목 | `title_menu_config.rpy`의 `tmenu.items`에 `"action": splash.ShowPage("controls")` |
| 아무 버튼에서 페이지 하나 보기 | `textbutton _("조작 방법") action splash.ShowPage("controls")` |
| 본 기록·보지 않기를 지우는 버튼 | `textbutton _("처음 안내 다시 보기") action splash.Reset()` (환경설정 화면 등) |
| 페이지 하나를 아예 빼기 | 페이지에 `"show": False`, 또는 편집기 스플래시 탭의 [안 보이기] |
| 페이지 하나의 기록만 지우기 | `splash.show_again("controls")`, 또는 편집기 스플래시 탭의 [다시 보이게] |

**페이지가 안 나올 때**: 편집기(Shift+M) 스플래시 탭에서 그 페이지를 고르면 "지금은 안 나옴: …"으로 까닭이 나옵니다. 예시의 조작 방법 페이지는 `"once": True`라 한 번 본 뒤로는 안 나옵니다.

- `ShowPage`로 연 페이지는 지금 화면 위에 나타났다가, 클릭하면 원래 화면으로 돌아옵니다. `once`, `dont_show_again`, `min_time`과 상관없이 보여 주고, 효과음은 나지만 음악은 바꾸지 않습니다.
- 기록은 `persistent.splash_seen`(본 페이지), `persistent.splash_hidden`(보지 않기)에 남습니다. 세이브 파일과 상관없이 컴퓨터에 남고, 런처의 "지속 데이터 삭제하기"로도 지워집니다.

---

## 6. 고친 뒤 확인하기

스플래시는 **게임을 처음 켤 때만** 나옵니다. Shift+R로 다시 불러오면 나오지 않습니다.

- 게임을 껐다가 런처에서 다시 실행하거나,
- 개발 모드에서 콘솔(Shift+O)을 열고 `splash.preview()`를 입력합니다. 꺼 둔 페이지, 이미 본 페이지까지 모두 처음부터 보여 주고, 본 기록은 남기지 않습니다.
- 다 고쳤으면 런처에서 **Lint**를 실행합니다. 파일이 없거나, 파일 이름 대소문자가 다르거나(윈도우에서는 열려도 맥·안드로이드·웹에서는 안 열림), 이름을 잘못 적은 값을 `splash:`로 시작하는 줄로 알려줍니다. 같은 문제가 있으면 게임을 켤 때도 오류 화면으로 알려줍니다.
- 게임을 자주 켜 보는 동안 스플래시가 번거로우면 `splash.developer_skip = True`. 배포판에서는 항상 나옵니다.

---

## 7. 다른 플러그인과 같이 쓰기

| 플러그인 | 같이 쓰면 |
|---|---|
| `hotkeys` | `"keys": "auto"`면 `hotkeys.keyboard_help`(조작방법 화면 설명)를 그대로 보여 줌. `hotkeys`가 없거나 그 값이 `None`이면 렌파이 기본 설명 |
| `screen_fx` (2.1 이상) | VHS 범위에서 스플래시는 타이틀 쪽. `vhs_crt.scope = "game"`이면 스플래시에 효과 없음, `"main_menu"`나 `"all"`이면 있음. 타이틀 일렁임은 타이틀 화면에서만이라 스플래시에는 없음 |
| `ui_kit` | 타이틀 메뉴 항목에 `splash.ShowPage("controls")`. 커서 애니메이션은 스플래시에서도 그대로 |

---

## 8. 값이 적용되는 순서

같은 값이 여러 곳에 있으면 오른쪽으로 갈수록 이깁니다.

엔진 기본값 → `splash.default` → 페이지에 적은 값 → 편집기가 저장한 값(`splash_layout.rpy`)

`splash_layout.rpy`에 적힌 글은 `_("…")` 모양이라 번역 만들기에 그대로 잡힙니다. 이미 만든 번역(`game/tl`)은 원문이 바뀌면 다시 만들어야 합니다(렌파이 원래 동작).

---

## 9. 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 스플래시가 안 나옴 | `splash.enabled`, `developer_skip`, Shift+R로 다시 불러온 것은 아닌지 (껐다 켜기), 모든 페이지가 `once`·보지 않기로 빠진 것은 아닌지 (`splash.preview()`로 확인) |
| `… is defined twice, at game/splash/… and game/(다른 폴더)/…` 오류 | `splash` 폴더가 두 벌 들어 있음. 오류에 나온 예전 폴더를 `.rpyc`까지 지우기 |
| 내가 쓴 `splashscreen` 레이블만 나옴 | 그 레이블 안에 `call splash_play`를 넣기 (2장) |
| 영상이 안 나오거나 검게 나옴 | 경로, VP9 코덱, 투명 영상이면 side_mask 형식인지와 `*_side_mask` 값 |
| 글자가 네모로 나옴 | 글꼴에 그 글자가 없음. 렌파이 새 프로젝트의 한글 글꼴에는 가운뎃점(·)이 없으니 `/`나 `,`를 쓰기 |
| 조작 방법 표가 안내 글자와 겹침 | 줄이 많으면 `"yalign"`을 줄이거나 `"key_size"`, `"keys_spacing"`을 줄이기 |
| 클릭해도 안 넘어감 | `min_time`이 지났는지, `"skippable": False`인지 |
| 타이틀 음악이 끊김 | 스플래시 `"music"`과 `config.main_menu_music`을 같은 파일로 |
| 다른 컴퓨터에서만 파일을 못 찾음 | 파일 이름 대소문자. Lint가 알려줌 |

---

## 10. 제거

`game/splash` 폴더를 **`.rpyc` 파일까지 포함해** 통째로 지우면 렌파이 기본(바로 타이틀)으로 돌아갑니다. 스크립트에서 `call splash_play`, `splash.ShowPage(…)`를 썼다면 그 줄도 지우세요.

MIT 라이선스입니다. 저장소의 `LICENSE`, `THIRD_PARTY.md`를 보세요.

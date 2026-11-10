################################################################################
## Splash — 설정
##
## 게임을 켰을 때 타이틀 화면 전에 나오는 페이지(로고, 경고, 조작 방법)를 정합니다.
## 이 파일만 고치면 됩니다.
##
## 아래 예시에는 쓸 수 있는 값이 모두 적혀 있습니다.
##   - 앞에 #이 없는 줄: 지금 켜져 있는 값 (대부분 기본값과 같아서 지워도 그대로입니다)
##   - 앞에 #이 있는 줄: 그림·영상·소리 파일이 있어야 하는 값. 파일을 game 폴더에 넣고 #을 지우면 켜집니다.
##
## 규칙 세 가지만 기억하세요.
##   1. 페이지는 splash.pages에 적은 순서대로 나옵니다.
##   2. 페이지에 적지 않은 값은 아래 splash.default 값을 따릅니다.
##   3. 글자 모양은 앞말 + 렌파이 글자 스타일 속성으로 적습니다.
##      title_ 제목 / body_ 본문 / key_ 조작 방법의 키 / desc_ 키 설명 /
##      prompt_ "클릭하면 계속" 안내 / option_ "다음부터 보지 않기" 버튼
##      스타일 속성: font, size, color, outlines, kerning, bold, italic, line_spacing,
##                   text_align(줄 정렬), xalign(묶음 안 위치) 등 렌파이 글자 스타일 전부
##
## 스플래시는 게임을 처음 켤 때만 나옵니다. Shift+R로 다시 불러오면 나오지 않으니,
## 고친 뒤에는 게임을 껐다 켜거나 콘솔(Shift+O)에서 splash.preview()로 확인하세요.
## 다 고치면 런처에서 Lint를 실행하세요. 틀린 이름·없는 파일을 "splash:"로 시작하는 줄로 알려줍니다.
##
## 편집기(개발 모드 Shift+M → "스플래시" 탭)에서 화면을 보며 끌고, 돌리고, 글을 고치고, 페이지를
## 더하거나 순서를 바꿀 수 있습니다. 편집기로 고친 값은 splash/splash_layout.rpy에 있고 그쪽이 이깁니다.
################################################################################

init offset = 1


## ── 이 기능을 쓸지 ───────────────────────────────────────────────────────────

## False면 렌파이 기본과 같이 바로 타이틀 화면이 나옵니다.
define splash.enabled = True

## True면 개발 모드(런처에서 실행)에서는 건너뜁니다. 게임을 자주 켜 볼 때 편해요.
## 배포판에서는 이 값과 상관없이 항상 나옵니다.
define splash.developer_skip = False


## ── 모든 페이지에 공통으로 쓰는 기본값 ────────────────────────────────────────
## 페이지에 같은 이름을 적으면 그 페이지만 바뀝니다.
## 아래 숫자는 모두 엔진 기본값입니다.

define splash.default = {

    ## 바탕과 시간
    "color": "#000000",              # 페이지 바탕색 (background가 있으면 그 아래에 깔림)
    "fade_in": 0.6,                  # 나타나는 시간(초)
    "fade_out": 0.6,                 # 사라지는 시간(초). 페이지 사이는 검은 화면을 거침

    ## 넘어가는 때
    "duration": None,                # 숫자 = 다 나타난 뒤 그 초만큼 보여 주고 넘어감
                                     # None = 클릭할 때까지 / "movie" = 영상이 끝날 때까지
    "min_time": 0.5,                 # 다 나타난 뒤 이 시간(초)이 지나야 클릭으로 넘어감
    "skippable": True,               # False면 클릭으로 못 넘김 (그때는 duration을 꼭 적기)

    ## 그림·제목·본문·조작 방법 표를 묶은 덩어리의 위치
    "xalign": 0.5,                   # 가로 위치 (0.0 왼쪽 ~ 1.0 오른쪽)
    "yalign": 0.45,                  # 세로 위치 (0.0 위 ~ 1.0 아래)
    "width": 960,                    # 최대 폭(픽셀). 글자가 이 폭에서 줄바꿈
    "spacing": 28,                   # 그림·제목·본문·표 사이 간격(픽셀)

    ## 조작 방법 표
    "key_width": 300,                # 키 칸의 폭(픽셀)
    "key_gap": 32,                   # 키와 설명 사이(픽셀)
    "keys_spacing": 12,              # 줄 사이(픽셀)
    "keys_xalign": 0.5,              # 표 전체의 가로 위치 (묶음 안에서)

    ## 제목 글자
    "title_font": gui.interface_text_font,
    "title_size": 44,
    "title_color": "#ffffff",
    "title_xalign": 0.5,             # 묶음 안에서 가운데
    "title_text_align": 0.5,         # 여러 줄일 때 줄 정렬 (0.0 왼쪽, 0.5 가운데, 1.0 오른쪽)
    # "title_outlines": [ (3, "#000000", 0, 0) ],   # 외곽선 (두께, 색, x, y)

    ## 본문 글자
    "body_font": gui.text_font,
    "body_size": 24,
    "body_color": "#d8d8d8",
    "body_xalign": 0.5,
    "body_text_align": 0.5,
    "body_line_spacing": 6,          # 줄 간격(픽셀)

    ## 조작 방법의 키 글자
    "key_font": gui.text_font,
    "key_size": 22,
    "key_color": "#ffffff",
    "key_text_align": 1.0,           # 키 칸 안에서 오른쪽 정렬

    ## 조작 방법의 설명 글자
    "desc_font": gui.text_font,
    "desc_size": 22,
    "desc_color": "#bbbbbb",

    ## "클릭하면 계속합니다" 안내 (넘길 수 있게 되면 화면 아래에서 깜빡임)
    "prompt_font": gui.text_font,
    "prompt_size": 20,
    "prompt_color": "#ffffffaa",
    "prompt_xalign": 0.5,            # 화면 기준 위치
    "prompt_yalign": 0.95,

    ## "다음부터 보지 않기" 버튼 (체크 상자 색은 option_color를 따름)
    "option_font": gui.text_font,
    "option_size": 18,
    "option_color": "#ffffffaa",
    "option_hover_color": "#ffffff", # 마우스를 올렸을 때
    "option_xalign": 0.96,           # 화면 기준 위치 (오른쪽 아래)
    "option_yalign": 0.95,
}


## ── 페이지 ───────────────────────────────────────────────────────────────────
## "id"는 꼭 적고 페이지마다 다르게 (한 번 본 기록, 다시 보기, 오류 메시지에 씀).

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
        "show": True,                            # False면 이 페이지를 건너뜀 (편집기 스플래시 탭의 [보이기 / 안 보이기], 2.1)
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


## ── 페이지 사이와 끝 ─────────────────────────────────────────────────────────

## 게임을 켜고 첫 페이지가 나오기 전 검은 화면(초)
define splash.start_delay = 0.3

## 페이지와 페이지 사이 검은 화면(초)
define splash.gap = 0.3

## 마지막 페이지 뒤 타이틀 화면이 나타나는 전환 (None이면 바로)
## options.rpy 등에서 config.end_splash_transition을 정했으면 그쪽이 우선합니다.
define splash.end_transition = Dissolve(0.6)

## True면 min_time은 그 페이지를 처음 볼 때만 적용 (두 번째부터는 다 나타나자마자 넘길 수 있음)
define splash.min_time_once = True

## 페이지에서 튼 음악이 타이틀 음악(config.main_menu_music)과 다를 때 서서히 끄는 시간(초)
define splash.music_fadeout = 1.0

## 영상이 이 시간(초) 안에 시작되지 않으면(코덱 문제 등) 멈춰 있지 않고 다음 페이지로
define splash.movie_wait = 5.0


## ── 다른 곳에서 쓰는 것 (참고) ───────────────────────────────────────────────
## 이 파일에 적는 값이 아니라, 다른 파일에서 쓰는 이름입니다.
##
##   splash.ShowPage("controls")   페이지 하나를 지금 화면 위에 보여 주는 동작
##                                  타이틀 메뉴 항목:  "action": splash.ShowPage("controls")
##                                  버튼:  textbutton _("조작 방법") action splash.ShowPage("controls")
##   splash.Reset()                한 번 본 기록과 "다음부터 보지 않기"를 지우는 동작 (환경설정 화면 버튼 등)
##   splash.preview()              개발 중에 처음부터 다시 보기. 콘솔(Shift+O)에 입력
##   call splash_play              스크립트에 직접 쓴 label splashscreen: 이 있을 때, 그 안에서 페이지들을 보여 줌

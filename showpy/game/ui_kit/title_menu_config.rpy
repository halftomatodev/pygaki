################################################################################
## UI Kit — 타이틀 메뉴 설정
##
## 이 파일만 고치면 됩니다. 저장 후 게임 실행 중 Shift+R을 누르면 바로 반영돼요.
## 설정 이름 전체 목록과 설명은 README.md를 보세요.
##
## 규칙 두 가지만 기억하세요.
##   1. 항목에 적지 않은 값은 아래 tmenu.default 값을 따릅니다.
##   2. 이름 앞에 hover_를 붙이면 "선택됐을 때" 값입니다.
##      예: "color" = 평소 색, "hover_color" = 선택됐을 때 색
##
## 편집기(개발 모드에서 Shift+M)로 위치를 잡고 저장하면
## title_menu_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 렌파이 기본 screens.rpy보다 늦게 실행되어 아래 스타일이 항상 적용되도록 합니다.
init offset = 1


## ── 이 기능을 쓸지 ───────────────────────────────────────────────────────────
## False면 렌파이 기본 타이틀 화면·게임 메뉴 목록과 똑같아집니다.
## (아래에 적은 style 문은 켜고 끄는 것과 상관없이 적용됩니다)

define tmenu.enabled = True


## ── 모든 항목에 공통으로 쓰는 기본값 ──────────────────────────────────────────
## 글자 스타일 속성은 렌파이 텍스트 스타일 속성을 그대로 씁니다.
## (font, size, color, outlines, kerning, bold, italic, strikethrough ...)

define tmenu.default = {
    "font": gui.interface_text_font,
    "size": 36,
    "color": gui.idle_color,
    "hover_color": gui.hover_color,
    "outlines": [ (2, "#00000099", 0, 0) ],
}


## ── 메뉴 항목 ────────────────────────────────────────────────────────────────
## 목록 순서 = 키보드로 이동하는 순서 = 밀려나는 방향의 기준입니다.
##
## 위치는 둘 중 하나로 적어요.
##   "xalign": 0.5, "yalign": 0.53   화면 비율 (0.0 ~ 1.0)
##   "x": 640, "y": 380              픽셀 (앵커 기준점, 기본은 글자 가운데)
##
## 자주 쓰는 값
##   "rotate": -5          회전 (도, 시계 방향)
##   "skew": 10            기울기 (도, 양수면 윗부분이 오른쪽으로)
##   "zoom": 1.2           확대
##   "hover_offset": (20, 0)   선택됐을 때 이동 (픽셀)
##   "hover_text": "START"      선택됐을 때 글자 교체
##   "hover_movie": "movies/menu_start.webm"         선택됐을 때 뒤에 깔리는 영상
##   "hover_label_movie": "movies/start_label.webm"  선택됐을 때 글자 대신 나오는 영상

define tmenu.items = [
    {
        "id": "start",
        "text": _("시작하기"),
        "action": Start(),
        "xalign": 0.06, "yalign": 0.42,
        "rotate": -4,
        "hover_zoom": 1.15,
        "hover_offset": (10, 0),
    },
    {
        "id": "load",
        "text": _("불러오기"),
        "action": ShowMenu("load"),
        "xalign": 0.07, "yalign": 0.52,
        "rotate": -2,
        "hover_zoom": 1.15,
        "hover_offset": (10, 0),
    },
    {
        "id": "prefs",
        "text": _("환경설정"),
        "action": ShowMenu("preferences"),
        "xalign": 0.08, "yalign": 0.62,
        "rotate": 0,
        "hover_zoom": 1.15,
        "hover_offset": (10, 0),
    },
    {
        "id": "about",
        "text": _("버전정보"),
        "action": ShowMenu("about"),
        "xalign": 0.09, "yalign": 0.71,
        "rotate": 2,
        "size": 28,
        "hover_zoom": 1.15,
        "hover_offset": (10, 0),
    },
    {
        "id": "quit",
        "text": _("종료하기"),
        "action": Quit(confirm=False),
        "xalign": 0.10, "yalign": 0.78,
        "rotate": 4,
        "size": 24,
        "hover_zoom": 1.15,
        "hover_offset": (10, 0),
    },
]


## ── 선택이 바뀔 때의 움직임 ──────────────────────────────────────────────────

## 선택한 항목보다 목록 앞쪽 항목이 밀리는 방향·거리 (x, y 픽셀)
define tmenu.push_before = (0, -10)

## 선택한 항목보다 목록 뒤쪽 항목이 밀리는 방향·거리
define tmenu.push_after = (0, 10)

## 한 칸 멀어질 때마다 밀리는 정도에 곱하는 값 (1.0 = 모두 같은 거리)
define tmenu.push_falloff = 0.6

## 움직이는 시간(초)과 속도 곡선
## 곡선 예: "ease", "easein", "easeout", "linear", "easeout_back"(살짝 튕김)
define tmenu.move_time = 0.25
define tmenu.move_warper = "easeout"

## 평소 글자 ↔ 선택 글자가 바뀌는 페이드 시간(초)
define tmenu.fade_time = 0.12


## ── 등장 연출 ────────────────────────────────────────────────────────────────

define tmenu.intro = True
define tmenu.intro_delay = 0.06      # 항목마다 늦게 나오는 간격(초)
define tmenu.intro_time = 0.35       # 나타나는 데 걸리는 시간(초)
define tmenu.intro_offset = (-30, 0) # 어디서부터 미끄러져 들어올지 (픽셀)


## ── 배경 영상 ────────────────────────────────────────────────────────────────
## 쓰려면 경로를 적으세요. 비워두면(None) gui.rpy의 gui.main_menu_background를 그대로 씁니다.
## 예: define tmenu.background_movie = "movies/title_bg.webm"

define tmenu.background_movie = None


## ── 소리 (선택 사항) ─────────────────────────────────────────────────────────
## 예: define tmenu.hover_sound = "audio/menu_move.ogg"

define tmenu.hover_sound = None
define tmenu.activate_sound = None


## ── 타이틀 화면의 게임 제목 ──────────────────────────────────────────────────
## 제목 글자는 gui.rpy의 gui.show_name, config.name을 따릅니다.

## 제목 아래 버전 번호 표시
define tmenu.show_version = True

## 렌파이 기본 GUI의 메뉴 뒤 반투명 판(gui/overlay/main_menu.png) 표시
define tmenu.main_menu_frame = True

## 제목 위치·색을 바꾸려면 렌파이 스타일 문법으로 적으세요. 적은 속성만 바뀝니다.
## style main_menu_vbox:
##     xalign 0.45
##     yalign 0.42
##
## style main_menu_title:
##     color "#ffffff"


## ── 게임 중 ESC 메뉴 (일시정지 메뉴) ─────────────────────────── (UI Kit 3.1) ──
## 게임 중에 ESC나 오른쪽 클릭을 누르면 나오는 메뉴를 타이틀 메뉴와 같은 모양으로 그립니다.
## 글꼴, 크기, 색, 선택됐을 때 모양(tmenu.default), 등장 연출, 소리는 타이틀 메뉴 설정을 같이 씁니다.
## 항목 자리는 편집기에서 따로 옮길 수 있습니다: ESC 메뉴를 연 채로 Shift+M → "타이틀 메뉴" 탭.
## (저장하면 title_menu_layout.rpy에 tmenu.pause_layout으로 들어갑니다)

## True: ESC 메뉴를 타이틀 스타일로 / False: 렌파이 기본 (ESC를 누르면 바로 저장 화면)
define tmenu.pause = True

## 뒤에 깔린 게임 화면을 얼마나 어둡게 할지 (색 코드의 마지막 두 자리가 진하기. 00 투명 ~ ff 새까맣게)
##   "#000000b3"   70% 어둡게 (기본)
##   "#00000066"   40% 어둡게 (게임 화면이 잘 보임)
##   "#20000099"   붉은빛으로 어둡게
##   None          어둡게 하지 않음
define tmenu.pause_dim = "#000000b3"

## 어둡게 하는 대신 그림을 깔려면 (그림이 있으면 pause_dim은 안 씀)
## define tmenu.pause_background = "gui/game_menu.png"
define tmenu.pause_background = None

## 항목 목록. 안 적으면(None) 아래 7개가 기본입니다:
##   돌아가기 / 저장하기 / 불러오기 / 환경설정 / 대사록 / 메인 메뉴 / 종료하기
## 바꾸고 싶을 때만 주석(##)을 풀고 고치세요. 쓰는 법은 위의 tmenu.items와 같습니다.
## "action"에 쓸 수 있는 것:
##   Return()                 게임으로 돌아가기
##   ShowMenu("save")         저장 화면 ("load" 불러오기, "preferences" 환경설정, "history" 대사록, "help" 조작방법)
##   MainMenu()               메인 메뉴로 (확인 창이 나옴)
##   Quit()                   게임 끄기 (확인 창이 나옴)
## "show_if"는 보일 조건: 예) "renpy.variant('pc')" PC에서만
##
## define tmenu.pause_items = [
##     { "id": "return",  "text": _("돌아가기"), "action": Return(),
##       "xalign": 0.06, "yalign": 0.26, "rotate": -4, "hover_zoom": 1.15, "hover_offset": (10, 0) },
##     { "id": "save",    "text": _("저장하기"), "action": ShowMenu("save"),
##       "xalign": 0.07, "yalign": 0.345, "rotate": -2.7, "hover_zoom": 1.15, "hover_offset": (10, 0) },
##     { "id": "load",    "text": _("불러오기"), "action": ShowMenu("load"),
##       "xalign": 0.08, "yalign": 0.43, "rotate": -1.3, "hover_zoom": 1.15, "hover_offset": (10, 0) },
##     { "id": "prefs",   "text": _("환경설정"), "action": ShowMenu("preferences"),
##       "xalign": 0.09, "yalign": 0.515, "rotate": 0, "hover_zoom": 1.15, "hover_offset": (10, 0) },
##     { "id": "history", "text": _("대사록"), "action": ShowMenu("history"),
##       "xalign": 0.10, "yalign": 0.60, "rotate": 1.3, "hover_zoom": 1.15, "hover_offset": (10, 0) },
##     { "id": "main",    "text": _("메인 메뉴"), "action": MainMenu(), "show_if": "not _in_replay",
##       "xalign": 0.11, "yalign": 0.685, "rotate": 2.7, "hover_zoom": 1.15, "hover_offset": (10, 0) },
##     { "id": "quit",    "text": _("종료하기"), "action": Quit(), "show_if": "renpy.variant('pc')",
##       "xalign": 0.12, "yalign": 0.77, "rotate": 4, "hover_zoom": 1.15, "hover_offset": (10, 0) },
## ]
define tmenu.pause_items = None

## 저장, 불러오기 화면의 "돌아가기"는 렌파이 기본처럼 게임으로 돌아갑니다. (ESC 메뉴로 가지 않음)


## ── 게임 메뉴 (대사록·저장·불러오기·환경설정 화면 왼쪽 목록) ────────────────

## 타이틀에서 연 환경설정·불러오기 화면에도 왼쪽 목록을 보여줄지
## False면 "돌아가기" 버튼만 나옵니다.
define tmenu.title_game_menu_navigation = True

## 목록의 버튼 글자를 바꾸려면 ("돌아가기" 버튼에도 적용됩니다)
## style navigation_button_text:
##     size 35
##     color "#fff6f6"
##     hover_color "#ffffff"
##     hover_strikethrough True

## 버튼 목록을 바꾸고 싶을 때만 주석(##)을 풀고 고치세요.
## 항목: (글자, 동작) 또는 (글자, 동작, "보일 조건")
## 아무것도 안 적으면 렌파이 기본 목록과 같습니다.
##
## define tmenu.game_menu = [
##     (_("시작하기"), Start(), "main_menu"),
##     (_("대사록"), ShowMenu("history"), "not main_menu"),
##     (_("저장하기"), ShowMenu("save"), "not main_menu"),
##     (_("불러오기"), ShowMenu("load")),
##     (_("환경설정"), ShowMenu("preferences")),
##     (_("리플레이 끝내기"), EndReplay(confirm=True), "_in_replay"),
##     (_("메인 메뉴"), MainMenu(), "not main_menu and not _in_replay"),
##     (_("버전정보"), ShowMenu("about")),
##     (_("조작방법"), ShowMenu("help"), "renpy.variant('pc')"),
##     (_("종료하기"), Quit(), "renpy.variant('pc')"),
## ]

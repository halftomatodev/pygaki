################################################################################
## UI Kit — 선택지 설정
##
## 여기서는 "모든 선택지의 기본값"을 정합니다.
## 선택지마다 다르게 하고 싶은 값은 스크립트의 menu에서 바로 적으면 되고,
## 그 값이 여기 값보다 우선합니다. (사용법은 README.md)
##
## 편집기(개발 모드에서 Shift+M)는 선택지 하나의 괄호 값만 고치고, Ctrl+S로
## 원고의 그 선택지 줄에 바로 적습니다. 모든 선택지의 기본값은 이 파일에서 고치세요.
## (예전 편집기가 만든 choice_menu_layout.rpy가 있으면 그 값도 계속 적용됩니다)
################################################################################

## 렌파이 기본 screens.rpy보다 늦게 실행되도록 합니다.
init offset = 1


## ── 이 기능을 쓸지 ───────────────────────────────────────────────────────────
## False면 렌파이 기본 선택지와 똑같아지고, 스크립트의 선택지 괄호 값은 무시합니다.

define cmenu.enabled = True


## ── 모든 선택지의 기본값 ─────────────────────────────────────────────────────
## 글자 스타일 속성은 렌파이 텍스트 스타일 속성을 그대로 씁니다.
## (font, size, color, kerning(자간), line_spacing(줄 간격), outlines, bold ...)
## 앞에 hover_를 붙이면 마우스를 올렸을 때 값입니다.
## 앞에 button_을 붙이면 선택지 버튼(배경·여백) 스타일입니다.

define cmenu.default = {
    "font": gui.choice_button_text_font,
    "size": gui.choice_button_text_size,
    "color": gui.choice_button_text_idle_color,
    "hover_color": gui.choice_button_text_hover_color,
    "insensitive_color": gui.choice_button_text_insensitive_color,
    "textalign": 0.5,

    ## 버튼 안에서 글자의 가로 위치 (0.5 = 가운데)
    "text_xalign": gui.choice_button_text_xalign,

    ## 이 폭(픽셀)을 넘으면 줄을 바꿉니다. None이면 줄바꿈 안 함
    "width": None,

    ## 버튼 배경·크기·여백: 렌파이 기본 선택지와 같은 모양
    "button_background": Frame("gui/button/choice_idle_background.png", gui.choice_button_borders, tile=gui.choice_button_tile),
    "button_hover_background": Frame("gui/button/choice_hover_background.png", gui.choice_button_borders, tile=gui.choice_button_tile),
    "button_xsize": gui.choice_button_width,
    "button_padding": gui.choice_button_borders.padding,

    ## 마우스를 올리면 뒤에 나오는 영상 (None이면 없음)
    ## 예: "hover_movie": "gui/button/choice_hover.webm",
    "hover_movie": None,
}


## ── 등장 연출 ────────────────────────────────────────────────────────────────
## "pop"   작게 시작해서 튀어나오듯 커짐
## "fade"  서서히 나타남
## "slide" 아래(appear_offset)에서 올라오며 나타남
## None    연출 없음
## 선택지마다 appear="fade" 처럼 따로 줄 수도 있어요.

define cmenu.appear = "fade"
define cmenu.appear_time = 0.25      # 나타나는 데 걸리는 시간(초)
define cmenu.appear_stagger = 0.05   # 선택지마다 늦게 나오는 간격(초)
define cmenu.appear_offset = (0, 20) # slide일 때 출발 위치


## ── 세로 목록 위치 ───────────────────────────────────────────────────────────
## 위치를 적지 않은 선택지가 세로로 쌓이는 목록의 가운데 위치 (x, y 픽셀).
## None이면 렌파이 기본 스타일(choice_vbox)을 따릅니다.

define cmenu.list_pos = None


## ── 마우스를 올렸을 때 움직임 ────────────────────────────────────────────────

define cmenu.hover_time = 0.15
define cmenu.hover_warper = "easeout"


## ── 소리 (선택 사항) ─────────────────────────────────────────────────────────

define cmenu.hover_sound = None
define cmenu.activate_sound = None

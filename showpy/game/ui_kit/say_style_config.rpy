################################################################################
## UI Kit — 대사 스타일 설정
##
## 대사 뒤 괄호에 적은 값은 그 한 줄에만 적용되고,
## 적지 않은 값은 아래 기본 캐릭터의 값을 따릅니다.
##
## 편집기(개발 모드에서 Shift+M)는 대사 한 줄의 괄호 값만 고치고, Ctrl+S로
## 원고의 그 줄에 바로 적습니다. 캐릭터의 기본값은 이 파일에서 고치세요.
## (예전 편집기가 만든 say_style_layout.rpy가 있으면 그 값도 계속 적용됩니다)
################################################################################


## ── 이 기능을 쓸지 ───────────────────────────────────────────────────────────
## False면 대사 괄호의 짧은 이름(x, size, color ...)을 무시하고 캐릭터 기본값으로
## 보여줍니다. 아래 캐릭터 정의는 켜고 끄는 것과 상관없이 그대로 쓸 수 있어요.

define say_style.enabled = True


## ── 기본 캐릭터 ──────────────────────────────────────────────────────────────
## 대사를 화면 어디에나 놓을 수 있는 내레이션용 캐릭터입니다.
## 이름(t)은 바꿔도 되고, 같은 방식으로 여러 개 만들어도 됩니다.

define t = Character(None,
    window_yalign=0.0, window_ysize=720,     # 대사 창을 화면 전체로
    what_font=gui.text_font,                  # 기본 글꼴 (예: "fonts/NeoDGMpro.ttf")
    what_size=22,                             # 기본 크기
    what_xpos=400, what_ypos=157)             # 기본 위치 (화면 왼쪽 위 기준 픽셀)


## ── 자주 쓰는 위치 프리셋 (선택) ─────────────────────────────────────────────
## 프리셋 위치를 쓰면서 괄호로 일부만 덮어쓸 수도 있어요.
##     n2 "……그런 게 없다고?" (color="#aa0000")

define n1 = Character(kind=t, what_xpos=400, what_ypos=157)
define n2 = Character(kind=t, what_xpos=400, what_ypos=210)
define n3 = Character(kind=t, what_xpos=400, what_ypos=264)


## ── 짧은 이름 추가 (선택) ────────────────────────────────────────────────────
## 기본으로 쓸 수 있는 이름:
##   대사 글자   x, y, pos, font, size, color, outline, spacing,
##               bold, italic, kerning, width, align
##   속도·효과   speed (속도 배율. 0.5 = 절반 속도), effect (등장 효과: "dissolve",
##               "flip", "zoom", "jitter", "wave")
##   이름        name_x, name_y (이름 상자 위치, 대사 창 기준), name_font, name_size, name_color
##   화면 효과   fx, fx_transition, fx_overlay, fx_warp, fx_exclude (screen_fx 플러그인이 있을 때.
##               이 줄만이 아니라 다음에 바꿀 때까지 이어짐)
##                   e "어? 화면이…" (fx="ascii")                    # 이 대사부터 ASCII
##                   e "돌아왔다." (fx="default")                    # 선택취소 (기본 효과로)
##                   e "서서히." (fx="gameboy", fx_transition="fade")  # "tv", "fade", None(바로)
##                   e "덮개 없이." (fx="ascii", fx_overlay=False)     # VHS 덮개 끔 (True면 켬)
##                   e "덮개만 켜자." (fx_overlay=True)                # 효과는 그대로, 덮개만
##                   e "화면이 휜다." (fx_warp=3.0)                    # 덮개 휘어짐. "default"면 설정값
##                   e "전부 글자로." (fx="ascii", fx_exclude=())       # 글자 빼기: () 안 뺌 / ("say",) 대사·이름 빼기
##                   e "대사만 또렷." (fx="gameboy", fx_exclude=("say", "choice"))  # "say" 대사·이름, "choice" 선택지, "screens" 메뉴·화면
##   글 상자     box ("bubble" 말풍선, "pill" 둥근 테두리), tail, box_rotate, bubble_..., pill_...
##                   e "안녕!" (box="bubble")                          # 흰 말풍선, 꼬리 아래
##                   e "어디?" (box="bubble", tail="top")               # 꼬리 "top" "left" "right" None
##                   e "쾅!" (box="pill", box_rotate=-4)                # 둥근 테두리, 살짝 기울임
## 여기에 새 이름을 더하거나 바꿀 수 있어요.  "짧은이름": "렌파이 속성"

define say_style.alias = {
    # "alpha": "what_alpha",
}


## ── 글 상자 기본 모양 (선택) ────────────────────────────────────────────────
## 대사 괄호에 box="bubble"이나 box="pill"을 적으면 글을 상자가 둘러쌉니다.
## 괄호에 적지 않은 값은 여기 값을 씁니다. 지우면 엔진의 기본값을 씁니다.
##   color / fill    속 색 ("#ffffff"). pill의 fill이 None이면 속이 빔
##   border / line   선 (굵기, 색). None이면 선 없음
##   radius          모서리 둥글기 (픽셀). None이면 양 끝이 반원
##   padding         글과 상자 사이: 숫자 하나, (가로, 세로), (왼, 위, 오른, 아래)
##   tail            꼬리 "bottom" "top" "left" "right" None, 또는 (x, y) 꼬리 끝 (글 왼쪽 위 기준)
##   tail_pos        꼬리가 붙는 자리 (변을 따라 0.0 ~ 1.0), tail_size 길이, tail_width 밑동 폭
##   pop             튀어나오며 나타남 (True / False, 또는 걸리는 초)
##   rotate          기울기 (도)
##   text_color      상자를 쓸 때 글 색 (괄호에 color를 적으면 그것). None이면 그대로
##   text_outlines   상자를 쓸 때 글 외곽선. [ ]이면 없앰, None이면 그대로
## 한 줄만 바꾸려면 괄호에 bubble_color="#ffeeee", pill_line=(2, "#ff0000")처럼 적습니다.

define say_style.box_styles = {
    "bubble": dict(color="#ffffff", border=(3, "#000000"), radius=18, padding=(22, 14),
                   tail="bottom", tail_pos=0.25, tail_size=24, tail_width=26, pop=True,
                   text_color="#222222", text_outlines=[ ]),
    "pill":   dict(fill=None, line=(3, "#ffffff"), radius=None, padding=(18, 6), rotate=0),
}

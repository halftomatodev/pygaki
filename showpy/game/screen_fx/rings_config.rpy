################################################################################
## Screen FX — 동심원 어긋남(rings) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면을 동그란 고리로 잘라 고리마다 조금씩 돌리고 밀어서 어긋나게 합니다. halves = True면 고리를 반으로 가름.
##
##     $ screen_fx.shaders("rings")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("rings", "vhs_crt")       # 동심원 어긋남 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ rings.preset("broken")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define rings.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define rings.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define rings.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define rings.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define rings.exclude = ()

define rings.settings = {
    "strength": 1.0,      # 전체 세기
    "center_x": 0.5,      # 가운데 가로 (0~1)
    "center_y": 0.5,      # 가운데 세로 (0~1)
    "width": 60.0,        # 고리 굵기 (픽셀)
    "twist": 8.0,         # 돌아가는 정도 (도)
    "shift": 6.0,         # 밀리는 거리 (픽셀)
    "zoom": 0.03,         # 고리마다 확대
    "speed": 0.4,         # 흔들리는 빠르기
    "halves": False,      # 반으로 가르기
    "line": 0.25,         # 고리 경계선
    "line_color": "#000000",# 경계선 색
}

define rings.presets = {
    "broken": {
        "width": 30.0,
        "twist": 20.0,
        "shift": 12.0,
        "halves": True,
    },
    "calm": {
        "twist": 3.0,
        "shift": 2.0,
        "speed": 0.2,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ rings.set(twist=20.0, duration=1.0)     # 1초 동안 바꾸기
##     $ rings.reset()                     # 이 파일의 값으로

define rings.warper = "ease"
define rings.redraw = 0.0

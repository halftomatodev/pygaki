################################################################################
## Screen FX — 양각(relief) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면을 금속판에 눌러 찍은 것처럼 밝은 곳이 튀어나오고 빛에 가장자리가 반짝입니다. invert = True면 음각.
##
##     $ screen_fx.shaders("relief")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("relief", "vhs_crt")       # 양각 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ relief.preset("gold")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define relief.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define relief.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define relief.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define relief.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define relief.exclude = ()

define relief.settings = {
    "strength": 1.0,      # 전체 세기
    "depth": 3.0,         # 튀어나온 정도
    "radius": 1.5,        # 가장자리 굵기 (픽셀)
    "angle": 135.0,       # 빛 방향 (도)
    "metal": "#c9ccd1",   # 판 색
    "color": 0.0,         # 원래 색 남기기
    "shine": 0.6,         # 반짝임
    "gloss": 24.0,        # 반짝임 날카로움
    "invert": False,      # 눌려 들어가게 (음각)
    "sweep": 0.0,         # 빛이 도는 빠르기
}

define relief.presets = {
    "gold": {
        "metal": "#d4a64a",
        "shine": 0.9,
    },
    "stone": {
        "metal": "#8a857c",
        "shine": 0.1,
        "depth": 5.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ relief.set(depth=6.0, duration=1.0)     # 1초 동안 바꾸기
##     $ relief.reset()                     # 이 파일의 값으로

define relief.warper = "ease"
define relief.redraw = 0.0

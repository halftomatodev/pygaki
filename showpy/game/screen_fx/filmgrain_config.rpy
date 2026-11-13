################################################################################
## Screen FX — 옛날 필름(filmgrain) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 오래된 필름 영사기처럼 입자, 먼지, 세로 긁힘, 머리카락, 깜빡임, 덜컹거림, 바랜 색.
##
##     $ screen_fx.shaders("filmgrain")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("filmgrain", "vhs_crt")       # 옛날 필름 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ filmgrain.preset("clean")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define filmgrain.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define filmgrain.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define filmgrain.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define filmgrain.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define filmgrain.exclude = ()

define filmgrain.settings = {
    "strength": 1.0,      # 전체 세기
    "fps": 18.0,          # 초당 바뀌는 번
    "grain": 0.12,        # 입자
    "grain_size": 1.6,    # 입자 크기
    "dust": 0.35,         # 먼지 점
    "scratches": 0.5,     # 세로 긁힘
    "hair": 0.3,          # 머리카락
    "flicker": 0.06,      # 밝기 깜빡임
    "weave": 1.5,         # 덜컹거림 (픽셀)
    "vignette": 0.45,     # 가장자리 어둡게
    "fade": 0.35,         # 색 바램
    "tint": "#e8d9b8",    # 물드는 색
    "tint_amount": 0.35,  # 물드는 정도
    "dark_dust": 0.5,     # 검은 먼지 비율
}

define filmgrain.presets = {
    "clean": {
        "dust": 0.1,
        "scratches": 0.1,
        "hair": 0.0,
        "fade": 0.15,
    },
    "silent": {
        "fade": 1.0,
        "tint_amount": 0.15,
        "flicker": 0.12,
        "dust": 0.6,
        "scratches": 0.8,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ filmgrain.set(grain=0.3, duration=1.0)     # 1초 동안 바꾸기
##     $ filmgrain.reset()                     # 이 파일의 값으로

define filmgrain.warper = "ease"
define filmgrain.redraw = 0.0

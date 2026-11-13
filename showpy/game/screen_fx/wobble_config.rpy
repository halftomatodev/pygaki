################################################################################
## Screen FX — 일렁거림(wobble) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 노이즈 무늬로 화면이 아지랑이나 손으로 그린 그림처럼 일렁거립니다.
## size_x, size_y를 다르게 두면 한쪽으로 늘어진 일렁임. fps를 올리면 손그림 애니메이션처럼 뚝뚝 끊깁니다.
##
##     $ screen_fx.shaders("wobble")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("wobble", "vhs_crt")       # 일렁거림 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ wobble.preset("heat")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define wobble.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define wobble.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define wobble.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define wobble.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define wobble.exclude = ()

define wobble.settings = {
    "strength": 1.0,      # 전체 세기
    "amount": 8.0,        # 밀리는 거리 (픽셀)
    "size_x": 140.0,      # 무늬 가로 크기 (픽셀)
    "size_y": 60.0,       # 무늬 세로 크기 (픽셀)
    "detail": 0.5,        # 잔무늬
    "speed": 0.5,         # 흐르는 속도
    "pulse": 0.3,         # 세기 출렁임
    "pulse_speed": 0.4,   # 출렁임 빠르기
    "rise": 0.0,          # 위로 피어오름
    "fps": 0.0,           # 뚝뚝 끊기 (초당 번, 0 = 부드럽게)
}

define wobble.presets = {
    "heat": {
        "size_x": 300.0,
        "size_y": 40.0,
        "amount": 6.0,
        "rise": 1.2,
    },
    "sketch": {
        "amount": 3.0,
        "size_x": 30.0,
        "size_y": 30.0,
        "fps": 8.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ wobble.set(amount=16.0, duration=1.0)     # 1초 동안 바꾸기
##     $ wobble.reset()                     # 이 파일의 값으로

define wobble.warper = "ease"
define wobble.redraw = 0.0

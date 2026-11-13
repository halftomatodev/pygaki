################################################################################
## Screen FX — 물결(waves) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 잔잔한 물에 돌을 던진 것처럼 한 점에서 동그란 물결이 퍼져 나가며 화면이 굴절합니다.
## pulse = 0이면 물결이 끊이지 않고, 0보다 크면 그 초마다 한 번씩 퍼집니다. drops를 올리면 빗방울 물결이 여기저기.
##
##     $ screen_fx.shaders("waves")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("waves", "vhs_crt")       # 물결 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ waves.preset("rain")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define waves.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define waves.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define waves.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define waves.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define waves.exclude = ()

define waves.settings = {
    "strength": 1.0,      # 전체 세기
    "center_x": 0.5,      # 가운데 가로 (0~1)
    "center_y": 0.5,      # 가운데 세로 (0~1)
    "amount": 10.0,       # 굴절 (픽셀)
    "wavelength": 46.0,   # 물결 간격 (픽셀)
    "speed": 220.0,       # 퍼지는 속도 (픽셀/초)
    "decay": 1.2,         # 멀수록 잦아듦
    "pulse": 1.6,         # 몇 초마다 (0 = 계속)
    "rings": 3.0,         # 한 번에 물결 수
    "drops": 0.0,         # 빗방울
    "drop_size": 0.6,     # 빗방울 크기
    "shine": 0.25,        # 비친 빛
}

define waves.presets = {
    "rain": {
        "pulse": 0.0,
        "amount": 6.0,
        "drops": 0.7,
        "decay": 3.0,
    },
    "shock": {
        "pulse": 2.5,
        "rings": 2.0,
        "amount": 22.0,
        "speed": 500.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ waves.set(amount=20.0, duration=1.0)     # 1초 동안 바꾸기
##     $ waves.reset()                     # 이 파일의 값으로

define waves.warper = "ease"
define waves.redraw = 0.0

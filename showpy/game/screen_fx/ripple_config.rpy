################################################################################
## Screen FX — 일렁임(ripple) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면을 투명한 액체 너머로 보는 것처럼 천천히 일렁입니다.
## 예전 "타이틀 일렁임"을 셰이더로 옮긴 것이라 타이틀 셰이더에도, 게임 중에도 쓸 수 있습니다.
##
##     define screen_fx.title_shaders = ("ripple", "none")   # 타이틀에 일렁임 (screen_fx_config.rpy)
##     $ screen_fx.shaders("ripple")                       # 게임 중 1번 자리에 일렁임
##     $ screen_fx.shaders("ripple", "vhs_crt")            # 일렁임 + VHS
##     $ screen_fx.shaders("none")                         # 끄기
##     $ ripple.preset("calm")                             # 아래 presets 묶음으로
##
## 화면만 휘고 클릭 영역은 그대로라서, 메뉴 글자까지 휘게 둘 때는 amount를 8 이하로 두세요.
################################################################################

## 효과 켜기·끄기
define ripple.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define ripple.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define ripple.exclude = ()                          # 메뉴 글자까지 같이 일렁임 (기본)
##   define ripple.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define ripple.exclude = ()

define ripple.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)
    "amount": 6.0,          # 일렁임(픽셀). 메뉴 글자까지 휘게 두면 8 이하
    "scale": 180.0,         # 물결 하나의 크기(픽셀). 클수록 느긋하고 큰 물결
    "speed": 0.6,           # 흐르는 속도
    "flow": 1.2,            # 소용돌이 (0 = 단순한 물결)
    "shine": 0.15,          # 액체 표면에 비친 빛 (0 = 없음)
}

define ripple.presets = {
    "calm": {               # 아주 살짝
        "amount": 3.0,
        "speed": 0.3,
        "shine": 0.05,
    },
    "dream": {              # 꿈처럼 크게 출렁
        "amount": 14.0,
        "scale": 320.0,
        "flow": 2.2,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ ripple.set(amount=12.0, duration=1.0)     # 1초 동안 점점 크게
##     $ ripple.reset()                            # 이 파일의 값으로

define ripple.warper = "ease"
define ripple.redraw = 0.0

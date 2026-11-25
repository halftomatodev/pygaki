################################################################################
## 화면 효과 — 옛 캠코더(camcorder) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 옛날 캠코더로 찍어 낮은 화질로 옮긴 영상처럼 화면 톤만 바꿉니다.
## 뭉개진 화질, 어두운 물체 둘레의 하얀 테두리, 옆으로 번지는 색, 따뜻한 색감, 살짝 들뜬 검은색.
##
##     $ screen_fx.shaders("camcorder")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("camcorder", "vhs_crt")       # 캠코더 + VHS 주사선
##     $ screen_fx.shaders("none")                       # 끄기
##     e "그날의 영상이야." (fx="camcorder")              # 대사 줄 괄호로
##     $ camcorder.preset("tape")                        # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define camcorder.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define camcorder.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define camcorder.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define camcorder.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define camcorder.exclude = ()

define camcorder.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)
    "resolution": 300.0,    # 세로 해상도 (줄). 작을수록 뭉개짐
    "smear": 1.6,           # 가로로 뭉개지는 정도
    "sharpen": 0.9,         # 어두운 물체 둘레의 하얀 테두리 (과한 샤픈)
    "halo": 2.5,            # 그 테두리의 폭
    "chroma": 5.0,          # 색이 옆으로 번지는 폭 (픽셀)
    "shift": 2.0,           # 색이 옆으로 밀리는 거리 (픽셀, 음수면 반대로)
    "saturation": 1.25,     # 채도
    "contrast": 1.1,        # 대비
    "gamma": 1.25,          # 감마 (클수록 중간 밝기가 어두움)
    "tint": "#ffe2c4",      # 색감 (따뜻하게)
    "tint_amount": 0.35,    # 색감 세기
    "black": 0.07,          # 검은색이 들뜨는 정도
    "shadow": "#22303a",    # 들뜬 검은색의 색 (푸르스름한 회색)
    "bloom": 0.25,          # 밝은 곳 번짐
    "noise": 0.05,          # 잔 노이즈
    "fps": 24.0,            # 노이즈가 초당 바뀌는 번
    "jitter": 0.3,          # 화면 떨림 (픽셀)
    "vignette": 0.3,        # 가장자리 어둡게
}

define camcorder.presets = {
    "light": {              # 살짝만 (DVD로 옮긴 느낌)
        "resolution": 480.0,
        "sharpen": 0.5,
        "chroma": 3.0,
        "noise": 0.03,
    },
    "tape": {               # 많이 낡은 테이프
        "resolution": 200.0,
        "smear": 2.6,
        "chroma": 9.0,
        "shift": 3.5,
        "black": 0.12,
        "noise": 0.09,
    },
    "cold": {               # 차가운 색감 (형광등 아래)
        "tint": "#cfe6ff",
        "shadow": "#1c3328",
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ camcorder.set(resolution=200, duration=1.0)    # 1초 동안 더 뭉개지게
##     $ camcorder.reset()                              # 이 파일의 값으로

define camcorder.warper = "ease"
define camcorder.redraw = 0.0

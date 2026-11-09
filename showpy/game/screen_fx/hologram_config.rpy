################################################################################
## Screen FX — 홀로그램(hologram) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면(또는 이미지 하나)을 SF 영화의 홀로그램처럼 바꿉니다.
## 한 색으로 통일하고, 가로 주사선이 흐르고, 옆으로 번진 복사본 두 겹과 빛 번짐,
## 살짝 깜빡임과 가끔 옆으로 튀는 띠가 있습니다.
##
##     $ screen_fx.shaders("hologram")               # 화면 전체를 홀로그램으로
##     $ screen_fx.shaders("none")                   # 끄기
##     e "통신 연결." (fx="hologram")                 # 대사 줄 괄호로
##
## 인물 하나만 홀로그램으로 (가장 많이 쓰는 방법):
##     show eileen at screen_fx.image_fx("hologram")
##     show eileen at screen_fx.image_fx("hologram", color="#ff7ad9", opacity=0.7)   # 분홍, 더 투명하게
##     show eileen at center, screen_fx.image_fx("hologram")                         # 자리와 같이
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "홀로그램")로 바꿔 저장하면
## hologram_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

define hologram.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define hologram.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
define hologram.exclude = ("say", "choice")

define hologram.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)
    "color": "#59d8ff",     # 홀로그램 색 (하늘색. "#7dffb0" 초록, "#ff7ad9" 분홍, "#ffb347" 주황)
    "brightness": 1.3,      # 밝기
    "opacity": 1.0,         # 불투명도. 이미지에 걸 때 0.6~0.8로 하면 뒤가 비쳐 보임

    ## ── 주사선 ──
    "lines": 4.0,           # 줄 간격(픽셀)
    "line_dark": 0.45,      # 줄 진하기 (0 = 줄 없음)
    "line_speed": 20.0,     # 줄이 흐르는 속도(픽셀/초). 음수면 위로, 0이면 멈춤

    ## ── 번짐 ──
    "smear": 10.0,          # 오른쪽으로 번진 복사본 1의 거리(픽셀)
    "smear2": 26.0,         # 복사본 2의 거리(픽셀)
    "smear_alpha": 0.45,    # 복사본 진하기 (0 = 복사본 없음)
    "glow": 0.5,            # 빛 번짐 (0 = 없음)
    "glow_size": 6.0,       # 빛 번짐 크기(픽셀)

    ## ── 흔들림 ──
    "flicker": 0.12,        # 깜빡임 (0 = 없음)
    "jitter": 3.0,          # 가끔 가로 띠가 옆으로 튀는 거리(픽셀)
}

define hologram.presets = {
    "pink": {               # 분홍 홀로그램
        "color": "#ff7ad9",
    },
    "unstable": {           # 끊길 듯 불안한 통신
        "flicker": 0.35,
        "jitter": 14.0,
        "smear_alpha": 0.7,
    },
    "clean": {              # 번짐 없이 깔끔하게
        "smear_alpha": 0.0,
        "glow": 0.2,
        "flicker": 0.0,
        "jitter": 0.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ hologram.set(color="#ff5050", duration=0.5)  # 0.5초 동안 붉게 (경고)
##     $ hologram.reset()                             # 이 파일의 값으로

define hologram.warper = "ease"
define hologram.redraw = 0.0

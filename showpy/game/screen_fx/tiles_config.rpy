################################################################################
## Screen FX — 조각 어긋남(tiles) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면을 크기가 다른 네모 칸으로 나누고, 칸마다 조금씩 밀리거나, 확대되거나,
## 색이 바뀌거나, 엉뚱한 자리의 그림을 보여 줍니다. 칸 나눔은 몇 초마다 새로 바뀝니다.
##
##     $ screen_fx.shaders("tiles")                  # 1번 자리에 조각 어긋남
##     $ screen_fx.shaders("none")                   # 끄기
##     e "기억이 뒤죽박죽이야." (fx="tiles")          # 대사 줄 괄호로
##     $ tiles.set(shuffle=0.0)                      # 칸 나눔을 멈춤
##     show photo at screen_fx.image_fx("tiles")     # 이미지 하나에만
##
## 장면 전환 (칸마다 다른 때에 옛 장면에서 새 장면으로):
##     scene bg room with screen_fx.TileSwap(1.0)
##     scene bg room with screen_fx.TileSwap(2.0, grid=120, offset=30)
##     scene bg room with screen_fx.TileSwap(1.0, lines=0.0)      # 칸 선 없이
##   값: time 시간(초), grid 칸 크기(픽셀), offset 바뀌는 동안 밀림(픽셀),
##       lines 칸 선 진하기(0~1), line_color 선 색
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "조각 어긋남")로 바꿔 저장하면
## tiles_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

define tiles.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define tiles.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
define tiles.exclude = ("say", "choice")

define tiles.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)

    ## ── 칸 ──
    "grid": 80.0,           # 기본 칸 크기(픽셀). 칸은 이 크기의 1×1 ~ 3×2배
    "shuffle": 1.5,         # 몇 초마다 칸을 새로 나눌지 (0 = 그대로)

    ## ── 어긋남 ──
    "offset": 12.0,         # 칸마다 밀리는 거리(최대, 픽셀)
    "zoom": 0.08,           # 칸 안 확대 (0 = 없음, 0.3 = 많이)
    "swap": 0.08,           # 엉뚱한 자리의 그림을 보여 주는 칸 비율 (0 ~ 1)
    "tint": "#ff4d6d",      # 칸을 물들이는 색
    "tint_amount": 0.2,     # 물드는 칸 비율 (0 = 없음)

    ## ── 테두리 ──
    "lines": 0.6,           # 칸 선 진하기 (0 = 선 없음)
    "line_width": 1.5,      # 선 두께(픽셀)
    "line_color": "#000000",  # 선 색
}

define tiles.presets = {
    "collage": {            # 큰 칸으로 천천히 바뀌는 콜라주
        "grid": 140.0,
        "shuffle": 4.0,
        "offset": 20.0,
        "swap": 0.15,
    },
    "shatter": {            # 잘게 깨진 화면 (빨리 바뀜)
        "grid": 40.0,
        "shuffle": 0.25,
        "offset": 24.0,
        "zoom": 0.2,
        "swap": 0.25,
    },
    "still": {              # 칸만 나뉘고 거의 안 움직임
        "shuffle": 0.0,
        "offset": 4.0,
        "zoom": 0.0,
        "swap": 0.0,
        "tint_amount": 0.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ tiles.set(offset=40.0, duration=1.0)        # 1초 동안 점점 크게 어긋남
##     $ tiles.reset()

define tiles.warper = "ease"
define tiles.redraw = 0.0

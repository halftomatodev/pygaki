################################################################################
## Screen FX — 포토 콜라주(collage) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 한 장면을 사진으로 여러 번 찍어 겹쳐 붙인 것처럼 보이게 합니다.
## 화면 가운데에만 크기가 제각각인 네모 조각(최대 10장)이 겹쳐 놓이고,
## 조각마다 같은 장면이 조금 밀리고 확대되어 보입니다. 가는 하얀 테두리와 옅은 그림자.
##
##     $ screen_fx.shaders("collage")                # 1번 자리에 포토 콜라주
##     $ screen_fx.shaders("collage", "vhs_crt")     # 포토 콜라주 + VHS 덮개
##     $ screen_fx.shaders("none")                   # 끄기
##     e "기억이 겹쳐 보여." (fx="collage")           # 대사 줄 괄호로
##     $ collage.preset("scatter")                   # 아래 presets 묶음으로
##     $ screen_fx.set_values("collage", count=10, area=0.8)   # 게임 중에 값 바꾸기
##     show eileen at screen_fx.image_fx("collage")  # 그림 하나에만
##
## 장면 전환: scene bg2 with screen_fx.TileSwap(1.0)   (칸마다 다른 때에 새 장면으로)
##
## 예전 이름 "tiles"(조각 어긋남, screen_fx 5.2까지)로 적은 줄도 이 효과로 돕니다.
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "포토 콜라주")로 바꿔 저장하면
## collage_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기
define collage.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define collage.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define collage.exclude = ("say", "choice")  # 대사·선택지는 조각 위에 (기본)
##   define collage.exclude = ()                 # 대사창까지 같이 조각남
define collage.exclude = ("say", "choice")

define collage.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)

    ## ── 조각 ──
    "count": 7.0,           # 조각 수 (1~10)
    "area": 0.6,            # 가운데 범위 (화면에서 조각이 놓이는 가운데 부분의 비율, 1 = 화면 전체)
    "size_min": 0.25,       # 작은 조각 (가운데 범위에 대한 비율)
    "size_max": 0.6,        # 큰 조각
    "strips": 0.25,         # 가는 띠 비율 (가늘고 긴 조각이 나올 확률)
    "shuffle": 1.5,         # 바꾸기 (초). 조각마다 다른 때에 새 자리로. 0이면 그대로

    ## ── 어긋남 ──
    "offset": 10.0,         # 밀림(픽셀). 조각 안 그림이 원래 자리에서 밀리는 정도
    "zoom": 0.06,           # 확대 (0.06 = 최대 6%)
    "shade": 0.12,          # 조각마다 밝기 차이
    "tint": "#9cc4ff",      # 물들이는 색
    "tint_amount": 0.3,     # 물드는 조각 비율

    ## ── 테두리 ──
    "lines": 0.7,           # 선 진하기
    "line_width": 1.5,      # 선 두께(픽셀)
    "line_color": "#ffffff",# 선 색
    "shadow": 0.3,          # 아래 조각에 지는 그림자
}

define collage.presets = {
    "joiner": {             # 가운데에 조각 일곱, 천천히 바뀜 (기본과 비슷)
        "count": 7.0,
        "area": 0.6,
        "shuffle": 2.0,
    },
    "scatter": {            # 넓게, 많이, 자주
        "count": 10.0,
        "area": 0.85,
        "size_min": 0.15,
        "size_max": 0.45,
        "shuffle": 0.8,
        "offset": 16.0,
    },
    "calm": {               # 조각 넷, 거의 안 바뀜, 차이 적게
        "count": 4.0,
        "area": 0.5,
        "shuffle": 4.0,
        "offset": 6.0,
        "zoom": 0.03,
        "shade": 0.06,
        "tint_amount": 0.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ collage.set(count=10, duration=1.0)
##     $ collage.reset()                              # 이 파일의 값으로

define collage.warper = "ease"
define collage.redraw = 0.0

################################################################################
## Screen FX — 파편 흩날림(shards) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면 위로 작은 뾰족한 조각이 바람에 날리듯 흩날립니다.
## 깊이 세 겹(먼 조각은 작고 흐리고 느림)이고, 조각마다 돌고 뒤집히고 깜빡입니다.
## 화면은 그대로 보이고 그 위에 조각만 얹힙니다. 그림 파일은 필요 없습니다.
##
##     $ screen_fx.shaders("shards")                 # 1번 자리에 파편
##     $ screen_fx.shaders("shards", "vhs_crt")      # 파편 + VHS 덮개
##     $ screen_fx.shaders("none")                   # 끄기
##     e "무언가 부서졌어." (fx="shards")             # 대사 줄 괄호로
##     $ shards.preset("ash")                        # 아래 presets 묶음으로
##     $ screen_fx.set_values("shards", count=200, direction=90)   # 게임 중에 값 바꾸기
##
## 다른 효과와 같이 쓰려면 2번 자리에 두세요: screen_fx.shaders("boil", "shards")
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "파편 흩날림")로 바꿔 저장하면
## shards_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기
define shards.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define shards.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define shards.exclude = ()                 # 조각이 대사창 위로도 날림 (기본)
##   define shards.exclude = ("say", "choice")  # 대사·선택지는 조각 위에
define shards.exclude = ()

define shards.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)

    ## ── 양과 색 ──
    "count": 90.0,          # 화면에 보이는 조각 수 (대강, 0~400). 많으면 무거워질 수 있음
    "colors": 2,            # 색 수 1, 2, 3. 조각마다 아래 색 중 하나를 무작위로
    "color": "#d22222",     # 색 1
    "color2": "#7a1010",    # 색 2
    "color3": "#ff8a5c",    # 색 3
    "opacity": 0.9,         # 조각 진하기
    "dim": 0.0,             # 바탕 화면 어둡게 (0 = 그대로, 0.5 = 절반 어둡게)

    ## ── 모양 ──
    "size_min": 3.0,        # 작은 조각 길이(픽셀). 가까운 겹은 이보다 조금 크게 보임
    "size_max": 9.0,        # 큰 조각 길이(픽셀)
    "thin": 0.35,           # 가늘기 (작을수록 바늘처럼, 1이면 통통한 마름모)

    ## ── 움직임 ──
    "speed": 120.0,         # 날리는 속도(픽셀/초). 가까운 겹이 더 빠름
    "direction": 200.0,     # 날리는 방향(도). 0 오른쪽, 90 아래, 180 왼쪽, 270 위
    "spread": 0.5,          # 흔들림 폭 (0 = 곧게 날림)
    "spin": 1.0,            # 돌기·뒤집힘 빠르기
    "twinkle": 0.4,         # 깜빡임 (0 = 없음)
    "depth_blur": 0.6,      # 먼 조각 흐림 (0 = 다 또렷)
}

define shards.presets = {
    "embers": {             # 불티: 위로 천천히 올라가는 주황 불씨
        "colors": 3,
        "color": "#ff7a1a",
        "color2": "#ffb347",
        "color3": "#ff3b1a",
        "direction": 270.0,
        "speed": 60.0,
        "spread": 0.9,
        "thin": 0.6,
        "count": 130.0,
        "size_min": 3.0,
        "size_max": 8.0,
        "opacity": 1.0,
        "twinkle": 0.6,
    },
    "ash": {                # 재: 회색 조각이 천천히 내려옴
        "colors": 2,
        "color": "#9a9a9a",
        "color2": "#4a4a4a",
        "direction": 100.0,
        "speed": 40.0,
        "spread": 1.0,
        "spin": 0.5,
        "twinkle": 0.1,
    },
    "storm": {              # 폭풍: 많고 빠르게 옆으로
        "count": 300.0,
        "speed": 520.0,
        "direction": 185.0,
        "spread": 0.2,
        "spin": 2.5,
    },
    "dread": {              # 어두운 화면에 붉은 파편
        "dim": 0.55,
        "count": 140.0,
        "speed": 90.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ shards.set(count=250, duration=2.0)          # 2초 동안 점점 많이
##     $ shards.reset()                               # 이 파일의 값으로

define shards.warper = "ease"
define shards.redraw = 0.0

################################################################################
## 화면 효과 — 블록 깨짐(macroblock) 효과 설정 
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 디지털 영상이 깨질 때처럼 화면이 네모 칸으로 나뉘고, 무작위 칸이 한 색으로
## 뭉개지거나, 줄무늬가 생기거나, 엉뚱한 자리의 그림이 들어가고 색이 틀어집니다.
##
## 이 효과는 기본으로는 꺼져 있다가, 스크립트에서 켭니다.
##     $ screen_fx.shaders("macroblock")              # 1번 자리에 블록 깨짐
##     $ screen_fx.shaders("ascii", "macroblock")     # 겹치기
##     $ screen_fx.shaders("none")                    # 끄기
##     $ macroblock.preset("broken")                  # 아래 presets 묶음으로
##     $ macroblock.set(always=True)                  # 계속 깨짐
##
## pygaki editor(F9 → "화면 효과" 탭 → "블록 깨짐")로 바꿔 저장하면
## macroblock_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기 (False면 이 효과를 골라도 깨끗한 화면)
define macroblock.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define macroblock.overlay = False

## 글자 빼기: 효과를 씌우지 않을 글자 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
define macroblock.exclude = ()

## 화면 효과 값. 적지 않은 값은 엔진의 기본값입니다.
define macroblock.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면, 1 = 다 보임)

    ## ── 언제 깨질지 ──
    "rate": 0.6,            # 1초에 몇 번쯤 깨지는지
    "length": 0.4,          # 한 번 깨질 때 길이(초)
    "always": False,        # True = 쉬지 않고 계속 깨짐

    ## ── 모양 ──
    "block": 32.0,          # 칸 크기(픽셀)
    "amount": 0.35,         # 깨지는 칸의 양 (0~1)
    "flat": 0.6,            # 깨진 칸 가운데 한 색으로 뭉개지는 비율 (0~1)
    "stripes": 0.4,         # 줄무늬가 생기는 비율 (0~1)
    "shift": 0.5,           # 엉뚱한 자리의 그림이 들어가는 비율 (0~1)
    "color": 0.25,          # 색이 틀어지는 비율 (0~1)
}

## 게임 중에 $ macroblock.preset("이름")으로 한 번에 바꿀 수 있는 묶음.
define macroblock.presets = {
    "subtle": {             # 가끔 몇 칸만
        "rate": 0.3,
        "amount": 0.12,
    },
    "broken": {             # 쉬지 않고 크게 깨짐 (영상이 무너지는 장면)
        "always": True,
        "amount": 0.7,
        "block": 48.0,
    },
    "smear": {              # 밀림만 (데이터가 끌리는 느낌)
        "flat": 0.0,
        "stripes": 0.0,
        "color": 0.1,
        "shift": 1.0,
        "amount": 0.5,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ macroblock.set(always=True, amount=0.8)       # 계속 심하게
##     $ macroblock.reset()                            # 이 파일의 값으로

## 부드럽게 바뀔 때의 속도 곡선
define macroblock.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임
define macroblock.redraw = 0.0

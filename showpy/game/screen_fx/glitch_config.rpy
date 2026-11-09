################################################################################
## Screen FX — 무작위 글리치(glitch) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 평소에는 깨끗한 화면이다가, 가끔 무작위로 화면이 가로 띠로 찢기고,
## 네모 조각이 엉뚱한 자리로 밀리고, 빨강·파랑이 옆으로 갈라집니다.
##
## 이 효과는 기본으로는 꺼져 있다가, 스크립트에서 켭니다.
##     $ screen_fx.shaders("glitch")                 # 1번 자리에 글리치
##     $ screen_fx.shaders("ascii", "glitch")        # 1번 아스키 + 2번 글리치 (겹치기)
##     $ screen_fx.shaders("none")                   # 끄기
##     e "어…?" (fx="glitch")                         # 대사 줄 괄호로
##     $ glitch.preset("storm")                      # 아래 presets 묶음으로
##     $ glitch.set(rate=3.0)                        # 더 자주
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "글리치")로 바꿔 저장하면
## glitch_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
## 편집기에서 값을 고를 때는 "늘 망가짐"을 켜면 모양이 계속 보여서 고르기 쉽습니다.
################################################################################

## 효과 켜기·끄기 (False면 이 효과를 골라도 깨끗한 화면)
define glitch.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define glitch.overlay = False

## 글자 빼기: 효과를 씌우지 않을 글자 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define glitch.exclude = ()              # 아무것도 안 뺌: 대사창까지 같이 망가짐 (기본)
##   define glitch.exclude = ("say",)        # 대사는 멀쩡하게 (쉼표 꼭)
define glitch.exclude = ()

## 화면 효과 값. 적지 않은 값은 엔진의 기본값입니다.
define glitch.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면, 1 = 다 보임)

    ## ── 언제 망가질지 ──
    "rate": 0.8,            # 1초에 몇 번쯤 망가지는지 (0.2 = 5초에 한 번쯤, 3 = 거의 계속)
    "length": 0.25,         # 한 번 망가질 때 길이(초)
    "always": False,        # True = 쉬지 않고 계속 망가짐 (값 고를 때, 아주 무서운 장면)

    ## ── 얼마나 ──
    "amount": 1.0,          # 망가지는 세기 (0.5 = 살짝, 2 = 아주 심하게)
    "tear": 40.0,           # 가로 띠가 옆으로 밀리는 거리(픽셀)
    "band": 24.0,           # 가로 띠 두께(픽셀)
    "blocks": 0.5,          # 엉뚱한 자리로 밀리는 네모 조각의 양 (0 = 없음, 1 = 많이)
    "block_size": 64.0,     # 네모 조각 크기(픽셀)
    "rgb_split": 8.0,       # 빨강·파랑이 갈라지는 거리(픽셀)
    "noise": 0.15,          # 하얀 지지직 줄 (0 = 없음)
}

## 게임 중에 $ glitch.preset("이름")으로 한 번에 바꿀 수 있는 묶음.
define glitch.presets = {
    "subtle": {             # 가끔 살짝 (눈치챌 듯 말 듯)
        "rate": 0.3,
        "amount": 0.5,
        "blocks": 0.2,
        "noise": 0.0,
    },
    "storm": {              # 쉬지 않고 심하게 (화면이 무너지는 장면)
        "always": True,
        "amount": 1.6,
        "blocks": 0.9,
        "rgb_split": 14.0,
        "noise": 0.5,
    },
    "rgb": {                # 색 갈라짐만
        "tear": 0.0,
        "blocks": 0.0,
        "noise": 0.0,
        "rgb_split": 12.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ glitch.set(always=True, amount=2.0)          # 계속 심하게
##     $ glitch.reset()                               # 이 파일의 값으로
##     $ screen_fx.set_values("glitch", rate=2.0)     # 같은 일을 하는 다른 방법
##     $ screen_fx.set_values("glitch")               # 설정대로 돌아감

## 부드럽게 바뀔 때의 속도 곡선
define glitch.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임 (이 효과는 움직여서 0으로 둡니다)
define glitch.redraw = 0.0

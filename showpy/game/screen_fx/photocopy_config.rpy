################################################################################
## Screen FX — 복사기(photocopy) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 여러 번 복사해서 닳은 종이처럼 밝기가 뭉개지고 얼룩, 끌린 줄, 종이 색이 생깁니다.
##
##     $ screen_fx.shaders("photocopy")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("photocopy", "vhs_crt")       # 복사기 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ photocopy.preset("fax")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define photocopy.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define photocopy.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define photocopy.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define photocopy.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define photocopy.exclude = ()

define photocopy.settings = {
    "strength": 1.0,      # 전체 세기
    "threshold": 0.35,    # 검게 되는 밝기
    "contrast": 3.0,      # 대비
    "levels": 3.0,        # 밝기 단계 (1 = 흑백)
    "toner": 0.35,        # 토너 얼룩
    "speckle": 0.25,      # 흰 빈 곳
    "streaks": 0.4,       # 끌린 줄
    "smear": 2.0,         # 인쇄 어긋남 (픽셀)
    "paper": "#efe9dc",   # 종이 색
    "ink": "#1d1b1a",     # 토너 색
    "edge": 0.4,          # 가장자리 그림자
    "fps": 8.0,           # 초당 바뀌는 번
}

define photocopy.presets = {
    "fax": {
        "levels": 1.0,
        "contrast": 6.0,
        "toner": 0.6,
        "streaks": 0.7,
    },
    "zine": {
        "paper": "#f3e6c8",
        "ink": "#2a1a4a",
        "levels": 2.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ photocopy.set(threshold=0.7, duration=1.0)     # 1초 동안 바꾸기
##     $ photocopy.reset()                     # 이 파일의 값으로

define photocopy.warper = "ease"
define photocopy.redraw = 0.0

################################################################################
## Screen FX — 그라데이션 맵(gradmap) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면의 밝기만 보고 어두운 곳, 중간, 밝은 곳을 고른 색으로 새로 칠합니다. levels를 올리면 포스터처럼 몇 단계로.
##
##     $ screen_fx.shaders("gradmap")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("gradmap", "vhs_crt")       # 그라데이션 맵 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ gradmap.preset("duotone")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define gradmap.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define gradmap.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define gradmap.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define gradmap.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define gradmap.exclude = ()

define gradmap.settings = {
    "strength": 1.0,      # 전체 세기
    "shadow": "#1b0f3a",  # 어두운 곳 색
    "mid": "#c2185b",     # 중간 색
    "light": "#ffe08a",   # 밝은 곳 색
    "mid_pos": 0.5,       # 중간 색 자리
    "brightness": 1.0,    # 밝기
    "contrast": 1.1,      # 대비
    "levels": 0.0,        # 단계 수 (0 = 부드럽게)
    "dither": 0.0,        # 단계 사이 점 섞기
    "shift": 0.0,         # 색이 흐르는 빠르기
}

define gradmap.presets = {
    "duotone": {
        "shadow": "#0b1d3a",
        "mid": "#7a8a9a",
        "light": "#f2e8cf",
    },
    "poster": {
        "levels": 4.0,
        "dither": 0.6,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ gradmap.set(levels=4.0, duration=1.0)     # 1초 동안 바꾸기
##     $ gradmap.reset()                     # 이 파일의 값으로

define gradmap.warper = "ease"
define gradmap.redraw = 0.0

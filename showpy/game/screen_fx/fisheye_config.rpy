################################################################################
## Screen FX — 어안렌즈(fisheye) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 어안렌즈로 본 것처럼 가운데가 부풀고 가장자리가 휘어 눌립니다. circle = 1이면 둥근 렌즈 화면.
## 화면만 휘고 클릭 영역은 그대로라서, 메뉴 글자까지 휘게 둘 때는 amount를 0.4 이하로 두세요.
##
##     $ screen_fx.shaders("fisheye")                  # 게임 중 1번 자리에
##     $ screen_fx.shaders("fisheye", "vhs_crt")       # 어안렌즈 + VHS
##     $ screen_fx.shaders("none")                # 끄기
##     $ fisheye.preset("peephole")                          # 아래 presets 묶음으로
################################################################################

## 효과 켜기·끄기
define fisheye.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define fisheye.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define fisheye.exclude = ()                          # 메뉴 글자까지 같이 (기본)
##   define fisheye.exclude = ("say", "choice")           # 대사·선택지는 또렷하게
define fisheye.exclude = ()

define fisheye.settings = {
    "strength": 1.0,      # 전체 세기
    "amount": 0.6,        # 휘는 정도
    "zoom": 1.0,          # 확대
    "center_x": 0.5,      # 가운데 가로 (0~1)
    "center_y": 0.5,      # 가운데 세로 (0~1)
    "chroma": 0.3,        # 가장자리 색 번짐
    "circle": 0.0,        # 둥근 화면 (0 = 없음)
    "circle_soft": 0.02,  # 둥근 화면 가장자리
    "vignette": 0.35,     # 가장자리 어둡게
    "breathe": 0.0,       # 숨쉬듯 출렁
}

define fisheye.presets = {
    "peephole": {
        "amount": 0.9,
        "circle": 1.0,
        "vignette": 0.6,
    },
    "soft": {
        "amount": 0.3,
        "chroma": 0.1,
        "vignette": 0.2,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ fisheye.set(amount=0.9, duration=1.0)     # 1초 동안 바꾸기
##     $ fisheye.reset()                     # 이 파일의 값으로

define fisheye.warper = "ease"
define fisheye.redraw = 0.0

################################################################################
## Screen FX — 망점(halftone) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 인쇄물처럼 화면을 작은 점(또는 줄)으로 바꿉니다.
## 어두운 곳은 큰 점, 밝은 곳은 작은 점이 됩니다.
##   "mono" 한 색: 잉크 한 색과 종이색만 (신문 사진처럼)
##   "cmyk" 네 색: 하늘색·분홍·노랑·검정 점을 서로 다른 각도로 겹침 (색 포스터, 옛 만화 인쇄처럼)
##
##     $ screen_fx.shaders("halftone")               # 1번 자리에 망점
##     $ screen_fx.shaders("none")                   # 끄기
##     e "옛날 신문 사진처럼." (fx="halftone")        # 대사 줄 괄호로
##     $ halftone.preset("poster")                   # 네 색 포스터로 (아래 presets)
##     $ halftone.set(mode="cmyk")                   # 네 색으로
##     show ghost at screen_fx.image_fx("halftone")  # 이미지 하나에만
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "망점")로 바꿔 저장하면
## halftone_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

define halftone.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define halftone.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
## 작은 글자는 점이 되면 잘 안 읽힙니다. 대사를 읽게 하려면 ("say", "choice")
define halftone.exclude = ("say", "choice")

define halftone.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)
    "mode": "mono",         # "mono" 한 색 / "cmyk" 네 색
    "shape": "dot",         # "dot" 동그란 점 / "line" 비스듬한 줄
    "cell": 8.0,            # 점 간격(픽셀). 작을수록 곱고, 클수록 굵직 (4 ~ 16쯤)
    "angle": 45.0,          # 점 줄의 각도. 네 색이면 판마다 이 값에서 조금씩 돌림
    "ink": "#1a1a1a",       # 잉크 색 (한 색일 때 그 색, 네 색일 때 검정 판)
    "paper": "#f3eee2",     # 종이 색
    "brightness": 1.0,      # 밝기 (크면 점이 작아짐)
    "contrast": 1.0,        # 대비 (크면 진한 곳은 더 진하게, 옅은 곳은 더 옅게)
}

define halftone.presets = {
    "newspaper": {          # 신문 사진 (곱고 누런 종이)
        "mode": "mono",
        "cell": 5.0,
        "paper": "#ebe3cf",
    },
    "poster": {             # 네 색 포스터
        "mode": "cmyk",
        "cell": 9.0,
    },
    "comic": {              # 옛 만화 인쇄 (굵은 네 색 점, 밝게)
        "mode": "cmyk",
        "cell": 14.0,
        "brightness": 1.15,
        "contrast": 1.2,
    },
    "blue_print": {         # 파란 잉크 한 색, 줄 무늬
        "mode": "mono",
        "shape": "line",
        "ink": "#1d3c8f",
        "paper": "#f4f1e8",
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ halftone.set(cell=20.0, duration=2.0)        # 2초 동안 점이 점점 커짐
##     $ halftone.reset()                             # 이 파일의 값으로

define halftone.warper = "ease"
define halftone.redraw = 0.0

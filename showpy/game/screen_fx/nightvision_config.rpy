################################################################################
## Screen FX — 나이트비전(nightvision) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 야간 투시경으로 보는 화면처럼 바꿉니다.
## 밝기만 남겨 초록 한 색으로 끌어올리고, 어두운 곳에 노이즈, 가장자리를 어둡게 합니다.
## 효과가 보이는 동안 화면 글(왼쪽 위 글, 오른쪽 위 녹화 시간, 아래 [ZOOM])도 같이 뜹니다.
##
##     $ screen_fx.shaders("nightvision")            # 1번 자리에 나이트비전
##     $ screen_fx.shaders("nightvision", "vhs_crt") # + VHS (녹화 영상 느낌)
##     $ screen_fx.shaders("none")                   # 끄기 (화면 글도 같이 사라짐)
##     e "뭔가 움직였어." (fx="nightvision")          # 대사 줄 괄호로
##     $ nightvision.set(scope=True)                 # 동그란 망원경 테두리
##     $ nightvision.set(hud=False)                  # 화면 글 끄기
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "나이트비전")로 바꿔 저장하면
## nightvision_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

define nightvision.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define nightvision.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
define nightvision.exclude = ("say", "choice")

define nightvision.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)
    "color": "#8cff6e",     # 화면 색 (초록. "#b0e0ff" 하얀 열상, "#ffcf6e" 호박색)
    "gain": 1.8,            # 밝게 끌어올리는 정도 (어두운 장면이면 2.5쯤)
    "gamma": 0.8,           # 감마 (작을수록 어두운 곳이 밝게 보임)

    ## ── 질감 ──
    "noise": 0.18,          # 노이즈 (어두운 곳일수록 많이)
    "noise_size": 1.5,      # 노이즈 크기(픽셀)
    "soft": 0.5,            # 살짝 번짐
    "scanlines": 0.08,      # 가는 가로줄
    "flicker": 0.04,        # 깜빡임

    ## ── 테두리 ──
    "vignette": 0.6,        # 가장자리 어둡게
    "scope": False,         # True = 동그란 망원경 테두리 (바깥은 검게)

    ## ── 화면 글 (하나씩 켜고 끌 수 있음) ──
    "hud": True,            # 화면 글 전부 (False면 아래 것 모두 안 보임)
    "hud_label": True,      # 왼쪽 위 글 (아래 hud_text)
    "rec": True,            # 오른쪽 위 깜빡이는 점과 "REC" 글자
    "timer": True,          # 오른쪽 위 숫자 시간 00:00:12 (효과가 켜진 뒤부터 셈)
    "zoom": True,           # 아래 가운데 글 (아래 zoom_text)
    "hud_text": "Standard NVG\n40° FOV",   # 왼쪽 위 글. \n은 줄바꿈
    "zoom_text": "[ZOOM]",  # 아래 가운데 글

    ## ── 화면 이미지 (테두리, 조준선, 배터리 표시 같은 그림을 얹기) ──
    "hud_image": "",        # 그림 파일. "" = 없음. 예: "gui/nv_frame.png" (game 폴더 기준, 가운데가 투명한 PNG)
    "hud_image_fit": "full",    # "full" 화면 가득 늘림 / "center" 가운데에 원래 크기
    "hud_image_alpha": 1.0, # 진하기 (0 ~ 1)
    "hud_image_zoom": 1.0,  # 크기 (1 = 그대로, 0.5 = 절반, 2 = 두 배)
    "hud_image_rotate": 0.0,    # 회전 (도, 오른쪽으로 +)
    "hud_image_x": 0.0,     # 가로 자리 (픽셀, 가운데 기준. 오른쪽으로 +)
    "hud_image_y": 0.0,     # 세로 자리 (픽셀, 가운데 기준. 아래로 +)
}

## 화면 글 글꼴과 크기 (기본: 플러그인에 든 Neo둥근모 32)
define nightvision.hud_font = "screen_fx/fonts/neodgm.ttf"
define nightvision.hud_size = 32

define nightvision.presets = {
    "thermal": {            # 하얗게 (열상 카메라 느낌)
        "color": "#d8ecff",
        "gain": 1.5,
        "noise": 0.1,
    },
    "scope": {              # 망원경으로 엿보기 (동그란 테두리, 화면 글 없음)
        "scope": True,
        "hud": False,
    },
    "dark": {               # 아주 어두운 곳 (노이즈 많이)
        "gain": 2.6,
        "gamma": 0.6,
        "noise": 0.4,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ nightvision.set(hud_text="CAM 03\nB1 주차장")  # 화면 글 바꾸기 (한글은 hud_font에 있는 글자만)
##     $ nightvision.set(rec=False, timer=False)       # 오른쪽 위 REC와 시간 끄기
##     $ nightvision.set(hud_image="gui/nv_frame.png") # 화면에 그림 얹기
##     $ nightvision.preset("scope")
##     $ nightvision.reset()

define nightvision.warper = "ease"
define nightvision.redraw = 0.0

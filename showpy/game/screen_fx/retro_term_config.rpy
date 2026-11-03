################################################################################
## Screen FX — 레트로 터미널(retro_term) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 옛날 단색 모니터(형광체 화면)로 보는 것처럼 바꿉니다. 화면의 밝기를 형광체 색으로 칠해서,
## 녹색 형광체 + 검은 바탕이면 흰 글자가 녹색으로 빛납니다.
## 곡면 CRT(휘어짐·테두리)와 VHS(흐르는 띠·흔들림)를 이 효과 안에서 따로 켜고 끕니다.
## VHS_CRT 효과(덮개)와는 따로 노는 값이라, 덮개를 꺼도 이 효과만으로 브라운관 모양이 나옵니다.
##
## 이 효과는 기본으로는 꺼져 있다가(기본 효과는 "없음"), 스크립트에서 켭니다.
##     $ screen_fx.use("retro_term")                       # 레트로 터미널로 바꾸고 유지 (덮개 VHS는 기본으로 꺼짐)
##     $ screen_fx.clear()                                 # 선택취소: 기본 효과로
##     e "접속 중…" (fx="retro_term")                       # 대사 줄 괄호로
##     $ retro_term.preset("blue")                          # 파란 화면으로 (아래 presets)
##
## 덮개(VHS)를 같이 씌우면 휘어짐이 두 번 걸려서, 이 효과를 쓰는 동안 덮개는 기본으로 꺼집니다
## (아래 retro_term.overlay). 덮개를 켜려면 이 효과의 곡면 CRT를 끄는(crt: False) 쪽을 권합니다.
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "레트로 터미널" 버튼)로 바꿔 저장하면
## retro_term_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기 (False면 use("retro_term")을 해도 효과 없는 화면)
define retro_term.enabled = True

## 이 효과를 쓰는 동안 덮개(VHS)를 기본으로 켤지 (4.0)
##   True   켬: 레트로 터미널 위에 VHS를 한 번 더 씌움 (휘어짐이 두 번 걸리니 settings의 "crt"를 False로)
##   False  끔: 레트로 터미널만 (자체 곡면 CRT·VHS만. 기본)
## (screen_fx_config.rpy의 screen_fx.overlay가 False면 이 값과 상관없이 꺼짐.
##  한 번만 바꾸려면: $ screen_fx.use("retro_term", overlay=False) 또는 대사 괄호 (fx="retro_term", fx_overlay=False))
define retro_term.overlay = False

## 글자 빼기: 이 효과를 씌우지 않을 글자 (괄호 안에 고른 것만 원래대로 남음)
##   "say"      대사·이름 (대사창)
##   "choice"   선택지
##   "screens"  메뉴·화면 (퀵메뉴, 저장·환경설정 화면, show screen으로 띄운 화면)
## 예)
##   define retro_term.exclude = ()                     # 아무것도 안 뺌: 대사까지 형광체 색으로 (기본. 그림처럼 터미널 화면)
##   define retro_term.exclude = ("say",)               # 대사·이름만 원래 색 (쉼표 꼭: ("say",))
##   define retro_term.exclude = ("say", "choice")      # 대사·선택지는 원래 색, 퀵메뉴·메뉴는 터미널
## 한 번만 바꾸려면: $ screen_fx.use("retro_term", exclude=("say",)) 또는 대사 괄호 (fx="retro_term", fx_exclude=("say",))
define retro_term.exclude = ()

## 화면 효과 값. 적지 않은 값은 엔진의 기본값입니다.
define retro_term.settings = {
    "strength": 1.0,            # 전체 세기 (0 = 원래 화면, 1 = 완전히 터미널 화면)

    ## ── 색 ──
    "phosphor": "#5cff8a",      # 형광체 색: 글자와 밝은 곳이 빛나는 색
                                #   "#5cff8a" 녹색, "#ffb000" 호박색, "#bfeaff" 하늘색, "#e8e8e8" 흰색
    "background": "#061208",    # 바탕색: 가장 어두운 곳의 색 (꺼진 화면의 색)
                                #   "#061208" 검은 녹색, "#000000" 검정, "#1f6aa0" 파란 바탕(그림 2처럼)
    "color_keep": 0.0,          # 원래 색 남기기 (0 = 형광체 한 가지 색, 1 = 원래 색 그대로, 0.3 = 원래 색이 살짝)
    "brightness": 1.1,          # 밝기 (0.2~3)
    "contrast": 1.1,            # 대비 (1 = 그대로, 크면 밝은 곳과 어두운 곳 차이가 커짐)
    "ambient": 0.15,            # 유리에 비친 빛: 화면 가운데가 은은하게 밝음 (0 = 없음, 1 = 강하게)

    ## ── 빛 ──
    "bloom": 0.6,               # 빛 번짐: 밝은 글자 주변으로 빛이 퍼짐 (0 = 없음, 1 = 진하게, 2까지)
    "bloom_size": 3.0,          # 번짐 크기(픽셀). 클수록 넓게 퍼짐 (0.5~12)
    "flicker": 0.04,            # 깜빡임: 화면 전체 밝기가 흔들림 (0 = 없음, 0.1 = 눈에 띄게)
    "glow_line": 0.25,          # 위에서 아래로 지나가는 밝은 줄 (0 = 없음)
    "glow_line_speed": 0.12,    # 밝은 줄 속도 (1초에 화면 높이의 몇 배를 지나가는지. 0.12 = 약 8초에 한 번)

    ## ── 화면 결 ──
    "raster": "scanlines",      # "none" 없음, "scanlines" 가로 주사선, "pixels" 픽셀 격자(가로·세로),
                                # "subpixels" RGB 서브픽셀(빨강·초록·파랑 세로줄. 가까이서 본 모니터)
    "raster_size": 3.0,         # 결 간격(게임 화면 픽셀). 3 = 3픽셀마다 한 줄, 클수록 굵은 줄
    "raster_strength": 0.45,    # 결 진하기 (0 = 안 보임, 1 = 진하게. 진해진 만큼 밝기는 알아서 보정)
    "static_noise": 0.06,       # 정적 노이즈: 화면 전체 자글자글 (0 = 없음, 0.2 = 많이)
    "jitter": 0.0,              # 떨림: 화면이 미세하게 덜덜 떨림 (0 = 없음, 1 = 눈에 띄게)
    "rgb_shift": 0.0,           # RGB 어긋남(픽셀): 빨강·파랑이 옆으로 갈라짐 (0 = 없음, 2 = 살짝)

    ## ── 곡면 CRT (이 효과 안의 브라운관 모양. VHS_CRT 효과와는 따로 노는 값) ──
    "crt": True,                # True: 곡면 CRT 켜기 / False: 평평한 화면 (아래 값은 무시)
    "curvature": 0.25,          # 휘어짐 (0 = 평평, 0.25 = 그림처럼, 0.6 = 많이 휜 옛날 TV)
    "vignette": 0.35,           # 가장자리 어둡게 (0~1)
    "frame": True,              # True: 화면 둘레에 테두리(모니터 틀)를 그림
    "frame_size": 0.035,        # 테두리 두께 (화면 크기의 비율. 0.035 = 약 3.5%. 0이면 테두리 없이 휘기만)
    "frame_color": "#1c1c1a",   # 테두리 색 (모니터 틀 색)
    "frame_reflect": 0.35,      # 테두리에 비친 화면 빛 (0 = 없음, 1 = 강하게)
    "corner": 0.05,             # 화면 모서리 둥글기 (0 = 각진 모서리, 0.1 = 많이 둥글게)

    ## ── VHS (이 효과 안의 VHS. VHS_CRT 효과와는 따로 노는 값) ──
    "vhs": False,               # True: VHS 켜기 (흐르는 띠·수평 흔들림)
    "vhs_roll": 0.5,            # 위에서 아래로 흐르는 띠 세기 (0~1)
    "vhs_roll_speed": 1.0,      # 띠 속도 (1 = 약 12초에 한 번 지나감, 2 = 두 배 빠르게)
    "vhs_wobble": 0.4,          # 수평 흔들림: 줄마다 옆으로 출렁임 (0 = 없음, 1 = 많이)
    "vhs_noise": 0.4,           # 띠가 지나갈 때 지직거림 (0~1)
}

## 게임 중에 $ retro_term.preset("이름")으로 한 번에 바꿀 수 있는 묶음.
## 적은 값만 바뀌고 나머지는 위 settings 값을 따릅니다.
define retro_term.presets = {
    "green": {                  # 녹색 형광체 (그림 1: 검은 녹색 바탕에 빛나는 녹색 글자)
        "phosphor": "#5cff8a",
        "background": "#061208",
    },
    "blue": {                   # 파란 화면 (그림 2: 파란 바탕에 밝은 하늘색 글자)
        "phosphor": "#c8f0ff",
        "background": "#1f6aa0",
        "contrast": 1.3,
        "bloom": 0.4,
    },
    "amber": {                  # 호박색 형광체
        "phosphor": "#ffb000",
        "background": "#140a00",
    },
    "white": {                  # 흰색 형광체 (흑백 모니터)
        "phosphor": "#e8e8e8",
        "background": "#0a0a0a",
    },
    "flat": {                   # 평평한 화면 (곡면·테두리 없이 색과 결만)
        "crt": False,
    },
    "broken": {                 # 고장 난 화면 (VHS 켜고 강하게)
        "vhs": True,
        "vhs_roll": 1.0,
        "vhs_wobble": 1.2,
        "vhs_noise": 0.8,
        "jitter": 0.8,
        "rgb_shift": 2.0,
        "flicker": 0.15,
    },
}

## 게임 중에 값 바꾸기 (VHS와 같은 방법, 세이브·되감기에 저장)
##     $ retro_term.preset("amber", duration=1.0)          # 1초 동안 호박색으로
##     $ retro_term.set(vhs=True)                          # 이 효과의 VHS 켜기 (켜기·끄기 값은 바로 바뀜)
##     $ retro_term.set(curvature=0.6, duration=2.0)       # 2초 동안 화면이 더 휨
##     $ retro_term.preset("broken")                       # 순간 고장
##     $ renpy.pause(0.4)
##     $ retro_term.reset(duration=0.5)                    # 이 파일의 값으로 돌아감
##     $ retro_term.off(duration=2.0)                      # 서서히 원래 화면으로 (strength만 0으로)
## 화면 버튼:
##     textbutton "파란 화면" action retro_term.Preset("blue")
##     textbutton _("터미널 효과") action retro_term.Toggle()   # 플레이어용 켜기·끄기

## 터미널 글꼴로 대사 쓰기 (선택. 셰이더는 글꼴을 못 바꾸므로 대사 글꼴을 따로 바꿉니다)
## 플러그인에 들어 있는 Neo둥근모(픽셀 글꼴)를 쓰면 그림 같은 터미널 글씨가 됩니다.
##   이 효과를 켜는 동안만 바꾸려면 대사 괄호에 (ui_kit 대사 스타일이 있을 때):
##     e "접속 중…" (fx="retro_term", font="screen_fx/fonts/neodgm.ttf", size=32)
##   게임 전체를 터미널 글씨로 하려면 gui.rpy에서:
##     define gui.text_font = "screen_fx/fonts/neodgm.ttf"
##   Neo둥근모는 16의 배수 크기(16, 32, 48)에서 가장 또렷합니다.

## 부드럽게 바뀔 때의 속도 곡선 ("ease", "linear", "easein", "easeout" 등 ATL warper 이름)
define retro_term.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임 (깜빡임·노이즈·밝은 줄이 움직임). 1.0/30 이면 초당 30번
define retro_term.redraw = 0.0

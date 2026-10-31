################################################################################
## Screen FX — VHS·CRT 효과(vhs_crt) 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
## 각 값의 뜻은 README.md를 보세요.
##
## UI Kit 편집기(개발 모드에서 Shift+M → T로 "화면 효과" 탭 → "VHS" 버튼)로 바꿔
## 저장하면 vhs_crt_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
##
## 4.0부터 VHS는 "덮개"입니다. 기본 효과(없음 / ASCII / 레트로 터미널 / 게임보이) 위에 한 번 더
## 씌우고, 켜고 끄는 것만 고릅니다. 켜고 끄기는 screen_fx_config.rpy의 screen_fx.overlay와 각 효과의 <이름>.overlay.
##     $ screen_fx.set_overlay(False)          # 덮개 끔 (효과는 그대로)
##     $ screen_fx.set_overlay(True)           # 덮개 켬
##     e "치지직." (fx_overlay=True)           # 대사 괄호로
##
## 왜곡 정도는 아래 settings의 값으로 정합니다. 가장 눈에 띄는 것:
##   "warp_amount"        가장자리 휘어짐 (0 = 평평, 1 = 기본, 3 이상 = 크게 휨)
##   "distort_intensity"  띠가 지나갈 때 화면이 옆으로 밀리는 정도
##   "aberration"         색 번짐
## 게임 중에 바꾸기:
##     $ screen_fx.set_warp(3.0, duration=2.0)                 # 휘어짐만 2초 동안 3으로
##     $ vhs_crt.set(warp_amount=0.0, distort_intensity=0.0)   # 여러 값을 한 번에 (vhs_crt.set)
##     e "화면이 휜다." (fx_warp=3.0)                          # 대사 괄호로 (fx_warp="default"면 설정값으로)
################################################################################

## 효과 전체 켜기·끄기
define vhs_crt.enabled = True

## True: 게임 화면 전체에 자동으로 씌움 (따로 코드를 쓸 필요 없음)
## False: 원하는 곳에 직접 씌움 (camera at vhs_crt.effect 등, README 참고)
define vhs_crt.auto = True

## auto일 때 어디에 씌울지: "all" 항상, "game" 게임 중에만, "main_menu" 타이틀(과 타이틀에서 연 메뉴)에서만
## (Splash 플러그인의 타이틀 전 페이지는 "main_menu" 쪽에 들어갑니다)
define vhs_crt.scope = "all"

## 글자 빼기: VHS를 씌우지 않을 글자 (괄호 안에 고른 것만 깨끗하게 남음)
##   "say"      대사·이름 (대사창)
##   "choice"   선택지
##   "screens"  메뉴·화면 (퀵메뉴, 저장·환경설정 화면, show screen으로 띄운 화면)
## 예)
##   define vhs_crt.exclude = ()                            # 아무것도 안 뺌: 글자까지 전부 VHS (기본. 브라운관 TV를 보는 느낌)
##   define vhs_crt.exclude = ("say",)                      # 대사·이름만 깨끗하게 (쉼표 꼭 붙이기: ("say",))
##   define vhs_crt.exclude = ("say", "choice", "screens")  # 글자 전부 깨끗하게, 배경·캐릭터만 VHS
## 기본 효과가 "없음"일 때 이 값을 따릅니다. 기본 효과가 있으면, 그 효과가 아무것도 안 뺄 때는
## 덮개도 아무것도 안 뺍니다 (덮개가 늘 위에 오도록).
## 한 번만 바꾸려면: $ screen_fx.use("none", exclude=("say",))
define vhs_crt.exclude = ()

## 화면 효과 값. 적지 않은 값은 원본 셰이더(Godot)의 기본값입니다.
define vhs_crt.settings = {
    "strength": 1.0,                 # 효과 전체 세기 (0 = 원래 화면, 1 = 효과 100%)

    ## 화면 구조
    "resolution": None,              # 주사선·격자 개수 (가로, 세로). None = 게임 해상도의 절반
    "pixelate": True,                # 칸마다 한 색으로 채워 도트 느낌
    "scanlines_opacity": 0.4,        # 가로 주사선 진하기 (0~1)
    "scanlines_width": 0.25,         # 주사선 사이 틈 두께 (0~0.5)
    "grille_opacity": 0.3,           # 세로 RGB 격자 진하기 (0~1)

    ## 화면 흔들림 (VHS 트래킹)
    "roll": True,                    # 흔들리는 띠 켜기
    "roll_speed": 8.0,               # 띠 이동 속도 (양수 = 아래로, 음수 = 위로)
    "roll_size": 15.0,               # 띠 크기 (0~100)
    "roll_variation": 1.8,           # 띠 모양 변화 (0.1~5)
    "distort_intensity": 0.05,       # 띠가 지나갈 때 화면이 옆으로 밀리는 정도 (0~0.2)

    ## 노이즈
    "noise_opacity": 0.4,            # 띠를 따라 생기는 지직거림 (0~1)
    "noise_speed": 5.0,              # 지직거림 움직임 속도
    "static_noise_intensity": 0.06,  # 화면 전체 자글자글한 노이즈 (0~1)

    ## 색
    "aberration": 0.03,              # 색 번짐 (빨강·초록 어긋남, -1~1)
    "brightness": 1.4,               # 밝기 보정 (주사선·격자로 어두워진 만큼)
    "discolor": True,                # 바랜 VHS 색감 켜기
    "saturation": 0.5,               # 바랜 정도 (discolor일 때, 0 = 원래 색, 1 = 흑백)
    "contrast": 1.2,                 # 대비 (discolor일 때)

    ## 브라운관 모양
    "warp_amount": 1.0,              # 가장자리 휘어짐 (0~5)
    "clip_warp": False,              # 휘어서 생긴 바깥 검은 테두리를 투명하게
    "vignette_intensity": 0.4,       # 가장자리 어둡게 하는 범위
    "vignette_opacity": 0.5,         # 가장자리 어둡기 (0~1)
}

## 게임 중에 $ vhs_crt.preset("이름")으로 바꿀 수 있는 묶음.
## 적은 값만 바뀌고 나머지는 위 settings 값을 따릅니다.
define vhs_crt.presets = {
    "clean": {
        "roll": False,
        "noise_opacity": 0.0,
        "static_noise_intensity": 0.02,
        "aberration": 0.01,
        "discolor": False,
    },
    "broken": {
        "roll_speed": 20.0,
        "distort_intensity": 0.15,
        "noise_opacity": 0.9,
        "static_noise_intensity": 0.2,
        "aberration": 0.3,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장, 새 게임이면 이 파일 값으로)
##     $ vhs_crt.set(noise_opacity=0.9, aberration=0.3)        # 바로
##     $ vhs_crt.set(distort_intensity=0.2, duration=1.0)      # 1초 동안 부드럽게
##     $ vhs_crt.preset("broken", duration=0.5)                # 프리셋으로
##     $ vhs_crt.reset(duration=1.0)                           # 이 파일의 값으로 돌아감
##     $ vhs_crt.off(duration=2.0)                             # 서서히 끄기 (strength만 0으로)
##     $ vhs_crt.on(duration=2.0)                              # 다시 켜기
## 순간적인 지직거림:
##     $ vhs_crt.preset("broken")
##     pause 0.3
##     $ vhs_crt.reset(duration=0.5)
## 화면 버튼:
##     textbutton "지직" action vhs_crt.Set(noise_opacity=1.0, duration=0.3)
##     textbutton "고장" action vhs_crt.Preset("broken")
##     textbutton _("VHS 효과") action vhs_crt.Toggle()      # 플레이어용 켜기·끄기

## 부드럽게 바뀔 때의 속도 곡선 ("ease", "linear", "easein", "easeout" 등 ATL warper 이름)
define vhs_crt.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임. 1.0/30 이면 초당 30번 (저사양 PC용)
define vhs_crt.redraw = 0.0

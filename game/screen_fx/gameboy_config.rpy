################################################################################
## Screen FX — 게임보이(gameboy) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 옛날 휴대용 게임기의 LCD 화면처럼 바꿉니다.
## 화면을 큰 점으로 나누고, 밝기에 따라 4가지 색(또는 2가지 색)으로만 칠합니다.
##
## 표현 방식은 두 가지 중에 고릅니다 (아래 "mode"):
##   "dither" 디더링: 색과 색 사이의 밝기를 점 무늬로 섞어서 표현합니다.
##                    그러데이션·그림자·사진 같은 CG도 부드럽게 넘어갑니다.
##   "pixel"  픽셀화: 무늬 없이 가장 가까운 색으로 딱 끊어서 칠합니다.
##                    넓은 면이 한 색이 되어 도트 게임 그림처럼 또렷합니다.
##
## 이 효과는 기본으로는 꺼져 있다가(기본 효과는 "없음"), 스크립트에서 켭니다.
##     $ screen_fx.use("gameboy")                          # 게임보이 화면으로 바꾸고 유지
##     $ screen_fx.use("gameboy", overlay=False)           # 덮개(VHS) 없이 LCD 화면만
##     $ screen_fx.clear()                                 # 선택취소: 기본 효과로
##     e "삐빅." (fx="gameboy")                              # 대사 줄 괄호로
##     $ gameboy.preset("pocket")                           # 회색 화면으로 (아래 presets)
##     $ gameboy.set(mode="pixel")                          # 픽셀화로 바꾸기
##
## LCD 화면만 보이게 하려면 아래 gameboy.overlay를 False로 (덮개 VHS를 안 씌움)
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "게임보이" 버튼)로 바꿔 저장하면
## gameboy_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기 (False면 use("gameboy")를 해도 효과 없는 화면)
define gameboy.enabled = True

## 이 효과를 쓰는 동안 덮개(VHS)를 기본으로 켤지 (4.0)
##   True   켬: 게임보이 위에 VHS를 한 번 더 씌움 (브라운관 TV에 연결한 느낌. 기본)
##   False  끔: 게임보이만 (진짜 휴대용 LCD처럼 평평하고 깨끗함)
## (screen_fx_config.rpy의 screen_fx.overlay가 False면 이 값과 상관없이 꺼짐.
##  한 번만 바꾸려면: $ screen_fx.use("gameboy", overlay=False) 또는 대사 괄호 (fx="gameboy", fx_overlay=False))
define gameboy.overlay = True

## 글자 빼기: 이 효과를 씌우지 않을 글자 (괄호 안에 고른 것만 원래대로 남음)
##   "say"      대사·이름 (대사창)
##   "choice"   선택지
##   "screens"  메뉴·화면 (퀵메뉴, 저장·환경설정 화면, show screen으로 띄운 화면)
## 예)
##   define gameboy.exclude = ()                     # 아무것도 안 뺌: 대사까지 게임보이 색 (기본)
##   define gameboy.exclude = ("say",)               # 대사·이름만 원래 색 (쉼표 꼭: ("say",))
##   define gameboy.exclude = ("say", "choice")      # 대사·선택지는 원래 색, 퀵메뉴·메뉴는 게임보이 색
## 한 번만 바꾸려면: $ screen_fx.use("gameboy", exclude=("say",)) 또는 대사 괄호 (fx="gameboy", fx_exclude=("say",))
##
## 빼지 않은 글자를 어떻게 그릴지는 아래 settings의 "text_pixel"로 정합니다.
##   False (기본) 글자는 4색만 입히고 모양은 그대로 → 대사를 읽을 수 있음
##   True         글자도 점으로 쪼갬 → 진짜 게임보이처럼, 대신 작은 글자는 못 읽음
define gameboy.exclude = ()

## 화면 효과 값. 적지 않은 값은 엔진의 기본값입니다.
define gameboy.settings = {
    "strength": 1.0,            # 전체 세기 (0 = 원래 화면, 1 = 완전히 게임보이 화면)

    ## ── 화면 ──
    "mode": "dither",           # 표현 방식: "dither" 디더링(점 무늬로 섞기) / "pixel" 픽셀화(딱 끊기)
    "pixel_size": 4.0,          # 점 하나의 크기(게임 화면 픽셀). 정수만 씀
                                #   1280×720 게임에서 4 = 가로 320점, 6 = 가로 213점(더 굵직), 2 = 가로 640점(곱게)
    "dither": "4x4",            # 디더링 무늬: "4x4" (굵은 바둑판·격자) / "8x8" (더 고운 무늬, 단계가 많음)
    "dither_strength": 1.0,     # 디더링 세기 (1 = 무늬로 고르게 섞음, 0.5 = 색이 바뀌는 근처에만 무늬,
                                #   0 = 무늬 없음 = 픽셀화와 같음). 무늬가 너무 많아 보이면 0.5쯤으로
    "text_pixel": False,        # 글자도 점으로 쪼갤지 (위 exclude 설명 참고)
                                #   False: 대사·선택지·메뉴는 색만 바뀜 (기본, 읽기 편함)
                                #   True:  화면 전체를 한꺼번에 점으로 (대사 글꼴이 아주 크거나 픽셀 글꼴일 때)

    ## ── 색 ──
    "colors": 4,                # 색 수: 4 (4색) / 2 (2색: 1번과 4번 색만 씀. 흑백 만화 같은 느낌)
    "color1": "#1c3f04",        # 1번: 가장 어두운 색 (검은 곳, 글자 테두리, 그림자)
    "color2": "#456306",        # 2번: 어두운 색
    "color3": "#74870a",        # 3번: 밝은 색
    "color4": "#939f06",        # 4번: 가장 밝은 색 (흰 곳, 꺼진 LCD 바탕)
                                #   기본값은 올리브빛 초록 (옛 게임보이 화면 사진처럼)
    "brightness": 1.0,          # 밝기 (1 = 그대로. 크면 밝은 색이 많아짐)
    "contrast": 1.0,            # 대비 (1 = 그대로. 크면 가장 어두운·가장 밝은 색이 많아지고 중간 색이 줄어듦)
    "gamma": 1.0,               # 감마 (1 = 그대로, 0.6 = 어두운 곳이 밝아짐, 1.5 = 어두운 곳이 더 어두워짐)
                                #   어두운 CG가 1번 색으로 뭉개지면 0.6~0.8로

    ## ── LCD (화면 질감) ──
    "grid": 0.4,                # 점 사이 틈: 점과 점 사이로 밝은 바탕이 비침 (0 = 없음, 1 = 진하게)
    "grid_width": 0.25,         # 틈 두께 (점 크기의 비율. 0.25 = 점 4픽셀 중 1픽셀)
    "shadow": 0.4,              # 점 그림자: 어두운 점의 그림자가 오른쪽 아래로 비침 (0 = 없음, 1 = 진하게)
    "shadow_offset": 0.5,       # 그림자 거리 (점 하나 = 1. 0.5 = 점 반 개만큼)
    "texture": 0.2,             # LCD 얼룩: 비스듬한 결과 넓은 얼룩 (0 = 없음, 0.5 = 눈에 띄게)
}

## 게임 중에 $ gameboy.preset("이름")으로 한 번에 바꿀 수 있는 묶음.
## 적은 값만 바뀌고 나머지는 위 settings 값을 따릅니다.
define gameboy.presets = {
    "dmg": {                    # 올리브 초록 (기본값과 같음. 다른 프리셋에서 돌아올 때)
        "color1": "#1c3f04",
        "color2": "#456306",
        "color3": "#74870a",
        "color4": "#939f06",
    },
    "green": {                  # 선명한 초록 (도트 그림에서 흔히 쓰는 게임보이 4색)
        "color1": "#0f380f",
        "color2": "#306230",
        "color3": "#8bac0f",
        "color4": "#9bbc0f",
    },
    "pocket": {                 # 회색 (작아진 게임보이처럼 흑백에 가까운 화면)
        "color1": "#1e1e1c",
        "color2": "#4d4d47",
        "color3": "#8c8c82",
        "color4": "#c5c5b8",
    },
    "light": {                  # 청록 백라이트 (어두운 곳에서 빛나는 화면)
        "color1": "#002b26",
        "color2": "#0d5c4f",
        "color3": "#32a48a",
        "color4": "#7fe0c4",
    },
    "bw": {                     # 흑백
        "color1": "#000000",
        "color2": "#555555",
        "color3": "#aaaaaa",
        "color4": "#ffffff",
    },
    "blood": {                  # 붉은 화면 (공포 장면용: 검붉은 색과 바랜 뼛빛)
        "color1": "#0d0303",
        "color2": "#4b0b0b",
        "color3": "#9a1d1d",
        "color4": "#e3d6c4",
    },
    "1bit": {                   # 2색 (검정과 종이색만. 고운 무늬로 명암을 표현)
        "colors": 2,
        "color1": "#121212",
        "color4": "#e8e4d8",
        "dither": "8x8",
        "pixel_size": 2.0,
        "grid": 0.0,
        "shadow": 0.0,
    },
    "clean": {                  # LCD 질감 없이 디더링 무늬만 (틈·그림자·얼룩 끔)
        "grid": 0.0,
        "shadow": 0.0,
        "texture": 0.0,
    },
}

## 게임 중에 값 바꾸기 (VHS와 같은 방법, 세이브·되감기에 저장)
##     $ gameboy.preset("blood", duration=1.0)             # 1초 동안 붉은 화면으로
##     $ gameboy.set(mode="pixel")                         # 픽셀화로 (표현 방식은 바로 바뀜)
##     $ gameboy.set(mode="dither")                        # 다시 디더링으로
##     $ gameboy.set(pixel_size=8.0)                       # 점을 크게
##     $ gameboy.set(pixel_size=24.0, duration=2.0)        # 2초 동안 점이 한 단계씩 커짐 (모자이크처럼)
##     $ gameboy.set(gamma=0.7, duration=2.0)              # 2초 동안 어두운 곳이 밝아짐
##     $ gameboy.set(text_pixel=True)                      # 글자도 점으로
##     $ gameboy.reset(duration=0.5)                       # 이 파일의 값으로 돌아감
##     $ gameboy.off(duration=2.0)                         # 서서히 원래 화면으로 (strength만 0으로)
## 프리셋은 그 프리셋에 적힌 값만 바꾸고, 앞에서 set()으로 바꾼 값은 지웁니다.
## 그래서 "붉은 화면 + 픽셀화"는 순서대로:
##     $ gameboy.preset("blood")
##     $ gameboy.set(mode="pixel")
## 화면 버튼:
##     textbutton "회색 화면" action gameboy.Preset("pocket")
##     textbutton "픽셀화" action gameboy.Set(mode="pixel")
##     textbutton _("게임보이 효과") action gameboy.Toggle()   # 플레이어용 켜기·끄기

## 게임보이 글꼴로 대사 쓰기 (선택. 셰이더는 글꼴을 못 바꾸므로 대사 글꼴을 따로 바꿉니다)
## 플러그인에 들어 있는 Neo둥근모(픽셀 글꼴)를 쓰면 화면과 잘 어울립니다.
##   이 효과를 켜는 동안만 바꾸려면 대사 괄호에 (ui_kit 대사 스타일이 있을 때):
##     e "삐빅." (fx="gameboy", font="screen_fx/fonts/neodgm.ttf", size=32)
##   Neo둥근모는 16의 배수 크기(16, 32, 48)에서 가장 또렷합니다.
##   "text_pixel": True로 글자까지 점으로 쪼갤 때는, 글자 크기가 점 크기의 16배쯤은 되어야 또렷하게 읽힙니다.
##     (점 2픽셀이면 글자 32, 점 4픽셀이면 글자 64. 작은 글씨를 쓰려면 text_pixel은 False로)

## 부드럽게 바뀔 때의 속도 곡선 ("ease", "linear", "easein", "easeout" 등 ATL warper 이름)
define gameboy.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임
define gameboy.redraw = 0.0

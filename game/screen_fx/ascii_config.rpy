################################################################################
## Screen FX — ASCII 효과(ascii) 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 화면을 글자 칸으로 나누고, 칸마다 밝기에 맞는 글자로 다시 그립니다.
## 글자 하나가 픽셀 하나 역할을 합니다. (옛날 텍스트 화면·로그라이크 콘솔 느낌)
##
## 이 효과는 기본으로는 꺼져 있다가(기본 효과는 "없음"), 스크립트에서 켭니다.
##     $ screen_fx.use("ascii")                       # ASCII로 바꾸고 유지 (덮개 VHS는 아래 ascii.overlay대로)
##     $ screen_fx.use("ascii", overlay=False)        # ASCII만 (덮개 끔)
##     $ screen_fx.clear()                            # 선택취소: 기본 효과로
##     e "글자로 된 세계." (fx="ascii")                # 대사 줄 괄호로
##     e "덮개 없이." (fx="ascii", fx_overlay=False)
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "ASCII" 버튼)로 바꿔 저장하면
## ascii_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기 (False면 use("ascii")를 해도 효과 없는 화면)
define ascii.enabled = True

## 이 효과를 쓰는 동안 덮개(VHS)를 기본으로 켤지 (4.0)
##   True   켬: ASCII 위에 VHS를 한 번 더 씌움 (브라운관에 비친 글자 화면. 기본)
##   False  끔: ASCII만 (깨끗한 글자 화면)
## (screen_fx_config.rpy의 screen_fx.overlay가 False면 이 값과 상관없이 꺼짐.
##  한 번만 바꾸려면: $ screen_fx.use("ascii", overlay=False) 또는 대사 괄호 (fx="ascii", fx_overlay=False))
define ascii.overlay = True

## 글자 빼기: 이 효과를 씌우지 않을 글자 (괄호 안에 고른 것만 원래대로 또렷하게 남음)
##   "say"      대사·이름 (대사창)
##   "choice"   선택지
##   "screens"  메뉴·화면 (퀵메뉴, 저장·환경설정 화면, show screen으로 띄운 화면)
## 예)
##   define ascii.exclude = ("say", "choice", "screens")   # 글자는 전부 원래대로, 배경·캐릭터만 글자로 (기본)
##   define ascii.exclude = ("say", "choice")              # 퀵메뉴·메뉴까지는 글자로 (저장 화면도 글자가 되니 주의)
##   define ascii.exclude = ()                             # 아무것도 안 뺌: 대사창까지 전부 글자로 (연출용)
## 한 번만 바꾸려면:
##   $ screen_fx.use("ascii", exclude=())                  # 스크립트
##   e "전부 글자로." (fx="ascii", fx_exclude=())           # 대사 괄호
define ascii.exclude = ("say", "choice", "screens")

## 글자에 쓸 글꼴 (game 폴더 기준 경로)
##   None                       플러그인에 들어 있는 Neo둥근모 (screen_fx/fonts/neodgm.ttf)
##   "fonts/NeoDGMpro.ttf"       game/fonts에 넣어 둔 다른 글꼴
## 픽셀 글꼴이면 "crisp": True와 함께 쓸 때 가장 또렷합니다.
define ascii.font = None

## 화면 효과 값. 적지 않은 값은 엔진의 기본값입니다.
define ascii.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면, 1 = 완전히 글자로)

    ## ── 글자 칸 (글자 하나 = 픽셀 하나) ──
    "cell": 16,             # 글자 칸 높이(픽셀). 작을수록 촘촘해서 그림이 잘 보이고, 클수록 글자가 크게 보임
                            #   8 = 아주 촘촘 (글자는 거의 안 읽힘), 16 = 기본, 32 = 큼직한 글자, 48 이상 = 그림이 무너짐
    "aspect": 0.5,          # 칸 가로 ÷ 세로
                            #   0.5 = 반각 글자 모양 (8×16, 옛날 텍스트 화면·로그라이크 콘솔)
                            #   1.0 = 정사각형 칸 (타일 느낌. 글자 양옆이 비어 보임)
    "crisp": True,          # True: 칸 높이를 8의 배수로 맞춤. 16, 32, 48처럼 16의 배수에서 Neo둥근모가 가장 또렷함
                            # False: 적은 크기 그대로 (어중간한 크기에서는 글자가 조금 흐려짐)

    ## ── 글자 목록 (어두운 칸 → 밝은 칸 순서. 맨 앞이 가장 어두운 곳) ──
    "chars": " .:-=+*#%@",  # 기본
                            #   " .,:;ox%#@"        던전풍
                            #   " .'^\":;!|/7xX#"   가는 선
                            #   " .oO0@"            동그라미
                            #   " ░▒▓█"             블록 (점이 아니라 면으로 채워짐)
                            #   "01"                0과 1 (두 단계)
                            # 글자 수는 자유. 많을수록 밝기 단계가 촘촘해짐. 맨 앞을 " "(빈칸)으로 두면 어두운 곳이 바탕색이 됨

    ## ── 색 ──
    "color_mode": "color",  # "mono"      한 가지 색: 모든 글자를 아래 "fg" 색으로 (옛날 단색 모니터)
                            # "color"     원래 색: 칸의 원래 색을 글자에 입힘 (컬러 텍스트 게임처럼)
                            # "palette16" 16색: 원래 색을 옛날 PC의 16색 중 가장 가까운 색으로 (로그라이크 콘솔 느낌)
    "fg": "#c8c8c8",        # "mono"일 때 글자 색. "#33ff66" 녹색 단말기, "#ffb000" 호박색 단말기, "#c8c8c8" 회색
    "bg": "#000000",        # 바탕색 (글자 사이 빈 곳). "#000000" 검정, "#000080" 남색
    "color_boost": 1.3,     # "color"/"palette16"일 때 글자 색을 밝게 하는 배율 (글자가 칸을 다 채우지 않아 어두워 보이므로)
    "bg_tint": 0.0,         # 바탕(글자 사이 빈 곳)에 칸의 원래 색을 비치는 정도
                            #   0.0 = 바탕은 "bg" 색 그대로 (기본. 가장 글자다움)
                            #   0.15~0.3 = 원래 그림이 어둡게 비쳐 알아보기 쉬움 (VHS를 덮으면 화면이 어두워지므로 이때 추천)
                            #   1.0 = 바탕이 칸 색으로 꽉 참 (모자이크 위에 글자)

    ## ── 밝기 (글자 고르기에 쓰는 밝기) ──
    "brightness": 1.0,      # 크면 밝은 글자(@, #)가 많아짐, 작으면 빈칸·점이 많아짐
    "contrast": 1.0,        # 크면 밝은 곳과 어두운 곳의 글자 차이가 커짐
    "invert": False,        # True: 밝기를 뒤집음 (어두운 곳에 꽉 찬 글자. 밝은 바탕색과 같이 쓸 때)
}

## 게임 중에 $ ascii.preset("이름")으로 한 번에 바꿀 수 있는 묶음.
## 적은 값만 바뀌고 나머지는 위 settings 값을 따릅니다.
define ascii.presets = {
    "terminal": {               # 녹색 단색 모니터
        "color_mode": "mono",
        "fg": "#33ff66",
        "bg": "#001a08",
    },
    "amber": {                  # 호박색 단색 모니터
        "color_mode": "mono",
        "fg": "#ffb000",
        "bg": "#140c00",
    },
    "dungeon": {                # 로그라이크 콘솔 (16색 + 던전풍 글자)
        "color_mode": "palette16",
        "chars": " .,:;ox%#@",
        "color_boost": 1.6,
    },
    "blocks": {                 # 블록 문자로 면을 채움
        "chars": " ░▒▓█",
    },
    "big": {                    # 큼직한 글자
        "cell": 32,
    },
    "glow": {                   # VHS 덮개와 같이 쓸 때 추천: 바탕에 그림이 비쳐 어두워지지 않음
        "bg_tint": 0.2,         #   $ screen_fx.use("ascii", overlay=True)
        "color_boost": 1.6,     #   $ ascii.preset("glow")
    },
}

## 게임 중에 값 바꾸기 (VHS와 같은 방법, 세이브·되감기에 저장)
##     $ ascii.set(cell=32, duration=2.0)          # 2초 동안 글자가 점점 커짐 (화면이 글자로 무너지는 연출)
##     $ ascii.set(chars=" ░▒▓█")                 # 글자 목록 바꾸기 (바로 바뀜)
##     $ ascii.preset("terminal", duration=0.5)    # 프리셋으로
##     $ ascii.reset(duration=1.0)                 # 이 파일의 값으로 돌아감
##     $ ascii.off(duration=2.0)                   # 서서히 원래 화면으로 (strength만 0으로)
##     $ ascii.on(duration=2.0)                    # 다시 글자로
## 화면 버튼:
##     textbutton "단말기" action ascii.Preset("terminal")
##     textbutton _("ASCII 효과") action ascii.Toggle()   # 플레이어용 켜기·끄기

## 부드럽게 바뀔 때의 속도 곡선 ("ease", "linear", "easein", "easeout" 등 ATL warper 이름)
define ascii.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임. 움직임이 없는 효과라 1.0/30 으로 줄여도 티가 잘 안 남
define ascii.redraw = 0.0

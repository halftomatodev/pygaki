################################################################################
## UI Kit — 커스텀 UI 설정 (커서·클릭 대기 표시·대사 소리·텍스트 속도·퀵메뉴)
##
## 이 파일만 고치면 됩니다. 처음에는 모든 기능이 꺼져 있어서 렌파이 기본과 같아요.
## 쓰려는 기능만 True로 바꾸고 이미지·소리 경로를 적으세요.
##
## 편집기(개발 모드에서 Shift+M)로 바꿔 저장하면 custom_ui_layout.rpy가
## 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

init offset = 1


## ── 이 기능을 쓸지 ───────────────────────────────────────────────────────────
## False면 아래 설정을 모두 무시하고 렌파이 기본과 똑같아집니다.

define custom_ui.enabled = True


## ── 마우스 커서 애니메이션 ───────────────────────────────────────────────────
## 커서·클릭 대기 표시 애니메이션은 초당 24프레임으로 고정입니다. (UI Kit 3.0)
## 그림 한 장을 몇 프레임 보여줄지만 고릅니다 (_hold).
##   1  1프레임마다: 초당 24장. 12장이면 0.5초에 한 바퀴 (1초에 두 바퀴)
##   2  2프레임마다: 초당 12장. 12장이면 1초에 한 바퀴 (기본)
## 그림은 최대 12장까지 고르는 걸 권합니다. (편집기 칸이 12개. 여기에는 더 적어도 동작함)
## 편집기(Shift+M → "커서/대사 소리" 탭)에서 칸을 눌러 그림을 고를 수 있어요.

define custom_ui.cursor = False

## 프레임 이미지 (순서대로 재생). game 폴더 기준 경로
define custom_ui.cursor_frames = [
    "gui/cursor/cursor1.png",
    "gui/cursor/cursor2.png",
    "gui/cursor/cursor3.png",
    "gui/cursor/cursor4.png",
    "gui/cursor/cursor5.png",
    "gui/cursor/cursor6.png",
]

## 그림 한 장을 보여줄 프레임 수 (24fps 기준): 1 또는 2
define custom_ui.cursor_hold = 2

## 커서를 그리는 방식
##   "software"  렌파이가 화면에 직접 그림 (기본). 24fps가 정확하고 그림 크기 제한이 없음.
##               아주 느린 PC에서는 커서가 아주 살짝 늦게 따라올 수 있음
##   "hardware"  렌파이 기본 커서 (운영체제가 그림). 반응이 가장 빠르지만 초당 20프레임까지만
##               (그래서 _hold가 1이면 초당 20장, 2면 10장)
define custom_ui.cursor_mode = "software"

## 클릭 기준점 (이미지 왼쪽 위에서 x, y 픽셀)
define custom_ui.cursor_hotspot = (0, 0)


## ── 클릭 대기 표시(ctc) 애니메이션 ───────────────────────────────────────────

define custom_ui.ctc = False

## 이미지 이름. Character(ctc="ctc_anim")처럼 이 이름으로도 쓸 수 있어요.
define custom_ui.ctc_name = "ctc_anim"

define custom_ui.ctc_frames = [
    "gui/ctc/ctc1.png",
    "gui/ctc/ctc2.png",
    "gui/ctc/ctc3.png",
    "gui/ctc/ctc4.png",
    "gui/ctc/ctc5.png",
    "gui/ctc/ctc6.png",
]

## 그림 한 장을 보여줄 프레임 수 (24fps 기준): 1 또는 2
define custom_ui.ctc_hold = 2

## ctc를 따로 지정하지 않은 모든 캐릭터(내레이션 포함)에 이 표시를 씀
define custom_ui.ctc_all_characters = True

## 표시 위치: "nestled"(글자 바로 뒤), "nestled-close", "fixed"(say 스크린에서 정한 자리)
define custom_ui.ctc_position = "nestled"


## ── 대사 출력 소리 ───────────────────────────────────────────────────────────
## 대사 글자가 나오는 동안 재생되고, 다 나오면 멈춥니다. None이면 끔.
## 캐릭터마다 바꾸려면:  Character("이름", cb_typing_sound="audio/other.ogg")
## 그 캐릭터만 끄려면:   Character("이름", cb_typing_sound=None)

define custom_ui.typing_sound = None    # 예: "audio/type.ogg"

## 볼륨 (0.0 ~ 1.0). 환경설정의 "효과음 음량"에도 같이 따릅니다.
define custom_ui.typing_volume = 1.0

## 글자가 다 나올 때까지 반복 재생
define custom_ui.typing_loop = True


## ── 텍스트 출력 속도 ─────────────────────────────────────────────────────────
## 1초에 나오는 글자 수. 0이면 한 번에 다 나옴. None이면 options.rpy 값을 그대로 씀.
## 처음 실행할 때(그리고 이 값을 바꿨을 때)만 적용됩니다.
## 플레이어가 환경설정에서 바꾸면 그 값이 유지돼요.

define custom_ui.text_cps = None    # 예: 20


## ── 퀵메뉴 ───────────────────────────────────────────────────────────────────
## 새 게임을 시작할 때 화면 아래 퀵메뉴(되감기·저장하기 등)를 보일지.
## 게임 중에 $ quick_menu = True 로 켜고 끌 수도 있어요.

define custom_ui.quick_menu = True

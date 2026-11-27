################################################################################
## pygaki — 퀵메뉴 설정 (pygaki v2.0-beta1)
##
## 게임 중 화면 아래의 퀵메뉴(되감기, 대사록, 넘기기, 자동진행, 저장하기,
## Q.저장하기, Q.불러오기, 설정)를 꾸밉니다.
##   - 항목마다 자리 옮기기, 숨기기
##   - 막대 전체 뒤, 항목 뒤에 그림·영상(webm)·색
##
## 개발 모드에서 F9 → "퀵메뉴" 탭에서 끌어서 옮기고 Ctrl+S로 저장하면
## quick_menu_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
##
## 넣자마자 보이는 모양은 렌파이 기본 퀵메뉴와 같습니다.
## 글꼴·크기·색은 렌파이 기본처럼 gui.rpy의 gui.quick_button_text_* 값을 씁니다.
##
## 퀵메뉴를 켜고 끄는 값(새 게임에서 보일지)은 custom_ui_config.rpy의 custom_ui.quick_menu입니다.
################################################################################

## False: 이 기능을 끔. 그 게임의 screens.rpy 퀵메뉴가 그대로 나옵니다.
##        (screens.rpy의 quick_menu를 직접 고쳐 둔 게임은 False로 두세요)
define qmenu.enabled = True

## 막대 전체 뒤 배경. 그림 경로, 영상 경로(webm), 색("#00000088") 중 하나. None = 없음
## (옮기지 않고 아래 줄에 남은 항목들 뒤에 깔립니다)
define qmenu.bar_background = None

## 막대 배경과 그 안 항목 사이 여백 (가로, 세로 픽셀)
define qmenu.bar_padding = (20, 6)

## 모든 항목 뒤 배경. 그림, 영상, 색 중 하나. None = 없음
## 항목마다 다르게 하려면 편집기에서 그 항목을 고르고 [이 항목 배경]을 고르세요.
define qmenu.item_background = None

## 항목 목록. 안 적으면(None) 렌파이 기본과 같은 8개입니다:
##   back 되감기 / history 대사록 / skip 넘기기 / auto 자동진행 / save 저장하기 /
##   qsave Q.저장하기 / qload Q.불러오기 / prefs 설정
## 바꾸고 싶을 때만 주석(##)을 풀고 고치세요.
##   "x", "y"        그 자리(항목 가운데, 픽셀)에. 안 적으면 아래 가운데 한 줄에
##   "hidden": True  숨기기
##   "background"    이 항목 뒤 그림·영상·색
##   "show_if"       보일 조건: 예) "renpy.variant('pc')" PC에서만
##
## define qmenu.items = [
##     { "id": "back",    "text": _("Back"),    "action": Rollback() },
##     { "id": "history", "text": _("History"), "action": ShowMenu("history") },
##     { "id": "skip",    "text": _("Skip"),    "action": Skip(), "alternate": Skip(fast=True, confirm=True) },
##     { "id": "auto",    "text": _("Auto"),    "action": Preference("auto-forward", "toggle") },
##     { "id": "save",    "text": _("Save"),    "action": ShowMenu("save") },
##     { "id": "qsave",   "text": _("Q.Save"),  "action": QuickSave() },
##     { "id": "qload",   "text": _("Q.Load"),  "action": QuickLoad() },
##     { "id": "prefs",   "text": _("Prefs"),   "action": ShowMenu("preferences") },
## ]
define qmenu.items = None

# Hotkeys 플러그인 (단축키)

단축키를 추가하거나 렌파이 기본 단축키에서 키를 빼고, **조작방법 화면의 설명도 같은 설정 파일에서** 관리하는 렌파이 플러그인입니다.

버전 1.1 · 렌파이 8.5.3에서 만들고 테스트했습니다.

- 1.1: `ui_kit` 편집기(개발 모드 Shift+M)와 pygaki 앱의 [GUI 편집]에 **"단축키" 탭**이 생깁니다(`editor/editor_hotkeys.rpy`, 아래 3장). 줄마다 `"do"`(정해 둔 동작 이름)와 `"help"`(조작방법 화면 설명)를 적을 수 있고, 설명을 적은 단축키는 조작방법 목록에 저절로 들어갑니다. Shift+키를 새로 걸면, Shift를 가리지 않던 같은 키의 렌파이 기본 단축키는 Shift 없을 때만으로 바뀌어 둘이 함께 실행되지 않습니다.

---

## 1. 설치

`hotkeys` 폴더를 프로젝트의 `game` 폴더 안에 넣고 `hotkeys_config.rpy`를 고칩니다. **`screens.rpy`는 고치지 않아도 됩니다.**

이 플러그인은 렌파이 기본 `screens.rpy`의 `keyboard_help` 스크린(조작방법 화면의 키보드 탭)을 대신 정의합니다.

```
game/hotkeys/
├── hotkeys.rpy          엔진 (고치지 않음)
├── hotkeys_config.rpy   설정
├── hotkeys_layout.rpy   편집 화면이 저장한 값 (저장하면 생김, 지우면 설정 파일 값으로)
├── editor/              편집 화면 "단축키" 탭 (ui_kit이 있을 때만, 고치지 않음)
└── README.md            이 설명서 (배포판에는 자동으로 빠짐)
```

제거할 때는 폴더를 `.rpyc` 파일까지 통째로 지웁니다.

---

## 2. 설정

### 새 단축키

```renpy
define hotkeys.bindings = [
    { "keys": [ "K_v" ], "action": ShowMenu("preferences") },     # V: 환경설정
    { "keys": [ "K_F5" ], "action": QuickSave() },                 # F5: 퀵세이브
    { "keys": [ "K_F9" ], "action": QuickLoad() },                 # F9: 퀵로드
]
```

키 이름은 렌파이 방식입니다. `K_v`(V), `shift_K_s`(Shift+S), `ctrl_K_l`(Ctrl+L), `K_F5`(F5), `K_SPACE` 등.

### 기본 단축키에서 키 빼기

새 키가 렌파이 기본 단축키와 겹치면 둘 다 실행되므로, 기본 쪽에서 빼 줍니다.

```renpy
define hotkeys.unbind = {
    "self_voicing": [ "K_v" ],      # V의 '대사 읽어주기'를 빼고 Alt+V로만
}
```

자주 쓰는 기본 단축키 이름: `screenshot`(S), `toggle_fullscreen`(F), `hide_windows`(H), `self_voicing`(V), `accessibility`(Shift+A), `skip`(Ctrl), `toggle_skip`(Tab), `rollback`(Page Up).

### 조작방법 화면의 설명

```renpy
define hotkeys.keyboard_help = [
    (_("엔터(Enter)"), _("대사 진행 및 UI (선택지 포함) 선택.")),
    ...
    ("V", _("볼륨 설정 열기.")),
    ("Alt+V", _("{a=https://www.renpy.org/l/voicing}대사 읽어주기 기능{/a} 토글.")),
]
```

(키, 설명) 목록을 위에서부터 순서대로 보여줍니다. `None`이면 렌파이 기본 설명을 씁니다.

### 정해 둔 동작과 설명 (1.1)

`"action"` 대신 `"do"`에 동작 이름을 적을 수 있습니다. 편집 화면의 "단축키" 탭이 쓰는 것과 같습니다. `"help"`를 적으면 조작방법 화면 목록에 들어갑니다. 목록에 같은 키 이름 줄(예: `"V"`)이 있으면 그 줄의 설명을 바꾸고, 없으면 맨 아래에 붙습니다.

```renpy
define hotkeys.bindings = [
    { "keys": [ "K_F5" ], "do": "quick_save", "help": _("퀵세이브") },
    { "keys": [ "noshift_K_v" ], "do": "preferences", "help": _("환경설정 열기") },
]
```

| `"do"` | 동작 |
|---|---|
| `"preferences"`, `"save"`, `"load"`, `"history"`, `"help"` | 환경설정, 저장, 불러오기, 대사록, 조작방법 화면 열기 |
| `"quick_save"`, `"quick_load"` | 퀵세이브, 퀵로드 |
| `"skip"`, `"auto"`, `"rollback"` | 스킵 켜기/끄기, 자동 진행 켜기/끄기, 이전 대사로 |
| `"hide"`, `"screenshot"`, `"fullscreen"`, `"mute"` | UI 숨기기, 스크린샷, 전체 화면, 소리 끄기/켜기 |
| `"main_menu"`, `"quit"` | 타이틀로, 게임 끝내기 (둘 다 물어봄) |
| `"controls_page"` | 스플래시 플러그인의 조작 방법 페이지 보기 |

키 이름 앞의 `noshift_`는 "Shift를 누르지 않았을 때만"입니다. 렌파이의 `"K_v"`는 Shift+V에도 걸립니다.

---

## 3. 편집 화면 "단축키" 탭 (1.1)

`ui_kit` 플러그인이 있으면 개발 모드에서 Shift+M으로 여는 편집 화면에 "단축키" 탭이 생깁니다. pygaki 앱의 [GUI 편집] → "단축키, 조작 방법"에도 같은 패널이 나옵니다.

- **새 단축키**: [줄 더하기] → 키 칸을 눌러 키를 고릅니다. [키 누르기 (게임 창)]를 누르고 게임 창에서 키를 누르거나(Shift, Ctrl, Alt와 같이), 아래 키 단추에서 고릅니다(Shift, Ctrl, Alt 단추를 먼저 켬). 동작 칸을 눌러 동작을 고르고, 오른쪽 칸에 조작방법 화면에 보일 설명을 적습니다(비우면 안 보임).
- **겹칠 때**: 렌파이 기본 단축키와 겹치면 그 이름이 나오고, [기본에서 빼기]를 누르면 새 동작만 실행됩니다. 편집 화면을 여는 키(Shift+M)와 이미 다른 줄이나 설정 파일에서 쓰는 키는 고를 수 없습니다.
- **조작방법 화면 목록**: 처음에는 설정 파일 목록(`keyboard_help`, 없으면 렌파이 기본)을 그대로 씁니다. [직접 적기로 바꾸기]를 누르면 칸마다 고치고 줄을 더하고 지웁니다. [설정 파일 목록으로]는 되돌립니다.
- **스플래시와 같이**: 스플래시 조작 방법 페이지의 표가 `"auto"`면 이 목록을 그대로 보여 줍니다. [스플래시 조작 방법 페이지로]를 누르면 그 페이지로 가고, 스플래시 탭의 표 패널에는 [단축키 탭에서 고치기]가 있습니다.
- 고치는 동안 게임에 바로 적용됩니다. 편집 화면을 닫고 눌러 보세요. **저장(Ctrl+S)**하면 이 폴더의 `hotkeys_layout.rpy`에 적고, 그 값은 설정 파일의 목록에 더해집니다. 설정 파일에 직접 적은 단축키는 탭에서 보이기만 하고 거기서 고칩니다.


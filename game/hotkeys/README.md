# Hotkeys 플러그인 (단축키)

단축키를 추가하거나 렌파이 기본 단축키에서 키를 빼고, **조작방법 화면의 설명도 같은 설정 파일에서** 관리하는 렌파이 플러그인입니다.

버전 1.0 · 렌파이 8.5.3에서 만들고 테스트했습니다.

---

## 1. 설치

`hotkeys` 폴더를 프로젝트의 `game` 폴더 안에 넣고 `hotkeys_config.rpy`를 고칩니다. **`screens.rpy`는 고치지 않아도 됩니다.**

이 플러그인은 렌파이 기본 `screens.rpy`의 `keyboard_help` 스크린(조작방법 화면의 키보드 탭)을 대신 정의합니다.

```
game/hotkeys/
├── hotkeys.rpy          엔진 (고치지 않음)
├── hotkeys_config.rpy   설정
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

(키, 설명) 목록을 위에서부터 순서대로 보여줍니다. `None`이면 렌파이 기본 설명을 씁니다. 단축키를 바꿨다면 여기도 같이 고쳐 주세요.

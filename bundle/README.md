# 배포 묶음 만들기

렌파이 SDK + showpy 템플릿 + 런처 버튼 + PyKaki 데스크톱 앱을 윈도우용 폴더(와 zip) 하나로 묶어요.

## 순서

1. **PyKaki 앱 받기**: GitHub의 Actions → "PyKaki 앱" → 가장 최근 성공한 실행 → 맨 아래 Artifacts의 `PyKaki-win`을 받아 풀어요. (안에 `PyKaki.exe`가 있는 폴더)
   직접 만들려면:
   ```bash
   cd pykaki && npm ci && npm run build
   cd app && npm ci && npm run dist
   ```
   그러면 `pykaki/app/out/win-unpacked`에 생겨요.
2. **묶기**: 저장소 맨 위에서
   ```bash
   python bundle/make_bundle.py --sdk <렌파이 SDK> --app 받은폴더\PyKaki-win --zip
   ```
   `bundle/out/pygaki-renpy-8.5.3/`와 같은 이름의 zip이 생겨요. (`bundle/out`은 저장소에 안 올라가요)

## 묶음 안

| 자리 | 무엇 |
|---|---|
| `renpy.exe`, `launcher/`, `renpy/` ... | 렌파이 SDK 그대로 |
| `launcher/game/pygaki_launcher.rpy` | 런처 첫 화면 아래쪽 버튼: [PyKaki로 대본 쓰기], [showpy 새 프로젝트] ([launcher/pygaki_launcher.rpy](launcher/pygaki_launcher.rpy)) |
| `showpy/` | 새 프로젝트 템플릿. SDK의 기본 틀(`gui/game`) + showpy 플러그인(`ui_kit`, `screen_fx`, `hotkeys`, `splash`), `project.json`의 `"type": "template"` |
| `pygaki/PyKaki/PyKaki.exe` | PyKaki 데스크톱 앱 |
| `pygaki/읽어주세요.txt` | 쓰는 법 |

템플릿에 넣는 플러그인은 `make_bundle.py`의 `PLUGINS`에서 고쳐요. 템플릿에서만 다르게 두는 설정은 `TEMPLATE_SETTINGS`에 있어요. 지금은 **VHS 덮개가 처음에는 꺼져 있어요**(`screen_fx.overlay = False`). 켜려면 새 프로젝트의 `game/screen_fx/screen_fx_config.rpy`에서 `True`로 바꿔요.

## 렌파이를 올릴 때

새 SDK 폴더로 `make_bundle.py`를 다시 돌리면 돼요. 런처의 원래 파일은 고치지 않고 `pygaki_launcher.rpy` 하나만 더하기 때문에, 런처가 바뀌어도 대개 그대로 돼요. 런처 화면이 크게 바뀌면 버튼 자리(`ypos`)만 맞춰요.

## 런처 버튼이 하는 일

- **[PyKaki로 대본 쓰기]**: 왼쪽 목록에서 고른 프로젝트로 `PyKaki.exe --project "프로젝트 폴더"`를 실행해요.
- **[showpy 새 프로젝트]**: 이름을 물어본 뒤 런처의 원래 새 프로젝트 과정(템플릿 쓰기)으로 만들어요. 런처의 [Create New Project]에서 템플릿 "showpy"를 골라도 같아요.

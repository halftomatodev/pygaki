# 배포 파일 만들기

렌파이 SDK + showpy 템플릿 + 런처 버튼 + PyKaki 데스크톱 앱을 윈도우용으로 묶어요. 두 가지가 한 번에 생겨요.

| 파일 | 누구에게 | 쓰는 법 |
|---|---|---|
| `pygaki-<태그>-renpy-<버전>.zip` (약 280MB) | 렌파이가 아직 없는 사람 | 아무 폴더에 풀고 `renpy.exe` |
| `pygaki-<태그>-addon.zip` (약 120MB) | 렌파이 SDK가 이미 있는 사람 | zip 안의 `launcher`, `showpy`, `pygaki`를 SDK 폴더(`renpy.exe`가 있는 곳)에 끌어 넣고 런처를 껐다 켬 |

덧붙임은 렌파이의 원래 파일을 고치지 않고 파일만 더해요(`launcher/game/pygaki_launcher.rpy`, `showpy/`, `pygaki/`). 템플릿의 기본 프로젝트는 묶을 때 쓴 렌파이(지금 8.5.3)로 만들어서, 다른 렌파이 8에서도 대개 되지만 확실한 건 묶음이에요.

## GitHub Releases에 올리기 (보통은 이것)

```bash
git tag v1.0
git push origin v1.0
```

Actions "배포 파일"(`.github/workflows/release.yml`)이 PyKaki 앱을 빌드하고(`app.yml`을 불러 씀), renpy.org에서 SDK `RENPY_VERSION`을 받아 묶고, 템플릿 프로젝트와 런처를 Lint한 뒤 Releases에 **초안**으로 두 zip을 올려요. Releases에서 보고 [Publish release]를 눌러야 공개돼요.

Actions 화면에서 손으로 돌리면(Run workflow) Releases에는 안 올리고 Artifacts `pygaki-dev`에만 남아요(시험용).

렌파이를 올리려면 `release.yml`의 `RENPY_VERSION`을 바꿔요.

## 내 컴퓨터에서 만들기

1. **PyKaki 앱 받기**: GitHub의 Actions → "pygaki 앱" → 가장 최근 성공한 실행 → 맨 아래 Artifacts의 `pygaki-win`을 받아 풀어요. (안에 `pygaki.exe`가 있는 폴더)
   직접 만들려면:
   ```bash
   cd pykaki && npm ci && npm run build
   cd app && npm ci && npm run dist
   ```
   그러면 `pykaki/app/out/win-unpacked`에 생겨요.
2. **묶기**: 저장소 맨 위에서 (2분쯤)
   ```bash
   python bundle/make_bundle.py --sdk 렌파이SDK폴더 --app 받은폴더\pygaki-win --zip --tag v1.0
   ```
   `bundle/out/`에 `pygaki-v1.0-renpy-8.5.3/`, `pygaki-v1.0-addon/`과 같은 이름의 zip이 생겨요. `--tag`를 빼면 이름에 태그가 안 붙어요. 다시 만들 때는 `bundle/out`을 먼저 지워요. (`bundle/out`은 저장소에 안 올라가요)

## 묶음 안

| 자리 | 무엇 |
|---|---|
| `renpy.exe`, `launcher/`, `renpy/` ... | 렌파이 SDK 그대로 (덧붙임에는 없음) |
| `launcher/game/pygaki_launcher.rpy` | 런처 첫 화면 아래쪽 버튼 [pygaki로 편집], [+ Create New Project](새 프로젝트 만들기)의 "기본 (Vanilla)" / "Pygaki" 고르기 ([launcher/pygaki_launcher.rpy](launcher/pygaki_launcher.rpy)) |
| `showpy/` | 새 프로젝트 템플릿. 런처의 [새 프로젝트 만들기]와 같은 방법으로 만든 1280x720 한국어 기본 프로젝트(그림까지 다 만듦) + showpy 플러그인(`ui_kit`, `screen_fx`, `hotkeys`, `splash`), `project.json`의 `"type": "template"` |
| `pygaki/app/pygaki.exe` | PyKaki 데스크톱 앱 |
| `pygaki/읽어주세요.txt` | 쓰는 법 |
| `pygaki_넣는법.txt` | (덧붙임에만) SDK 폴더에 넣는 법, 빼는 법 |

템플릿에 넣는 플러그인은 `make_bundle.py`의 `PLUGINS`에서 고쳐요. 템플릿에서만 다르게 두는 설정은 `TEMPLATE_SETTINGS`에 있어요. 지금은 **VHS 덮개가 처음에는 꺼져 있어요**(`screen_fx.overlay = False`). 켜려면 새 프로젝트의 `game/screen_fx/screen_fx_config.rpy`에서 `True`로 바꿔요.

## 렌파이를 올릴 때

새 SDK 폴더로 `make_bundle.py`를 다시 돌리면 돼요(Releases는 `RENPY_VERSION`만 바꾸고 태그). 런처의 원래 파일은 고치지 않고 `pygaki_launcher.rpy` 하나만 더하기 때문에, 런처가 바뀌어도 대개 그대로 돼요. 런처 화면이 크게 바뀌면 버튼 자리(`ypos`)를 맞추고, 런처의 `new_project.rpy`가 바뀌었으면 `pygaki_new_project`를 그 순서에 맞춰요.

## 한국어 공통 문구

템플릿을 만들 때 런처의 [새 프로젝트 만들기]처럼 렌파이 공통 문구(종료 확인 창 같은 글)의 한국어 번역 `game/tl/None/common.rpym`을 만듭니다(`add_common_translation`: 런처에서 `extract_strings korean` → 프로젝트에서 `translate None --common-only` → `merge_strings`). 이 파일이 없으면 확인 창이 영어로 나옵니다.

## 런처 버튼이 하는 일

- **[pygaki로 편집]**: 왼쪽 목록에서 고른 프로젝트로 `pygaki.exe --project "프로젝트 폴더"`를 실행해요.
- **[+ Create New Project](새 프로젝트 만들기)**: 런처의 원래 버튼을 누르면 먼저 둘 중 하나를 골라요(`config.label_overrides`로 런처의 `new_project`를 `pygaki_new_project`로 돌림. 런처 파일은 그대로).
  - **기본 (Vanilla)**: 렌파이 원래 새 프로젝트(언어 안내 → 이름 → 해상도, 색). showpy는 안 들어가요.
  - **Pygaki**: 이름을 물어본 뒤 런처의 원래 템플릿 과정(`new_template_project`)으로 `showpy/` 템플릿을 복사해요. 처음에 골라져 있어요.
  - 따로 둔 다른 템플릿 프로젝트가 있으면 그 아래에 이어서 나와요. `showpy/` 폴더가 없으면 런처 원래 흐름 그대로예요.

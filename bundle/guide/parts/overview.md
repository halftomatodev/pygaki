# 한눈에: 문서와 파일 자리

받은 묶음, 만든 게임 프로젝트, 저장소에 무엇이 어디 있는지 모았습니다. "이 파일은 지워도 되나", "내 작업은 어디 저장되나"가 궁금할 때 봅니다.

## 내 작업이 저장되는 곳

| 무엇 | 자리 | 알아 둘 것 |
| --- | --- | --- |
| 대본(원본) | 프로젝트 폴더 맨 위 `프로젝트이름.flow.json` | 고칠 때마다 저절로 저장. **이것이 원본**이니 백업할 때 꼭 챙깁니다. 게임 배포판에는 들어가지 않습니다 |
| 내보낸 원고 | `game/script_flow.rpy` | 대본에서 만들어지는 결과물입니다. 다시 내보내면 덮어써지니 이 파일을 직접 고치지 않습니다 |
| 저장본(버전 목록) | 이 컴퓨터의 pygaki 앱 안 | 바뀐 것이 있을 때 5분마다, 내보낼 때, 받아 적기 전에 저절로 남습니다(자동 저장본은 최근 30개). 다른 컴퓨터로 옮겨지지 않습니다 |
| 그림 위치 | `game/ui_kit/stage_layout.rpy` | 줄의 [위치 옮기기]로 저장한 자리. 저장본으로 되돌아가지 않습니다 |
| GUI 편집기에서 저장한 값 | 각 플러그인 폴더의 `*_layout.rpy` (예: `ui_kit/title_menu_layout.rpy`, `screen_fx/screen_fx_layout.rpy`) | 설정 파일(`*_config.rpy`)의 같은 값보다 먼저 쓰입니다. 새 판으로 바꿀 때 따로 두었다가 다시 넣습니다 |
| 내가 고친 설정 | 각 플러그인 폴더의 `*_config.rpy` | 엔진 파일(`engine/`, `editor/`)은 고치지 않습니다 |
| 원고를 고치기 전 원본 | 프로젝트 폴더의 `ui_kit_backup/` | GUI 편집기가 원고 괄호를 바꾸기 전에 남깁니다. 개발용이라 배포판에서 뺍니다 |
| 게임과 앱이 주고받는 파일 | `game/showpy_inbox.json`, `game/showpy_live.json`, `game/pykaki_preview.json`, `game/pykaki_goto.json` | 개발 중에만 생기는 연결 파일입니다. 게임 배포판에는 넣지 않습니다(지워도 다시 생깁니다) |

게임을 배포용으로 빌드할 때는 `*.flow.json`, `ui_kit_backup/`, 위의 연결 파일을 빼 주세요. 각 플러그인의 `README.md`는 빌드할 때 저절로 빠집니다.

## 받은 묶음 안

| 자리 | 무엇 |
| --- | --- |
| `renpy.exe`, `launcher/`, `renpy/`, `lib/` … | 렌파이 SDK 그대로 (덧붙임 zip에는 없음) |
| `launcher/game/pygaki_launcher.rpy` | 런처 첫 화면의 [pygaki로 편집], [pygaki 안내서] 단추와, 새 프로젝트 만들기의 "기본 (Vanilla)" / "Pygaki" 고르기. 렌파이의 원래 파일은 고치지 않고 이 파일 하나만 더합니다 |
| `pygaki/template/` | Pygaki 새 프로젝트에 얹을 플러그인 템플릿 |
| `pygaki/app/pygaki.exe` | pygaki 데스크톱 앱. 앱만 따로 켜면 프로젝트 폴더를 고르는 창이 뜹니다 |
| `pygaki/pygaki_안내서.html` | 이 안내서 |
| `pygaki/읽어주세요.txt` | 짧은 쓰는 법 |
| `pygaki/LICENSE-pygaki.txt` | pygaki 라이선스 (MIT) |
| `pygaki_넣는법.txt` | (덧붙임에만) SDK 폴더에 넣는 법, 빼는 법 |

덧붙임을 빼려면 `launcher/game/pygaki_launcher.rpy`(와 `.rpyc`), `pygaki` 폴더를 지웁니다.

## 새로 만든 게임 프로젝트 안

| 자리 | 무엇 |
| --- | --- |
| `프로젝트이름.flow.json` | 대본 (앱이 저장) |
| `game/script.rpy` | 렌파이 기본 원고. 그대로 둬도 됩니다(게임 시작이 대본의 첫 상자로 이어짐) |
| `game/script_flow.rpy` | PyKaki가 내보낸 원고 |
| `game/images/`, `game/movies/`, `game/audio/` | 그림, webm 영상, 소리. 앱의 고르기 창에 나옵니다. 파일 이름은 영어, 숫자, `_`로 |
| `game/gui/cursor/`, `game/gui/ctc/` | 커서와 클릭 대기 표시 그림 (샘플이 들어 있음) |
| `game/ui_kit/` | 타이틀·선택지·대사·커서·그림 배치·GUI 편집기 플러그인. `effects/`에 글자 효과와 그림 전환 파일(`.glsl`) |
| `game/screen_fx/` | 화면 셰이더 플러그인. 셰이더마다 `<이름>_config.rpy`, 목록에서 감출 이름은 `shaders_off.txt` |
| `game/hotkeys/`, `game/splash/` | 단축키, 스플래시 |
| `game/tl/None/common.rpym` | 렌파이 공통 문구(종료 확인 창 등)의 한국어 |

## 저장소 안 (고쳐 쓰려는 사람)

| 자리 | 무엇 |
| --- | --- |
| `README.md` | 저장소 소개 |
| `pykaki/` | PyKaki 화면(React + TypeScript). `src/`가 코드 |
| `pykaki/app/` | 데스크톱 앱(Electron). 화면은 `pykaki/`를 빌드한 것을 그대로 씁니다 |
| `pykaki/docs/GUIDE.md` | 앱의 [도움말](F1). 이 안내서의 "PyKaki로 대본 쓰기" 장 |
| `pykaki/docs/SPEC.md` | PyKaki 구조 설명 (고치는 사람용) |
| `pykaki/public/effects/` | 글자 효과 견본 영상 (이 안내서의 "효과 견본" 장에 들어감) |
| `pykaki/licenses/` | 앱에 함께 넣은 글꼴·라이브러리의 라이선스 |
| `showpy/game/` | pygaki 플러그인 네 폴더 (게임의 `game/`에 넣는 그대로) |
| `showpy/docs/CUSTOM_GUIDE.md` | 설정 값 찾아보기. 이 안내서의 "플러그인 커스텀 가이드" 장 |
| `showpy/docs/READ_ME_FIRST.md` | 판마다 바뀐 점, 설치·제거, 주의 |
| `showpy/docs/SPEC.md`, `DEV_RULES.md` | 플러그인 구조와 작업 규칙 (고치는 사람용) |
| `showpy/CHANGELOG.md` | 판마다 고친 것 |
| `showpy/game/*/README.md` | 플러그인마다 설정 이름의 전체 설명 |
| `showpy/samples/`, `showpy/examples/` | 커서·클릭 대기 샘플 그림, PyKaki 원고 예제 |
| `docs/LINK.md` | 두 프로그램이 서로 맞추는 형식(대본 파일, 원고의 표시, 실시간 연결, 효과 파일) |
| `bundle/` | 묶음 만들기(`make_bundle.py`), 런처 버튼(`launcher/`), 이 안내서(`guide/`) |
| `.github/workflows/` | 앱 확인·윈도우 빌드, 태그를 올리면 Releases 초안 |

## 문서 읽는 순서

| 나는 | 읽을 것 |
| --- | --- |
| 처음 받았다 | 이 안내서의 "시작하기" → "PyKaki로 대본 쓰기" |
| 대본은 썼고 게임 화면을 맞추고 싶다 | "플러그인 커스텀 가이드"의 "PyKaki와 함께 쓰기" |
| 설정 파일로 모양을 바꾸고 싶다 | "플러그인 커스텀 가이드"의 "한눈에 찾기" → 각 플러그인 `README.md` |
| 효과를 고르고 싶다 | "효과 견본" |
| 효과·코드를 더하고 싶다 | "직접 고치기" → `showpy/docs/DEV_RULES.md`, `ui_kit/effects/README.md` |
| 예전 판에서 옮긴다 | `showpy/docs/READ_ME_FIRST.md`, `showpy/CHANGELOG.md` |

## 지금까지의 판

| 판 | 플러그인 | 주요 내용 |
| --- | --- | --- |
| v1.0 | 4.13 | 첫 묶음: 렌파이 SDK + 플러그인 + 런처 [pygaki로 편집] + PyKaki 앱 |
| v1.1 | 4.22 | 앱 이름을 pygaki로, 앱 [대본 편집]·[GUI 편집], 셰이더 두 자리(1번 + 2번)와 [여기에서부터 적용], 셰이더가 바뀌는 줄과 줄마다 전환, 커서·클릭 대기 그림 폴더, 타이틀·ESC 메뉴 꾸미기, 스플래시 편집 |
| v1.2 | 4.23 | 스플래시를 화면 위에서 고치기(끌기, 그 자리 글 고치기, 페이지 더하기), 이미지 하나에 거는 효과, 태그 상자(굵게, 색, 멈춤, 속도), 묶음에서 개발용 파일 빼기 |
| v1.3 | 5.0 | 새 화면 셰이더 일곱(글리치, 지글거림, 망점, 홀로그램, 나이트비전 등), 글자 등장 효과 열하나, 글 상자(말풍선, 둥근 테두리), GUI 편집기 "UI 글" 탭, 공통 문구 한국어 |
| v1.4 (만드는 중) | 5.1 | 효과 폴더와 그림 전환, 셰이더 전환(픽셀소트, 데이터모싱, TV 지직 등), 화면 셰이더 여덟 더(물결, 옛날 필름, 어안렌즈 등), 태그 상자(카드, 막대, 견본 툴팁), 루비, 속도는 "1초에 몇 글자"로, 앱 [효과]·[셰이더] 갤러리, PyKaki는 데스크톱 앱만, 이 HTML 안내서 |

판마다 자세한 것은 `showpy/CHANGELOG.md`에 있습니다.

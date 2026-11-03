# showpy

**렌파이(Ren'Py) 게임을 실행한 채, 코드 없이 마우스로 고치는 플러그인 묶음이에요.**

타이틀 메뉴, 선택지, 대사 모양, 그림 위치, 화면 효과를 게임 화면 위에서 바로 고쳐요. 글은 웹 에디터 [PyKaki](https://github.com/halftomatodev/pygaki/tree/main/pykaki)에서 쓰고, 화면은 showpy에서 맞추면 렌파이 코드와 툴 사용법을 먼저 익히지 않아도 게임을 만들 수 있어요.

## 할 수 있는 것

- **게임 중 편집기 (Shift+M):** 그림을 끌어서 옮기고, 전환을 고르고, 그림과 webm 영상, 소리를 대사 사이에 넣어요.
- **타이틀 메뉴와 ESC 메뉴:** 항목을 자유롭게 배치해요.
- **선택지와 대사:** 위치, 글꼴, 색, 등장 효과를 줄마다 정해요.
- **화면 효과:** ASCII, 레트로 터미널, 게임보이, VHS 덮개, TV 전환.
- **그 밖:** 커서와 클릭 대기 애니메이션, 대사 소리, 단축키, 타이틀 전 로고 화면.

## 설치

1. 렌파이 8.5 이상으로 프로젝트를 만들어요.
2. 이 저장소를 내려받아요. (초록색 **Code** 버튼 → **Download ZIP**)
3. `game` 폴더 안의 `ui_kit`, `screen_fx`, `hotkeys`, `splash`를 내 프로젝트의 `game` 폴더에 넣어요.
4. 게임을 실행해요. 대사가 나오는 중에 **Shift+M**을 누르면 편집기가 열려요.

필요한 폴더만 골라 넣어도 돼요. `screen_fx`는 넣자마자 VHS 덮개가 켜지니까, 처음에 깨끗한 화면으로 보려면 [가이드](docs/CUSTOM_GUIDE.md)의 "화면 효과 바꾸기"를 보세요.

## PyKaki와 함께 쓰기

```
PyKaki에서 글을 쓴다 → Ctrl+E → 렌파이에서 바로 본다
렌파이 편집기에서 그림, 영상, 소리를 넣는다 → PyKaki 대본에도 나타난다
```

순서는 [가이드의 "PyKaki와 함께 쓰기"](docs/CUSTOM_GUIDE.md#pykaki와-함께-쓰기)에 있어요. 바로 만져 보려면 [샘플](examples/pykaki_sample)을 여세요.

## 문서

| 문서 | 누가 읽나요 | 내용 |
|---|---|---|
| [docs/CUSTOM_GUIDE.md](docs/CUSTOM_GUIDE.md) | **게임을 만드는 사람** | 어떤 값을 고치면 무엇이 바뀌는지, PyKaki 연결과 사용법 |
| [docs/READ_ME_FIRST.md](docs/READ_ME_FIRST.md) | 게임을 만드는 사람 | 처음 넣을 때 알 것, 버전별 바뀐 점과 옮기는 법 |
| `game/*/README.md` | 게임을 만드는 사람 | 폴더별 모든 값의 자세한 설명 |
| [docs/SPEC.md](docs/SPEC.md) | 고치는 사람 | showpy 구조와 동작 |
| [../docs/LINK.md](../docs/LINK.md) | 고치는 사람 | showpy와 PyKaki가 맞춰야 하는 형식 |
| [docs/DEV_RULES.md](docs/DEV_RULES.md) | 고치는 사람 | 작업 규칙, 버전 올리는 법 |
| [PyKaki 명세](https://github.com/halftomatodev/pygaki/blob/main/pykaki/docs/SPEC.md), [PyKaki 가이드](https://github.com/halftomatodev/pygaki/blob/main/pykaki/docs/GUIDE.md) | | 같은 저장소의 pykaki 폴더에 있어요 |
| [CHANGELOG.md](CHANGELOG.md) | 모두 | 버전 기록 |

## 라이선스

[MIT 라이선스](LICENSE)예요. 함께 들어 있는 글꼴과 참고한 셰이더는 [THIRD_PARTY.md](THIRD_PARTY.md)를 보세요.

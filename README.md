# pygaki

**렌파이(Ren'Py)로 게임을 만드는 사람을 위한 도구 묶음이에요.**

| 폴더 | 무엇 |
|---|---|
| [pykaki/](pykaki/) | **PyKaki**: 파이썬을 몰라도 상자와 선으로 렌파이 대본을 쓰는 에디터. 웹 버전과 데스크톱 앱 |
| [showpy/](showpy/) | **showpy**: 렌파이 플러그인. 게임을 실행한 채로 그림, 대사 위치, 화면 효과를 마우스로 고치는 편집기와 UI 묶음 |
| [docs/LINK.md](docs/LINK.md) | 두 프로그램이 서로 맞추는 형식 |

예전에는 [pykaki](https://github.com/halftomatodev/pykaki)와 [showpy](https://github.com/halftomatodev/showpy) 두 저장소였고, 두 저장소의 기록을 그대로 합쳤어요.

## 앞으로 (만드는 중)

렌파이 SDK, showpy, PyKaki 데스크톱 앱을 윈도우용 묶음 하나로 배포하려고 해요.

- 렌파이 런처에서 새 프로젝트를 만들면 showpy가 처음부터 들어 있어요.
- 런처의 [PyKaki로 대본 쓰기] 버튼으로 지금 프로젝트의 대본을 열어요. 폴더 연결이나 권한 창이 없어요.
- 대본(`.flow.json`)은 프로젝트 폴더에 저장돼요.

웹 버전 PyKaki는 지금처럼 브라우저에서도 쓸 수 있어요.

## 라이선스

MIT. 각 폴더의 `LICENSE`와 `pykaki/licenses/`, `showpy/THIRD_PARTY.md`를 보세요.

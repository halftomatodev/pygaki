# pygaki

**렌파이(Ren'Py)로 게임을 만드는 사람을 위한 도구 묶음이에요.**

| 폴더 | 무엇 |
|---|---|
| [pykaki/](pykaki/) | **PyKaki**: 파이썬을 몰라도 상자와 선으로 렌파이 대본을 쓰는 에디터. 웹 버전과 데스크톱 앱 |
| [showpy/](showpy/) | **showpy**: 렌파이 플러그인. 게임을 실행한 채로 그림, 대사 위치, 화면 효과를 마우스로 고치는 편집기와 UI 묶음 |
| [docs/LINK.md](docs/LINK.md) | 두 프로그램이 서로 맞추는 형식 |
| [bundle/](bundle/) | 렌파이 SDK와 함께 묶는 스크립트, 런처에 붙이는 파일 |

예전에는 [pykaki](https://github.com/halftomatodev/pykaki)와 [showpy](https://github.com/halftomatodev/showpy) 두 저장소였고, 두 저장소의 기록을 그대로 합쳤어요.

## 윈도우용 묶음 (만드는 중)

렌파이 SDK, showpy, PyKaki 데스크톱 앱을 폴더 하나로 묶어요. 만드는 법은 [bundle/README.md](bundle/README.md).

- 렌파이 런처의 [pygaki로 새 프로젝트]로 만들면 showpy가 처음부터 들어 있어요.
- 런처의 [pygaki로 편집]로 고른 프로젝트의 대본을 열어요. 폴더 연결이나 권한 창이 없어요.
- 대본은 프로젝트 폴더 맨 위의 `프로젝트이름.flow.json`에 자동 저장돼요.

웹 버전 PyKaki는 지금처럼 브라우저에서도 쓸 수 있어요.

## 라이선스

MIT. 각 폴더의 `LICENSE`와 `pykaki/licenses/`, `showpy/THIRD_PARTY.md`를 보세요.

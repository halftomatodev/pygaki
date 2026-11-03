# pygaki

렌파이 대본 에디터 PyKaki와 렌파이 플러그인 showpy를 한 저장소에 모은 것. 렌파이 SDK와 함께 윈도우용 오프라인 묶음으로 배포한다. 사용자는 한국어로 대화한다.

| 폴더 | 내용 | 먼저 읽기 |
|---|---|---|
| `pykaki/` | 대본 에디터 (웹 버전 + 데스크톱 앱) | [pykaki/CLAUDE.md](pykaki/CLAUDE.md), [pykaki/docs/SPEC.md](pykaki/docs/SPEC.md) |
| `showpy/` | 렌파이 플러그인 (`game/ui_kit` 등) | [showpy/docs/DEV_RULES.md](showpy/docs/DEV_RULES.md), [showpy/docs/SPEC.md](showpy/docs/SPEC.md) |
| `docs/LINK.md` | 두 프로그램이 맞추는 형식 (하나만 있음) | 형식을 바꿀 때 |
| `pykaki/app/` | PyKaki 데스크톱 앱 (Electron). 화면은 웹 빌드 그대로 | [pykaki/docs/SPEC.md](pykaki/docs/SPEC.md) 데스크톱 앱 |
| `bundle/` | 렌파이 SDK + showpy 템플릿 + 런처 버튼 + 앱 묶기 | [bundle/README.md](bundle/README.md) |

## 꼭 지킬 것

- 커밋 작성자는 `halftomato <wwonwan@naver.com>`, GitHub 계정은 `halftomatodev`.
- 두 프로그램이 맞추는 형식을 바꾸면 `docs/LINK.md`와 양쪽 코드를 같은 커밋에서 고친다.
- 등장 효과 셰이더는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나다. PyKaki는 빌드할 때 그대로 가져간다(사본 없음).
- PyKaki를 고치면 `pykaki/`에서 `npm run build`로 `pykaki/dist/index.html`도 다시 만든다.
- showpy를 고치면 Lint를 돌리고, 시험 프로젝트에 복사한 뒤 `.rpyc`를 지운다. 사용자의 진짜 게임(`horror`, `test_plugin`)은 말할 때만 건드린다.
- 저장 형식 이름 `"format": "renpy-flow"`, `.flow.json`, IndexedDB `renpy-flow-editor`는 바꾸지 않는다.

## 명령

```bash
cd pykaki && npm run dev     # 웹 버전 개발 서버 http://localhost:5173
cd pykaki && npx tsc --noEmit
cd pykaki && npm run build   # pykaki/dist/index.html 한 파일
cd pykaki/app && npm ci && npm start   # 데스크톱 앱 (웹 빌드를 복사해서 켬)
```

- 데스크톱 앱 확인: GitHub Actions "PyKaki 앱"이 리눅스에서 진짜 Electron으로 켜 보고(`pykaki/app/smoke.cjs`), 윈도우 `PyKaki.exe` 폴더를 만든다.

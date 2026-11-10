# pygaki

렌파이 대본 에디터 PyKaki와 렌파이 플러그인 showpy를 한 저장소에 모은 것. 렌파이 SDK와 함께 윈도우용 오프라인 묶음으로 배포한다. 사용자는 한국어로 대화한다.

**지금 진행 상황, 쓰는 법과 고치는 법, 남은 일: `docs/HANDOFF.md`** (로컬 전용, 저장소에 안 올라감)

지나온 기록과 주요 결정: `docs/HISTORY.md` (로컬 전용). 두 파일과 `docs/LOCAL.md`는 `.gitignore`에 있어서 이 컴퓨터에만 있다. 없으면 사용자에게 알린다. 예전 `pykaki`, `showpy` 저장소는 보관만 하고, 이 저장소 하나만 고친다.

로컬 자리: 문서에는 `<저장소>`, `<렌파이 SDK>`, `<시험 묶음>`, `<렌파이 프로젝트 폴더>` 같은 이름으로만 적는다. 실제 폴더는 저장소에 올리지 않는 **`docs/LOCAL.md`**에 있으니 작업 전에 먼저 읽는다(없으면 사용자에게 물어서 만든다). 저장소는 Dropbox 밖에 둔다.

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
- showpy를 고치면 Lint를 돌리고, 시험 프로젝트에 복사한 뒤 `.rpyc`를 지운다. 사용자의 진짜 게임(이름은 `docs/LOCAL.md`)은 말할 때만 건드린다.
- 저장 형식 이름 `"format": "renpy-flow"`, `.flow.json`, IndexedDB `renpy-flow-editor`는 바꾸지 않는다.
- **정보가 새지 않게**: 저장소는 공개이고 묶음은 남에게 배포한다. 사용자가 허락하지 않은 정보(내 컴퓨터 경로, 계정, 사용자가 보여 준 참고 자료의 파일 이름·출처 계정, 메일 주소)를 코드, 묶음, 커밋하는 문서와 커밋 메시지에 넣지 않는다. 참고 자료는 모양만 말로 적는다. 프로그램은 사용자 허락 없이 밖으로 통신하지 않는다(실시간 연결은 `127.0.0.1`만, 앱·웹은 외부 요청 없음). 개발용 파일(`showpy_live.json`, `showpy_inbox.json`, `pykaki_preview.json`, `pykaki_goto.json`, `ui_kit_backup/`, `*.flow.json`)은 게임 배포판과 묶음에서 뺀다. 묶음은 `bundle/make_bundle.py`의 `privacy_check`가 만든 사람 컴퓨터 경로를 찾으면 멈춘다.

## 명령

```bash
cd pykaki && npm run dev     # 웹 버전 개발 서버 http://localhost:5173
cd pykaki && npx tsc --noEmit
cd pykaki && npm run build   # pykaki/dist/index.html 한 파일
cd pykaki/app && npm ci && npm start   # 데스크톱 앱 (웹 빌드를 복사해서 켬)
```

- 데스크톱 앱 확인: GitHub Actions "pygaki 앱"이 리눅스에서 진짜 Electron으로 켜 보고(`pykaki/app/smoke.cjs`), 윈도우 `pygaki.exe` 폴더를 만든다.

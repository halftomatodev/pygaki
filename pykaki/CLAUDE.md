# PyKaki

렌파이 대본을 상자와 선으로 쓰고 `.rpy`로 내보내는 에디터. 데스크톱 앱(`app/`, Electron)으로만 낸다. 화면은 웹 빌드(`dist/index.html`)를 앱이 그대로 쓴다. 사용자는 한국어로 대화한다.

- 구현 명세: [docs/SPEC.md](docs/SPEC.md) — 작업 전에 먼저 읽기
- 사용자 가이드: [docs/GUIDE.md](docs/GUIDE.md) — 기능을 바꾸면 같이 고치기
- 웹 버전(GitHub Pages 배포, 웹앱 설치)은 2026-11-12에 없앴다. `npm run dev`는 개발용으로만 쓴다(렌파이 프로젝트는 못 열고 예제 대본을 브라우저 자동 저장으로).

## 명령

```bash
npm run dev        # 개발 서버 http://localhost:5173 (개발용)
npx tsc --noEmit   # 타입 검사
npm run build      # dist/index.html 한 파일로 빌드
```

## 꼭 지킬 것

- 저장소 맨 위 [../CLAUDE.md](../CLAUDE.md)도 같이 따른다.
- 기능을 고친 뒤에는 **`npm run build`로 로컬 `dist/index.html`도 다시 만든다.** 데스크톱 앱이 그 파일을 복사해 쓴다(`app`에서 `npm run web`).
- 작업 폴더는 Dropbox 밖의 `<저장소>\pykaki`다(pygaki 저장소 안). 저장소를 Dropbox 안에 두지 않는다. Vite 캐시는 `vite.config.ts`의 `cacheDir`로 임시 폴더에 둔다(Dropbox 안에서 돌릴 때도 EBUSY로 개발 서버가 멈추지 않게).
- Windows는 파일 이름 대소문자를 구분하지 않는다. 새 파일 이름이 있는 파일과 대소문자만 다르지 않게 한다.
- PyKaki 안 플레이 화면은 없앴다(2026-11-12). 대본은 앱의 [▶ 렌파이에서 실행]과 [렌파이에서 여기로 이동]으로 게임에서 본다. 대사 미리보기는 `src/SayPreview.tsx`.
- 커밋 작성자는 `halftomato <wwonwan@naver.com>`, GitHub 계정은 `halftomatodev`. 이 저장소의 git 설정에 `http.sslBackend=schannel`과 gh 자격 증명이 들어 있어 push가 된다.
- 저장 파일 형식(`src/types.ts`)을 바꿀 때는 `normalizeProject()`에서 예전 파일도 열리게 한다.
- 등장 효과 셰이더의 기본 효과는 `../showpy/game/ui_kit/engine/text_effects.glsl` 하나에, 더하는 효과는 `../showpy/game/ui_kit/effects/`에 파일 하나씩 있다. PyKaki는 빌드할 때 그대로 가져가고, 연결한 게임 폴더의 효과 파일도 읽는다(`src/fx/textShaders.ts` `setFolderEffects`). 형식은 저장소 맨 위 docs/LINK.md 8장.
- 원본은 툴의 JSON이고 `.rpy`는 결과물이다(단방향). showpy에서 넣은 그림, 소리 줄만 `showpy_inbox.json`으로 받아 적는다. 형식은 [../docs/LINK.md](../docs/LINK.md). 바꾸면 `../showpy/`의 맞는 코드도 같은 커밋에서 고친다.
- 이름은 PyKaki지만, 저장 형식 `"format": "renpy-flow"`·`.flow.json`과 IndexedDB 이름 `renpy-flow-editor`는 일부러 예전 이름 그대로다(바꾸면 기존 대본 파일과 자동 저장을 못 읽음). 바꾸지 말 것.

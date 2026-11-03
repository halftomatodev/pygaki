# 인수인계 (2026-11-03, 클라우드 세션 → 로컬)

클라우드 세션에서 한 일, 아직 확인하지 못한 것, 다음에 할 일을 적은 문서입니다. 로컬에서 이어서 작업할 때 이 문서부터 읽습니다. 다 처리하면 이 문서를 지우거나 줄입니다.

## 1. 지금 구조

- 저장소: **https://github.com/halftomatodev/pygaki** (`main`). 예전 `pykaki`, `showpy` 두 저장소의 기록을 그대로 합쳤습니다.
  - 같은 내용이 `claude/ecstatic-archimedes-jt7rpo` 브랜치(pygaki, 예전 pykaki 저장소)에도 있습니다.
  - 예전 showpy 저장소의 같은 이름 브랜치에는 합치기 전 showpy 4.13까지만 있습니다.
- 로컬 자리(제안): `F:\SHOWPY\pygaki` (Dropbox 밖). 예전 `F:\SHOWPY\pykaki`, `F:\SHOWPY\showpy`는 더 이상 고치지 않습니다.

| 폴더 | 내용 |
|---|---|
| `pykaki/` | PyKaki 웹 버전 (`npm run build` → `pykaki/dist/index.html`) |
| `pykaki/app/` | PyKaki 데스크톱 앱 (Electron) |
| `showpy/` | 렌파이 플러그인. `showpy/game/`의 `ui_kit`, `screen_fx`, `hotkeys`, `splash` |
| `bundle/` | 렌파이 SDK + showpy 템플릿 + 런처 버튼 + 앱 묶기 (`make_bundle.py`, `launcher/pygaki_launcher.rpy`) |
| `docs/LINK.md` | 두 프로그램이 맞추는 형식 (하나만 있음) |
| `.github/workflows/` | `deploy.yml` 웹 버전 Pages 배포, `app.yml` 앱 확인 + 윈도우 빌드 |

## 2. 이번에 한 일 (시간 순)

1. **실시간 미리보기 버그 두 개**
   - showpy `editor_preview.rpy`: 켤 때 파일이 없으면 첫 미리보기를 무시하던 것을 고침.
   - PyKaki `writePreview`: 폴더 권한이 없으면 스위치 옆에 안내와 [권한 허용]을 띄움.
2. **등장 효과를 WebGL로 (showpy 4.13, ui_kit 3.12)**
   - 셰이더는 `showpy/game/ui_kit/engine/text_effects.glsl` 하나입니다. 형식은 LINK.md 8장.
   - `text_effects.rpy`는 init에서 이 파일을 읽어 등록합니다. 등록 값이 4.12와 20개 모두 같은지 렌파이 없이 비교했습니다.
   - PyKaki(`pykaki/src/fx/`)는 같은 파일을 빌드할 때 가져와, 렌파이가 셰이더 조각을 합치는 방식(렌파이 8.5.3 소스를 보고 맞춤)대로 WebGL로 그립니다. WebGL이 없으면 예전 CSS로 돌아갑니다.
   - 견본 영상 27개와 프레임을 나란히 놓고 비교해서 맞췄습니다.
   - 효과 목록, 한글 이름, 글자/초 기본값(`@cps`)도 셰이더 파일에서 읽습니다. 렌파이 내장 7개는 `pykaki/src/fx/renpy_textshaders.glsl`(MIT)에 있습니다.
   - 알게 된 것: `slowalpha`는 렌파이에서 혼자 쓰면 글자가 처음부터 다 보입니다.
3. **저장소 합치기 (pygaki)**: LINK.md를 하나로, 셰이더 사본과 `sync-shaders`를 없앰. Pages 배포를 `pykaki/` 기준으로.
4. **데스크톱 앱** (`pykaki/app/`, `pykaki/src/desktop.ts`)
   - `PyKaki.exe --project "폴더"`로 프로젝트 하나를 엽니다. 대본은 프로젝트 맨 위 `프로젝트이름.flow.json`에 자동 저장됩니다.
   - showpy 기록은 파일이 바뀌면 바로 받아 적고, 프로젝트 밖 쓰기는 막습니다.
   - 웹 코드는 그대로이고, `desktop.ts`가 앱의 파일 기능을 브라우저 폴더 손잡이 모양으로 감쌉니다. 자세한 것은 `pykaki/docs/SPEC.md` 9-2.
5. **런처 버튼과 묶음**
   - `bundle/launcher/pygaki_launcher.rpy`: 런처 첫 화면 아래 [PyKaki로 대본 쓰기] [showpy 새 프로젝트].
   - `bundle/make_bundle.py`: SDK 복사, 템플릿 `showpy/`(런처처럼 만든 1280x720 한국어 기본 프로젝트 + 플러그인 4개, `project.json` type template, **VHS 덮개는 템플릿에서만 꺼 둠**), 앱, zip.

## 3. 확인한 것 / 아직 못 한 것

확인함 (자동):
- 효과 27개를 렌파이 견본과 프레임 비교. 여러 줄, 색과 굵기 태그, WebGL을 끈 경우
- 앱: GitHub Actions에서 진짜 Electron으로 켜서 자동 저장, 내보내기, 받아 적기, 밖에 쓰기 막기 통과(`pykaki/app/smoke.cjs`). 윈도우 `PyKaki.exe` 빌드 성공
- 묶음 스크립트: 렌파이 소스로 만든 가짜 SDK로 끝까지

**아직 못 함 (클라우드에서 렌파이 SDK를 받을 수 없었음, 윈도우 없음):**
- [x] showpy 4.13 Lint (2026-11-04 로컬). 렌파이에 등록되는 효과 20개를 4.12와 비교: 셰이더 코드(공백 빼고), 값, adjust 결과 모두 같음
- [ ] 4.13 실행 화면에서 효과 눈으로 보기, 대사 탭 효과 버튼(이제 glsl에서 이름을 읽음)
- [x] 묶음: 런처 아래쪽 버튼이 보이고 겹치지 않음(`ypos 506`, 한국어 런처)
  - [x] [PyKaki로 대본 쓰기]로 앱이 고른 프로젝트로 열리고 자동 저장됨
  - [x] [showpy 새 프로젝트]: 처음에는 SDK `gui/game`을 그대로 템플릿으로 써서 새 프로젝트가 켜질 때 그림 만들기에서 오류. `make_bundle.py`가 런처처럼 `generate_gui` + `gui_images`로 기본 프로젝트를 만들게 고친 뒤 새 프로젝트 만들기, 실행, Lint 통과
  - [ ] 런처 영어일 때 한글이 보이는지
- [ ] 앱과 게임을 나란히: showpy 편집기에서 그림 넣기 → 앱에 바로 받아 적힘, 앱에서 Ctrl+E → 게임이 다시 불러옴
- [ ] 실시간 미리보기([렌파이에서 보기])를 PyKaki와 렌파이를 같이 켜 놓고
- [ ] 예전부터 남은 것: 실제 폴더 선택창으로 [렌파이 프로젝트 연결], 크롬에서 F8 전체화면, 소리, 렌파이 대사 탭 저장

## 4. 다음에 할 일

1. ~~**묶음 만들어 시험하기**~~ (2026-11-04 함, 남은 확인은 3장): Actions "PyKaki 앱"의 `PyKaki-win`을 받아 풀고 아래를 돌린 뒤 3장의 체크 항목을 봅니다. 파이썬이 없으면 `renpy-8.5.3-sdk\lib\py3-windows-x86_64\python.exe`.
   ```
   python bundle\make_bundle.py --sdk F:\SHOWPY\renpy-8.5.3-sdk --app F:\SHOWPY\PyKaki-win --zip
   ```
2. ~~**GitHub Pages 켜기**~~ (2026-11-04 함, https://halftomatodev.github.io/pygaki/): https://github.com/halftomatodev/pygaki/settings/pages 에서 Source를 GitHub Actions로 하고 "Deploy to GitHub Pages"를 다시 돌립니다(첫 실행은 Pages가 꺼져 있어 404로 실패).
3. ~~**링크 바꾸기**~~ (2026-11-04 함. 맨 위 README의 예전 저장소 소개만 남김): 문서와 화면에 남은 예전 주소를 pygaki로 바꿉니다.
   - `github.io/pykaki`, `github.com/halftomatodev/pykaki`, `github.com/halftomatodev/showpy`
   - 들어 있는 곳: `pykaki/src/Sidebar.tsx`, `pykaki/README.md`, `pykaki/CLAUDE.md`, `pykaki/docs/*.md`, `showpy/README.md`, `showpy/docs/*.md`, `showpy/CHANGELOG.md`, `showpy/examples/pykaki_sample/README.md`
4. ~~**예전 저장소 정리**~~ (2026-11-04 함): pykaki, showpy 두 저장소 README 맨 위에 "pygaki로 옮겼어요" 안내를 넣고 보관(archive)함. 예전 사이트 github.io/pykaki는 예전 PyKaki 그대로 열림(브라우저 저장은 같은 주인이라 함께 씀).
5. **구글 문서**: 공개용 사용 안내(https://docs.google.com/document/d/10kmDFgiQ9JpbgIY6Q7vejf3EjMC06rCJCxjVSeukdes/edit)에 4.13과 데스크톱 앱 내용을 반영. 아직 반영 안 한 내용은 `F:\SHOWPY\구글문서_수정안.md`.
6. **시험 프로젝트에 showpy 4.13 넣기**: `fx_test_25`, `pykaki_sample`의 `game/` 플러그인 폴더를 `pygaki\showpy\game\`에서 통째로 바꾸고 `.rpyc` 지우기. `text_effects.glsl`이 같이 들어가야 합니다.

## 5. 나중에 할 것 (예전부터)

- 화면 전체 글리치: VHS 덮개 보강, 화면 블록 글리치, 화면 데이터모싱 흉내
- 참고자료 `F:\Dropbox\1_DEV\renpydev\assets\참고자료\uRHAHdq1xFNfW-Wc.mp4` 아직 안 봄
- 렌파이 견본 영상(`pykaki/public/effects/*.webm`)은 그대로 둠. 다시 만들 때 `pykaki/tools/record_effect_clips.py`(이제 showpy 경로를 저장소 안에서 찾음)

## 6. 알아 둘 것

- **커밋 작성자**는 `halftomato <wwonwan@naver.com>`(CLAUDE.md 규칙). 클라우드 환경이 "Unverified" 경고와 함께 작성자를 바꾸라고 했지만, 예전 기록을 다시 써야 해서 바꾸지 않았습니다.
- **효과 비교 방법**(다시 할 때):
  - 시험용 페이지에서 `SayBox`를 1280x720, 글자 40, 30글자/초, 문장 "효과 미리보기 Sample 글자"로 띄웁니다.
  - Playwright `page.clock`으로 1/15초씩 돌려 대사창 자리(880x90, 왼쪽 230 위 578)를 찍습니다.
  - 견본 webm을 ffmpeg로 프레임으로 풀어 나란히 놓습니다. 견본은 대사가 뜨기 전 프레임이 4장쯤 더 있습니다.
  - 이 시험 도구는 저장소에 넣지 않았습니다.
- 런처 파일은 런처의 `new_template_project`, `interface.input`, `project.current`, `config.overlay_screens`를 씁니다(렌파이 8.5.3 기준). 렌파이를 올리면 이 이름들이 그대로인지 봅니다.
- 앱은 Electron 33, 빌드는 electron-builder `--win dir`. 서명이 없어서 윈도우가 처음에 경고할 수 있습니다.

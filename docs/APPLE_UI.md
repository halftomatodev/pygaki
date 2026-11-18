# 넘겨받기: 화면 움직임과 유리 UI (apple_ui 브랜치)

클라우드 세션(2026-11-18)에서 한 일. 로컬에서 이 문서만 읽고 바로 이어 고칠 수 있게 지금 상태로 정리했다.
옮긴 뒤 필요한 내용은 `docs/HANDOFF.md`(한 줄)와 맞는 `docs/local/` 파일로 옮기고 이 파일은 지운다.

## 1. 로컬에 가져오기

`main`에 그사이 새 커밋이 없어서 그대로 합쳐진다(충돌 없음 확인).

```bash
git fetch origin apple_ui
git switch main
git merge --ff-only origin/apple_ui      # 또는 시험만: git switch apple_ui
cd pykaki && npm ci                        # 새 의존성 fluidkit, motion
npm run build                              # dist/index.html 다시 만들기 (꼭)
cd app && npm start                        # 데스크톱 앱으로 확인
```

## 2. 지금 상태 (사용자가 고른 것)

| 자리 | 지금 | 파일 |
|---|---|---|
| 움직임 원칙·토큰 | 애플 HIG 기준. `--ease`, `--ease-out`, `--ease-in`, `--ease-spring`(1% 넘침), `--dur-hover/press/pop/view`(100/150/250/400ms), `--pop-scale`, `--pop-blur`, `--spring-scale`. 애니메이션 줄이기면 확대·흐림·튐 빠짐 | `pykaki/docs/MOTION.md`, `pykaki/src/styles.css` 맨 위 |
| 드롭다운 메뉴 3개 | **끈적 드롭다운**: 단추가 판과 같은 색 알약이 되고, 판이 단추에서 녹아 나와 출렁 스프링(8%, 440ms)으로 커지고, 230ms에 글자 페이드, 300ms부터 흐림 6→0으로 목을 **완전히 끊고** 필터 끔. 닫으면 판을 복제해 두고 단추 안으로 빨려 들어감 | `pykaki/src/GooMenu.tsx`. 쓰는 곳: `FlagMenu.tsx`(PickMenu: 플래그 추가, 화면 만들기), `FolderMenu.tsx`, `TransPicker.tsx` |
| 상단 화면 탭 | **fluidkit `LiquidTabs`**: `flow="slide"`(물방울 + 꼬리가 다시 합쳐짐), `material="glass"`, 강조색 82% 유리 막대, 바탕은 옅은 회색(`style`로 덮음), 글자색은 테마에서 rgb로 읽음(`useThemeInk`) | `pykaki/src/Toolbar.tsx` `ViewSwitch`, `VIEW_TABS` |
| 화면 바뀔 때 | 새 화면이 탭이 움직인 방향에서 32px 밀려 들어옴(`--dur-view` `--ease-spring`, 흐림, 페이드 200ms). 나가는 화면은 바로 사라짐 | `pykaki/src/App.tsx` `VIEW_ORDER`, `.view-in` |
| 카드 | **fluidkit `LiquidCard`** 유리(`radius=14`). 반투명이라 뒤 캔버스가 비침. 접힘 하늘색, 사용 중 연두는 `tint`로 | `pykaki/src/Card.tsx` `TINT` |
| 라이선스 | fluidkit 0.5.0, motion 12.43.0 (MIT) | `pykaki/licenses/MIT-fluidkit.txt`, `MIT-motion.txt` |

### 고칠 때 알아 둘 것

- **카드 CSS**: LiquidCard가 내용을 `[data-fluidkit='liquid-card-content']` 칸으로 한 겹 감싼다. 카드 안을 가리키는 CSS는 `.sec > h3`가 아니라 `:is(.sec, .card > [data-fluidkit='liquid-card-content']) > h3` 꼴로 쓴다(인스펙터의 맨 `.sec`도 같이 맞게). 카드 바탕·그림자는 `.sec.card.card { background: transparent; box-shadow: none }`(styles.css 맨 끝)로 빼고 LiquidCard가 그린다.
- **새 드롭다운 메뉴**: 판 맨 앞에 `<GooMenu anchor={단추} ready={자리가 정해졌는지} />` 한 줄. 판은 `document.body`로 포털해 `position: fixed`, `z-index`가 있어야 한다. 정리 함수가 판이 빠지기 직전에 돌아서, 판을 감싼 컴포넌트가 조건부로 빠지는 구조면 된다.
- **끈적 목이 남는 까닭**: 흐림 σ에서 1.5σ보다 가까운 두 면은 계속 붙는다(σ=6이면 9px). 그래서 자리를 잡으면 흐림을 0으로 줄인다. 간격을 넓히는 것으로는 앱 메뉴(4~6px)에 안 맞는다.
- **LiquidTabs 색**: `labelColor`, `activeLabelColor`는 hex나 `rgb()`만 된다(프레임마다 숫자로 섞음). CSS 변수는 `useThemeInk`처럼 rgb로 바꿔 넘긴다. `tint`를 주면 탭 바탕까지 그 색이 되니 바탕은 `style`로 덮는다.
- fluidkit은 애니메이션 줄이기를 스스로 따른다. `GooMenu`는 줄이기면 액체 층 없이 짧은 페이드.
- 기본 `<select>`(57곳)는 운영체제가 그려 끈적·유리를 못 입힌다.

## 3. 확인한 것과 못 한 것

확인함 (클라우드, 리눅스):
- Electron 33.2.1(Chromium 130)에서 `cubic-bezier`, `linear()`, `backdrop-filter`, `@starting-style`, `startViewTransition`, `element.animate`, `prefers-reduced-motion`, 끈적 SVG 필터 모두 됨.
- `npx tsc --noEmit`, `npm run build` 통과. 웹 빌드를 크롬으로 열어: 플래그 [+ 추가] 메뉴 열고 닫기(목 끊김, 닫은 뒤 남는 것 없음), 탭 전환, 카드 10장 유리, 콘솔 오류 없음.
- 웹 빌드 크기 5,957KB → 6,131KB.

**로컬에서 볼 것** (못 함):
1. 윈도우 데스크톱 앱에서 세 메뉴(플래그 추가, 폴더 메뉴, 나타나는 방식)를 열고 닫기. 메뉴가 단추 **위로** 뜨는 경우도.
2. 상단 탭 빠르게 여러 번 누르기, 언어·글자 크기 바꾼 뒤 막대 자리.
3. **어두운 화면**과 환경 설정 색 바꾸기에서 탭 글자색, 카드 유리 색.
4. 카드를 많이 펼쳤을 때 캔버스 끌기가 버벅이지 않는지(카드마다 `backdrop-filter`). 느리면 `Card.tsx`에서 `material="flat"`으로 바꾸는 것부터.
5. 윈도우 설정 > 접근성 > 시각 효과 > 애니메이션 효과 끄고 다시 1~2.
6. GUI 편집 칸 카드(`ShowpyView`)의 모양. 바탕이 단색이라 유리가 거의 안 보일 수 있다.

## 4. 남은 일

- 위 확인 뒤 어색한 곳을 사용자와 고르기.
- 기존 transition·animation 약 30곳을 토큰으로(토스트, 옆 칸, 스위치, 슬라이더 등). 원칙은 `pykaki/docs/MOTION.md` 2장 표.
- 메뉴가 아닌 뜨는 창(`.fd-pop` 플래그 칸 고치기, `.modal` 대화 상자)에 스프링 등장을 줄지.
- `pykaki/docs/SPEC.md`·`GUIDE.md`에 바뀐 모양 적기(아직 안 함).
- 시험 묶음: Actions "배포 파일"을 `apple_ui`(또는 합친 `main`)로 손으로 돌리면 Artifacts `pygaki-dev`에 생긴다. 이번 세션에서 한 번 돌렸다가 사용자 요청으로 취소했다.

## 5. 참고 (모양만)

- 애플 HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- 끈적 메뉴는 사용자가 보여 준 영상(어두운 바탕, 흰 알약 단추 아래로 흰 메뉴가 녹아 나왔다 떨어짐)을 프레임으로 재서 맞췄다: 30ms 물방울, 230ms까지 붙은 채 커짐, 230~370ms 글자, 330ms쯤 목 끊김, 450ms 자리. 닫기 약 400ms.
- 유리 탭·카드는 fluidkit(npm `fluidkit`, MIT). 같은 라이브러리에 `LiquidMenu`도 있지만 사용자가 고른 끈적 드롭다운을 쓴다.
- 이 세션에서 만든 비교 데모 페이지(메뉴 등장 4가지, 탭 전환 4가지, 끈적 드롭다운 따라 하기)는 claude.ai 비공개 페이지라 저장소에는 없다.
